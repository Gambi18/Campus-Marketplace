-- name: CreateAuditLog :exec
INSERT INTO audit_log (admin_id, action, target_id, target_type, details, ip_address)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: GetAuditLogsByAdmin :many
SELECT * FROM audit_log
WHERE admin_id = $1
ORDER BY created_at DESC;

-- name: GetAuditLogsByAction :many
SELECT * FROM audit_log
WHERE action = $1
ORDER BY created_at DESC;
