<?php

// ============================================================
// cron/enforceSuspensions.php — Nightly billing sweep
// Schedule: 1 0 * * * php /path/to/backend/cron/enforceSuspensions.php
//
// CLI only. No HTTP context — bootstrap.php intentionally excluded.
// Loads EnvLoader, Database, and ShopInvoice model directly.
// ============================================================

define('CRON_START', microtime(true));

$backendRoot = dirname(__DIR__);

require_once $backendRoot . '/config/EnvLoader.php';
EnvLoader::load($backendRoot . '/.env');

require_once $backendRoot . '/config/Database.php';
require_once $backendRoot . '/config/EmailSender.php';
require_once $backendRoot . '/models/ShopInvoice.php';

$db    = (new Database())->connect();
$model = new ShopInvoice($db);

echo "[" . date('Y-m-d H:i:s') . "] FixGo Suspension Sweep starting.\n";

$db->beginTransaction();
try {
    $overdue = $model->findOverdueForSweep();

    if (empty($overdue)) {
        $db->rollBack();
        echo "[" . date('Y-m-d H:i:s') . "] No overdue invoices found. Sweep complete.\n";
        exit(0);
    }

    $suspendStmt = $db->prepare("UPDATE users SET isActive = 0 WHERE id = :shopId");

    $processed = 0;
    foreach ($overdue as $inv) {
        $model->markOverdue((int)$inv['id']);
        $suspendStmt->execute([':shopId' => $inv['shopId']]);
        
        if (!empty($inv['shopEmail'])) {
            EmailSender::sendSuspensionEmail($inv['shopEmail'], $inv['shopName'], [
                'invoiceReference'   => $inv['invoiceReference'],
                'billingPeriodYear'  => $inv['billingPeriodYear'],
                'billingPeriodMonth' => $inv['billingPeriodMonth'],
                'totalAmount'        => $inv['totalAmount']
            ]);
        }

        $processed++;
        echo "  -> Invoice #{$inv['id']} marked Overdue. Shop #{$inv['shopId']} suspended.\n";
    }

    $db->commit();

    $elapsed = round(microtime(true) - CRON_START, 3);
    echo "[" . date('Y-m-d H:i:s') . "] Sweep complete. Processed: {$processed} invoice(s). Time: {$elapsed}s\n";
    exit(0);

} catch (Throwable $e) {
    $db->rollBack();
    error_log("CRON FATAL ERROR: " . $e->getMessage());
    echo "[" . date('Y-m-d H:i:s') . "] FATAL: " . $e->getMessage() . "\n";
    exit(1);
}
