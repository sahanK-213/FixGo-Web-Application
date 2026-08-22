<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../database/QueryBuilder.php';

class ServiceRequestTest extends TestCase {
    private $db;
    private $qb;
    private $customerEmail = 'req_customer@fixgo.com';
    private $shopEmail = 'req_shop@fixgo.com';
    private $otherShopEmail = 'req_other_shop@fixgo.com';
    private $customerUserId;
    private $shopUserId;
    private $otherShopUserId;
    private $wrapperPath;

    protected function setUp(): void {
        putenv('JWT_SECRET=supersecret1234567890abcdef');
        
        $database = new Database();
        $this->db = $database->connect();
        $this->qb = new QueryBuilder($this->db);
        
        $this->cleanUp();
        $this->createTestData();

        $this->wrapperPath = __DIR__ . '/service_request_wrapper.php';
        file_put_contents($this->wrapperPath, "<?php
            require_once '" . realpath(__DIR__ . '/../../config/Database.php') . "';
            require_once '" . realpath(__DIR__ . '/../../controllers/ServiceRequestController.php') . "';
            require_once '" . realpath(__DIR__ . '/../../config/RequestValidator.php') . "';
            require_once '" . realpath(__DIR__ . '/../../database/QueryBuilder.php') . "';
            \$db = (new Database())->connect();
            \$controller = new ServiceRequestController(\$db);
            
            \$method = \$_SERVER['HTTP_X_METHOD'] ?? '';
            \$userId = (int)(\$_SERVER['HTTP_X_USER_ID'] ?? 0);
            \$role = \$_SERVER['HTTP_X_USER_ROLE'] ?? 'customer';
            \$payload = ['user_id' => \$userId, 'role' => \$role];
            
            if (\$method === 'createRequest') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$controller->handleCreateRequest(\$payload);
            } elseif (\$method === 'updateStatus') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$controller->handleUpdateStatus(\$payload);
            } elseif (\$method === 'getCustomerRequests') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$controller->handleGetCustomerRequests(\$payload);
            } elseif (\$method === 'getShopRequests') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$controller->handleGetShopRequests(\$payload);
            }
        ");
    }

    protected function tearDown(): void {
        $this->cleanUp();
        if (file_exists($this->wrapperPath)) {
            @unlink($this->wrapperPath);
        }
    }

    private function cleanUp() {
        $customer = $this->qb->table('users')->where('email', $this->customerEmail)->first();
        $shop = $this->qb->table('users')->where('email', $this->shopEmail)->first();
        $otherShop = $this->qb->table('users')->where('email', $this->otherShopEmail)->first();

        // 1. Delete ALL notifications for these users first to clear FKs on service_request_id
        if ($customer) $this->qb->table('notification')->where('user_id', $customer['id'])->delete();
        if ($shop) $this->qb->table('notification')->where('user_id', $shop['id'])->delete();
        if ($otherShop) $this->qb->table('notification')->where('user_id', $otherShop['id'])->delete();

        // 2. Delete ALL service requests involving these users
        if ($customer) $this->qb->table('servicerequest')->where('customer_id', $customer['id'])->delete();
        if ($shop) $this->qb->table('servicerequest')->where('shop_id', $shop['id'])->delete();
        if ($otherShop) $this->qb->table('servicerequest')->where('shop_id', $otherShop['id'])->delete();

        // 3. Delete profiles and users
        if ($customer) {
            $this->qb->table('customer')->where('id', $customer['id'])->delete();
            $this->qb->table('users')->where('id', $customer['id'])->delete();
        }
        if ($shop) {
            $this->qb->table('shop')->where('id', $shop['id'])->delete();
            $this->qb->table('users')->where('id', $shop['id'])->delete();
        }
        if ($otherShop) {
            $this->qb->table('shop')->where('id', $otherShop['id'])->delete();
            $this->qb->table('users')->where('id', $otherShop['id'])->delete();
        }
    }

    private function createTestData() {
        // Customer
        $this->qb->table('users')->insert([
            'email' => $this->customerEmail,
            'password' => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole' => 'customer',
            'isActive' => 1
        ]);
        $customerUser = $this->qb->table('users')->where('email', $this->customerEmail)->first();
        $this->customerUserId = $customerUser['id'];
        $this->qb->table('customer')->insert([
            'id' => $this->customerUserId,
            'name' => 'Req Customer',
            'contactNumber' => '0770000001',
            'cancellation_strikes' => 0
        ]);

        // Shop 1
        $this->qb->table('users')->insert([
            'email' => $this->shopEmail,
            'password' => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole' => 'shop_owner',
            'isActive' => 1
        ]);
        $shopUser = $this->qb->table('users')->where('email', $this->shopEmail)->first();
        $this->shopUserId = $shopUser['id'];
        $this->qb->table('shop')->insert([
            'id' => $this->shopUserId,
            'name' => 'Main Shop',
            'contactNumber' => '0770000002'
        ]);

        // Shop 2
        $this->qb->table('users')->insert([
            'email' => $this->otherShopEmail,
            'password' => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole' => 'shop_owner',
            'isActive' => 1
        ]);
        $otherShopUser = $this->qb->table('users')->where('email', $this->otherShopEmail)->first();
        $this->otherShopUserId = $otherShopUser['id'];
        $this->qb->table('shop')->insert([
            'id' => $this->otherShopUserId,
            'name' => 'Other Shop',
            'contactNumber' => '0770000003'
        ]);
    }

    private function runReqRequest($method, $actorId, $actorRole, $payload = null) {
        $cmdEnv = "HTTP_X_METHOD=" . escapeshellarg($method) . " HTTP_X_USER_ID=" . (int)$actorId . " HTTP_X_USER_ROLE=" . escapeshellarg($actorRole) . " REDIRECT_STATUS=1 SCRIPT_FILENAME=" . escapeshellarg($this->wrapperPath);
        
        if ($payload !== null) {
            $jsonPayload = json_encode($payload);
            $contentLength = strlen($jsonPayload);
            $cmd = "echo " . escapeshellarg($jsonPayload) . " | {$cmdEnv} CONTENT_TYPE=application/json CONTENT_LENGTH={$contentLength} php-cgi";
        } else {
            $cmd = "{$cmdEnv} php-cgi";
        }
        
        $output = shell_exec($cmd);
        
        if (preg_match('/Status: (\d+)/i', $output, $matches)) {
            $status = (int)$matches[1];
        } else {
            echo "Raw Output: $output\n";
            $status = 200;
        }
        
        $body = '';
        $parts = explode("\r\n\r\n", $output, 2);
        if (count($parts) === 2) {
            $body = $parts[1];
        } else {
            $parts = explode("\n\n", $output, 2);
            if (count($parts) === 2) {
                $body = $parts[1];
            }
        }
        
        return [
            'status' => $status,
            'body' => json_decode($body, true) ?: $body
        ];
    }

    public function testCustomerCanCreateRequest() {
        $payload = [
            'shop_id' => $this->shopUserId,
            'vehicle_category_id' => 1,
            'issue_description' => 'Engine making noise',
            'latitude' => 6.9,
            'longitude' => 79.8,
            'needs_towing' => 0
        ];
        
        $res = $this->runReqRequest('createRequest', $this->customerUserId, 'customer', $payload);
        $this->assertEquals(201, $res['status']);
        $this->assertArrayHasKey('request_id', $res['body']);
        
        $req = $this->qb->table('servicerequest')->where('id', $res['body']['request_id'])->first();
        $this->assertEquals('Pending', $req['status']);
    }

    public function testDuplicateRequestBlocked() {
        $payload = [
            'shop_id' => $this->shopUserId,
            'vehicle_category_id' => 1,
            'issue_description' => 'Flat tire'
        ];
        
        $this->runReqRequest('createRequest', $this->customerUserId, 'customer', $payload); // First
        $res = $this->runReqRequest('createRequest', $this->customerUserId, 'customer', $payload); // Second
        
        $this->assertEquals(429, $res['status']);
        $this->assertStringContainsString('already have a pending request', $res['body']['message'] ?? '');
    }

    public function testShopCanAcceptPendingRequest() {
        $this->qb->table('servicerequest')->insert([
            'customer_id' => $this->customerUserId,
            'shop_id' => $this->shopUserId,
            'status' => 'Pending'
        ]);
        $req = $this->qb->table('servicerequest')->where('customer_id', $this->customerUserId)->first();
        
        $res = $this->runReqRequest('updateStatus', $this->shopUserId, 'shop_owner', [
            'request_id' => $req['id'],
            'new_status' => 'Accepted'
        ]);
        
        $this->assertEquals(200, $res['status']);
        $updated = $this->qb->table('servicerequest')->where('id', $req['id'])->first();
        $this->assertEquals('Accepted', $updated['status']);
    }

    public function testCustomerConfirmsAcceptedRequest() {
        $this->qb->table('servicerequest')->insert([
            'customer_id' => $this->customerUserId,
            'shop_id' => $this->shopUserId,
            'status' => 'Accepted'
        ]);
        $req = $this->qb->table('servicerequest')->where('customer_id', $this->customerUserId)->first();
        
        $res = $this->runReqRequest('updateStatus', $this->customerUserId, 'customer', [
            'request_id' => $req['id'],
            'new_status' => 'Confirmed'
        ]);
        
        $this->assertEquals(200, $res['status']);
        $updated = $this->qb->table('servicerequest')->where('id', $req['id'])->first();
        $this->assertEquals('Confirmed', $updated['status']);
    }

    public function testCompetingRequestsAreCancelledOnConfirm() {
        $now = date('Y-m-d H:i:s');
        
        // Request 1 to Shop 1 (Accepted)
        $this->qb->table('servicerequest')->insert([
            'customer_id' => $this->customerUserId,
            'shop_id' => $this->shopUserId,
            'status' => 'Accepted',
            'vehicle_brand' => 'Toyota',
            'issue_category' => 'Engine',
            'created_at' => $now
        ]);
        $req1 = $this->qb->table('servicerequest')->where('shop_id', $this->shopUserId)->first();
        
        // Request 2 to Shop 2 (Pending/Accepted)
        $this->qb->table('servicerequest')->insert([
            'customer_id' => $this->customerUserId,
            'shop_id' => $this->otherShopUserId,
            'status' => 'Accepted',
            'vehicle_brand' => 'Toyota',
            'issue_category' => 'Engine',
            'created_at' => $now
        ]);
        $req2 = $this->qb->table('servicerequest')->where('shop_id', $this->otherShopUserId)->first();
        
        // Customer confirms req1
        $res = $this->runReqRequest('updateStatus', $this->customerUserId, 'customer', [
            'request_id' => $req1['id'],
            'new_status' => 'Confirmed'
        ]);
        $this->assertEquals(200, $res['status']);
        
        // Ensure req2 is cancelled
        $updatedReq2 = $this->qb->table('servicerequest')->where('id', $req2['id'])->first();
        $this->assertEquals('Cancelled', $updatedReq2['status']);
    }

    public function testShopCannotAcceptCancelledRequest() {
        $this->qb->table('servicerequest')->insert([
            'customer_id' => $this->customerUserId,
            'shop_id' => $this->shopUserId,
            'status' => 'Cancelled'
        ]);
        $req = $this->qb->table('servicerequest')->where('shop_id', $this->shopUserId)->first();
        
        $res = $this->runReqRequest('updateStatus', $this->shopUserId, 'shop_owner', [
            'request_id' => $req['id'],
            'new_status' => 'Accepted'
        ]);
        
        $this->assertEquals(400, $res['status']);
    }

    public function testShopCanAdvanceThroughAllMilestones() {
        $this->qb->table('servicerequest')->insert([
            'customer_id' => $this->customerUserId,
            'shop_id' => $this->shopUserId,
            'status' => 'Confirmed'
        ]);
        $req = $this->qb->table('servicerequest')->where('shop_id', $this->shopUserId)->first();
        
        $milestones = ['Diagnosis', 'Pending Parts', 'In Progress', 'Completed'];
        foreach ($milestones as $milestone) {
            $res = $this->runReqRequest('updateStatus', $this->shopUserId, 'shop_owner', [
                'request_id' => $req['id'],
                'new_status' => $milestone
            ]);
            $this->assertEquals(200, $res['status']);
            
            $updated = $this->qb->table('servicerequest')->where('id', $req['id'])->first();
            $this->assertEquals($milestone, $updated['status']);
        }
    }

    public function testMilestonesBlockedBeforeConfirmation() {
        $this->qb->table('servicerequest')->insert([
            'customer_id' => $this->customerUserId,
            'shop_id' => $this->shopUserId,
            'status' => 'Accepted' // Not confirmed yet
        ]);
        $req = $this->qb->table('servicerequest')->where('shop_id', $this->shopUserId)->first();
        
        $res = $this->runReqRequest('updateStatus', $this->shopUserId, 'shop_owner', [
            'request_id' => $req['id'],
            'new_status' => 'In Progress'
        ]);
        
        $this->assertEquals(400, $res['status']);
        $this->assertStringContainsString('Cannot update repair milestones until the customer Confirms', $res['body']['message'] ?? '');
    }

    public function testCancellationStrikeAppliedOnLateCancel() {
        $this->qb->table('servicerequest')->insert([
            'customer_id' => $this->customerUserId,
            'shop_id' => $this->shopUserId,
            'status' => 'Confirmed'
        ]);
        $req = $this->qb->table('servicerequest')->where('shop_id', $this->shopUserId)->first();
        
        $res = $this->runReqRequest('updateStatus', $this->customerUserId, 'customer', [
            'request_id' => $req['id'],
            'new_status' => 'Cancelled'
        ]);
        
        $this->assertEquals(200, $res['status']);
        
        $customer = $this->qb->table('customer')->where('id', $this->customerUserId)->first();
        $this->assertEquals(1, $customer['cancellation_strikes']);
    }
    public function testShopCanDeclineRequest() {
        $this->qb->table('servicerequest')->insert([
            'customer_id' => $this->customerUserId,
            'shop_id' => $this->shopUserId,
            'status' => 'Pending'
        ]);
        $req = $this->qb->table('servicerequest')->where('customer_id', $this->customerUserId)->first();
        
        $res = $this->runReqRequest('updateStatus', $this->shopUserId, 'shop_owner', [
            'request_id' => $req['id'],
            'new_status' => 'Declined'
        ]);
        
        $this->assertEquals(200, $res['status']);
        $updated = $this->qb->table('servicerequest')->where('id', $req['id'])->first();
        $this->assertEquals('Declined', $updated['status']);
    }

    public function testGetCustomerRequestsReturnsList() {
        $this->qb->table('servicerequest')->insert([
            'customer_id' => $this->customerUserId,
            'shop_id' => $this->shopUserId,
            'status' => 'Pending'
        ]);
        
        $res = $this->runReqRequest('getCustomerRequests', $this->customerUserId, 'customer');
        
        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success']);
        $this->assertIsArray($res['body']['data']);
        $this->assertCount(1, $res['body']['data']);
    }

    public function testGetShopRequestsReturnsList() {
        $this->qb->table('servicerequest')->insert([
            'customer_id' => $this->customerUserId,
            'shop_id' => $this->shopUserId,
            'status' => 'Pending'
        ]);
        
        $res = $this->runReqRequest('getShopRequests', $this->shopUserId, 'shop_owner');
        
        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success']);
        $this->assertIsArray($res['body']['data']);
        $this->assertCount(1, $res['body']['data']);
    }

    public function testPhoneLockedBeforeConfirm() {
        $this->qb->table('servicerequest')->insert([
            'customer_id' => $this->customerUserId,
            'shop_id' => $this->shopUserId,
            'status' => 'Accepted' // Not confirmed
        ]);
        
        $res = $this->runReqRequest('getCustomerRequests', $this->customerUserId, 'customer');
        
        $this->assertEquals(200, $res['status']);
        $reqs = $res['body']['data'];
        $this->assertNotEmpty($reqs);
        $this->assertEquals('Locked until Confirmed', $reqs[0]['shop_phone']);
    }
}
