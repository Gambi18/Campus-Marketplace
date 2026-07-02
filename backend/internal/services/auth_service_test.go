package services

import (
	"context"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	testJWTSecret     = "test-jwt-secret-value-1234567890"
	testRefreshSecret = "test-refresh-secret-value-0987654321"
)

// newTestAuthService builds an AuthService with a nil *db.Queries. isBlacklisted
// short-circuits on a nil queries (returning false), so ValidateToken's success
// path does not touch the database and does not panic.
func newTestAuthService() *AuthService {
	return NewAuthService(testJWTSecret, testRefreshSecret, nil, time.Minute, time.Hour)
}

// TestValidateToken_RejectsNoneAlg guards against the alg-confusion attack: a
// token signed with the "none" algorithm must be rejected because the keyfunc
// only accepts HMAC.
func TestValidateToken_RejectsNoneAlg(t *testing.T) {
	s := newTestAuthService()
	claims := jwt.MapClaims{
		"user_id":    "u1",
		"actor_type": ActorTypeStudent,
		"jti":        "j1",
		"exp":        time.Now().Add(time.Hour).Unix(),
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodNone, claims)
	signed, err := tok.SignedString(jwt.UnsafeAllowNoneSignatureType)
	if err != nil {
		t.Fatalf("failed to build none-signed token: %v", err)
	}
	if _, err := s.ValidateToken(context.Background(), signed); err == nil {
		t.Fatal("expected none-alg token to be rejected")
	}
}

// TestValidateToken_RejectsBadSignature: a token that uses HMAC but is signed
// with a different secret must fail signature verification.
func TestValidateToken_RejectsBadSignature(t *testing.T) {
	s := newTestAuthService()
	claims := jwt.MapClaims{
		"user_id": "u1",
		"jti":     "j1",
		"exp":     time.Now().Add(time.Hour).Unix(),
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString([]byte("a-completely-different-secret"))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	if _, err := s.ValidateToken(context.Background(), signed); err == nil {
		t.Fatal("expected token with bad signature to be rejected")
	}
}

// TestValidateToken_RejectsExpired: an expired but correctly-signed token must
// be rejected by the jwt parser (exp validation happens before any DB call).
func TestValidateToken_RejectsExpired(t *testing.T) {
	s := newTestAuthService()
	claims := jwt.MapClaims{
		"user_id": "u1",
		"jti":     "j1",
		"exp":     time.Now().Add(-time.Hour).Unix(),
		"iat":     time.Now().Add(-2 * time.Hour).Unix(),
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString([]byte(testJWTSecret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	if _, err := s.ValidateToken(context.Background(), signed); err == nil {
		t.Fatal("expected expired token to be rejected")
	}
}

// TestGenerateStudentToken_ParsesWithExpectedClaims verifies a generated student
// token round-trips through ValidateToken (with nil queries) and carries the
// expected claims.
func TestGenerateStudentToken_ParsesWithExpectedClaims(t *testing.T) {
	s := newTestAuthService()
	const userID = "student-123"
	const email = "s@example.com"

	signed, jti, err := s.GenerateStudentToken(userID, email)
	if err != nil {
		t.Fatalf("GenerateStudentToken error: %v", err)
	}
	if jti == "" {
		t.Fatal("expected a non-empty jti")
	}

	claims, err := s.ValidateToken(context.Background(), signed)
	if err != nil {
		t.Fatalf("expected generated token to validate, got: %v", err)
	}
	if got := claims["user_id"]; got != userID {
		t.Errorf("user_id = %v, want %v", got, userID)
	}
	if got := claims["actor_type"]; got != ActorTypeStudent {
		t.Errorf("actor_type = %v, want %v", got, ActorTypeStudent)
	}
	if got := claims["jti"]; got != jti {
		t.Errorf("jti in claims = %v, want %v", got, jti)
	}
	if got, _ := claims["jti"].(string); got == "" {
		t.Error("expected a non-empty jti claim")
	}
}

// TestGenerateRefreshToken_ReturnsUniqueJTI: each refresh token must carry a
// non-empty jti, and two calls must produce distinct jtis (so they can be
// revoked individually).
func TestGenerateRefreshToken_ReturnsUniqueJTI(t *testing.T) {
	s := newTestAuthService()

	_, jti1, err := s.GenerateRefreshToken("u1", "u1@example.com")
	if err != nil {
		t.Fatalf("GenerateRefreshToken error: %v", err)
	}
	_, jti2, err := s.GenerateRefreshToken("u1", "u1@example.com")
	if err != nil {
		t.Fatalf("GenerateRefreshToken error: %v", err)
	}
	if jti1 == "" || jti2 == "" {
		t.Fatalf("expected non-empty jtis, got %q and %q", jti1, jti2)
	}
	if jti1 == jti2 {
		t.Fatalf("expected unique jtis across calls, both were %q", jti1)
	}
}
