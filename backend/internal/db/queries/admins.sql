-- name: GetAdminByEmail :one
SELECT * FROM admins
WHERE email = $1
LIMIT 1;

-- name: GetAdminByID :one
SELECT * FROM admins
WHERE id = $1
LIMIT 1;

-- name: CreateAdmin :one
INSERT INTO admins (username, email, password_hash)
VALUES ($1, $2, $3)
RETURNING *;

-- name: CountAdmins :one
SELECT COUNT(*)::bigint AS count FROM admins;

-- name: ListAdmins :many
SELECT * FROM admins
ORDER BY created_at ASC;

-- name: DeleteAdmin :exec
DELETE FROM admins
WHERE id = $1;
