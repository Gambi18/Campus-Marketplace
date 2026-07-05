-- name: CreateProduct :one
INSERT INTO products (
    seller_id,
    category_id,
    title,
    description,
    price,
    condition,
    image_url_1,
    image_url_2,
    image_url_3,
    image_url_4
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
)
RETURNING *;

-- name: GetProductByID :one
SELECT 
    p.*,
    u.username  AS seller_name,
    c.name      AS category_name
FROM products p
JOIN users      u ON u.id = p.seller_id
JOIN categories c ON c.id = p.category_id
WHERE p.id = $1;

-- name: GetAllProducts :many
SELECT
    p.*,
    u.username  AS seller_name,
    c.name      AS category_name
FROM products p
JOIN users      u ON u.id = p.seller_id
JOIN categories c ON c.id = p.category_id
WHERE p.status = 'available'
  AND (sqlc.narg('condition')::text    IS NULL OR p.condition = sqlc.narg('condition'))
  AND (sqlc.narg('min_price')::numeric IS NULL OR p.price >= sqlc.narg('min_price')::numeric)
  AND (sqlc.narg('max_price')::numeric IS NULL OR p.price <= sqlc.narg('max_price')::numeric)
ORDER BY
    CASE WHEN sqlc.arg('sort')::text = 'price_low'  THEN p.price END ASC,
    CASE WHEN sqlc.arg('sort')::text = 'price_high' THEN p.price END DESC,
    p.created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: GetProductsBySellerID :many
SELECT
    p.*,
    u.username  AS seller_name,
    c.name      AS category_name
FROM products p
JOIN users      u ON u.id = p.seller_id
JOIN categories c ON c.id = p.category_id
WHERE p.seller_id = $1
ORDER BY p.created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: GetProductsByCategory :many
SELECT
    p.*,
    u.username  AS seller_name,
    c.name      AS category_name
FROM products p
JOIN users      u ON u.id = p.seller_id
JOIN categories c ON c.id = p.category_id
WHERE p.category_id = sqlc.arg('category_id')
AND   p.status = 'available'
  AND (sqlc.narg('condition')::text    IS NULL OR p.condition = sqlc.narg('condition'))
  AND (sqlc.narg('min_price')::numeric IS NULL OR p.price >= sqlc.narg('min_price')::numeric)
  AND (sqlc.narg('max_price')::numeric IS NULL OR p.price <= sqlc.narg('max_price')::numeric)
ORDER BY
    CASE WHEN sqlc.arg('sort')::text = 'price_low'  THEN p.price END ASC,
    CASE WHEN sqlc.arg('sort')::text = 'price_high' THEN p.price END DESC,
    p.created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: SearchProducts :many
SELECT
    p.*,
    u.username  AS seller_name,
    c.name      AS category_name
FROM products p
JOIN users      u ON u.id = p.seller_id
JOIN categories c ON c.id = p.category_id
WHERE p.status = 'available'
AND  (
    p.title       ILIKE '%' || sqlc.arg('keyword') || '%'
    OR p.description ILIKE '%' || sqlc.arg('keyword') || '%'
)
  AND (sqlc.narg('condition')::text    IS NULL OR p.condition = sqlc.narg('condition'))
  AND (sqlc.narg('min_price')::numeric IS NULL OR p.price >= sqlc.narg('min_price')::numeric)
  AND (sqlc.narg('max_price')::numeric IS NULL OR p.price <= sqlc.narg('max_price')::numeric)
ORDER BY
    CASE WHEN sqlc.arg('sort')::text = 'price_low'  THEN p.price END ASC,
    CASE WHEN sqlc.arg('sort')::text = 'price_high' THEN p.price END DESC,
    p.created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: ClaimProductForPurchase :one
UPDATE products SET status = 'in_escrow', updated_at = NOW()
WHERE id = $1 AND status = 'available'
RETURNING *;

-- name: UpdateProduct :one
UPDATE products
SET
    category_id = $2,
    title       = $3,
    description = $4,
    price       = $5,
    condition   = $6,
    image_url_1 = $7,
    image_url_2 = $8,
    image_url_3 = $9,
    image_url_4 = $10,
    updated_at  = NOW()
WHERE id = $1
AND seller_id = $11
RETURNING *;

-- name: UpdateProductStatus :one
UPDATE products
SET
    status     = $2,
    updated_at = NOW()
WHERE id = $1
AND  seller_id = $3
RETURNING *;

-- name: DeleteProduct :exec
DELETE FROM products
WHERE id = $1
AND  seller_id = $2;