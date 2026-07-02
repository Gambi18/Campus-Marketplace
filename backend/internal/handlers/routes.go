package handlers

import (
	"context"
	"database/sql"
	"time"

	db "campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/middleware"
	"campus-marketplace/internal/notification"
	"campus-marketplace/internal/services"
	"campus-marketplace/internal/ws"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(
	ctx context.Context,
	router *gin.Engine,
	sqlDB *sql.DB,
	queries *db.Queries,
	authService *services.AuthService,
	productService *services.ProductService,
	cloudinaryService *services.CloudinaryService,
	notificationService *notification.NotificationService,
	auditService *services.AuditService,
	hub *ws.Hub,
	campayService *services.CamPayService,
	receiptService *services.ReceiptService,
	allowedOrigins []string,
	adminBootstrapToken string,
	cookieDomain string,
	cookieSecure bool,
) {
	authMiddleware := middleware.NewAuthMiddleware(authService)

	authHandler := NewAuthHandler(queries, authService, cloudinaryService, cookieDomain, cookieSecure)
	adminHandler := NewAdminHandler(queries, authService, notificationService, auditService, adminBootstrapToken, cookieDomain, cookieSecure)
	productHandler := NewProductHandler(queries, productService)
	categoryHandler := NewCategoryHandler(queries)
	reportHandler := NewReportHandler(queries)
	messageHandler := NewMessageHandler(queries, hub, notificationService, allowedOrigins)
	notificationHandler := NewNotificationHandler(notificationService)
	paymentHandler := NewPaymentHandler(
		sqlDB,
		queries,
		campayService,
		receiptService,
		cloudinaryService,
		hub,
	)

	// Start background expirer for stale pending payments
	go paymentHandler.StartPendingPaymentExpirer(ctx, 60*time.Second)

	// Surface payments stuck mid-release (money moved but status never advanced)
	// for operator follow-up.
	go paymentHandler.StartStuckPaymentReconciler(ctx, 5*time.Minute)

	api := router.Group("/api/v1")

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	router.POST("/webhook/campay", paymentHandler.Webhook)

	// Public routes — no auth required

	// Throttle credential endpoints against brute-force / credential-stuffing.
	loginRateLimit := middleware.RateLimit(10, time.Minute)
	registerRateLimit := middleware.RateLimit(5, time.Minute)
	createProductRateLimit := middleware.RateLimit(10, time.Minute)

	auth := api.Group("/auth")
	{
		auth.POST("/register", registerRateLimit, authHandler.Register)
		auth.POST("/login", loginRateLimit, authHandler.Login)
		auth.POST("/refresh", authHandler.RefreshToken)
	}

	adminAuth := api.Group("/admin/auth")
	{
		adminAuth.POST("/login", loginRateLimit, adminHandler.Login)
	}

	// One-time admin bootstrap: public by necessity (no admin token can exist
	// yet) but gated by the X-Admin-Bootstrap-Token secret and only usable while
	// the admins table is empty. See AdminHandler.CreateAdmin / README.
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

	// WebSocket uses its own auth middleware that accepts the token from a query
	// parameter (browser WebSocket API cannot set custom headers).
	api.GET("/ws", authMiddleware.RequireWebSocketAuth(), authMiddleware.RequireStudent(), messageHandler.HandleWebSocket)

	protected := api.Group("/")
	protected.Use(authMiddleware.RequireAuth())
	protected.Use(authMiddleware.RequireStudent())
	// CSRF double-submit protection for cookie-authenticated requests; skipped for
	// Bearer-token API calls (see middleware.CSRF).
	protected.Use(middleware.CSRF())
	{
		protected.GET("/profile", authHandler.GetProfile)
		protected.POST("/logout", authHandler.Logout)

		protected.GET("/my-products", productHandler.GetMyProducts)
		protected.POST("/products", createProductRateLimit, productHandler.CreateProduct)
		protected.PUT("/products/:id", productHandler.UpdateProduct)
		protected.PATCH("/products/:id/status", productHandler.UpdateProductStatus)
		protected.DELETE("/products/:id", productHandler.DeleteProduct)
		protected.POST("/reports", reportHandler.CreateReport)
		protected.GET("/my-reports", reportHandler.GetMyReports)
		protected.POST("/messages", messageHandler.CreateMessageREST)
		protected.GET("/conversations", messageHandler.GetConversations)
		protected.GET("/conversations/:product_id/:user_id", messageHandler.GetMessages)
		protected.GET("/unread-count", messageHandler.GetUnreadCount)
		protected.POST("/payments/initiate", paymentHandler.InitiatePayment)
		protected.GET("/payments/:id/status", paymentHandler.CheckPaymentStatus)
		protected.POST("/payments/:id/confirm", paymentHandler.ConfirmDelivery)
		protected.POST("/payments/:id/reject", paymentHandler.RejectDelivery)
		protected.GET("/payments/:id/receipt", paymentHandler.GetReceipt)
		protected.GET("/my-purchases", paymentHandler.GetMyPurchases)
		protected.GET("/my-sales", paymentHandler.GetMySales)

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
	admin.Use(middleware.CSRF())
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
		admin.GET("/payments/held", paymentHandler.GetAllHeldPayments)
	}
}
