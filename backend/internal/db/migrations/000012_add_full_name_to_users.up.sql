ALTER TABLE users
    ADD COLUMN full_name VARCHAR(100) NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);