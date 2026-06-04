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
	productService *services.ProductService,
	cloudinaryService *services.CloudinaryService,
) {
	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(authService)

	// Initialize handlers
	authHandler := NewAuthHandler(queries, authService, cloudinaryService)
	productHandler  := NewProductHandler(queries, productService)
	categoryHandler := NewCategoryHandler(queries)
	reportHandler := NewReportHandler(queries)

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
	//categories
		categories := api.Group("/categories")
	{
		categories.GET("",                  categoryHandler.GetAllCategories)
		categories.GET("/:id/products",     productHandler.GetProductsByCategory)
	}
	// pulic products
		products := api.Group("/products")
	{
		products.GET("",        productHandler.GetAllProducts)
		products.GET("/search", productHandler.SearchProducts)
		products.GET("/:id",    productHandler.GetProductByID)
	}

	// Protected routes — valid JWT required
	protected := api.Group("/")
	protected.Use(authMiddleware.RequireAuth())
	{
		protected.GET("/profile", authHandler.GetProfile)
		protected.GET("/my-products",               productHandler.GetMyProducts)
		protected.POST("/products",                 productHandler.CreateProduct)
		protected.PUT("/products/:id",              productHandler.UpdateProduct)
		protected.PATCH("/products/:id/status",     productHandler.UpdateProductStatus)
		protected.DELETE("/products/:id",           productHandler.DeleteProduct)
		protected.POST("/reports",      reportHandler.CreateReport)
		protected.GET("/my-reports",    reportHandler.GetMyReports)
	}

	// Admin routes — valid JWT + admin role required
	admin := api.Group("/admin")
	admin.Use(authMiddleware.RequireAuth())
	admin.Use(authMiddleware.RequireAdmin())
	{
		admin.GET("/users", authHandler.GetAllUsers)
		admin.POST("/categories",           categoryHandler.CreateCategory)
		admin.PUT("/categories/:id",        categoryHandler.UpdateCategory)
		admin.DELETE("/categories/:id",     categoryHandler.DeleteCategory)
		admin.GET("/reports",           reportHandler.GetAllReports)
		admin.GET("/reports/:id",       reportHandler.GetReportByID)
		admin.PATCH("/reports/:id/status", reportHandler.UpdateReportStatus)
		admin.GET("/pending-users",          authHandler.GetPendingUsers)
		admin.PATCH("/users/:id/approve",    authHandler.ApproveUser)
		admin.PATCH("/users/:id/reject",     authHandler.RejectUser)
	}
}