ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN is_email_verified TINYINT(1) DEFAULT 0;
UPDATE users SET is_email_verified = 1;
