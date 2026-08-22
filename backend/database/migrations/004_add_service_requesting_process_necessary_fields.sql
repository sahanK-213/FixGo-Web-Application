-- 1. Add Timestamps and Accountability to the Service Request table
ALTER TABLE `serviceRequest`
ADD COLUMN `confirmed_at` TIMESTAMP NULL DEFAULT NULL AFTER `accepted_at`,
ADD COLUMN `completed_at` TIMESTAMP NULL DEFAULT NULL AFTER `confirmed_at`,
ADD COLUMN `cancelled_at` TIMESTAMP NULL DEFAULT NULL AFTER `completed_at`,
ADD COLUMN `cancelled_by` ENUM('Customer', 'Shop', 'System') NULL DEFAULT NULL AFTER `cancelled_at`,
ADD COLUMN `cancellation_reason` VARCHAR(255) NULL DEFAULT NULL AFTER `cancelled_by`;

-- 2. Add the Penalty Tracker to the Customer table
ALTER TABLE `customer`
ADD COLUMN `cancellation_strikes` INT(11) NOT NULL DEFAULT 0 AFTER `profilePhoto`;