package services

import (
	"context"
	"database/sql"

	db "campus-marketplace/internal/db/sqlc"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sqlc-dev/pqtype"
)

type AuditAction string

const (
	AuditBlockUser     AuditAction = "block_user"
	AuditApproveUser   AuditAction = "approve_user"
	AuditRejectUser    AuditAction = "reject_user"
	AuditRefundPayment AuditAction = "refund_payment"
	AuditAdminLogin    AuditAction = "admin_login"
	AuditBootstrap     AuditAction = "bootstrap_admin"
	AuditCreateAdmin   AuditAction = "create_admin"
)

type AuditService struct {
	queries *db.Queries
}

func NewAuditService(queries *db.Queries) *AuditService {
	return &AuditService{queries: queries}
}

func (s *AuditService) Log(ctx context.Context, adminID uuid.UUID, action AuditAction, targetID *uuid.UUID, targetType string, ipAddress string) {
	var tid uuid.NullUUID
	if targetID != nil {
		tid = uuid.NullUUID{UUID: *targetID, Valid: true}
	}

	err := s.queries.CreateAuditLog(ctx, db.CreateAuditLogParams{
		AdminID:  adminID,
		Action:   string(action),
		TargetID: tid,
		TargetType: sql.NullString{
			String: targetType,
			Valid:  targetType != "",
		},
		Details: pqtype.NullRawMessage{
			RawMessage: []byte("{}"),
			Valid:      true,
		},
		IpAddress: sql.NullString{
			String: ipAddress,
			Valid:  ipAddress != "",
		},
	})
	if err != nil {
		println("Failed to create audit log:", err.Error())
	}
}

// ClientIP returns the caller's IP as determined by gin's trusted-proxy-aware
// ClientIP(). With SetTrustedProxies configured (see main.go) this cannot be
// forged via X-Forwarded-For/X-Real-IP by untrusted clients, so recorded
// admin-action IPs are trustworthy.
func ClientIP(c *gin.Context) string {
	return c.ClientIP()
}
