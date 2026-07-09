package httpx

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() { gin.SetMode(gin.TestMode) }

// ctxWithQuery builds a *gin.Context whose request carries the given raw query
// string (e.g. "limit=10&offset=5").
func ctxWithQuery(rawQuery string) *gin.Context {
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest(http.MethodGet, "/?"+rawQuery, nil)
	return c
}

func TestParsePagination(t *testing.T) {
	const (
		defaultLimit int32 = 20
		maxLimit     int32 = 100
	)

	tests := []struct {
		name       string
		query      string
		wantLimit  int32
		wantOffset int32
	}{
		{"defaults when absent", "", defaultLimit, 0},
		{"valid limit and offset", "limit=10&offset=5", 10, 5},
		{"limit clamped to max", "limit=500", maxLimit, 0},
		{"limit exactly max", "limit=100", 100, 0},
		{"negative limit ignored -> default", "limit=-5", defaultLimit, 0},
		{"zero limit ignored -> default", "limit=0", defaultLimit, 0},
		{"garbage limit ignored -> default", "limit=abc", defaultLimit, 0},
		{"negative offset ignored -> zero", "offset=-10", defaultLimit, 0},
		{"garbage offset ignored -> zero", "offset=xyz", defaultLimit, 0},
		{"zero offset accepted", "offset=0", defaultLimit, 0},
		{"valid offset only", "offset=42", defaultLimit, 42},
		{"overflow limit ignored -> default", "limit=99999999999999999999", defaultLimit, 0},
		{"valid limit garbage offset", "limit=7&offset=nope", 7, 0},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			c := ctxWithQuery(tc.query)
			p := ParsePagination(c, defaultLimit, maxLimit)
			if p.Limit != tc.wantLimit {
				t.Errorf("Limit = %d, want %d", p.Limit, tc.wantLimit)
			}
			if p.Offset != tc.wantOffset {
				t.Errorf("Offset = %d, want %d", p.Offset, tc.wantOffset)
			}
		})
	}
}
