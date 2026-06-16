DROP INDEX IF EXISTS idx_users_full_name;
ALTER TABLE users DROP COLUMN IF EXISTS full_name;