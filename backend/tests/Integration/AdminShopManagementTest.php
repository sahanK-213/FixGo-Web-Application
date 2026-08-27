<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../database/QueryBuilder.php';

class AdminShopManagementTest extends TestCase {
    private $db;
    private $qb;
    private $wrapperPath;

    private $adminEmail    = 'adminshop_admin@fixgo.com';
    private $pendingEmail  = 'adminshop_pending@fixgo.com';
    private $activeEmail   = 'adminshop_active@fixgo.com';

    private $adminUserId;
    private $pendingShopId;
    private $activeShopId;

    // Track test-created categories for cleanup
    private array $createdShopCategoryIds    = [];
    private array $createdVehicleCategoryIds = [];

    protected function setUp(): void {
        

        $database   = new Database();
        $this->db   = $database->connect();
        $this->qb   = new QueryBuilder($this->db);

        $this->cleanUp();
        $this->createTestData();

        $this->wrapperPath = __DIR__ . '/admin_shop_wrapper.php';
        file_put_contents($this->wrapperPath,
            "<?php
            require_once '" . realpath(__DIR__ . '/../../config/Database.php')         . "';
            require_once '" . realpath(__DIR__ . '/../../database/QueryBuilder.php')   . "';
            require_once '" . realpath(__DIR__ . '/../../config/RequestValidator.php') . "';
            require_once '" . realpath(__DIR__ . '/../../models/Shop.php')             . "';
            require_once '" . realpath(__DIR__ . '/../../models/userRole.php')         . "';
            require_once '" . realpath(__DIR__ . '/../../models/Category.php')         . "';
            require_once '" . realpath(__DIR__ . '/../../models/ModerationFlag.php')   . "';
            require_once '" . realpath(__DIR__ . '/../../models/ServiceRequest.php')   . "';
            require_once '" . realpath(__DIR__ . '/../../models/ShopInvoice.php')      . "';
            require_once '" . realpath(__DIR__ . '/../../controllers/AdminController.php') . "';

            \$db     = (new Database())->connect();
            \$method = \$_SERVER['HTTP_X_METHOD'] ?? '';
            \$userId = (int)(\$_SERVER['HTTP_X_USER_ID'] ?? 0);
            \$role   = \$_SERVER['HTTP_X_USER_ROLE'] ?? 'admin';
            \$payload = ['user_id' => \$userId, 'role' => \$role];

            \$ctrl = new AdminController(\$db);

            if (\$method === 'getPendingShops') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$ctrl->getPendingShops();
            } elseif (\$method === 'approveShop') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$ctrl->approveShop();
            } elseif (\$method === 'getCategories') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$ctrl->getCategories(\$payload);
            } elseif (\$method === 'addCategory') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$ctrl->addCategory(\$payload);
            } elseif (\$method === 'updateCategory') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$ctrl->updateCategory(\$payload);
            } elseif (\$method === 'deleteCategory') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$ctrl->deleteCategory(\$payload);
            }
        ");
    }

    protected function tearDown(): void {
        // Clean up any categories created during tests
        foreach ($this->createdShopCategoryIds as $id) {
            $this->qb->table('shopcategory')->where('id', $id)->delete();
        }
        foreach ($this->createdVehicleCategoryIds as $id) {
            $this->qb->table('vehiclecategory')->where('id', $id)->delete();
        }

        $this->cleanUp();

        if (file_exists($this->wrapperPath)) {
            @unlink($this->wrapperPath);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function cleanUp(): void {
        $admin   = $this->qb->table('users')->where('email', $this->adminEmail)->first();
        $pending = $this->qb->table('users')->where('email', $this->pendingEmail)->first();
        $active  = $this->qb->table('users')->where('email', $this->activeEmail)->first();

        if ($admin)   { $this->qb->table('users')->where('id', $admin['id'])->delete(); }
        if ($pending) { $this->qb->table('shop')->where('id', $pending['id'])->delete(); $this->qb->table('users')->where('id', $pending['id'])->delete(); }
        if ($active)  { $this->qb->table('shop')->where('id', $active['id'])->delete();  $this->qb->table('users')->where('id', $active['id'])->delete(); }

        // Clean leftover test categories
        $this->qb->table('shopcategory')->where('name', 'LIKE', 'Test_%')->delete();
        $this->qb->table('vehiclecategory')->where('name', 'LIKE', 'Test_%')->delete();
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

        // Pending shop (email verified but isActive=0 — awaiting approval)
        $this->qb->table('users')->insert([
            'email'             => $this->pendingEmail,
            'password'          => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole'          => 'shop_owner',
            'isActive'          => 0,
            'is_email_verified' => 1,
        ]);
        $p = $this->qb->table('users')->where('email', $this->pendingEmail)->first();
        $this->pendingShopId = $p['id'];
        $this->qb->table('shop')->insert(['id' => $this->pendingShopId, 'name' => 'Pending Shop']);

        // Active shop (isActive=1 — already approved)
        $this->qb->table('users')->insert([
            'email'             => $this->activeEmail,
            'password'          => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole'          => 'shop_owner',
            'isActive'          => 1,
            'is_email_verified' => 1,
        ]);
        $ac = $this->qb->table('users')->where('email', $this->activeEmail)->first();
        $this->activeShopId = $ac['id'];
        $this->qb->table('shop')->insert(['id' => $this->activeShopId, 'name' => 'Active Shop']);
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
     * Plan: testGetPendingShopsReturnsList
     * Admin → unapproved shops list (contains the seeded pending shop)
     */
    public function testGetPendingShopsReturnsList(): void {
        $res = $this->call('getPendingShops', $this->adminUserId, 'admin');

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);
        $this->assertIsArray($res['body']['data']);

        // The seeded pending shop must be in the list
        $ids = array_column($res['body']['data'], 'id');
        $this->assertContains($this->pendingShopId, $ids);
    }

    /**
     * Plan: testApproveShopActivatesAccount
     * Verified shop → isActive=1 after approval
     */
    public function testApproveShopActivatesAccount(): void {
        $res = $this->call('approveShop', $this->adminUserId, 'admin', [
            'shopId' => $this->pendingShopId,
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);
        $this->assertStringContainsString('approved', strtolower($res['body']['message'] ?? ''));

        // Verify DB
        $user = $this->qb->table('users')->where('id', $this->pendingShopId)->first();
        $this->assertEquals(1, (int)$user['isActive']);
    }

    /**
     * Plan: testApproveAlreadyActiveShopReturns200
     * Re-approving an already active shop → success with 'already_active' path
     */
    public function testApproveAlreadyActiveShopReturns200(): void {
        $res = $this->call('approveShop', $this->adminUserId, 'admin', [
            'shopId' => $this->activeShopId,
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);
        $this->assertStringContainsString('already', strtolower($res['body']['message'] ?? ''));
    }

    /**
     * Plan: testApproveNonExistentShopReturns404
     * shopId=999999 → HTTP 404
     */
    public function testApproveNonExistentShopReturns404(): void {
        $res = $this->call('approveShop', $this->adminUserId, 'admin', [
            'shopId' => 999999,
        ]);

        $this->assertEquals(404, $res['status']);
    }

    /**
     * Plan: testAdminCanGetAllCategories
     * Returns shopCategories and vehicleCategories arrays
     */
    public function testAdminCanGetAllCategories(): void {
        $res = $this->call('getCategories', $this->adminUserId, 'admin');

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);
        $this->assertArrayHasKey('shopCategories', $res['body']['data']);
        $this->assertArrayHasKey('vehicleCategories', $res['body']['data']);
        // Core seeded categories must be present
        $this->assertNotEmpty($res['body']['data']['shopCategories']);
    }

    /**
     * Plan: testAdminCanAddShopCategory
     * New unique name → category created, ID returned
     */
    public function testAdminCanAddShopCategory(): void {
        $res = $this->call('addCategory', $this->adminUserId, 'admin', [
            'type'        => 'shop',
            'name'        => 'Test_ElectricVehicleRepair',
            'description' => 'EV specialist garages',
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);
        $newId = (int)($res['body']['data']['id'] ?? 0);
        $this->assertGreaterThan(0, $newId);

        // Track for tearDown cleanup
        $this->createdShopCategoryIds[] = $newId;
    }

    /**
     * Plan: testAdminCannotAddDuplicateCategoryName
     * Same name twice → HTTP 400
     */
    public function testAdminCannotAddDuplicateCategoryName(): void {
        // First insert
        $res1 = $this->call('addCategory', $this->adminUserId, 'admin', [
            'type' => 'shop',
            'name' => 'Test_DuplicateCat',
        ]);
        $this->assertEquals(200, $res1['status']);
        if (isset($res1['body']['data']['id'])) {
            $this->createdShopCategoryIds[] = (int)$res1['body']['data']['id'];
        }

        // Duplicate insert
        $res2 = $this->call('addCategory', $this->adminUserId, 'admin', [
            'type' => 'shop',
            'name' => 'Test_DuplicateCat',
        ]);
        $this->assertEquals(400, $res2['status']);
        $this->assertStringContainsString('already exists', strtolower($res2['body']['message'] ?? ''));
    }

    /**
     * Plan: testAdminCanUpdateCategory
     * Update name → DB reflects change
     */
    public function testAdminCanUpdateCategory(): void {
        // Insert a category to update
        $this->qb->table('shopcategory')->insert(['name' => 'Test_OldName', 'description' => '']);
        $cat = $this->qb->table('shopcategory')->where('name', 'Test_OldName')->first();
        $this->createdShopCategoryIds[] = (int)$cat['id'];

        $res = $this->call('updateCategory', $this->adminUserId, 'admin', [
            'type' => 'shop',
            'id'   => $cat['id'],
            'name' => 'Test_NewName',
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);

        // Verify DB
        $updated = $this->qb->table('shopcategory')->where('id', $cat['id'])->first();
        $this->assertEquals('Test_NewName', $updated['name']);
    }

    /**
     * Plan: testAdminCanDeleteUnusedCategory
     * Unused category → deleted, no longer in DB
     */
    public function testAdminCanDeleteUnusedCategory(): void {
        // Insert a category that is NOT assigned to any shop
        $this->qb->table('shopcategory')->insert(['name' => 'Test_ToDelete', 'description' => '']);
        $cat = $this->qb->table('shopcategory')->where('name', 'Test_ToDelete')->first();
        $catId = (int)$cat['id'];

        $res = $this->call('deleteCategory', $this->adminUserId, 'admin', [
            'type' => 'shop',
            'id'   => $catId,
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);

        // Verify it is gone from DB
        $gone = $this->qb->table('shopcategory')->where('id', $catId)->first();
        $this->assertEmpty($gone);
    }

    /**
     * Plan: testAdminCannotDeleteCategoryInUse
     * Core seeded category (id=1: Garages) is in use by real shops → HTTP 400
     */
    public function testAdminCannotDeleteCategoryInUse(): void {
        // Category ID 1 (Garages) is used by the shopcategorymapping of seeded shops
        $res = $this->call('deleteCategory', $this->adminUserId, 'admin', [
            'type' => 'shop',
            'id'   => 1,
        ]);

        $this->assertEquals(400, $res['status']);
        $this->assertStringContainsString('assigned', strtolower($res['body']['message'] ?? ''));
    }
}
