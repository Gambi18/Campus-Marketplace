package services

import (
	"context"
	"log"

	db "campus-marketplace/internal/db/sqlc"
)

// EnsureDefaultAdmin creates the first platform admin from env when the admins table is empty.
func EnsureDefaultAdmin(ctx context.Context, queries *db.Queries, auth *AuthService, username, email, password string) {
	if email == "" || password == "" {
		log.Println("ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping default admin seed")
		return
	}

	count, err := queries.CountAdmins(ctx)
	if err != nil {
		log.Printf("could not count admins: %v", err)
		return
	}
	if count > 0 {
		return
	}

	if username == "" {
		username = "admin"
	}

	hash, err := auth.HashPassword(password)
	if err != nil {
		log.Printf("could not hash admin password: %v", err)
		return
	}

	_, err = queries.CreateAdmin(ctx, db.CreateAdminParams{
		Username:     username,
		Email:        email,
		PasswordHash: hash,
	})
	if err != nil {
		log.Printf("could not seed default admin: %v", err)
		return
	}

	log.Printf("Seeded default platform admin: %s", email)
}
