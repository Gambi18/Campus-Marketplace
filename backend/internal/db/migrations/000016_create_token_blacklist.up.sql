CREATE TABLE IF NOT EXISTS token_blacklist (
    jti         TEXT PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id),
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_token_blacklist_expires_at ON token_blacklist(expires_at);
