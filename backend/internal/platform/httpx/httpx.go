// Package httpx holds small HTTP helpers shared across handlers. These exist to
// remove the ~220 hand-copied user-extraction and error-response blocks without
// changing any response shapes: Error emits the exact same {"error": msg} body
// handlers already return, and CurrentUserID emits the same 401 on a bad subject.
package httpx

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Error writes the canonical error envelope. Identical in shape to the
// gin.H{"error": ...} literals it replaces.
func Error(c *gin.Context, code int, msg string) {
	c.JSON(code, gin.H{"error": msg})
}

// CurrentUserID parses the authenticated subject set by the auth middleware.
// On failure it writes a 401 (matching the previous inline behaviour) and
// returns ok=false so the caller can `return`.
func CurrentUserID(c *gin.Context) (id uuid.UUID, ok bool) {
	id, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		Error(c, http.StatusUnauthorized, "invalid user")
		return uuid.Nil, false
	}
	return id, true
}

// Pagination holds normalised list-window parameters. Defaults preserve prior
// behaviour for callers that pass no query params: a generous first page rather
// than an unbounded scan.
type Pagination struct {
	Limit  int32
	Offset int32
}

// ParsePagination reads ?limit & ?offset with safe defaults and an upper bound,
// so no endpoint can be coerced into an unbounded result set.
func ParsePagination(c *gin.Context, defaultLimit, maxLimit int32) Pagination {
	p := Pagination{Limit: defaultLimit, Offset: 0}
	if v := c.Query("limit"); v != "" {
		if n, err := parseInt32(v); err == nil && n > 0 {
			p.Limit = n
		}
	}
	if p.Limit > maxLimit {
		p.Limit = maxLimit
	}
	if v := c.Query("offset"); v != "" {
		if n, err := parseInt32(v); err == nil && n >= 0 {
			p.Offset = n
		}
	}
	return p
}
