package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// rateLimiter is a small in-memory fixed-window limiter keyed by client IP.
// It is intended to throttle sensitive endpoints (e.g. login) against
// brute-force and credential-stuffing. For multi-instance deployments this
// should be backed by a shared store (Redis); for a single instance it is enough.
type rateLimiter struct {
	mu     sync.Mutex
	hits   map[string]*window
	limit  int
	window time.Duration
}

type window struct {
	count   int
	resetAt time.Time
}

func newRateLimiter(limit int, per time.Duration) *rateLimiter {
	rl := &rateLimiter{
		hits:   make(map[string]*window),
		limit:  limit,
		window: per,
	}
	return rl
}

func (rl *rateLimiter) allow(key string, now time.Time) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	w, ok := rl.hits[key]
	if !ok || now.After(w.resetAt) {
		rl.hits[key] = &window{count: 1, resetAt: now.Add(rl.window)}
		// Opportunistically evict expired entries so the map cannot grow
		// unbounded under many distinct client IPs.
		for k, v := range rl.hits {
			if now.After(v.resetAt) {
				delete(rl.hits, k)
			}
		}
		return true
	}

	if w.count >= rl.limit {
		return false
	}
	w.count++
	return true
}

// RateLimit returns a gin middleware that allows at most `limit` requests per
// `per` duration from a single client IP, responding 429 once exceeded.
func RateLimit(limit int, per time.Duration) gin.HandlerFunc {
	rl := newRateLimiter(limit, per)
	return func(c *gin.Context) {
		if !rl.allow(c.ClientIP(), time.Now()) {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "too many attempts, please try again later"})
			c.Abort()
			return
		}
		c.Next()
	}
}
