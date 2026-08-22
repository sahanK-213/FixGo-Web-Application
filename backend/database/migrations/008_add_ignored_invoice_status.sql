-- ============================================================
-- Migration 011: Add 'Ignored' status to shopInvoice
-- ============================================================

ALTER TABLE `shopInvoice` MODIFY COLUMN `invoiceStatus` ENUM('Draft','Dispatched','Verification Pending','Overdue','Paid','Ignored') NOT NULL DEFAULT 'Draft';
