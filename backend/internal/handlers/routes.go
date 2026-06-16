package handlers

import (
	db "campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/middleware"
	"campus-marketplace/internal/notification"
	"campus-marketplace/internal/services"
	"campus-marketplace/internal/ws"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(
	router *gin.Engine,
	queries *db.Queries,
	authService *services.AuthService,
	productService *services.ProductService,
	cloudinaryService *services.CloudinaryService,
	notificationService *notification.NotificationService,
	hub *ws.Hub,
	campayService *services.CamPayService,      
	receiptService *services.ReceiptService,
) {
	authMiddleware := middleware.NewAuthMiddleware(authService)

	authHandler := NewAuthHandler(queries, authService, cloudinaryService)
	adminHandler := NewAdminHandler(queries, authService, notificationService)
	productHandler := NewProductHandler(queries, productService)
	categoryHandler := NewCategoryHandler(queries)
	reportHandler := NewReportHandler(queries)
	messageHandler := NewMessageHandler(queries, hub, notificationService)
	notificationHandler := NewNotificationHandler(notificationService)
	paymentHandler := NewPaymentHandler(
    queries,
    campayService,
    receiptService,
    cloudinaryService,
    hub,
    )

	api := router.Group("/api/v1")

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	router.POST("/webhook/campay", paymentHandler.Webhook)

	// Public routes — no auth required

	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	adminAuth := api.Group("/admin/auth")
	{
		adminAuth.POST("/login", adminHandler.Login)
	}

	adminCreate := api.Group("/admin")
	{
		adminCreate.POST("/create", adminHandler.CreateAdmin)
	}

	categories := api.Group("/categories")
	{
		categories.GET("", categoryHandler.GetAllCategories)
		categories.GET("/:id/products", productHandler.GetProductsByCategory)
	}

	products := api.Group("/products")
	{
		products.GET("", productHandler.GetAllProducts)
		products.GET("/search", productHandler.SearchProducts)
		products.GET("/:id", productHandler.GetProductByID)
	}

	protected := api.Group("/")
	protected.Use(authMiddleware.RequireAuth())
	protected.Use(authMiddleware.RequireStudent())
	{
		protected.GET("/profile", authHandler.GetProfile)

		protected.GET("/my-products", productHandler.GetMyProducts)
		protected.POST("/products", productHandler.CreateProduct)
		protected.PUT("/products/:id", productHandler.UpdateProduct)
		protected.PATCH("/products/:id/status", productHandler.UpdateProductStatus)
		protected.DELETE("/products/:id", productHandler.DeleteProduct)
		protected.POST("/reports", reportHandler.CreateReport)
		protected.GET("/my-reports", reportHandler.GetMyReports)
		protected.GET("/ws", messageHandler.HandleWebSocket)
		protected.GET("/conversations", messageHandler.GetConversations)
		protected.GET("/conversations/:product_id/:user_id", messageHandler.GetMessages)
		protected.GET("/unread-count", messageHandler.GetUnreadCount)
		protected.POST("/payments/initiate",          paymentHandler.InitiatePayment)
		protected.GET("/payments/:id/status",         paymentHandler.CheckPaymentStatus)
		protected.POST("/payments/:id/confirm",       paymentHandler.ConfirmDelivery)
		protected.POST("/payments/:id/reject",        paymentHandler.RejectDelivery)
		protected.GET("/payments/:id/receipt",        paymentHandler.GetReceipt)
		protected.GET("/my-purchases",                paymentHandler.GetMyPurchases)
		protected.GET("/my-sales",                    paymentHandler.GetMySales)


		// Notification routes
		notifications := protected.Group("/notifications")
		{
			notifications.GET("", notificationHandler.GetNotifications)
			notifications.GET("/unread-count", notificationHandler.GetUnreadCount)
			notifications.PATCH("/:id/read", notificationHandler.MarkAsRead)
			notifications.POST("/read-all", notificationHandler.MarkAllAsRead)
		}
	}

	admin := api.Group("/admin")
	admin.Use(authMiddleware.RequireAuth())
	admin.Use(authMiddleware.RequireAdmin())
	{
		admin.GET("/profile", adminHandler.GetProfile)
		admin.GET("/users", adminHandler.GetAllUsers)
		admin.PATCH("/users/:id/block", adminHandler.BlockUser)
		admin.GET("/pending-users", adminHandler.GetPendingUsers)
		admin.PATCH("/users/:id/approve", adminHandler.ApproveUser)
		admin.PATCH("/users/:id/reject", adminHandler.RejectUser)
		admin.POST("/categories", categoryHandler.CreateCategory)
		admin.PUT("/categories/:id", categoryHandler.UpdateCategory)
		admin.DELETE("/categories/:id", categoryHandler.DeleteCategory)
		admin.GET("/reports", reportHandler.GetAllReports)
		admin.GET("/reports/:id", reportHandler.GetReportByID)
		admin.PATCH("/reports/:id/status", reportHandler.UpdateReportStatus)
		admin.GET("/payments/held",   paymentHandler.GetAllHeldPayments)
	}
}
