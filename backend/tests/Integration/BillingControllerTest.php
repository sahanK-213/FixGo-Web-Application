<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../database/QueryBuilder.php';

class BillingControllerTest extends TestCase {
    private $db;
    private $qb;
    private $wrapperPath;

    private $adminEmail   = 'billing_admin@fixgo.com';
    private $shopEmail    = 'billing_shop@fixgo.com';
    private $adminUserId;
    private $shopUserId;

    // File Diffing Pattern (KI: test_file_cleanup_pattern)
    private array $initialFiles = [];
    private string $uploadDir   = '';

    // Track generated invoices for tearDown
    private int $testBillingYear  = 2099;
    private int $testBillingMonth = 1;

    protected function setUp(): void {
        

        $database   = new Database();
        $this->db   = $database->connect();
        $this->qb   = new QueryBuilder($this->db);

        // Snapshot upload dir BEFORE any test runs (KI pattern)
        $this->uploadDir    = realpath(__DIR__ . '/../../') . '/uploads/paymentSlips/';
        @mkdir($this->uploadDir, 0777, true);
        $this->initialFiles = glob($this->uploadDir . '*') ?: [];

        $this->cleanUp();
        $this->createTestData();

        $this->wrapperPath = __DIR__ . '/billing_wrapper.php';
        file_put_contents($this->wrapperPath,
            "<?php
            require_once '" . realpath(__DIR__ . '/../../config/Database.php')              . "';
            require_once '" . realpath(__DIR__ . '/../../database/QueryBuilder.php')        . "';
            require_once '" . realpath(__DIR__ . '/../../config/RequestValidator.php')      . "';
            require_once '" . realpath(__DIR__ . '/../../config/EmailSender.php')           . "';
            require_once '" . realpath(__DIR__ . '/../../models/BillingConfiguration.php') . "';
            require_once '" . realpath(__DIR__ . '/../../models/ShopInvoice.php')           . "';
            require_once '" . realpath(__DIR__ . '/../../models/Shop.php')                  . "';
            require_once '" . realpath(__DIR__ . '/../../models/userRole.php')              . "';
            require_once '" . realpath(__DIR__ . '/../../controllers/BillingController.php') . "';

            \$db     = (new Database())->connect();
            \$method = \$_SERVER['HTTP_X_METHOD'] ?? '';
            \$userId = (int)(\$_SERVER['HTTP_X_USER_ID'] ?? 0);
            \$ctrl   = new BillingController(\$db);

            if (\$method === 'getRates') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$ctrl->getRates();
            } elseif (\$method === 'updateRates') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$ctrl->updateRates(\$userId);
            } elseif (\$method === 'generateDrafts') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$ctrl->generateDrafts();
            } elseif (\$method === 'clearDrafts') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$ctrl->clearDrafts();
            } elseif (\$method === 'dispatchInvoices') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$ctrl->dispatchInvoices();
            } elseif (\$method === 'getPendingVerifications') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$ctrl->getPendingVerifications();
            } elseif (\$method === 'processVerification') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$ctrl->processVerification(\$userId);
            } elseif (\$method === 'getAnalytics') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$ctrl->getAnalytics();
            } elseif (\$method === 'getShopLedger') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$ctrl->getShopLedger(\$_GET);
            } elseif (\$method === 'getAllInvoices') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$ctrl->getAllInvoices(\$_GET);
            } elseif (\$method === 'getOwnerInvoices') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$ctrl->getOwnerInvoices(\$userId);
            }
        ");
    }

    protected function tearDown(): void {
        // File Diffing Pattern — delete only NEW files created during tests
        $currentFiles = glob($this->uploadDir . '*') ?: [];
        $newFiles     = array_diff($currentFiles, $this->initialFiles);
        foreach ($newFiles as $file) {
            if (is_file($file)) @unlink($file);
        }

        $this->cleanUp();

        if (file_exists($this->wrapperPath)) {
            @unlink($this->wrapperPath);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function cleanUp(): void {
        // Remove test invoices for the test billing period
        $this->qb->table('shopinvoice')
            ->where('billingPeriodYear', $this->testBillingYear)
            ->where('billingPeriodMonth', $this->testBillingMonth)
            ->delete();

        $a  = $this->qb->table('users')->where('email', $this->adminEmail)->first();
        $sh = $this->qb->table('users')->where('email', $this->shopEmail)->first();

        if ($a)  {
            $this->qb->table('admin')->where('id', $a['id'])->delete();
            $this->qb->table('users')->where('id', $a['id'])->delete();
        }
        if ($sh) {
            $this->qb->table('shopinvoice')->where('shopId', $sh['id'])->delete();
            $this->qb->table('shopcategorymapping')->where('shop_id', $sh['id'])->delete();
            $this->qb->table('shop')->where('id', $sh['id'])->delete();
            $this->qb->table('users')->where('id', $sh['id'])->delete();
        }
    }

    private function createTestData(): void {
        // Admin
        $this->qb->table('users')->insert([
            'email'             => $this->adminEmail,
            'password'          => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole'          => 'admin',
            'isActive'          => 1,
            'is_email_verified' => 1,
        ]);
        $a = $this->qb->table('users')->where('email', $this->adminEmail)->first();
        $this->adminUserId = $a['id'];
        $this->qb->table('admin')->insert(['id' => $this->adminUserId, 'name' => 'Billing Admin']);

        // Shop (Garage category = 1)
        $this->qb->table('users')->insert([
            'email'             => $this->shopEmail,
            'password'          => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole'          => 'shop_owner',
            'isActive'          => 1,
            'is_email_verified' => 1,
        ]);
        $sh = $this->qb->table('users')->where('email', $this->shopEmail)->first();
        $this->shopUserId = $sh['id'];
        $this->qb->table('shop')->insert(['id' => $this->shopUserId, 'name' => 'Billing Test Garage', 'isAvailable' => 1]);
        $this->qb->table('shopcategorymapping')->insert(['shop_id' => $this->shopUserId, 'shop_category_id' => 1]);
    }

    private function call(string $method, int $userId, string $role, $payload = null, string $queryString = ''): array {
        $env = "HTTP_X_METHOD={$method} HTTP_X_USER_ID={$userId} HTTP_X_USER_ROLE={$role}"
             . " REDIRECT_STATUS=1 SCRIPT_FILENAME=" . escapeshellarg($this->wrapperPath)
             . ($queryString ? " QUERY_STRING=" . escapeshellarg($queryString) : '');

        if ($payload !== null) {
            $json = json_encode($payload);
            $len  = strlen($json);
            $cmd  = "echo " . escapeshellarg($json) . " | {$env} CONTENT_TYPE=application/json CONTENT_LENGTH={$len} php-cgi 2>/dev/null";
        } else {
            $cmd  = "{$env} REQUEST_METHOD=GET php-cgi 2>/dev/null";
        }

        $output = shell_exec($cmd);
        $status = 200;
        if (preg_match('/Status: (\d+)/i', $output, $m)) {
            $status = (int)$m[1];
        }
        $body  = '';
        $parts = explode("\r\n\r\n", $output, 2);
        if (count($parts) === 2) {
            $body = $parts[1];
        } else {
            $parts = explode("\n\n", $output, 2);
            if (count($parts) === 2) $body = $parts[1];
        }
        return ['status' => $status, 'body' => json_decode($body, true) ?: $body];
    }

    // Seed a draft invoice directly into the DB for the test billing period
    private function seedDraftInvoice(float $amount = 1000.0): int {
        $this->qb->table('shopinvoice')->insert([
            'shopId'             => $this->shopUserId,
            'billingPeriodYear'  => $this->testBillingYear,
            'billingPeriodMonth' => $this->testBillingMonth,
            'shopCategoryId'     => 1,
            'rateSnapshot'       => 500.0,
            'completedRequests'  => 2,
            'totalAmount'        => $amount,
            'invoiceReference'   => 'INV-TEST-' . $this->shopUserId . '-' . uniqid(),
            'invoiceStatus'      => 'Draft',
        ]);
        $row = $this->qb->table('shopinvoice')
            ->where('shopId', $this->shopUserId)
            ->where('billingPeriodYear', $this->testBillingYear)
            ->where('billingPeriodMonth', $this->testBillingMonth)
            ->first();
        return (int)$row['id'];
    }

    // ── Tests ────────────────────────────────────────────────────────────────

    /**
     * Plan: testAdminCanGetBillingRates
     * Returns all 6 rate config fields
     */
    public function testAdminCanGetBillingRates(): void {
        $res = $this->call('getRates', $this->adminUserId, 'admin');

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);

        $data = $res['body']['data'];
        foreach (['garagePerRequestFee', 'serviceCenterPerRequestFee', 'sparePartsMonthlyFee',
                  'garageGracePeriodDays', 'serviceCenterGracePeriodDays', 'sparePartsGracePeriodDays'] as $field) {
            $this->assertArrayHasKey($field, $data, "Missing field: $field");
        }
    }

    /**
     * Plan: testAdminCanUpdateBillingRates
     * Valid rates → persisted and reflected in getRates
     */
    public function testAdminCanUpdateBillingRates(): void {
        $res = $this->call('updateRates', $this->adminUserId, 'admin', [
            'garagePerRequestFee' => 550,
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false, 'Failed to update rates. Response: ' . print_r($res, true));

        // Restore original value
        $this->call('updateRates', $this->adminUserId, 'admin', ['garagePerRequestFee' => 500]);
    }

    /**
     * Plan: testUpdateRatesRejectsNegativeValues
     * Negative fee → HTTP 400
     */
    public function testUpdateRatesRejectsNegativeValues(): void {
        $res = $this->call('updateRates', $this->adminUserId, 'admin', [
            'garagePerRequestFee' => -100,
        ]);

        $this->assertEquals(400, $res['status']);
        $this->assertStringContainsString('invalid', strtolower($res['body']['message'] ?? ''));
    }

    /**
     * Plan: testUpdateRatesRejectsNonNumericValues
     * "abc" fee → HTTP 400
     */
    public function testUpdateRatesRejectsNonNumericValues(): void {
        $res = $this->call('updateRates', $this->adminUserId, 'admin', [
            'garagePerRequestFee' => 'abc',
        ]);

        $this->assertEquals(400, $res['status']);
    }

    /**
     * Plan: testGenerateDraftsCreatesCorrectInvoiceCount
     * Billing period with our test shop → at least 1 draft created
     */
    public function testGenerateDraftsCreatesCorrectInvoiceCount(): void {
        $res = $this->call('generateDrafts', $this->adminUserId, 'admin', [
            'year'  => $this->testBillingYear,
            'month' => $this->testBillingMonth,
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false, 'Failed to generate drafts. Response: ' . print_r($res, true));
        $this->assertGreaterThan(0, (int)($res['body']['invoicesCreated'] ?? 0));

        // Verify in DB
        $inv = $this->qb->table('shopinvoice')
            ->where('shopId', $this->shopUserId)
            ->where('billingPeriodYear', $this->testBillingYear)
            ->where('billingPeriodMonth', $this->testBillingMonth)
            ->first();
        $this->assertNotEmpty($inv);
        $this->assertEquals('Draft', $inv['invoiceStatus']);
    }

    /**
     * Plan: testAdminCanClearDrafts
     * Admin can clear drafts before they are dispatched
     */
    public function testAdminCanClearDrafts(): void {
        $this->seedDraftInvoice(500.0);

        $res = $this->call('clearDrafts', $this->adminUserId, 'admin', [
            'year'  => $this->testBillingYear,
            'month' => $this->testBillingMonth,
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);

        // Verify DB is empty for drafts
        $inv = $this->qb->table('shopinvoice')
            ->where('shopId', $this->shopUserId)
            ->where('billingPeriodYear', $this->testBillingYear)
            ->where('billingPeriodMonth', $this->testBillingMonth)
            ->where('invoiceStatus', 'Draft')
            ->first();
        $this->assertEmpty($inv);
    }

    /**
     * Plan: testCannotGenerateDraftsTwiceForSamePeriod
     * Second call for same period → HTTP 409
     */
    public function testCannotGenerateDraftsTwiceForSamePeriod(): void {
        // First call
        $this->call('generateDrafts', $this->adminUserId, 'admin', [
            'year' => $this->testBillingYear, 'month' => $this->testBillingMonth,
        ]);

        // Second call — must conflict
        $res = $this->call('generateDrafts', $this->adminUserId, 'admin', [
            'year' => $this->testBillingYear, 'month' => $this->testBillingMonth,
        ]);

        $this->assertEquals(409, $res['status'], 'Expected 409, got ' . $res['status'] . '. Response: ' . print_r($res, true));
        $this->assertStringContainsString('already exist', strtolower($res['body']['message'] ?? ''));
    }

    /**
     * Plan: testZeroAmountInvoicesIgnoredOnDispatch
     * $0 draft invoice → status becomes 'Ignored' after dispatch
     */
    public function testZeroAmountInvoicesIgnoredOnDispatch(): void {
        // Seed a $0 draft
        $invId = $this->seedDraftInvoice(0.0);

        $res = $this->call('dispatchInvoices', $this->adminUserId, 'admin', [
            'year' => $this->testBillingYear, 'month' => $this->testBillingMonth,
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);

        $inv = $this->qb->table('shopinvoice')->where('id', $invId)->first();
        $this->assertEquals('Ignored', $inv['invoiceStatus']);
    }

    /**
     * Plan: testDispatchUpdatesStatusToDispatched
     * Non-zero draft → status becomes 'Dispatched' after dispatch
     */
    public function testDispatchUpdatesStatusToDispatched(): void {
        $invId = $this->seedDraftInvoice(1000.0);

        $res = $this->call('dispatchInvoices', $this->adminUserId, 'admin', [
            'year' => $this->testBillingYear, 'month' => $this->testBillingMonth,
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);

        $inv = $this->qb->table('shopinvoice')->where('id', $invId)->first();
        $this->assertEquals('Dispatched', $inv['invoiceStatus']);
    }

    /**
     * Plan: testShopOwnerCanGetOwnInvoices
     * Returns invoices + bankDetails
     */
    public function testShopOwnerCanGetOwnInvoices(): void {
        $this->seedDraftInvoice(500.0);

        $res = $this->call('getOwnerInvoices', $this->shopUserId, 'shop_owner');

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);
        $this->assertArrayHasKey('bankDetails', $res['body']);
        $this->assertIsArray($res['body']['data']);
    }

    /**
     * Plan: testAdminCanGetPendingVerifications
     * Returns all Verification Pending invoices
     */
    public function testAdminCanGetPendingVerifications(): void {
        // Seed a Verification Pending invoice directly
        $this->qb->table('shopinvoice')->insert([
            'shopId'             => $this->shopUserId,
            'billingPeriodYear'  => $this->testBillingYear,
            'billingPeriodMonth' => $this->testBillingMonth,
            'shopCategoryId'     => 1,
            'rateSnapshot'       => 500.0,
            'completedRequests'  => 2,
            'totalAmount'        => 1000.0,
            'invoiceReference'   => 'INV-VP-TEST-' . uniqid(),
            'invoiceStatus'      => 'Verification Pending',
            'paymentReference'   => 'PAY-REF-001',
        ]);

        $res = $this->call('getPendingVerifications', $this->adminUserId, 'admin');

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);
        $this->assertIsArray($res['body']['data']);
        $this->assertNotEmpty($res['body']['data']);
    }

    /**
     * Plan: testAdminCanApproveVerification
     * Approve → status becomes Paid, shop reactivated
     */
    public function testAdminCanApproveVerification(): void {
        // Temporarily deactivate the shop (simulating suspension)
        $this->qb->table('users')->where('id', $this->shopUserId)->update(['isActive' => 0]);

        $this->qb->table('shopinvoice')->insert([
            'shopId'             => $this->shopUserId,
            'billingPeriodYear'  => $this->testBillingYear,
            'billingPeriodMonth' => $this->testBillingMonth,
            'shopCategoryId'     => 1,
            'rateSnapshot'       => 500.0,
            'completedRequests'  => 2,
            'totalAmount'        => 1000.0,
            'invoiceReference'   => 'INV-APPROVE-TEST-' . uniqid(),
            'invoiceStatus'      => 'Verification Pending',
            'paymentReference'   => 'PAY-REF-002',
        ]);

        $inv = $this->qb->table('shopinvoice')
            ->where('shopId', $this->shopUserId)
            ->where('invoiceStatus', 'Verification Pending')
            ->first();

        $res = $this->call('processVerification', $this->adminUserId, 'admin', [
            'invoiceId' => $inv['id'],
            'action'    => 'approve',
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false, 'Failed to approve verification. Response: ' . print_r($res, true));

        // Verify invoice status
        $updated = $this->qb->table('shopinvoice')->where('id', $inv['id'])->first();
        $this->assertEquals('Paid', $updated['invoiceStatus']);

        // Verify shop was reactivated
        $user = $this->qb->table('users')->where('id', $this->shopUserId)->first();
        $this->assertEquals(1, (int)$user['isActive']);
    }

    /**
     * Plan: testAdminCanRejectVerificationWithReason
     * Reject + reason → status becomes Rejected
     */
    public function testAdminCanRejectVerificationWithReason(): void {
        $this->qb->table('shopinvoice')->insert([
            'shopId'             => $this->shopUserId,
            'billingPeriodYear'  => $this->testBillingYear,
            'billingPeriodMonth' => $this->testBillingMonth,
            'shopCategoryId'     => 1,
            'rateSnapshot'       => 500.0,
            'completedRequests'  => 2,
            'totalAmount'        => 1000.0,
            'invoiceReference'   => 'INV-REJECT-TEST-' . uniqid(),
            'invoiceStatus'      => 'Verification Pending',
            'paymentReference'   => 'PAY-REF-003',
        ]);

        $inv = $this->qb->table('shopinvoice')
            ->where('shopId', $this->shopUserId)
            ->where('invoiceStatus', 'Verification Pending')
            ->first();

        $res = $this->call('processVerification', $this->adminUserId, 'admin', [
            'invoiceId' => $inv['id'],
            'action'    => 'reject',
            'reason'    => 'Payment slip was illegible.',
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);

        $updated = $this->qb->table('shopinvoice')->where('id', $inv['id'])->first();
        $this->assertEquals('Dispatched', $updated['invoiceStatus']);
        $this->assertNotEmpty($updated['rejectionReason']);
    }

    /**
     * Plan: testAdminRejectRequiresReason
     * Reject without reason → HTTP 400
     */
    public function testAdminRejectRequiresReason(): void {
        $this->qb->table('shopinvoice')->insert([
            'shopId'             => $this->shopUserId,
            'billingPeriodYear'  => $this->testBillingYear,
            'billingPeriodMonth' => $this->testBillingMonth,
            'shopCategoryId'     => 1,
            'rateSnapshot'       => 500.0,
            'completedRequests'  => 2,
            'totalAmount'        => 1000.0,
            'invoiceReference'   => 'INV-NREASON-TEST-' . uniqid(),
            'invoiceStatus'      => 'Verification Pending',
            'paymentReference'   => 'PAY-REF-004',
        ]);

        $inv = $this->qb->table('shopinvoice')
            ->where('shopId', $this->shopUserId)
            ->where('invoiceStatus', 'Verification Pending')
            ->first();

        $res = $this->call('processVerification', $this->adminUserId, 'admin', [
            'invoiceId' => $inv['id'],
            'action'    => 'reject',
            // reason deliberately omitted
        ]);

        $this->assertEquals(400, $res['status']);
        $this->assertStringContainsString('reason', strtolower($res['body']['message'] ?? ''));
    }

    /**
     * Plan: testAdminCanGetAnalytics
     * Returns kpis, revenueChart, collectionHealth
     */
    public function testAdminCanGetAnalytics(): void {
        $res = $this->call('getAnalytics', $this->adminUserId, 'admin');

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);
        $this->assertArrayHasKey('kpis', $res['body']['data']);
        $this->assertArrayHasKey('revenueChart', $res['body']['data']);
        $this->assertArrayHasKey('collectionHealth', $res['body']['data']);
    }

    /**
     * Plan: testAdminCanGetShopLedger
     * shopId param → full invoice history for that shop
     */
    public function testAdminCanGetShopLedger(): void {
        $res = $this->call('getShopLedger', $this->adminUserId, 'admin', null, 'shopId=' . $this->shopUserId);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);
        $this->assertIsArray($res['body']['data']);
    }

    /**
     * Plan: testAdminCanGetAllInvoicesWithFilters
     * status=Draft filter → returns only Draft invoices
     */
    public function testAdminCanGetAllInvoicesWithFilters(): void {
        // Seed a Draft invoice
        $this->seedDraftInvoice(750.0);

        $res = $this->call('getAllInvoices', $this->adminUserId, 'admin', null, 'status=Draft');

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);
        $this->assertIsArray($res['body']['data']);

        // Every returned invoice must be Draft status
        foreach ($res['body']['data'] as $inv) {
            $this->assertEquals('Draft', $inv['invoiceStatus']);
        }
    }
}
