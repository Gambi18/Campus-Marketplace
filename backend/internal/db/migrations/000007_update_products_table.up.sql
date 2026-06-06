-- Add condition column
ALTER TABLE products
    ADD COLUMN condition   VARCHAR(20) NOT NULL DEFAULT 'good',
    ADD COLUMN image_url_1 TEXT        NOT NULL DEFAULT '',
    ADD COLUMN image_url_2 TEXT        NOT NULL DEFAULT '',
    ADD COLUMN image_url_3 TEXT        NOT NULL DEFAULT '',
    ADD COLUMN image_url_4 TEXT        NOT NULL DEFAULT '';

-- Migrate existing image_url data to image_url_1
UPDATE products SET image_url_1 = image_url WHERE image_url IS NOT NULL;

-- Drop old single image column
ALTER TABLE products DROP COLUMN image_url;