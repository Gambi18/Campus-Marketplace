package main

import (
	"log"
	

	"github.com/gin-gonic/gin"
	
    "campus-marketplace/internal/config"
    "campus-marketplace/internal/db"
	dbsqlc "campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/handlers"
	"campus-marketplace/internal/services"

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
    
	//  Initialize service
	authService := services.NewAuthService(cfg.JWTSecret)

        // cloudinary  initialization
    cloudinaryService, err := services.NewCloudinaryService(
        cfg.CloudinaryCloudName,
        cfg.CloudinaryAPIKey,
        cfg.CloudinaryAPISecret,
    )
    if err != nil {
        log.Fatalf("❌ Cloudinary error: %v", err)
    }

    productService := services.NewProductService(queries, cloudinaryService)


    // Sets gin mode based on environment
    if cfg.Env == "production" {
        gin.SetMode(gin.ReleaseMode)
    }

	// Creates Gin router
	router := gin.Default()

	handlers.SetupRoutes(router, queries, authService,  productService, cloudinaryService)


	// Starts server
	log.Printf("Starting server on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
