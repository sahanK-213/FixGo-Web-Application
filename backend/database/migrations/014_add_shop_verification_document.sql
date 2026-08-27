ALTER TABLE shop
    ADD COLUMN verification_document VARCHAR(255) DEFAULT NULL,
    ADD COLUMN is_verified TINYINT(1) DEFAULT 0;
