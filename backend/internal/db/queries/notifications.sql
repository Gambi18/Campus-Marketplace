-- name: CreateNotification :one
INSERT INTO notifications (user_id, type, title, message, metadata, link)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetUserNotifications :many
SELECT * FROM notifications
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: GetUnreadNotificationCount :one
SELECT COUNT(*) FROM notifications
WHERE user_id = $1 AND is_read = FALSE;

-- name: MarkNotificationAsRead :one
UPDATE notifications
SET is_read = TRUE, read_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: MarkAllNotificationsAsRead :exec
UPDATE notifications
SET is_read = TRUE, read_at = NOW()
WHERE user_id = $1 AND is_read = FALSE;

-- name: CreateEmailJob :one
INSERT INTO email_queue (notification_id, recipient_email, subject, template_name, payload)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetPendingEmailJobs :many
SELECT * FROM email_queue
WHERE status = 'pending'
ORDER BY created_at ASC
LIMIT $1;

-- name: UpdateEmailJobStatus :exec
UPDATE email_queue
SET status = $2, attempts = attempts + 1, sent_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE sent_at END
WHERE id = $1;

-- name: GetNotificationPreferences :one
SELECT * FROM notification_preferences
WHERE user_id = $1;

-- name: CreateDefaultNotificationPreferences :one
INSERT INTO notification_preferences (user_id)
VALUES ($1)
ON CONFLICT (user_id) DO NOTHING
RETURNING *;

-- name: UpdateNotificationPreferences :one
UPDATE notification_preferences
SET 
    email_messages = $2,
    email_offers = $3,
    email_sales = $4,
    email_marketing = $5,
    inapp_messages = $6,
    inapp_offers = $7,
    updated_at = NOW()
WHERE user_id = $1
RETURNING *;
