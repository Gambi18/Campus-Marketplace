CREATE TABLE IF NOT EXISTS payments (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id           UUID           NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
    seller_id          UUID           NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
    product_id         UUID           NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    amount             NUMERIC(10,2)  NOT NULL,
    platform_fee       NUMERIC(10,2)  NOT NULL DEFAULT 0,
    net_amount         NUMERIC(10,2)  NOT NULL DEFAULT 0,
    phone_number       VARCHAR(20)    NOT NULL,
    operator           VARCHAR(20)    NOT NULL,
    reference          VARCHAR(100)   UNIQUE,
    withdraw_reference VARCHAR(100),
    status             VARCHAR(20)    NOT NULL DEFAULT 'pending',
    receipt_number     VARCHAR(50)    UNIQUE,
    receipt_pdf_url    TEXT,
    created_at         TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_buyer_id   ON payments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payments_seller_id  ON payments(seller_id);
CREATE INDEX IF NOT EXISTS idx_payments_product_id ON payments(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_status     ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_reference  ON payments(reference);