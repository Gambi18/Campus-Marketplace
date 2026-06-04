ALTER TABLE users
    ADD COLUMN student_id_url  TEXT        NOT NULL DEFAULT '',
    ADD COLUMN account_status  VARCHAR(20) NOT NULL DEFAULT 'pending';

-- Update existing users to approved so they are not locked out
UPDATE users SET account_status = 'approved' WHERE account_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);