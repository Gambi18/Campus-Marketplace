-- name: CreateUser :one
INSERT INTO users (
    username,
    email,
    password_hash,
    role
) VALUES (
    $1, $2, $3, $4
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