-- name: CreateMessage :one
INSERT INTO messages (
    sender_id,
    receiver_id,
    product_id,
    content
) VALUES (
    $1, $2, $3, $4
)
RETURNING *;

-- name: GetMessagesByConversation :many
SELECT
    m.*,
    u.username AS sender_name
FROM messages m
JOIN users u ON u.id = m.sender_id
WHERE (
    (m.sender_id = $1 AND m.receiver_id = $2)
    OR
    (m.sender_id = $2 AND m.receiver_id = $1)
)
AND m.product_id = $3
ORDER BY m.created_at ASC;

-- name: GetConversations :many
SELECT DISTINCT ON (
    LEAST(m.sender_id::text, m.receiver_id::text) || m.product_id::text
)
    m.*,
    u.username  AS sender_name,
    p.title     AS product_title,
    p.image_url_1 AS product_image,
    (
        SELECT COUNT(*) FROM messages um
        WHERE um.product_id = m.product_id
          AND um.receiver_id = $1
          AND um.sender_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
          AND um.is_read = FALSE
    ) AS unread_count
FROM messages m
JOIN users    u ON u.id = m.sender_id
JOIN products p ON p.id = m.product_id
WHERE m.sender_id = $1
OR    m.receiver_id = $1
ORDER BY
    LEAST(m.sender_id::text, m.receiver_id::text) || m.product_id::text,
    m.created_at DESC;

-- name: MarkMessagesAsRead :exec
UPDATE messages
SET is_read = TRUE
WHERE product_id  = $1
AND   sender_id   = $2
AND   receiver_id = $3
AND   is_read     = FALSE;

-- name: GetUnreadCount :one
SELECT COUNT(*) FROM messages
WHERE receiver_id = $1
AND   is_read     = FALSE;