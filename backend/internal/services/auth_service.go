package services

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	ActorTypeStudent = "student"
	ActorTypeAdmin   = "admin"
)

type AuthService struct {
	JWTSecret string
}

func NewAuthService(jwtSecret string) *AuthService {
	return &AuthService{JWTSecret: jwtSecret}
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

func (s *AuthService) GenerateStudentToken(userID, email string) (string, error) {
	return s.generateToken(userID, email, ActorTypeStudent)
}

func (s *AuthService) GenerateAdminToken(adminID, email string) (string, error) {
	return s.generateToken(adminID, email, ActorTypeAdmin)
}

func (s *AuthService) generateToken(subjectID, email, actorType string) (string, error) {
	claims := jwt.MapClaims{
		"user_id":    subjectID,
		"email":      email,
		"actor_type": actorType,
		"exp":        time.Now().Add(24 * time.Hour).Unix(),
		"iat":        time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(s.JWTSecret))
	if err != nil {
		return "", fmt.Errorf("error signing token: %w", err)
	}
	return signed, nil
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

	return claims, nil
}
