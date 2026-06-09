-- name: CreateUser :one
INSERT INTO users (
    username,
    email,
    password_hash,
    student_id_url,
    account_status
) VALUES (
    $1, $2, $3, $4, 'pending'
)
RETURNING *;


-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1
LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1
LIMIT 1;


-- name: UpdateUserVerification :one
UPDATE users
SET
    is_verified = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: GetAllUsers :many
SELECT * FROM users
ORDER BY created_at DESC;

-- name: GetPendingUsers :many
SELECT * FROM users
WHERE account_status = 'pending'
ORDER BY created_at ASC;

-- name: BlockUser :one
UPDATE users
SET
    account_status = 'blocked',
    updated_at     = NOW()
WHERE id = $1
RETURNING *;

-- name: ApproveUser :one
UPDATE users
SET
    account_status = 'approved',
    is_verified    = TRUE,
    updated_at     = NOW()
WHERE id = $1
RETURNING *;

-- name: RejectUser :one
UPDATE users
SET
    account_status = 'rejected',
    updated_at     = NOW()
WHERE id = $1
RETURNING *;
