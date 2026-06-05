-- Restore old single image column
ALTER TABLE products ADD COLUMN image_url TEXT;

-- Migrate image_url_1 back to image_url
UPDATE products SET image_url = image_url_1;

-- Drop new columns
ALTER TABLE products
    DROP COLUMN IF EXISTS condition,
    DROP COLUMN IF EXISTS image_url_1,
    DROP COLUMN IF EXISTS image_url_2,
    DROP COLUMN IF EXISTS image_url_3,
    DROP COLUMN IF EXISTS image_url_4;