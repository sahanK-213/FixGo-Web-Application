-- ============================================================
-- Migration 010: FixGo Billing Module — Schema Implementation
-- Target DB   : fixgo_web (MariaDB 10.4)
-- ============================================================

START TRANSACTION;

-- ============================================================
-- STEP 1: Drop legacy stub tables (confirmed empty in production)
-- ============================================================

ALTER TABLE `history` DROP FOREIGN KEY `history_ibfk_1`;
ALTER TABLE `history` DROP FOREIGN KEY `history_ibfk_2`;
DROP TABLE IF EXISTS `history`;

ALTER TABLE `monthlyBill` DROP FOREIGN KEY `monthlyBill_ibfk_1`;
ALTER TABLE `monthlyBill` DROP FOREIGN KEY `monthlyBill_ibfk_2`;
DROP TABLE IF EXISTS `monthlyBill`;

DROP TABLE IF EXISTS `serviceChargeRule`;

-- ============================================================
-- STEP 2: Create `billingConfiguration` (single-row settings)
-- ============================================================

CREATE TABLE `billingConfiguration` (
  `id`                            INT(11)         NOT NULL AUTO_INCREMENT,
  `garagePerRequestFee`           DECIMAL(10,2)   NOT NULL DEFAULT 500.00,
  `serviceCenterPerRequestFee`    DECIMAL(10,2)   NOT NULL DEFAULT 400.00,
  `sparePartsMonthlyFee`          DECIMAL(10,2)   NOT NULL DEFAULT 3000.00,
  `garageGracePeriodDays`         INT(11)         NOT NULL DEFAULT 14,
  `serviceCenterGracePeriodDays`  INT(11)         NOT NULL DEFAULT 14,
  `sparePartsGracePeriodDays`     INT(11)         NOT NULL DEFAULT 14,
  `updatedAt`                     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedByAdminId`              INT(11)         DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `billingConfiguration_ibfk_1`
    FOREIGN KEY (`updatedByAdminId`) REFERENCES `admin` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



-- ============================================================
-- STEP 3: Create `shopInvoice` — core billing ledger
-- ============================================================

CREATE TABLE `shopInvoice` (
  `id`                  INT(11)         NOT NULL AUTO_INCREMENT,
  `shopId`              INT(11)         NOT NULL,
  `billingPeriodYear`   INT(4)          NOT NULL,
  `billingPeriodMonth`  TINYINT(2)      NOT NULL,
  `shopCategoryId`      INT(11)         NOT NULL,
  `rateSnapshot`        DECIMAL(10,2)   NOT NULL,
  `completedRequests`   INT(11)         NOT NULL DEFAULT 0,
  `totalAmount`         DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `invoiceReference`    VARCHAR(40)     NOT NULL UNIQUE,
  `invoiceStatus`       ENUM('Draft','Dispatched','Verification Pending','Overdue','Paid') NOT NULL DEFAULT 'Draft',
  `dispatchedAt`        TIMESTAMP       NULL DEFAULT NULL,
  `dueDate`             DATE            NULL DEFAULT NULL,
  `paymentSlipUrl`      VARCHAR(500)    NULL DEFAULT NULL,
  `paymentReference`    VARCHAR(255)    NULL DEFAULT NULL,
  `slipSubmittedAt`     TIMESTAMP       NULL DEFAULT NULL,
  `verifiedAt`          TIMESTAMP       NULL DEFAULT NULL,
  `verifiedByAdminId`   INT(11)         NULL DEFAULT NULL,
  `rejectionReason`     TEXT            NULL DEFAULT NULL,
  `createdAt`           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_shopPeriod` (`shopId`, `billingPeriodYear`, `billingPeriodMonth`),
  INDEX `idx_statusDue`      (`invoiceStatus`, `dueDate`),
  INDEX `idx_shopId`         (`shopId`),
  INDEX `idx_categoryPeriod` (`shopCategoryId`, `billingPeriodYear`, `billingPeriodMonth`),
  INDEX `idx_invoiceStatus`  (`invoiceStatus`),
  CONSTRAINT `shopInvoice_ibfk_1` FOREIGN KEY (`shopId`)            REFERENCES `shop` (`id`)      ON DELETE RESTRICT,
  CONSTRAINT `shopInvoice_ibfk_2` FOREIGN KEY (`shopCategoryId`)    REFERENCES `shopCategory` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `shopInvoice_ibfk_3` FOREIGN KEY (`verifiedByAdminId`) REFERENCES `admin` (`id`)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;
