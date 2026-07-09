package handlers

import (
	"net/http"
	"regexp"
	"strings"
	"time"

	db "campus-marketplace/internal/db/sqlc"
	"campus-marketplace/internal/models"
	"campus-marketplace/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// expFromClaims extracts the token expiry from JWT claims, falling back to
// now+fallback when the exp claim is missing or malformed. Used to blacklist a
// revoked token only until it would naturally expire.
func expFromClaims(claims jwt.MapClaims, fallback time.Duration) time.Time {
	if expF, ok := claims["exp"].(float64); ok {
		return time.Unix(int64(expF), 0)
	}
	return time.Now().Add(fallback)
}

type AuthHandler struct {
	queries           *db.Queries
	authService       *services.AuthService
	cloudinaryService *services.CloudinaryService
	cookieDomain      string
	cookieSecure      bool
}

func NewAuthHandler(queries *db.Queries, authService *services.AuthService, cloudinaryService *services.CloudinaryService, cookieDomain string, cookieSecure bool) *AuthHandler {
	return &AuthHandler{
		queries:           queries,
		authService:       authService,
		cloudinaryService: cloudinaryService,
		cookieDomain:      cookieDomain,
		cookieSecure:      cookieSecure,
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	username := c.PostForm("username")
	email := c.PostForm("email")
	password := c.PostForm("password")
	fullName := c.PostForm("full_name")
	phoneNumber := c.PostForm("phone_number")

	if username == "" || email == "" || password == "" || fullName == "" || phoneNumber == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username, full_name, email, password and phone_number are required"})
		return
	}

	if !strings.Contains(email, "@") || !strings.Contains(email, ".") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email format"})
		return
	}

	if len(phoneNumber) < 9 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "phone_number must be at least 9 digits"})
		return
	}

	if len(password) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password must be at least 8 characters"})
		return
	}

	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	hasDigit := regexp.MustCompile(`[0-9]`).MatchString(password)
	hasSpecial := regexp.MustCompile(`[^a-zA-Z0-9]`).MatchString(password)
	if !hasUpper || !hasLower || !hasDigit || !hasSpecial {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password must contain uppercase, lowercase, digit, and special character"})
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
		FullName:     fullName,
		StudentIDUrl: studentIDUrl,
		PhoneNumber:  phoneNumber,
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

	tokenStr, jti, err := h.authService.GenerateStudentToken(user.ID.String(), user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	refreshToken, _, err := h.authService.GenerateRefreshToken(user.ID.String(), user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate refresh token"})
		return
	}

	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("token", tokenStr, 86400, "/", h.cookieDomain, h.cookieSecure, true)
	c.SetCookie("refresh_token", refreshToken, 86400*30, "/", h.cookieDomain, h.cookieSecure, true)

	_ = jti // access-token jti; blacklisted on logout

	c.JSON(http.StatusOK, gin.H{
		"token":         tokenStr,
		"refresh_token": refreshToken,
		"user":          models.ToUserResponse(user),
		"actor_type":    "student",
	})
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	user, err := h.queries.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, models.ToUserResponse(user))
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	refreshTokenStr, _ := c.Cookie("refresh_token")
	if refreshTokenStr == "" {
		var req struct {
			RefreshToken string `json:"refresh_token"`
		}
		if err := c.ShouldBindJSON(&req); err == nil {
			refreshTokenStr = req.RefreshToken
		}
	}

	if refreshTokenStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refresh token required"})
		return
	}

	claims, err := h.authService.ValidateRefreshToken(c.Request.Context(), refreshTokenStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired refresh token"})
		return
	}

	userID, _ := claims["user_id"].(string)
	email, _ := claims["email"].(string)

	newToken, _, err := h.authService.GenerateStudentToken(userID, email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	newRefreshToken, _, err := h.authService.GenerateRefreshToken(userID, email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate refresh token"})
		return
	}

	// Rotation: revoke the OLD refresh token's jti so a stolen/replayed copy of it
	// can no longer be used to mint fresh tokens. Blacklist only until it would
	// have naturally expired.
	if oldJti, _ := claims["jti"].(string); oldJti != "" {
		if uid, perr := uuid.Parse(userID); perr == nil {
			h.authService.BlacklistToken(c.Request.Context(), oldJti, uid, expFromClaims(claims, 30*24*time.Hour))
		}
	}

	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("token", newToken, 86400, "/", h.cookieDomain, h.cookieSecure, true)
	c.SetCookie("refresh_token", newRefreshToken, 86400*30, "/", h.cookieDomain, h.cookieSecure, true)

	c.JSON(http.StatusOK, gin.H{
		"token":         newToken,
		"refresh_token": newRefreshToken,
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	// Blacklist the current access token's jti if available.
	if jti, exists := c.Get("jti"); exists && jti != "" {
		if jtiStr, ok := jti.(string); ok && jtiStr != "" {
			// Blacklist until token would naturally expire (max 15min from now)
			h.authService.BlacklistToken(c.Request.Context(), jtiStr, userID, time.Now().Add(15*time.Minute))
		}
	}

	// Also blacklist the refresh token's jti so it cannot be replayed after logout.
	refreshTokenStr, _ := c.Cookie("refresh_token")
	if refreshTokenStr == "" {
		var req struct {
			RefreshToken string `json:"refresh_token"`
		}
		if err := c.ShouldBindJSON(&req); err == nil {
			refreshTokenStr = req.RefreshToken
		}
	}
	if refreshTokenStr != "" {
		if rc, err := h.authService.ValidateRefreshToken(c.Request.Context(), refreshTokenStr); err == nil {
			if rjti, _ := rc["jti"].(string); rjti != "" {
				h.authService.BlacklistToken(c.Request.Context(), rjti, userID, expFromClaims(rc, 30*24*time.Hour))
			}
		}
	}

	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("token", "", -1, "/", h.cookieDomain, h.cookieSecure, true)
	c.SetCookie("refresh_token", "", -1, "/", h.cookieDomain, h.cookieSecure, true)
	c.SetCookie("csrf_token", "", -1, "/", h.cookieDomain, false, false)

	c.JSON(http.StatusOK, gin.H{"message": "logged out successfully"})
}
