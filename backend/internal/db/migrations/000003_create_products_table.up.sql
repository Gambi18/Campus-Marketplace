CREATE TABLE IF NOT EXISTS products (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER     NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    title       VARCHAR(255) NOT NULL,
    description TEXT         NOT NULL,
    price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    image_url   TEXT,
    status      VARCHAR(20)  NOT NULL DEFAULT 'available',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_seller_id   ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status       ON products(status);