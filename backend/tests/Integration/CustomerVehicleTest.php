<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../database/QueryBuilder.php';

class CustomerVehicleTest extends TestCase {
    private $db;
    private $qb;
    private $testEmail = 'vehicle_test_user@fixgo.com';
    private $testUserId;
    private $testCustomerId;
    private $wrapperPath;

    protected function setUp(): void {
        
        
        $database = new Database();
        $this->db = $database->connect();
        $this->qb = new QueryBuilder($this->db);
        
        // Clean up test DB before start
        $user = $this->qb->table('users')->where('email', $this->testEmail)->first();
        if ($user) {
            $this->qb->table('customervehicle')->where('customer_id', $user['id'])->delete();
            $this->qb->table('customer')->where('id', $user['id'])->delete();
            $this->qb->table('users')->where('id', $user['id'])->delete();
        }

        $this->createTestUser();

        $this->wrapperPath = __DIR__ . '/customer_vehicle_wrapper.php';
        file_put_contents($this->wrapperPath, "<?php
            require_once '" . realpath(__DIR__ . '/../../config/Database.php') . "';
            require_once '" . realpath(__DIR__ . '/../../controllers/CustomerController.php') . "';
            require_once '" . realpath(__DIR__ . '/../../config/RequestValidator.php') . "';
            require_once '" . realpath(__DIR__ . '/../../database/QueryBuilder.php') . "';
            require_once '" . realpath(__DIR__ . '/../../models/CustomerVehicle.php') . "';
            \$db = (new Database())->connect();
            \$controller = new CustomerController(\$db);
            
            \$method = \$_SERVER['HTTP_X_METHOD'] ?? 'GET';
            \$customerId = (int)(\$_SERVER['HTTP_X_CUSTOMER_ID'] ?? 0);
            \$payload = ['user_id' => \$customerId];
            
            if (\$method === 'GET') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$controller->handleGetVehicles(\$payload);
            } elseif (\$method === 'POST') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$controller->handleAddVehicle(\$payload);
            } elseif (\$method === 'PUT') {
                \$_SERVER['REQUEST_METHOD'] = 'PUT';
                \$controller->handleUpdateVehicle(\$payload);
            } elseif (\$method === 'DELETE') {
                \$_SERVER['REQUEST_METHOD'] = 'DELETE';
                \$controller->handleDeleteVehicle(\$payload);
            }
        ");
    }

    protected function tearDown(): void {
        if ($this->testUserId) {
            $this->qb->table('customervehicle')->where('customer_id', $this->testUserId)->delete();
            $this->qb->table('customer')->where('id', $this->testUserId)->delete();
            $this->qb->table('users')->where('id', $this->testUserId)->delete();
        }
        if (file_exists($this->wrapperPath)) {
            @unlink($this->wrapperPath);
        }
    }

    private function createTestUser() {
        $this->qb->table('users')->insert([
            'email' => $this->testEmail,
            'password' => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole' => 'customer',
            'isActive' => 1,
            'is_email_verified' => 1
        ]);
        
        $user = $this->qb->table('users')->where('email', $this->testEmail)->first();
        $this->testUserId = $user['id'];
        
        $this->qb->table('customer')->insert([
            'id' => $this->testUserId,
            'name' => 'Vehicle Test User',
            'contactNumber' => '0770000000',
            'address' => '123 Test Street',
            'loyalty_points' => 0
        ]);
        
        $this->testCustomerId = $this->testUserId;
    }

    private function runVehicleRequest($method, $payload = null) {
        $cmdEnv = "HTTP_X_METHOD=" . escapeshellarg($method) . " HTTP_X_CUSTOMER_ID=" . (int)$this->testUserId . " REDIRECT_STATUS=1 SCRIPT_FILENAME=" . escapeshellarg($this->wrapperPath);
        
        if ($payload !== null) {
            $jsonPayload = json_encode($payload);
            $contentLength = strlen($jsonPayload);
            $cmd = "echo " . escapeshellarg($jsonPayload) . " | {$cmdEnv} REQUEST_METHOD={$method} CONTENT_TYPE=application/json CONTENT_LENGTH={$contentLength} php-cgi 2>/dev/null";
        } else {
            $cmd = "{$cmdEnv} REQUEST_METHOD=GET php-cgi 2>/dev/null";
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

    public function testCustomerCanAddVehicle() {
        $payload = [
            'vehicle_category_id' => 2, // 4 Wheelers
            'brand' => 'Toyota Prius',
            'color' => 'White'
        ];
        
        $response = $this->runVehicleRequest('POST', $payload);
        $this->assertEquals(200, $response['status']);
        $this->assertTrue($response['body']['success']);
        
        $vehicle = $this->qb->table('customervehicle')->where('customer_id', $this->testUserId)->first();
        $this->assertEquals('Toyota Prius', $vehicle['brand']);
    }

    public function testDuplicateVehicleBlocked() {
        $payload = [
            'vehicle_category_id' => 2,
            'brand' => 'Honda Civic',
            'color' => 'Black'
        ];
        $this->runVehicleRequest('POST', $payload); // Add once
        
        $response = $this->runVehicleRequest('POST', $payload); // Add twice
        $this->assertEquals(400, $response['status']);
        $this->assertStringContainsString('already exists', $response['body']['message'] ?? '');
    }

    public function testMissingVehicleCategoryIdRejected() {
        $payload = [
            'brand' => 'Nissan Leaf',
            'color' => 'Silver'
        ];
        
        $response = $this->runVehicleRequest('POST', $payload);
        $this->assertEquals(400, $response['status']);
    }

    public function testCustomerCanGetVehicleList() {
        $this->qb->table('customervehicle')->insert([
            'customer_id' => $this->testUserId,
            'vehicle_category_id' => 1,
            'brand' => 'Yamaha FZ',
            'color' => 'Blue'
        ]);
        
        $response = $this->runVehicleRequest('GET');
        $this->assertEquals(200, $response['status']);
        $this->assertTrue($response['body']['success']);
        $this->assertCount(1, $response['body']['vehicles']);
        $this->assertEquals('Yamaha FZ', $response['body']['vehicles'][0]['brand']);
    }

    public function testCustomerCanUpdateVehicle() {
        $this->qb->table('customervehicle')->insert([
            'customer_id' => $this->testUserId,
            'vehicle_category_id' => 2,
            'brand' => 'Old Brand',
            'color' => 'Red'
        ]);
        $vehicle = $this->qb->table('customervehicle')->where('customer_id', $this->testUserId)->first();
        
        $payload = [
            'id' => $vehicle['id'],
            'vehicle_category_id' => 2,
            'brand' => 'New Brand',
            'color' => 'Green'
        ];
        $response = $this->runVehicleRequest('PUT', $payload);
        $this->assertEquals(200, $response['status']);
        
        $updated = $this->qb->table('customervehicle')->where('id', $vehicle['id'])->first();
        $this->assertEquals('New Brand', $updated['brand']);
        $this->assertEquals('Green', $updated['color']);
    }

    public function testCustomerCanDeleteVehicle() {
        $this->qb->table('customervehicle')->insert([
            'customer_id' => $this->testUserId,
            'vehicle_category_id' => 2,
            'brand' => 'To Be Deleted',
            'color' => 'Yellow'
        ]);
        $vehicle = $this->qb->table('customervehicle')->where('customer_id', $this->testUserId)->first();
        
        $response = $this->runVehicleRequest('DELETE', ['id' => $vehicle['id']]);
        $this->assertEquals(200, $response['status']);
        
        $deleted = $this->qb->table('customervehicle')->where('id', $vehicle['id'])->first();
        $this->assertEmpty($deleted);
    }
    public function testCannotDeleteOtherCustomersVehicle() {
        // Create another customer and their vehicle
        $this->qb->table('users')->insert([
            'email' => 'other_user@fixgo.com',
            'password' => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole' => 'customer',
            'isActive' => 1
        ]);
        $otherUser = $this->qb->table('users')->where('email', 'other_user@fixgo.com')->first();
        $this->qb->table('customer')->insert(['id' => $otherUser['id'], 'name' => 'Other', 'contactNumber' => '077']);
        
        $this->qb->table('customervehicle')->insert([
            'customer_id' => $otherUser['id'],
            'vehicle_category_id' => 2,
            'brand' => 'Other Brand',
            'color' => 'Other Color'
        ]);
        $otherVehicle = $this->qb->table('customervehicle')->where('customer_id', $otherUser['id'])->first();
        
        // Try to delete the other customer's vehicle with the test user's credentials
        $response = $this->runVehicleRequest('DELETE', ['id' => $otherVehicle['id']]);
        
        // Depending on implementation, it might return 404 or just 200 with no rows affected.
        // The key is that the vehicle should still exist.
        $stillExists = $this->qb->table('customervehicle')->where('id', $otherVehicle['id'])->first();
        $this->assertNotEmpty($stillExists);
        
        // Clean up
        $this->qb->table('customervehicle')->where('id', $otherVehicle['id'])->delete();
        $this->qb->table('customer')->where('id', $otherUser['id'])->delete();
        $this->qb->table('users')->where('id', $otherUser['id'])->delete();
    }
}
