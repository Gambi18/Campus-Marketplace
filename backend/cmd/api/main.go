package main

import (
	"context"
	"log"

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

func main() {
	// Iinsted of Loading environment variables, loaded config insted since everything is alredy set there
	cfg := config.LoadConfig()
	// temporary debug - remove after fixing

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

	hub := ws.NewHub()
	go hub.Run()

	//  Initialize service

	authService := services.NewAuthService(cfg.JWTSecret)
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
   //CORS
   router.Use(middleware.CORSMiddleware())

	handlers.SetupRoutes(router, queries, authService,  productService, cloudinaryService, notificationService, hub, campayService, receiptService,)


	// Starts server
	log.Printf("Starting server on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
