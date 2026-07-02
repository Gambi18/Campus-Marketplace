-- Performance and integrity indexes (additive only).

CREATE INDEX IF NOT EXISTS idx_products_status_created ON products (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON messages (receiver_id) WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_messages_convo ON messages (sender_id, receiver_id, product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments (status, created_at DESC);

-- Enforce at most one live (pending/held) payment per product.
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_payment_per_product ON payments (product_id) WHERE status IN ('pending', 'held');
