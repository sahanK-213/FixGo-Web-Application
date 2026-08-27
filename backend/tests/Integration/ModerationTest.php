<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../database/QueryBuilder.php';

class ModerationTest extends TestCase {
    private $db;
    private $qb;
    private $wrapperPath;

    private $customerEmail = 'mod_customer@fixgo.com';
    private $shopEmail     = 'mod_shop@fixgo.com';
    private $adminEmail    = 'mod_admin@fixgo.com';

    private $customerUserId;
    private $shopUserId;
    private $adminUserId;

    protected function setUp(): void {
        

        $database   = new Database();
        $this->db   = $database->connect();
        $this->qb   = new QueryBuilder($this->db);

        $this->cleanUp();
        $this->createTestData();

        $this->wrapperPath = __DIR__ . '/moderation_wrapper.php';
        file_put_contents($this->wrapperPath,
            "<?php
            require_once '" . realpath(__DIR__ . '/../../config/Database.php')            . "';
            require_once '" . realpath(__DIR__ . '/../../database/QueryBuilder.php')      . "';
            require_once '" . realpath(__DIR__ . '/../../config/RequestValidator.php')    . "';
            require_once '" . realpath(__DIR__ . '/../../models/Shop.php')                . "';
            require_once '" . realpath(__DIR__ . '/../../models/Customer.php')            . "';
            require_once '" . realpath(__DIR__ . '/../../models/ModerationFlag.php')      . "';
            require_once '" . realpath(__DIR__ . '/../../models/Review.php')              . "';
            require_once '" . realpath(__DIR__ . '/../../controllers/CustomerController.php') . "';
            require_once '" . realpath(__DIR__ . '/../../controllers/AdminController.php')    . "';

            \$db     = (new Database())->connect();
            \$method = \$_SERVER['HTTP_X_METHOD'] ?? '';
            \$userId = (int)(\$_SERVER['HTTP_X_USER_ID'] ?? 0);
            \$role   = \$_SERVER['HTTP_X_USER_ROLE'] ?? 'customer';
            \$payload = ['user_id' => \$userId, 'role' => \$role];

            if (\$method === 'reportShop') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$ctrl = new CustomerController(\$db);
                \$ctrl->reportShop(\$payload);
            } elseif (\$method === 'getModerationFlags') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$ctrl = new AdminController(\$db);
                \$ctrl->getModerationFlags(\$payload);
            } elseif (\$method === 'resolveModerationFlag') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$ctrl = new AdminController(\$db);
                \$ctrl->resolveModerationFlag(\$payload);
            }
        ");
    }

    protected function tearDown(): void {
        $this->cleanUp();
        if (file_exists($this->wrapperPath)) {
            @unlink($this->wrapperPath);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function cleanUp(): void {
        $c  = $this->qb->table('users')->where('email', $this->customerEmail)->first();
        $sh = $this->qb->table('users')->where('email', $this->shopEmail)->first();
        $a  = $this->qb->table('users')->where('email', $this->adminEmail)->first();

        // Moderation flags (no FK to service requests)
        if ($sh) $this->qb->table('moderation_flags')->where('entity_id', $sh['id'])->delete();

        // Profiles then users
        if ($c)  { $this->qb->table('customer')->where('id', $c['id'])->delete(); $this->qb->table('users')->where('id', $c['id'])->delete(); }
        if ($sh) { $this->qb->table('shop')->where('id', $sh['id'])->delete();    $this->qb->table('users')->where('id', $sh['id'])->delete(); }
        if ($a)  { $this->qb->table('users')->where('id', $a['id'])->delete(); }
    }

    private function createTestData(): void {
        // Customer
        $this->qb->table('users')->insert([
            'email'    => $this->customerEmail,
            'password' => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole' => 'customer',
            'isActive' => 1,
        ]);
        $c = $this->qb->table('users')->where('email', $this->customerEmail)->first();
        $this->customerUserId = $c['id'];
        $this->qb->table('customer')->insert(['id' => $this->customerUserId, 'name' => 'Mod Customer']);

        // Shop
        $this->qb->table('users')->insert([
            'email'    => $this->shopEmail,
            'password' => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole' => 'shop_owner',
            'isActive' => 1,
        ]);
        $sh = $this->qb->table('users')->where('email', $this->shopEmail)->first();
        $this->shopUserId = $sh['id'];
        $this->qb->table('shop')->insert(['id' => $this->shopUserId, 'name' => 'Mod Shop', 'isAvailable' => 1]);

        // Admin
        $this->qb->table('users')->insert([
            'email'    => $this->adminEmail,
            'password' => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole' => 'admin',
            'isActive' => 1,
        ]);
        $a = $this->qb->table('users')->where('email', $this->adminEmail)->first();
        $this->adminUserId = $a['id'];
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

    // ── Tests ────────────────────────────────────────────────────────────────

    /**
     * Plan: testCustomerCanReportAShop
     * Valid shop_id + description → flag created (success: true)
     */
    public function testCustomerCanReportAShop(): void {
        $res = $this->call('reportShop', $this->customerUserId, 'customer', [
            'shop_id'     => $this->shopUserId,
            'description' => 'This shop charged me extra without telling me beforehand.',
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);

        // Verify flag exists in DB
        $flag = $this->qb->table('moderation_flags')->where('entity_id', $this->shopUserId)->first();
        $this->assertNotEmpty($flag);
        $this->assertEquals('pending', $flag['status']);
    }

    /**
     * Plan: testReportRequiresDescription
     * Empty description → HTTP 400
     */
    public function testReportRequiresDescription(): void {
        $res = $this->call('reportShop', $this->customerUserId, 'customer', [
            'shop_id'     => $this->shopUserId,
            'description' => '',
        ]);

        $this->assertEquals(400, $res['status']);
        $this->assertStringContainsString('description', strtolower($res['body']['message'] ?? ''));
    }

    /**
     * Plan: testReportRequiresValidShopId
     * shop_id=0 → HTTP 400
     */
    public function testReportRequiresValidShopId(): void {
        $res = $this->call('reportShop', $this->customerUserId, 'customer', [
            'shop_id'     => 0,
            'description' => 'Bad shop.',
        ]);

        $this->assertEquals(400, $res['status']);
        $this->assertStringContainsString('shop', strtolower($res['body']['message'] ?? ''));
    }

    /**
     * Plan: testAdminCanGetAllModerationFlags
     * Admin → flags list with severity and actions fields
     */
    public function testAdminCanGetAllModerationFlags(): void {
        // Seed a flag first
        $this->qb->table('moderation_flags')->insert([
            'entity_type'      => 'shop',
            'entity_id'        => $this->shopUserId,
            'flag_type'        => 'PROFILE FLAG',
            'severity'         => 'medium',
            'reported_by_user' => 'Mod Customer',
            'shop_name'        => 'Mod Shop',
            'description'      => 'Suspicious activity.',
            'status'           => 'pending',
        ]);

        $res = $this->call('getModerationFlags', $this->adminUserId, 'admin');

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);
        $this->assertArrayHasKey('alerts', $res['body']['data']);
        $this->assertNotEmpty($res['body']['data']['alerts']);

        $first = $res['body']['data']['alerts'][0];
        $this->assertArrayHasKey('severity', $first);
        $this->assertArrayHasKey('actions', $first);
    }

    /**
     * Plan: testAdminCanSuspendShop
     * Suspend action → shop isAvailable=0
     */
    public function testAdminCanSuspendShop(): void {
        // Seed a flag
        $this->qb->table('moderation_flags')->insert([
            'entity_type'      => 'shop',
            'entity_id'        => $this->shopUserId,
            'flag_type'        => 'PROFILE FLAG',
            'severity'         => 'high',
            'reported_by_user' => 'Mod Customer',
            'shop_name'        => 'Mod Shop',
            'description'      => 'Fraudulent behaviour.',
            'status'           => 'pending',
        ]);
        $flag = $this->qb->table('moderation_flags')->where('entity_id', $this->shopUserId)->first();

        $res = $this->call('resolveModerationFlag', $this->adminUserId, 'admin', [
            'flagId' => $flag['id'],
            'action' => 'Suspend Shop',
            'notes'  => 'Verified complaint.',
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);

        // Verify shop is now suspended in DB
        $shop = $this->qb->table('shop')->where('id', $this->shopUserId)->first();
        $this->assertEquals(0, (int)$shop['isAvailable']);

        // Clean up — reactivate for next tests
        $this->qb->table('shop')->where('id', $this->shopUserId)->update(['isAvailable' => 1]);
    }

    /**
     * Plan: testAdminCanReactivateShop
     * Reactivate action → shop isAvailable=1
     */
    public function testAdminCanReactivateShop(): void {
        // First suspend the shop
        $this->qb->table('shop')->where('id', $this->shopUserId)->update(['isAvailable' => 0]);

        // Seed a flag in suspended state
        $this->qb->table('moderation_flags')->insert([
            'entity_type'      => 'shop',
            'entity_id'        => $this->shopUserId,
            'flag_type'        => 'PROFILE FLAG',
            'severity'         => 'medium',
            'reported_by_user' => 'Mod Customer',
            'shop_name'        => 'Mod Shop',
            'description'      => 'Under review.',
            'status'           => 'under_review',
        ]);
        $flag = $this->qb->table('moderation_flags')->where('entity_id', $this->shopUserId)->first();

        $res = $this->call('resolveModerationFlag', $this->adminUserId, 'admin', [
            'flagId' => $flag['id'],
            'action' => 'Reactivate Shop',
            'notes'  => 'Issue resolved.',
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);

        // Verify shop is reactivated in DB
        $shop = $this->qb->table('shop')->where('id', $this->shopUserId)->first();
        $this->assertEquals(1, (int)$shop['isAvailable']);
    }

    /**
     * Plan: testAdminCanDismissFlag
     * Ignore action → flag status becomes 'dismissed'
     */
    public function testAdminCanDismissFlag(): void {
        $this->qb->table('moderation_flags')->insert([
            'entity_type'      => 'shop',
            'entity_id'        => $this->shopUserId,
            'flag_type'        => 'PROFILE FLAG',
            'severity'         => 'low',
            'reported_by_user' => 'Mod Customer',
            'shop_name'        => 'Mod Shop',
            'description'      => 'Minor complaint.',
            'status'           => 'pending',
        ]);
        $flag = $this->qb->table('moderation_flags')->where('entity_id', $this->shopUserId)->first();

        $res = $this->call('resolveModerationFlag', $this->adminUserId, 'admin', [
            'flagId' => $flag['id'],
            'action' => 'Ignore',
            'notes'  => 'Unfounded.',
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);

        // Verify flag is dismissed in DB
        $updatedFlag = $this->qb->table('moderation_flags')->where('id', $flag['id'])->first();
        $this->assertEquals('dismissed', $updatedFlag['status']);
    }

    /**
     * Plan: testResolveFlagRequiresFlagIdAndAction
     * Missing flagId or action → HTTP 400
     */
    public function testResolveFlagRequiresFlagIdAndAction(): void {
        // Missing action
        $res = $this->call('resolveModerationFlag', $this->adminUserId, 'admin', [
            'flagId' => 999,
            'action' => '',
        ]);
        $this->assertEquals(400, $res['status']);

        // Missing flagId
        $res2 = $this->call('resolveModerationFlag', $this->adminUserId, 'admin', [
            'flagId' => 0,
            'action' => 'Ignore',
        ]);
        $this->assertEquals(400, $res2['status']);
    }
}
