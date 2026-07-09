package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const CSRFHeader = "X-CSRF-Token"
const CSRFCookie = "csrf_token"

// CSRF implements the double-submit-cookie pattern for cookie-authenticated,
// state-changing requests. It is deliberately a no-op for Bearer-token API
// calls: a browser never attaches an Authorization header automatically, so
// requests carrying `Authorization: Bearer ...` cannot be forged cross-site and
// need no CSRF token. Enforcement therefore applies ONLY when auth arrives via
// cookie, which preserves the current Bearer-based frontend (which sends no CSRF
// token) while closing the cookie-CSRF hole.
func CSRF() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodGet || c.Request.Method == http.MethodHead || c.Request.Method == http.MethodOptions {
			token, err := generateCSRFToken()
			if err != nil {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "could not generate csrf token"})
				return
			}
			c.SetCookie(CSRFCookie, token, 86400, "/", "", false, false)
			c.Set(CSRFHeader, token)
			c.Next()
			return
		}

		// Bearer-token requests are not attackable via CSRF (the header is never
		// sent automatically by a browser), so skip enforcement for them.
		if authHeader := c.GetHeader("Authorization"); strings.HasPrefix(authHeader, "Bearer ") {
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

func generateCSRFToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
