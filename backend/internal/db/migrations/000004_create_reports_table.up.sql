CREATE TABLE IF NOT EXISTS reports (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    reason      VARCHAR(50) NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_product_id  ON reports(product_id);
CREATE INDEX IF NOT EXISTS idx_reports_status      ON reports(status);

ALTER TABLE reports ADD CONSTRAINT unique_reporter_product
    UNIQUE (reporter_id, product_id);