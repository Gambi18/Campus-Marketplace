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
	cloudinaryService *services.CloudinaryService
}

func NewAuthHandler(queries *db.Queries, authService *services.AuthService, cloudinaryService *services.CloudinaryService,) *AuthHandler {
	return &AuthHandler{
		queries: queries,
		authService: authService,
		cloudinaryService: cloudinaryService,
	}
}

// CHANGED: entire Register function
// reason: now accepts multipart/form-data to include student ID photo
func (h *AuthHandler) Register(c *gin.Context) {
    // 1. Parse form fields instead of JSON
    username := c.PostForm("username")
    email    := c.PostForm("email")
    password := c.PostForm("password")

    if username == "" || email == "" || password == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "username, email and password are required"})
        return
    }

    if len(password) < 6 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "password must be at least 6 characters"})
        return
    }

    // 2. Get student ID photo — REQUIRED
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

    // 3. Upload student ID to Cloudinary
    studentIDUrl, err := h.cloudinaryService.UploadImage(c.Request.Context(), file, "student-ids")
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "could not upload student ID photo"})
        return
    }

    // 4. Hash password
    hashedPassword, err := h.authService.HashPassword(password)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "could not process password"})
        return
    }

    // 5. Save user to database
    user, err := h.queries.CreateUser(c.Request.Context(), db.CreateUserParams{
        Username:     username,
        Email:        email,
        PasswordHash: hashedPassword,
        Role:         "student",
        StudentIDUrl: studentIDUrl, 
    })
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"error": "email or username already exists"})
        return
    }

    // 6. CHANGED: no token returned — account is pending
    c.JSON(http.StatusCreated, gin.H{
        "message": "registration successful, please come back after 24 hours for verification",
        "user": models.UserResponse{
            ID:            user.ID.String(),
            Username:      user.Username,
            Email:         user.Email,
            Role:          user.Role,
            IsVerified:    user.IsVerified,
            AccountStatus: user.AccountStatus, 
        },
    })
}

// CHANGED: Login now checks account_status before issuing token
func (h *AuthHandler) Login(c *gin.Context) {
    var req models.LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    //  Find user by email
    user, err := h.queries.GetUserByEmail(c.Request.Context(), req.Email)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
        return
    }

    // 2. Check password
    if !h.authService.CheckPassword(req.Password, user.PasswordHash) {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
        return
    }

    // 3. ADDED: check account status before issuing token
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
    }

    // 4. Generate JWT token
    token, err := h.authService.GenerateToken(user.ID.String(), user.Email, user.Role)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
        return
    }

    // 5. Return token and user
    c.JSON(http.StatusOK, models.AuthResponse{
        Token: token,
        User: models.UserResponse{
            ID:            user.ID.String(),
            Username:      user.Username,
            Email:         user.Email,
            Role:          user.Role,
            IsVerified:    user.IsVerified,
            AccountStatus: user.AccountStatus, 
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

// ADDED: admin approves a student
func (h *AuthHandler) ApproveUser(c *gin.Context) {
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

    c.JSON(http.StatusOK, gin.H{
        "message": "user approved successfully",
        "user": models.UserResponse{
            ID:            user.ID.String(),
            Username:      user.Username,
            Email:         user.Email,
            Role:          user.Role,
            IsVerified:    user.IsVerified,
            AccountStatus: user.AccountStatus,
        },
    })
}

// ADDED: admin rejects a student
func (h *AuthHandler) RejectUser(c *gin.Context) {
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

    c.JSON(http.StatusOK, gin.H{
        "message": "user rejected",
        "user": models.UserResponse{
            ID:            user.ID.String(),
            Username:      user.Username,
            Email:         user.Email,
            Role:          user.Role,
            IsVerified:    user.IsVerified,
            AccountStatus: user.AccountStatus,
        },
    })
}

// ADDED: admin views all pending users
func (h *AuthHandler) GetPendingUsers(c *gin.Context) {
    users, err := h.queries.GetPendingUsers(c.Request.Context())
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch pending users"})
        return
    }

    response := make([]models.UserResponse, len(users))
    for i, u := range users {
        response[i] = models.UserResponse{
            ID:            u.ID.String(),
            Username:      u.Username,
            Email:         u.Email,
            Role:          u.Role,
            IsVerified:    u.IsVerified,
            AccountStatus: u.AccountStatus,
            StudentIDUrl: u.StudentIDUrl, // ← so admin can see the photo
        }
    }

    c.JSON(http.StatusOK, gin.H{
        "users": response,
        "count": len(response),
    })
}
