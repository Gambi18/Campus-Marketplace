DROP INDEX IF EXISTS idx_users_account_status;

ALTER TABLE users
    DROP COLUMN IF EXISTS student_id_url,
    DROP COLUMN IF EXISTS account_status;