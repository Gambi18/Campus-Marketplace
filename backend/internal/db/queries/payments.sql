-- name: CreatePayment :one
INSERT INTO payments (
    buyer_id,
    seller_id,
    product_id,
    amount,
    phone_number,
    operator,
    reference
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING *;

-- name: GetPaymentByReference :one
SELECT
    p.*,
    u1.username AS buyer_name,
    u2.username AS seller_name,
    pr.title    AS product_title
FROM payments p
JOIN users    u1 ON u1.id = p.buyer_id
JOIN users    u2 ON u2.id = p.seller_id
JOIN products pr ON pr.id = p.product_id
WHERE p.reference = $1;

-- name: GetPaymentByID :one
SELECT
    p.*,
    u1.username AS buyer_name,
    u2.username AS seller_name,
    pr.title    AS product_title
FROM payments p
JOIN users    u1 ON u1.id = p.buyer_id
JOIN users    u2 ON u2.id = p.seller_id
JOIN products pr ON pr.id = p.product_id
WHERE p.id = $1;

-- name: GetBuyerPayments :many
SELECT
    p.*,
    u1.username AS buyer_name,
    u2.username AS seller_name,
    pr.title    AS product_title
FROM payments p
JOIN users    u1 ON u1.id = p.buyer_id
JOIN users    u2 ON u2.id = p.seller_id
JOIN products pr ON pr.id = p.product_id
WHERE p.buyer_id = $1
ORDER BY p.created_at DESC;

-- name: GetSellerPayments :many
SELECT
    p.*,
    u1.username AS buyer_name,
    u2.username AS seller_name,
    pr.title    AS product_title
FROM payments p
JOIN users    u1 ON u1.id = p.buyer_id
JOIN users    u2 ON u2.id = p.seller_id
JOIN products pr ON pr.id = p.product_id
WHERE p.seller_id = $1
ORDER BY p.created_at DESC;

-- name: GetAllHeldPayments :many
SELECT
    p.*,
    u1.username AS buyer_name,
    u2.username AS seller_name,
    pr.title    AS product_title
FROM payments p
JOIN users    u1 ON u1.id = p.buyer_id
JOIN users    u2 ON u2.id = p.seller_id
JOIN products pr ON pr.id = p.product_id
WHERE p.status = 'held'
ORDER BY p.created_at ASC;

-- name: UpdatePaymentStatus :one
UPDATE payments
SET
    status     = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdatePaymentAfterRelease :one
UPDATE payments
SET
    status             = $2,
    platform_fee       = $3,
    net_amount         = $4,
    withdraw_reference = $5,
    receipt_number     = $6,
    receipt_pdf_url    = $7,
    updated_at         = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdatePaymentToHeld :one
UPDATE payments
SET
    status     = 'held',
    updated_at = NOW()
WHERE reference = $1
RETURNING *;