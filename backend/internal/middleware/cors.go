package middleware

import (
	"github.com/gin-gonic/gin"
)

// CORSMiddleware enables CORS for an explicit allow-list of origins.
// Reflecting only trusted origins (instead of "*") is required because the API
// is used with credentials — the wildcard + credentials combination is invalid
// per the CORS spec and unsafe.
func CORSMiddleware(allowedOrigins []string) gin.HandlerFunc {
	allowed := make(map[string]bool, len(allowedOrigins))
	for _, o := range allowedOrigins {
		allowed[o] = true
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin != "" && allowed[origin] {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Vary", "Origin")
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		}
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// IsAllowedOrigin reports whether origin is in the allow-list. Used by the
// WebSocket upgrader's CheckOrigin to prevent cross-site WebSocket hijacking.
func IsAllowedOrigin(allowedOrigins []string, origin string) bool {
	for _, o := range allowedOrigins {
		if o == origin {
			return true
		}
	}
	return false
}
