package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() { gin.SetMode(gin.TestMode) }

// runCSRF drives a request through a gin engine with only the CSRF middleware
// plus a trivial 200 handler, and returns the recorder.
func runCSRF(req *http.Request) *httptest.ResponseRecorder {
	r := gin.New()
	r.Use(CSRF())
	handler := func(c *gin.Context) { c.String(http.StatusOK, "ok") }
	r.GET("/x", handler)
	r.POST("/x", handler)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestCSRF_BearerRequestSkips(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/x", nil)
	req.Header.Set("Authorization", "Bearer sometoken")
	w := runCSRF(req)
	if w.Code != http.StatusOK {
		t.Fatalf("bearer POST should skip CSRF and pass, got %d body=%s", w.Code, w.Body.String())
	}
}

func TestCSRF_CookieAuthNoTokenRejected(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/x", nil)
	// Cookie-authenticated (no Bearer), no CSRF header/cookie -> rejected.
	w := runCSRF(req)
	if w.Code != http.StatusForbidden {
		t.Fatalf("cookie POST without CSRF token should be 403, got %d", w.Code)
	}
}

func TestCSRF_MismatchedTokenRejected(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/x", nil)
	req.Header.Set(CSRFHeader, "header-token")
	req.AddCookie(&http.Cookie{Name: CSRFCookie, Value: "different-cookie-token"})
	w := runCSRF(req)
	if w.Code != http.StatusForbidden {
		t.Fatalf("mismatched double-submit token should be 403, got %d", w.Code)
	}
}

func TestCSRF_MatchingDoubleSubmitPasses(t *testing.T) {
	const token = "matching-token-value"
	req := httptest.NewRequest(http.MethodPost, "/x", nil)
	req.Header.Set(CSRFHeader, token)
	req.AddCookie(&http.Cookie{Name: CSRFCookie, Value: token})
	w := runCSRF(req)
	if w.Code != http.StatusOK {
		t.Fatalf("matching double-submit token should pass, got %d body=%s", w.Code, w.Body.String())
	}
}

func TestCSRF_SafeGetIssuesTokenAndPasses(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	w := runCSRF(req)
	if w.Code != http.StatusOK {
		t.Fatalf("GET should pass, got %d", w.Code)
	}
	// It must issue a csrf_token cookie.
	var found bool
	for _, ck := range w.Result().Cookies() {
		if ck.Name == CSRFCookie && ck.Value != "" {
			found = true
		}
	}
	if !found {
		t.Fatalf("GET should set a %q cookie", CSRFCookie)
	}
}
