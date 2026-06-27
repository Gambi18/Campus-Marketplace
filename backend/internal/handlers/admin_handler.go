package handlers

import (
	"crypto/subtle"
	"net/http"

	db "campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/models"
	"campus-marketplace/internal/notification"
	"campus-marketplace/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AdminHandler struct {
	queries             *db.Queries
	authService         *services.AuthService
	notificationService *notification.NotificationService
	bootstrapToken      string
}

func NewAdminHandler(queries *db.Queries, authService *services.AuthService, notificationService *notification.NotificationService, bootstrapToken string) *AdminHandler {
	return &AdminHandler{
		queries:             queries,
		authService:         authService,
		notificationService: notificationService,
		bootstrapToken:      bootstrapToken,
	}
}

func (h *AdminHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, err := h.queries.GetAdminByEmail(c.Request.Context(), req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	if !h.authService.CheckPassword(req.Password, admin.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	token, err := h.authService.GenerateAdminToken(admin.ID.String(), admin.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	c.JSON(http.StatusOK, models.AdminAuthResponse{
		Token: token,
		Admin: models.ToAdminResponse(admin),
	})
}

// CreateAdmin is a one-time bootstrap endpoint for creating the very first
// platform admin. It is intentionally public (an admin token can't exist yet),
// but it is guarded two ways so it cannot be abused:
//
//  1. A secret ADMIN_BOOTSTRAP_TOKEN must be presented in the
//     X-Admin-Bootstrap-Token header. If the token is unset, the endpoint is
//     disabled entirely.
//  2. It only works while the admins table is empty. Once any admin exists
//     (via this endpoint or the EnsureDefaultAdmin seed) it is permanently inert.
//
// See README "Admin bootstrap" for the operational procedure.
func (h *AdminHandler) CreateAdmin(c *gin.Context) {
	// Guard 1: bootstrap must be explicitly enabled via a configured secret.
	if h.bootstrapToken == "" {
		c.JSON(http.StatusForbidden, gin.H{"error": "admin bootstrap is disabled"})
		return
	}
	// Constant-time compare to avoid leaking the token via timing.
	if subtle.ConstantTimeCompare([]byte(c.GetHeader("X-Admin-Bootstrap-Token")), []byte(h.bootstrapToken)) != 1 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid bootstrap token"})
		return
	}

	// Guard 2: only ever usable to create the first admin.
	count, err := h.queries.CountAdmins(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not verify admin state"})
		return
	}
	if count > 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "an admin already exists; bootstrap endpoint is disabled"})
		return
	}

	var req models.CreateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := h.authService.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not process password"})
		return
	}

	admin, err := h.queries.CreateAdmin(c.Request.Context(), db.CreateAdminParams{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: hashedPassword,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create admin"})
		return
	}

	c.JSON(http.StatusCreated, models.ToAdminResponse(admin))
}

func (h *AdminHandler) GetProfile(c *gin.Context) {
	adminID := c.GetString("user_id")

	admin, err := h.queries.GetAdminByID(c.Request.Context(), uuid.MustParse(adminID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "admin not found"})
		return
	}

	c.JSON(http.StatusOK, models.ToAdminResponse(admin))
}

func (h *AdminHandler) GetAllUsers(c *gin.Context) {
	users, err := h.queries.GetAllUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch users"})
		return
	}

	response := make([]models.UserResponse, len(users))
	for i, u := range users {
		response[i] = models.ToUserResponse(u)
	}

	c.JSON(http.StatusOK, gin.H{
		"users": response,
		"count": len(response),
	})
}

func (h *AdminHandler) GetPendingUsers(c *gin.Context) {
	users, err := h.queries.GetPendingUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch pending users"})
		return
	}

	response := make([]models.UserResponse, len(users))
	for i, u := range users {
		response[i] = models.ToUserResponse(u)
	}

	c.JSON(http.StatusOK, gin.H{
		"users": response,
		"count": len(response),
	})
}

func (h *AdminHandler) ApproveUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	user, err := h.queries.ApproveUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not approve user"})
		return
	}

	// Send notification
	_, _ = h.notificationService.Create(
		c.Request.Context(),
		userID,
		notification.NotificationListingApproved, // Account approved doesn't have a specific type yet, reusing
		"Account Approved",
		"Your student account has been approved. You can now start listing products.",
		notification.NotificationMetadata{"user_id": userID.String()},
		"/profile",
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "user approved successfully",
		"user":    models.ToUserResponse(user),
	})
}

func (h *AdminHandler) RejectUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	user, err := h.queries.RejectUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not reject user"})
		return
	}

	// Send notification
	_, _ = h.notificationService.Create(
		c.Request.Context(),
		userID,
		notification.NotificationListingRejected,
		"Account Rejected",
		"Your student account verification was rejected. Please check your student ID and try again.",
		notification.NotificationMetadata{"user_id": userID.String()},
		"/profile",
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "user rejected",
		"user":    models.ToUserResponse(user),
	})
}

func (h *AdminHandler) BlockUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	user, err := h.queries.BlockUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not block user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "user blocked successfully",
		"user":    models.ToUserResponse(user),
	})
}
