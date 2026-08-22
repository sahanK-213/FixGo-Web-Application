<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../database/QueryBuilder.php';

class ShopProfileTest extends TestCase {
    private $db;
    private $qb;
    private $testEmail = 'shop_profile_test@fixgo.com';
    private $testPassword = 'StrongPassword123!';
    private $testUserId;
    private $testShopId;
    private $wrapperPath;

    protected function setUp(): void {
        putenv('JWT_SECRET=supersecret1234567890abcdef');
        
        $database = new Database();
        $this->db = $database->connect();
        $this->qb = new QueryBuilder($this->db);
        
        // Clean up test DB before start
        $user = $this->qb->table('users')->where('email', $this->testEmail)->first();
        if ($user) {
            $shop = $this->qb->table('shop')->where('id', $user['id'])->first();
            if ($shop) {
                $this->qb->table('shopcategorymapping')->where('shop_id', $shop['id'])->delete();
                $this->qb->table('shopvehiclecategories')->where('shop_id', $shop['id'])->delete();
                $this->qb->table('shopimage')->where('shop_id', $shop['id'])->delete();
            }
            $this->qb->table('shop')->where('id', $user['id'])->delete();
            $this->qb->table('users')->where('id', $user['id'])->delete();
        }

        $this->createTestUser();

        $this->wrapperPath = __DIR__ . '/shop_profile_wrapper.php';
        file_put_contents($this->wrapperPath, "<?php
            require_once '" . realpath(__DIR__ . '/../../config/Database.php') . "';
            require_once '" . realpath(__DIR__ . '/../../controllers/ShopController.php') . "';
            require_once '" . realpath(__DIR__ . '/../../config/RequestValidator.php') . "';
            require_once '" . realpath(__DIR__ . '/../../database/QueryBuilder.php') . "';
            require_once '" . realpath(__DIR__ . '/../../models/Shop.php') . "';
            \$db = (new Database())->connect();
            \$controller = new ShopController(\$db);
            
            \$method = \$_SERVER['HTTP_X_METHOD'] ?? 'getProfile';
            \$shopId = (int)(\$_SERVER['HTTP_X_SHOP_ID'] ?? 0);
            \$payload = ['user_id' => \$shopId];
            
            \$_SERVER['REQUEST_METHOD'] = \$_SERVER['HTTP_X_REQUEST_METHOD'] ?? 'POST';
            
            if (\$method === 'getProfile') {
                \$controller->getProfile(\$shopId); // Uses raw shopId
            } elseif (\$method === 'updateBusinessInfo') {
                \$controller->updateBusinessInfo(\$payload);
            } elseif (\$method === 'getShopServices') {
                \$controller->getShopServices(\$payload);
            } elseif (\$method === 'updateShopServices') {
                \$controller->updateShopServices(\$payload);
            } elseif (\$method === 'getTowTruckDetails') {
                \$controller->getTowTruckDetails(\$payload); // Wait, ShopController uses handleGetTowTruckDetails or getTowTruckDetails? Wait, it is getTowTruckDetails in 386. But wait, it takes payload.
            } elseif (\$method === 'updateShopTowTruckDetails') {
                \$controller->updateShopTowTruckDetails(\$payload);
            } elseif (\$method === 'getGalleryImages') {
                \$controller->getGalleryImages(\$payload);
            } elseif (\$method === 'uploadGalleryImage') {
                \$controller->uploadGalleryImage(\$payload);
            } elseif (\$method === 'deleteGalleryImage') {
                \$controller->deleteGalleryImage(\$payload);
            } elseif (\$method === 'updatePassword') {
                \$controller->updatePassword(\$payload);
            }
        ");
    }

    protected function tearDown(): void {
        if ($this->testUserId) {
            $shop = $this->qb->table('shop')->where('id', $this->testUserId)->first();
            if ($shop) {
                $this->qb->table('shopcategorymapping')->where('shop_id', $shop['id'])->delete();
                $this->qb->table('shopvehiclecategories')->where('shop_id', $shop['id'])->delete();
                $this->qb->table('shopimage')->where('shop_id', $shop['id'])->delete();
            }
            $this->qb->table('shop')->where('id', $this->testUserId)->delete();
            $this->qb->table('users')->where('id', $this->testUserId)->delete();
        }
        
        if (file_exists($this->wrapperPath)) {
            @unlink($this->wrapperPath);
        }
    }

    private function createTestUser() {
        $this->qb->table('users')->insert([
            'email' => $this->testEmail,
            'password' => password_hash($this->testPassword, PASSWORD_BCRYPT),
            'userRole' => 'shop_owner',
            'isActive' => 1,
            'is_email_verified' => 1
        ]);
        
        $user = $this->qb->table('users')->where('email', $this->testEmail)->first();
        $this->testUserId = $user['id'];
        
        $this->qb->table('shop')->insert([
            'id' => $this->testUserId,
            'name' => 'Profile Test Shop',
            'address' => '123 Test Street',
            'contactNumber' => '0770000000',
            'owner' => 'John ShopOwner',
            'openTime' => '08:00:00',
            'closeTime' => '18:00:00',
            'carriageService' => 1,
            'default_driver_name' => 'John Driver',
            'default_driver_phone' => '0771231234',
            'default_truck_brand' => 'Toyota',
            'default_truck_color' => 'White',
            'tow_truck_plate' => 'WP-1234'
        ]);
        
        $this->testShopId = $this->testUserId;
        
        // Add default category
        $this->qb->table('shopcategorymapping')->insert([
            'shop_id' => $this->testShopId,
            'shop_category_id' => 1
        ]);
    }

    private function runShopRequest($method, $httpMethod = 'POST', $payload = null) {
        $cmdEnv = "HTTP_X_METHOD=" . escapeshellarg($method) . " HTTP_X_REQUEST_METHOD=" . escapeshellarg($httpMethod) . " HTTP_X_SHOP_ID=" . (int)$this->testUserId . " REDIRECT_STATUS=1 SCRIPT_FILENAME=" . escapeshellarg($this->wrapperPath);
        
        if ($payload !== null) {
            $jsonPayload = json_encode($payload);
            $contentLength = strlen($jsonPayload);
            $cmd = "echo " . escapeshellarg($jsonPayload) . " | {$cmdEnv} REQUEST_METHOD={$httpMethod} CONTENT_TYPE=application/json CONTENT_LENGTH={$contentLength} php-cgi 2>/dev/null";
        } else {
            $cmd = "{$cmdEnv} REQUEST_METHOD={$httpMethod} php-cgi 2>/dev/null";
        }
        
        $output = shell_exec($cmd);
        
        if (preg_match('/Status: (\d+)/i', $output, $matches)) {
            $status = (int)$matches[1];
        } else {
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

    public function testGetShopProfileReturnsExpectedData() {
        $response = $this->runShopRequest('getProfile', 'GET');
        
        $this->assertEquals(200, $response['status']);
        $this->assertTrue($response['body']['success']);
        $this->assertEquals('Profile Test Shop', $response['body']['data']['name']);
    }

    public function testUpdateBusinessInfoSucceeds() {
        $payload = [
            'name' => 'Updated Shop Name',
            'owner' => 'Updated Owner',
            'phone' => '0779999999',
            'address' => 'Updated Address',
            'openTime' => '09:00:00',
            'closeTime' => '17:00:00',
            'vehicleCategories' => [2] // 4 Wheelers
        ];
        
        $response = $this->runShopRequest('updateBusinessInfo', 'POST', $payload);
        
        $this->assertEquals(200, $response['status']);
        $this->assertTrue($response['body']['success']);
        
        $shop = $this->qb->table('shop')->where('id', $this->testShopId)->first();
        $this->assertEquals('Updated Shop Name', $shop['name']);
        $this->assertEquals('0779999999', $shop['contactNumber']);
    }

    public function testGetShopServicesReturnsList() {
        $response = $this->runShopRequest('getShopServices', 'GET');
        
        $this->assertEquals(200, $response['status']);
        $this->assertTrue($response['body']['success']);
        $this->assertIsArray($response['body']['data']);
    }

    public function testUpdateShopServicesSucceeds() {
        $payload = [
            'services' => ['Oil Change', 'Brake Repair']
        ];
        
        $response = $this->runShopRequest('updateShopServices', 'POST', $payload);
        
        $this->assertEquals(200, $response['status']);
        $this->assertTrue($response['body']['success']);
    }

    public function testGetTowTruckDetailsReturnsData() {
        $response = $this->runShopRequest('getTowTruckDetails', 'GET');
        
        $this->assertEquals(200, $response['status']);
        $this->assertTrue($response['body']['success']);
        $this->assertEquals('WP-1234', $response['body']['data']['tow_truck_plate']);
    }

    public function testUpdateTowTruckDetailsSucceeds() {
        $payload = [
            'driverName' => 'New Driver',
            'driverPhone' => '0778888888',
            'truckBrand' => 'Nissan',
            'truckColor' => 'Red',
            'truckPlate' => 'WP-5678'
        ];
        
        $response = $this->runShopRequest('updateShopTowTruckDetails', 'POST', $payload);
        
        $this->assertEquals(200, $response['status']);
        $this->assertTrue($response['body']['success']);
        
        $shop = $this->qb->table('shop')->where('id', $this->testShopId)->first();
        $this->assertEquals('WP-5678', $shop['tow_truck_plate']);
    }

    public function testUpdateTowTruckRejectsInvalidDriverPhone() {
        $payload = [
            'driverName' => 'New Driver',
            'driverPhone' => 'invalid_phone',
            'truckBrand' => 'Nissan',
            'truckColor' => 'Red',
            'truckPlate' => 'WP-5678'
        ];
        
        $response = $this->runShopRequest('updateShopTowTruckDetails', 'POST', $payload);
        
        $this->assertEquals(400, $response['status']);
        $this->assertStringContainsString('Invalid driver phone number format', $response['body']['message'] ?? '');
    }

    public function testDeleteGalleryImageSucceeds() {
        // First insert a dummy image directly via DB
        $this->qb->table('shopimage')->insert([
            'shop_id' => $this->testShopId,
            'url' => 'dummy_image.jpg'
        ]);
        
        $image = $this->qb->table('shopimage')->where('shop_id', $this->testShopId)->first();
        $this->assertNotEmpty($image);
        
        $payload = [
            'image_id' => $image['id']
        ];
        
        $response = $this->runShopRequest('deleteGalleryImage', 'POST', $payload);
        
        $this->assertEquals(200, $response['status']);
        
        $deleted = $this->qb->table('shopimage')->where('id', $image['id'])->first();
        $this->assertEmpty($deleted);
    }

    public function testUpdatePasswordSucceeds() {
        $payload = [
            'currentPassword' => $this->testPassword,
            'newPassword' => 'NewStrongPass123',
            'confirmPassword' => 'NewStrongPass123'
        ];
        
        $response = $this->runShopRequest('updatePassword', 'POST', $payload);
        
        $this->assertEquals(200, $response['status']);
        $this->assertTrue($response['body']['success']);
        
        $user = $this->qb->table('users')->where('id', $this->testUserId)->first();
        $this->assertTrue(password_verify('NewStrongPass123', $user['password']));
    }
    public function testUpdateBusinessInfoBlocksEmailChange() {
        $payload = [
            'name' => 'Updated Shop Name',
            'email' => 'hacked@fixgo.com', // malicious email change attempt
            'owner' => 'Updated Owner',
            'phone' => '0779999999',
            'address' => 'Updated Address',
            'openTime' => '09:00:00',
            'closeTime' => '17:00:00',
            'vehicleCategories' => [2]
        ];
        
        $response = $this->runShopRequest('updateBusinessInfo', 'POST', $payload);
        
        $this->assertEquals(200, $response['status']);
        $this->assertTrue($response['body']['success']);
        
        $user = $this->qb->table('users')->where('id', $this->testUserId)->first();
        $this->assertEquals($this->testEmail, $user['email']); // unchanged
    }

    public function testUpdateBusinessInfoBlocksCategoryChange() {
        $payload = [
            'name' => 'Updated Shop Name',
            'shop_category_id' => 3, // malicious category change attempt
            'owner' => 'Updated Owner',
            'phone' => '0779999999',
            'address' => 'Updated Address',
            'openTime' => '09:00:00',
            'closeTime' => '17:00:00',
            'vehicleCategories' => [2]
        ];
        
        $response = $this->runShopRequest('updateBusinessInfo', 'POST', $payload);
        
        $this->assertEquals(200, $response['status']);
        $this->assertTrue($response['body']['success']);
        
        $mapping = $this->qb->table('shopcategorymapping')->where('shop_id', $this->testShopId)->first();
        $this->assertEquals(1, (int)$mapping['shop_category_id']); // unchanged
    }

    public function testGalleryMaxFourImages() {
        // Insert 4 images directly
        for ($i = 0; $i < 4; $i++) {
            $this->qb->table('shopimage')->insert([
                'shop_id' => $this->testShopId,
                'url' => "dummy_image_{$i}.jpg"
            ]);
        }
        
        $payload = [
            'image' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
        ];
        
        $response = $this->runShopRequest('uploadGalleryImage', 'POST', $payload);
        
        $this->assertEquals(400, $response['status']);
        $this->assertStringContainsString('maximum of 4', strtolower($response['body']['message'] ?? ''));
    }

    public function testUpdatePasswordMismatchRejected() {
        $payload = [
            'currentPassword' => $this->testPassword,
            'newPassword' => 'NewStrongPass123',
            'confirmPassword' => 'MismatchedPass123'
        ];
        
        $response = $this->runShopRequest('updatePassword', 'POST', $payload);
        
        $this->assertEquals(400, $response['status']);
        $this->assertStringContainsString('match', strtolower($response['body']['message'] ?? ''));
    }
}
