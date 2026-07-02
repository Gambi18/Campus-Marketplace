// Package dbtx provides a small helper to run a set of sqlc queries inside a
// single database transaction, so multi-write flows (notably the payment/escrow
// path) are atomic instead of a sequence of autocommit statements.
package dbtx

import (
	"context"
	"database/sql"

	db "campus-marketplace/internal/db/sqlc"
)

// RunInTx opens a transaction, hands the caller a *db.Queries bound to it, and
// commits if fn returns nil. Any error (or panic) rolls back. The deferred
// Rollback is a no-op once Commit has succeeded.
func RunInTx(ctx context.Context, sqlDB *sql.DB, q *db.Queries, fn func(qtx *db.Queries) error) error {
	tx, err := sqlDB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	if err := fn(q.WithTx(tx)); err != nil {
		return err
	}
	return tx.Commit()
}
