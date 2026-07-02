-- name: CreateReport :one
INSERT INTO reports (
    reporter_id,
    product_id,
    reason,
    details
) VALUES (
    $1, $2, $3, $4
)
RETURNING *;

-- name: GetReportByID :one
SELECT
    r.*,
    u.username  AS reporter_name,
    p.title     AS product_title
FROM reports r
JOIN users    u ON u.id = r.reporter_id
JOIN products p ON p.id = r.product_id
WHERE r.id = $1;

-- name: GetAllReports :many
SELECT
    r.*,
    u.username  AS reporter_name,
    p.title     AS product_title
FROM reports r
JOIN users    u ON u.id = r.reporter_id
JOIN products p ON p.id = r.product_id
ORDER BY r.created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: GetReportsByStatus :many
SELECT
    r.*,
    u.username  AS reporter_name,
    p.title     AS product_title
FROM reports r
JOIN users    u ON u.id = r.reporter_id
JOIN products p ON p.id = r.product_id
WHERE r.status = $1
ORDER BY r.created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: GetReportsByReporterID :many
SELECT
    r.*,
    u.username  AS reporter_name,
    p.title     AS product_title
FROM reports r
JOIN users    u ON u.id = r.reporter_id
JOIN products p ON p.id = r.product_id
WHERE r.reporter_id = $1
ORDER BY r.created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: UpdateReportStatus :one
UPDATE reports
SET
    status     = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;