package handlers

import (
	"net/http"

	db "campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/models"
	"campus-marketplace/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthHandler struct {
	queries           *db.Queries
	authService       *services.AuthService
	cloudinaryService *services.CloudinaryService
}

func NewAuthHandler(queries *db.Queries, authService *services.AuthService, cloudinaryService *services.CloudinaryService) *AuthHandler {
	return &AuthHandler{
		queries:           queries,
		authService:       authService,
		cloudinaryService: cloudinaryService,
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	username := c.PostForm("username")
	email := c.PostForm("email")
	password := c.PostForm("password")

	if username == "" || email == "" || password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username, email and password are required"})
		return
	}

	if len(password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password must be at least 6 characters"})
		return
	}

	fileHeader, err := c.FormFile("student_id")
	if err != nil || fileHeader == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "student ID photo is required"})
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "could not read student ID photo"})
		return
	}
	defer file.Close()

	studentIDUrl, err := h.cloudinaryService.UploadImage(c.Request.Context(), file, "student-ids")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not upload student ID photo"})
		return
	}

	hashedPassword, err := h.authService.HashPassword(password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not process password"})
		return
	}

	user, err := h.queries.CreateUser(c.Request.Context(), db.CreateUserParams{
		Username:     username,
		Email:        email,
		PasswordHash: hashedPassword,
		StudentIDUrl: studentIDUrl,
	})
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email or username already exists"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "registration successful, please come back after 24 hours for verification",
		"user":    models.ToUserResponse(user),
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.queries.GetUserByEmail(c.Request.Context(), req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	if !h.authService.CheckPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	switch user.AccountStatus {
	case "pending":
		c.JSON(http.StatusForbidden, gin.H{
			"error": "your account is pending verification, please check back after 24 hours",
		})
		return
	case "rejected":
		c.JSON(http.StatusForbidden, gin.H{
			"error": "your verification was rejected, make sure your ID card photo is clear and has not expired",
		})
		return
	case "blocked":
		c.JSON(http.StatusForbidden, gin.H{
			"error": "your account has been blocked. Contact support if you believe this is a mistake",
		})
		return
	}

	token, err := h.authService.GenerateStudentToken(user.ID.String(), user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		Token: token,
		User:  models.ToUserResponse(user),
	})
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID := c.GetString("user_id")

	user, err := h.queries.GetUserByID(c.Request.Context(), uuid.MustParse(userID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, models.ToUserResponse(user))
}
