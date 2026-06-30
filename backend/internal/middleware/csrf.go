package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"

	"github.com/gin-gonic/gin"
)

const CSRFHeader = "X-CSRF-Token"
const CSRFCookie = "csrf_token"

func CSRF() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodGet || c.Request.Method == http.MethodHead || c.Request.Method == http.MethodOptions {
			token := generateCSRFToken()
			c.SetCookie(CSRFCookie, token, 86400, "/", "", false, false)
			c.Set(CSRFHeader, token)
			c.Next()
			return
		}

		headerToken := c.GetHeader(CSRFHeader)
		cookieToken, err := c.Cookie(CSRFCookie)
		if err != nil || headerToken == "" || headerToken != cookieToken {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF token mismatch"})
			return
		}

		c.Next()
	}
}

func generateCSRFToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}
