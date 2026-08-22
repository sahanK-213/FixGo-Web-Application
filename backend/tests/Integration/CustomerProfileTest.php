<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../database/QueryBuilder.php';

class CustomerProfileTest extends TestCase {
    private $db;
    private $qb;
    private $testEmail = 'profile_test_user@fixgo.com';
    private $testPassword = 'Password123';
    private $testUserId;
    private $testCustomerId;
    private $wrapperPath;

    protected function setUp(): void {
        putenv('JWT_SECRET=supersecret1234567890abcdef');
        
        $database = new Database();
        $this->db = $database->connect();
        $this->qb = new QueryBuilder($this->db);
        
        // Clean up test DB before start
        $user = $this->qb->table('users')->where('email', $this->testEmail)->first();
        if ($user) {
            $this->qb->table('customer')->where('id', $user['id'])->delete();
            $this->qb->table('users')->where('id', $user['id'])->delete();
        }

        // Create the test user
        $this->createTestUser();

        $this->wrapperPath = __DIR__ . '/customer_profile_wrapper.php';
        file_put_contents($this->wrapperPath, "<?php
            require_once '" . realpath(__DIR__ . '/../../config/Database.php') . "';
            require_once '" . realpath(__DIR__ . '/../../controllers/CustomerController.php') . "';
            require_once '" . realpath(__DIR__ . '/../../config/RequestValidator.php') . "';
            require_once '" . realpath(__DIR__ . '/../../database/QueryBuilder.php') . "';
            \$db = (new Database())->connect();
            \$controller = new CustomerController(\$db);
            
            \$method = \$_SERVER['HTTP_X_METHOD'] ?? 'GET';
            \$customerId = (int)(\$_SERVER['HTTP_X_CUSTOMER_ID'] ?? 0);
            
            if (\$method === 'GET') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$controller->getProfile(\$customerId, false);
            } else {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$controller->updateProfile(\$customerId);
            }
        ");
    }

    protected function tearDown(): void {
        if ($this->testUserId) {
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
            'password' => password_hash($this->testPassword, PASSWORD_BCRYPT),
            'userRole' => 'customer',
            'isActive' => 1,
            'is_email_verified' => 1
        ]);
        
        $user = $this->qb->table('users')->where('email', $this->testEmail)->first();
        $this->testUserId = $user['id'];
        
        $this->qb->table('customer')->insert([
            'id' => $this->testUserId,
            'name' => 'Profile Test User',
            'contactNumber' => '0770000000',
            'address' => '123 Test Street, Colombo',
            'loyalty_points' => 0
        ]);
        
        $customer = $this->qb->table('customer')->where('id', $this->testUserId)->first();
        $this->testCustomerId = $customer['id'];
    }

    private function runProfileRequest($method, $payload = null) {
        $cmdEnv = "HTTP_X_METHOD=" . escapeshellarg($method) . " HTTP_X_CUSTOMER_ID=" . (int)$this->testUserId . " REDIRECT_STATUS=1 SCRIPT_FILENAME=" . escapeshellarg($this->wrapperPath);
        
        if ($payload !== null) {
            $jsonPayload = json_encode($payload);
            $contentLength = strlen($jsonPayload);
            $cmd = "echo " . escapeshellarg($jsonPayload) . " | {$cmdEnv} REQUEST_METHOD=POST CONTENT_TYPE=application/json CONTENT_LENGTH={$contentLength} php-cgi 2>/dev/null";
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

    public function testGetProfileReturnsCorrectFields() {
        $response = $this->runProfileRequest('GET');
        
        $this->assertEquals(200, $response['status']);
        $this->assertTrue($response['body']['success']);
        $this->assertEquals('Profile Test User', $response['body']['name']);
        $this->assertEquals($this->testEmail, $response['body']['email']);
        $this->assertEquals('0770000000', $response['body']['contactNumber']);
    }

    public function testUpdateProfileName() {
        $payload = [
            'name' => 'Updated Name'
        ];
        
        $response = $this->runProfileRequest('POST', $payload);
        $this->assertEquals(200, $response['status']);
        
        // Verify in DB
        $customer = $this->qb->table('customer')->where('id', $this->testUserId)->first();
        $this->assertEquals('Updated Name', $customer['name']);
    }

    public function testUpdateProfilePhone() {
        $payload = [
            'phone' => '0779999999'
        ];
        
        $response = $this->runProfileRequest('POST', $payload);
        $this->assertEquals(200, $response['status']);
        
        $customer = $this->qb->table('customer')->where('id', $this->testUserId)->first();
        $this->assertEquals('0779999999', $customer['contactNumber']);
    }

    public function testUpdateProfileInvalidPhoneRejected() {
        $payload = [
            'phone' => '123'
        ];
        
        $response = $this->runProfileRequest('POST', $payload);
        $this->assertEquals(400, $response['status']);
        $this->assertStringContainsString('Invalid phone number format', $response['body']['message'] ?? '');
    }

    public function testPasswordChangeRequiresCurrentPassword() {
        $payload = [
            'newPassword' => 'NewStrongPass123'
        ];
        
        $response = $this->runProfileRequest('POST', $payload);
        $this->assertEquals(400, $response['status']);
        $this->assertStringContainsString('Current password is required', $response['body']['message'] ?? '');
    }

    public function testPasswordChangeWithWrongCurrentPassword() {
        $payload = [
            'currentPassword' => 'WrongCurrent123',
            'newPassword' => 'NewStrongPass123'
        ];
        
        $response = $this->runProfileRequest('POST', $payload);
        $this->assertEquals(400, $response['status']);
        $this->assertStringContainsString('Current password is incorrect', $response['body']['message'] ?? '');
    }

    public function testSuccessfulPasswordChange() {
        $payload = [
            'currentPassword' => $this->testPassword,
            'newPassword' => 'NewStrongPass123'
        ];
        
        $response = $this->runProfileRequest('POST', $payload);
        $this->assertEquals(200, $response['status']);
        
        // Verify new password via AuthController login wrapper or just DB directly
        $user = $this->qb->table('users')->where('id', $this->testUserId)->first();
        $this->assertTrue(password_verify('NewStrongPass123', $user['password']));
    }
}
