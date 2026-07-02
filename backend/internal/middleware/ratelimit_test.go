package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

// TestRateLimiter_Allow exercises the fixed-window logic deterministically by
// passing an explicit `now`, avoiding time.Sleep flakiness.
func TestRateLimiter_Allow(t *testing.T) {
	const limit = 3
	rl := newRateLimiter(limit, time.Minute)
	base := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	// First `limit` requests within the window are allowed.
	for i := 0; i < limit; i++ {
		if !rl.allow("1.2.3.4", base) {
			t.Fatalf("request %d should be allowed", i+1)
		}
	}
	// The next one is over the limit -> denied.
	if rl.allow("1.2.3.4", base) {
		t.Fatal("request over the limit should be denied")
	}

	// A different IP is independent and still allowed.
	if !rl.allow("5.6.7.8", base) {
		t.Fatal("a different IP must have its own independent bucket")
	}

	// After the window elapses, the original IP's bucket resets.
	afterWindow := base.Add(time.Minute + time.Second)
	if !rl.allow("1.2.3.4", afterWindow) {
		t.Fatal("bucket should reset after the window elapses")
	}
}

// TestRateLimit_Middleware exercises the gin middleware end-to-end with a tiny
// window so the reset path is covered with a short real sleep.
func TestRateLimit_Middleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	const limit = 2
	window := 60 * time.Millisecond

	r := gin.New()
	r.Use(RateLimit(limit, window))
	r.GET("/x", func(c *gin.Context) { c.String(http.StatusOK, "ok") })

	do := func(ip string) int {
		req := httptest.NewRequest(http.MethodGet, "/x", nil)
		req.RemoteAddr = ip + ":12345"
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		return w.Code
	}

	// First `limit` requests from one IP pass.
	for i := 0; i < limit; i++ {
		if code := do("10.0.0.1"); code != http.StatusOK {
			t.Fatalf("request %d from IP should pass, got %d", i+1, code)
		}
	}
	// The next is throttled.
	if code := do("10.0.0.1"); code != http.StatusTooManyRequests {
		t.Fatalf("over-limit request should be 429, got %d", code)
	}
	// A different IP is unaffected.
	if code := do("10.0.0.2"); code != http.StatusOK {
		t.Fatalf("a different IP should be independent, got %d", code)
	}

	// After the window elapses, the first IP can pass again.
	time.Sleep(window + 20*time.Millisecond)
	if code := do("10.0.0.1"); code != http.StatusOK {
		t.Fatalf("after window reset the IP should pass again, got %d", code)
	}
}
