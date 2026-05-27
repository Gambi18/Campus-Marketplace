package handlers

import (
	"campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/middleware"
	"campus-marketplace/internal/services"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(
	router *gin.Engine,
	queries *db.Queries,
	authService *services.AuthService,
) {
	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(authService)

	// Initialize handlers
	authHandler := NewAuthHandler(queries, authService)

	// API v1
	api := router.Group("/api/v1")

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Public routes — no auth required
	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	// Protected routes — valid JWT required
	protected := api.Group("/")
	protected.Use(authMiddleware.RequireAuth())
	{
		protected.GET("/profile", authHandler.GetProfile)
	}

	// Admin routes — valid JWT + admin role required
	admin := api.Group("/admin")
	admin.Use(authMiddleware.RequireAuth())
	admin.Use(authMiddleware.RequireAdmin())
	{
		admin.GET("/users", authHandler.GetAllUsers)
	}
}