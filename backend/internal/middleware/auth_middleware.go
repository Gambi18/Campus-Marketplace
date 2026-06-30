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
		tokenStr := extractBearerToken(c)
		if tokenStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization required"})
			c.Abort()
			return
		}

		m.setClaims(c, tokenStr)
	}
}

// RequireWebSocketAuth is identical to RequireAuth but also accepts the token
// from a query parameter, which is unavoidable for browser WebSocket connections
// (the WebSocket API does not support setting custom headers). The query-param
// path is intentionally separated from RequireAuth so that REST endpoints never
// accept tokens via URL, preventing log/referrer leakage.
func (m *AuthMiddleware) RequireWebSocketAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := extractBearerToken(c)
		if tokenStr == "" {
			tokenStr = c.Query("token")
		}
		if tokenStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization required"})
			c.Abort()
			return
		}

		m.setClaims(c, tokenStr)
	}
}

func extractBearerToken(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && parts[0] == "Bearer" {
			return parts[1]
		}
	}
	if token, err := c.Cookie("token"); err == nil && token != "" {
		return token
	}
	return ""
}

func (m *AuthMiddleware) setClaims(c *gin.Context, tokenStr string) {
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

	jti, _ := claims["jti"].(string)
	c.Set("jti", jti)

	c.Next()
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
