package services

import (
	"context"
	"fmt"
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
}

func NewAuthService(jwtSecret, refreshSecret string, queries *db.Queries, tokenExpiry, refreshExpiry time.Duration) *AuthService {
	if tokenExpiry == 0 {
		tokenExpiry = 15 * time.Minute
	}
	if refreshExpiry == 0 {
		refreshExpiry = 30 * 24 * time.Hour
	}
	return &AuthService{
		JWTSecret:     jwtSecret,
		RefreshSecret: refreshSecret,
		queries:       queries,
		tokenExpiry:   tokenExpiry,
		refreshExpiry: refreshExpiry,
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

func (s *AuthService) ValidateToken(tokenString string) (jwt.MapClaims, error) {
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

	if s.queries != nil {
		jti, _ := claims["jti"].(string)
		if jti != "" {
			blacklisted, err := s.queries.IsTokenBlacklisted(context.Background(), jti)
			if err == nil && blacklisted {
				return nil, fmt.Errorf("token has been revoked")
			}
		}
	}

	return claims, nil
}

func (s *AuthService) GenerateRefreshToken(userID, email string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"type":    "refresh",
		"exp":     time.Now().Add(s.refreshExpiry).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(s.RefreshSecret))
	if err != nil {
		return "", fmt.Errorf("error signing refresh token: %w", err)
	}
	return signed, nil
}

func (s *AuthService) ValidateRefreshToken(tokenString string) (jwt.MapClaims, error) {
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
