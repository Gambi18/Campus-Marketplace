-- name: BlacklistToken :exec
INSERT INTO token_blacklist (jti, user_id, expires_at)
VALUES ($1, $2, $3);

-- name: IsTokenBlacklisted :one
SELECT EXISTS(
    SELECT 1 FROM token_blacklist
    WHERE jti = $1 AND expires_at > NOW()
);

-- name: GetBlacklistedTokensByUser :many
SELECT * FROM token_blacklist
WHERE user_id = $1
ORDER BY created_at DESC;
