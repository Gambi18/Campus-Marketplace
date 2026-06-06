CREATE TABLE IF NOT EXISTS messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id   UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id   ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_product_id  ON messages(product_id);

-- Prevent user from messaging themselves
ALTER TABLE messages ADD CONSTRAINT check_sender_not_receiver 
    CHECK (sender_id != receiver_id);