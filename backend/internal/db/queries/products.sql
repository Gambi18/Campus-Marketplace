-- name: CreateProduct :one
INSERT INTO products (
    seller_id,
    category_id,
    title,
    description,
    price,
    image_url
) VALUES (
    $1, $2, $3, $4, $5, $6
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
ORDER BY p.created_at DESC;

-- name: GetProductsBySellerID :many
SELECT
    p.*,
    u.username  AS seller_name,
    c.name      AS category_name
FROM products p
JOIN users      u ON u.id = p.seller_id
JOIN categories c ON c.id = p.category_id
WHERE p.seller_id = $1
ORDER BY p.created_at DESC;

-- name: GetProductsByCategory :many
SELECT
    p.*,
    u.username  AS seller_name,
    c.name      AS category_name
FROM products p
JOIN users      u ON u.id = p.seller_id
JOIN categories c ON c.id = p.category_id
WHERE p.category_id = $1
AND   p.status = 'available'
ORDER BY p.created_at DESC;

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
    p.title       ILIKE '%' || $1 || '%'
    OR p.description ILIKE '%' || $1 || '%'
)
ORDER BY p.created_at DESC;

-- name: UpdateProduct :one
UPDATE products
SET
    category_id = $2,
    title       = $3,
    description = $4,
    price       = $5,
    image_url   = $6,
    updated_at  = NOW()
WHERE id = $1
AND seller_id = $7
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