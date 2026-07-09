package services

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	db "campus-marketplace/internal/db/sqlc"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

const (
	ActorTypeStudent = "student"
	ActorTypeAdmin   = "admin"
)

type AuthService struct {
	JWTSecret     string
	RefreshSecret string
	queries       *db.Queries
	tokenExpiry   time.Duration
	refreshExpiry time.Duration

	// blacklistCache is a small in-process negative cache: jti -> expiry time of
	// the cached "not blacklisted" verdict. It lets repeated requests carrying the
	// same still-valid token skip the Postgres round-trip on the hot auth path.
	// Only NEGATIVE results are cached with a short TTL, so a freshly blacklisted
	// jti becomes effective within blacklistCacheTTL without any invalidation.
	blacklistCache    sync.Map
	blacklistCacheTTL time.Duration
}

func NewAuthService(jwtSecret, refreshSecret string, queries *db.Queries, tokenExpiry, refreshExpiry time.Duration) *AuthService {
	if tokenExpiry == 0 {
		tokenExpiry = 15 * time.Minute
	}
	if refreshExpiry == 0 {
		refreshExpiry = 30 * 24 * time.Hour
	}
	return &AuthService{
		JWTSecret:         jwtSecret,
		RefreshSecret:     refreshSecret,
		queries:           queries,
		tokenExpiry:       tokenExpiry,
		refreshExpiry:     refreshExpiry,
		blacklistCacheTTL: 30 * time.Second,
	}
}

func (s *AuthService) HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("error hashing password : %w", err)
	}
	return string(bytes), nil
}

func (s *AuthService) CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func (s *AuthService) GenerateStudentToken(userID, email string) (string, string, error) {
	return s.generateToken(userID, email, ActorTypeStudent)
}

func (s *AuthService) GenerateAdminToken(adminID, email string) (string, string, error) {
	return s.generateToken(adminID, email, ActorTypeAdmin)
}

func (s *AuthService) generateToken(subjectID, email, actorType string) (string, string, error) {
	jti := uuid.New().String()
	claims := jwt.MapClaims{
		"user_id":    subjectID,
		"email":      email,
		"actor_type": actorType,
		"jti":        jti,
		"exp":        time.Now().Add(s.tokenExpiry).Unix(),
		"iat":        time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(s.JWTSecret))
	if err != nil {
		return "", "", fmt.Errorf("error signing token: %w", err)
	}
	return signed, jti, nil
}

func (s *AuthService) ValidateToken(ctx context.Context, tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.JWTSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	jti, _ := claims["jti"].(string)
	if s.isBlacklisted(ctx, jti) {
		return nil, fmt.Errorf("token has been revoked")
	}

	return claims, nil
}

// isBlacklisted reports whether the given jti has been revoked. It consults a
// short-lived in-process negative cache first so the common case (a valid,
// unrevoked token used repeatedly) avoids a DB round-trip. Only "not
// blacklisted" verdicts are cached; a revoked jti is never cached, and the
// short TTL bounds how long a stale negative verdict can survive. On DB error
// it fails open (matching the previous behaviour where only err==nil &&
// blacklisted revoked a token).
func (s *AuthService) isBlacklisted(ctx context.Context, jti string) bool {
	if s.queries == nil || jti == "" {
		return false
	}

	if v, ok := s.blacklistCache.Load(jti); ok {
		if exp, ok := v.(time.Time); ok && time.Now().Before(exp) {
			return false
		}
		s.blacklistCache.Delete(jti)
	}

	blacklisted, err := s.queries.IsTokenBlacklisted(ctx, jti)
	if err != nil {
		return false
	}
	if blacklisted {
		return true
	}

	s.blacklistCache.Store(jti, time.Now().Add(s.blacklistCacheTTL))
	return false
}

// StartBlacklistCleanup periodically deletes expired rows from token_blacklist
// (so the table cannot grow unboundedly) and prunes stale negative-cache
// entries. It blocks until ctx is cancelled and is meant to run in its own
// goroutine.
func (s *AuthService) StartBlacklistCleanup(ctx context.Context, interval time.Duration) {
	if s.queries == nil {
		return
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := s.queries.DeleteExpiredBlacklistedTokens(ctx); err != nil {
				log.Printf("blacklist cleanup failed: %v", err)
			}
			now := time.Now()
			s.blacklistCache.Range(func(k, v any) bool {
				if exp, ok := v.(time.Time); ok && now.After(exp) {
					s.blacklistCache.Delete(k)
				}
				return true
			})
		}
	}
}

// GenerateRefreshToken issues a refresh token carrying a unique jti so it can be
// individually revoked (on logout and on rotation). It returns the signed token
// and its jti.
func (s *AuthService) GenerateRefreshToken(userID, email string) (string, string, error) {
	jti := uuid.New().String()
	claims := jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"type":    "refresh",
		"jti":     jti,
		"exp":     time.Now().Add(s.refreshExpiry).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(s.RefreshSecret))
	if err != nil {
		return "", "", fmt.Errorf("error signing refresh token: %w", err)
	}
	return signed, jti, nil
}

func (s *AuthService) ValidateRefreshToken(ctx context.Context, tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.RefreshSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid refresh token claims")
	}

	if typ, _ := claims["type"].(string); typ != "refresh" {
		return nil, fmt.Errorf("not a refresh token")
	}

	// A revoked (logged-out or rotated-away) refresh token must not be usable.
	jti, _ := claims["jti"].(string)
	if s.isBlacklisted(ctx, jti) {
		return nil, fmt.Errorf("refresh token has been revoked")
	}

	return claims, nil
}

func (s *AuthService) BlacklistToken(ctx context.Context, jti string, userID uuid.UUID, expiresAt time.Time) error {
	if s.queries == nil {
		return nil
	}
	return s.queries.BlacklistToken(ctx, db.BlacklistTokenParams{
		Jti:       jti,
		UserID:    userID,
		ExpiresAt: expiresAt,
	})
}
