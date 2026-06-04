ALTER TABLE reports DROP CONSTRAINT IF EXISTS unique_reporter_product;
DROP INDEX IF EXISTS idx_reports_status;
DROP INDEX IF EXISTS idx_reports_product_id;
DROP INDEX IF EXISTS idx_reports_reporter_id;
DROP TABLE IF EXISTS reports;