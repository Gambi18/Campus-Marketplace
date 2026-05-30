-- name: GetAllCategories :many
SELECT * FROM categories
ORDER BY name ASC;

-- name: GetCategoryByID :one
SELECT * FROM categories
WHERE id = $1;

-- name: CreateCategory :one
INSERT INTO categories (name, description)
VALUES($1, $2)
RETURNING *;

-- name: UpdateCategory :one
UPDATE categories
SET
    name        = $2,
    description = $3
WHERE id = $1
RETURNING *;

-- name: DeleteCategory :exec
DELETE FROM categories
WHERE id = $1;
