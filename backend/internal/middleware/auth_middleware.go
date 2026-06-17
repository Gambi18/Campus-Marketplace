package middleware

import (
	"net/http"
	"strings"

	"campus-marketplace/internal/services"

	"github.com/gin-gonic/gin"
)

type AuthMiddleware struct {
	authService *services.AuthService
}

func NewAuthMiddleware(authService *services.AuthService) *AuthMiddleware {
	return &AuthMiddleware{authService: authService}
}

func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := ""

		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenStr = parts[1]
			}
		}

		if tokenStr == "" {
			tokenStr = c.Query("token")
		}

		if tokenStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization required"})
			c.Abort()
			return
		}

		claims, err := m.authService.ValidateToken(tokenStr)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		actorType, _ := claims["actor_type"].(string)
		c.Set("user_id", claims["user_id"])
		c.Set("email", claims["email"])
		c.Set("actor_type", actorType)

		c.Next()
	}
}

func (m *AuthMiddleware) RequireStudent() gin.HandlerFunc {
	return func(c *gin.Context) {
		actorType, _ := c.Get("actor_type")
		if actorType != services.ActorTypeStudent {
			c.JSON(http.StatusForbidden, gin.H{"error": "student access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func (m *AuthMiddleware) RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		actorType, _ := c.Get("actor_type")
		if actorType != services.ActorTypeAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}
