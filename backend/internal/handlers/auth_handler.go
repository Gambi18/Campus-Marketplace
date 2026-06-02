package handlers

import (
	"net/http"

	"campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/models"
	"campus-marketplace/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthHandler struct {
	queries  *db.Queries
	authService *services.AuthService
}

func NewAuthHandler(queries *db.Queries, authService *services.AuthService) *AuthHandler {
	return &AuthHandler{
		queries: queries,
		authService: authService,
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
		//  Hash the password
	hashedPassword, err := h.authService.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not process password"})
		return
	}

	//  Save user to database
	user, err := h.queries.CreateUser(c.Request.Context(), db.CreateUserParams{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: hashedPassword,
		Role:         "student",
	})
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email or username already exists"})
		return
	}

	//  Generate JWT token
	token, err := h.authService.GenerateToken(user.ID.String(), user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	// Return token and user
	c.JSON(http.StatusCreated, models.AuthResponse{
		Token: token,
		User: models.UserResponse{
			ID:         user.ID.String(),
			Username:   user.Username,
			Email:      user.Email,
			Role:       user.Role,
			IsVerified: user.IsVerified,
		},
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	//  Parse and validate request body
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user by email
	user, err := h.queries.GetUserByEmail(c.Request.Context(), req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	// Check password
	if !h.authService.CheckPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	// Generate JWT token
	token, err := h.authService.GenerateToken(user.ID.String(), user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	// Return token and user
	c.JSON(http.StatusOK, models.AuthResponse{
		Token: token,
		User: models.UserResponse{
			ID:         user.ID.String(),
			Username:   user.Username,
			Email:      user.Email,
			Role:       user.Role,
			IsVerified: user.IsVerified,
		},
	})
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID := c.GetString("user_id")

	user, err := h.queries.GetUserByID(c.Request.Context(), uuid.MustParse(userID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, models.UserResponse{
		ID:         user.ID.String(),
		Username:   user.Username,
		Email:      user.Email,
		Role:       user.Role,
		IsVerified: user.IsVerified,
	})
}

func (h *AuthHandler) GetAllUsers(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "admin only - list of users will go here"})
}
