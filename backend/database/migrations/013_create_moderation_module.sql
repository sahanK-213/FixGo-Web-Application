-- Migration 013: Create Moderation Module Tables and Sample Data
-- Creates moderation_flags and moderation_logs for the Admin Dashboard Moderation module.

CREATE TABLE IF NOT EXISTS `moderation_flags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `entity_type` ENUM('review', 'shop', 'user', 'fraud_signal') NOT NULL,
  `entity_id` INT NULL,
  `flag_type` VARCHAR(50) NOT NULL, -- e.g., 'REVIEW REPORT', 'PROFILE FLAG', 'FRAUD SIGNAL'
  `severity` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  `reported_by_user` VARCHAR(100) NULL,
  `shop_name` VARCHAR(150) NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('pending', 'under_review', 'action_taken', 'dismissed') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`status`),
  INDEX (`flag_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `moderation_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `flag_id` INT NOT NULL,
  `admin_id` INT NULL,
  `action_taken` VARCHAR(100) NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`flag_id`) REFERENCES `moderation_flags`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert seed sample records if table is newly created
INSERT INTO `moderation_flags` (`id`, `entity_type`, `entity_id`, `flag_type`, `severity`, `reported_by_user`, `shop_name`, `description`, `status`, `created_at`)
VALUES
(1, 'review', 101, 'REVIEW REPORT', 'high', 'Saman P.', 'Elite Auto Care', 'The shop overcharged me and the mechanic was extremely rude during service.', 'pending', NOW() - INTERVAL 2 MINUTE),
(2, 'shop', 45, 'PROFILE FLAG', 'medium', NULL, 'Vantage Service Center', 'Suspected duplicate profile and unverified business registration details.', 'pending', NOW() - INTERVAL 45 MINUTE),
(3, 'fraud_signal', 2214, 'FRAUD SIGNAL', 'critical', NULL, 'Speedy Repairs Shop', 'Unusual surge in 5-star ratings (50 reviews in 10 minutes) detected.', 'pending', NOW() - INTERVAL 2 HOUR),
(4, 'review', 104, 'REVIEW REPORT', 'low', 'Nimal K.', 'QuickFix Auto', 'Parts supplied were substandard and failed after 2 days of installation.', 'pending', NOW() - INTERVAL 3 HOUR)
ON DUPLICATE KEY UPDATE `id`=`id`;
