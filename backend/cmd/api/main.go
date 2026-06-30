package main

import (
	"context"
	"log"
	"time"

	"github.com/gin-gonic/gin"

	"campus-marketplace/internal/config"
	"campus-marketplace/internal/db"
	dbsqlc "campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/handlers"
	"campus-marketplace/internal/middleware"
	"campus-marketplace/internal/notification"
	"campus-marketplace/internal/services"
	"campus-marketplace/internal/ws"
)

func validateConfig(cfg *config.Config) {
	if cfg.Env == "production" {
		if cfg.DBPass == "" || cfg.DBPass == "password" {
			log.Fatal("DB_PASSWORD is unset or still the default — refusing to start")
		}
		if cfg.AdminPassword == "" || cfg.AdminPassword == "password" {
			log.Fatal("ADMIN_PASSWORD is unset or still the default — refusing to start")
		}
		if cfg.CamPayAppUsername == "" || cfg.CamPayAppPassword == "" {
			log.Fatal("CamPay credentials are required in production")
		}
	}
}

func main() {
	// Iinsted of Loading environment variables, loaded config insted since everything is alredy set there
	cfg := config.LoadConfig()

	validateConfig(cfg)

	// Fail fast on an unset/placeholder JWT secret — signing tokens with an empty
	// HMAC key lets anyone forge valid tokens.
	if cfg.JWTSecret == "" || cfg.JWTSecret == "your_super_secret_key" {
		log.Fatal("JWT_SECRET is not set (or still the example value) — refusing to start")
	}

	// Run migrations
	if err := db.RunMigrations(cfg.DatabaseURL()); err != nil {
		log.Fatalf("Migration error: %v", err)
	}
	//  Connect to database
	database, err := db.Connect(cfg.DatabaseURL())
	if err != nil {
		log.Fatalf("Database connection error: %v", err)
	}
	defer database.Close()

	//  Initialize sqlc queries
	queries := dbsqlc.New(database)

	auditService := services.NewAuditService(queries)

	hub := ws.NewHub()
	go hub.Run()

	//  Initialize service

	refreshSecret := cfg.RefreshSecret
	if refreshSecret == "" {
		refreshSecret = cfg.JWTSecret + "_refresh"
	}
	authService := services.NewAuthService(cfg.JWTSecret, refreshSecret, queries, 15*time.Minute, 30*24*time.Hour)
	services.EnsureDefaultAdmin(context.Background(), queries, authService, cfg.AdminUsername, cfg.AdminEmail, cfg.AdminPassword)


        // cloudinary  initialization
    cloudinaryService, err := services.NewCloudinaryService(
        cfg.CloudinaryCloudName,
        cfg.CloudinaryAPIKey,
        cfg.CloudinaryAPISecret,
    )
    campayService := services.NewCamPayService(
    cfg.CamPayBaseURL,
    cfg.CamPayAppUsername,
    cfg.CamPayAppPassword,
    cfg.CamPayPermanentToken,
    )
    receiptService := services.NewReceiptService(cloudinaryService)
    if err != nil {
        log.Fatalf("Cloudinary error: %v", err)
    }

	productService := services.NewProductService(queries, cloudinaryService)
	notificationService := notification.NewNotificationService(queries, hub)

	// Sets gin mode based on environment
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Creates Gin router
	router := gin.Default()

	// Cap request bodies to bound memory use from uploads. Product create/update
	// can carry up to 5 images (1 student ID + 4 product photos), so allow some
	// headroom while still rejecting abusive payloads.
	const maxUploadBytes = 25 << 20 // 25 MB
	router.MaxMultipartMemory = 8 << 20
	router.Use(middleware.BodySizeLimit(maxUploadBytes))

   //CORS — restricted to the configured allow-list
   router.Use(middleware.CORSMiddleware(cfg.AllowedOrigins))

   // Security headers
   router.Use(middleware.SecurityHeaders())

   // Serve uploaded files in dev mode
   router.Static("/uploads", "./uploads")

	handlers.SetupRoutes(router, queries, authService, productService, cloudinaryService, notificationService, auditService, hub, campayService, receiptService, cfg.AllowedOrigins, cfg.AdminBootstrapToken, cfg.CookieDomain, cfg.CookieSecure)


	// Starts server
	log.Printf("Starting server on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
