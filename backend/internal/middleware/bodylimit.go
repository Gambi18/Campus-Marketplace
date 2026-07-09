package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// BodySizeLimit caps the number of bytes read from each request body, guarding
// against memory-exhaustion DoS from oversized uploads (student IDs, product
// images). Once the limit is exceeded, the body reader returns an error which
// handlers surface as a 400. maxBytes applies to the whole request body,
// including multipart uploads.
func BodySizeLimit(maxBytes int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
		c.Next()
	}
}
