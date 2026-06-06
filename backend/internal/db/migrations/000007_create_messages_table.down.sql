ALTER TABLE messages DROP CONSTRAINT IF EXISTS check_sender_not_receiver;
DROP INDEX IF EXISTS idx_messages_product_id;
DROP INDEX IF EXISTS idx_messages_receiver_id;
DROP INDEX IF EXISTS idx_messages_sender_id;
DROP TABLE IF EXISTS messages;