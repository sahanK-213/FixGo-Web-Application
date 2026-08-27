<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../database/QueryBuilder.php';

class CustomerRegistrationTest extends TestCase {
    private $db;
    private $qb;
    private $testEmail = 'customer_reg_test@fixgo.com';
    private $wrapperPath;
    private $initialFiles = [];

    protected function setUp(): void {
        
        
        $database = new Database();
        $this->db = $database->connect();
        $this->qb = new QueryBuilder($this->db);
        
        $user = $this->qb->table('users')->where('email', $this->testEmail)->first();
        if ($user) {
            $this->qb->table('customer')->where('id', $user['id'])->delete();
            $this->qb->table('users')->where('id', $user['id'])->delete();
        }

        // Snapshot files before tests run
        $this->initialFiles = glob(realpath(__DIR__ . '/../../') . '/uploads/customers/*');

        $this->wrapperPath = __DIR__ . '/customer_reg_wrapper.php';
        file_put_contents($this->wrapperPath, "<?php
            require_once '" . realpath(__DIR__ . '/../../config/Database.php') . "';
            require_once '" . realpath(__DIR__ . '/../../controllers/CustomerController.php') . "';
            require_once '" . realpath(__DIR__ . '/../../config/RequestValidator.php') . "';
            require_once '" . realpath(__DIR__ . '/../../database/QueryBuilder.php') . "';
            \$db = (new Database())->connect();
            \$controller = new CustomerController(\$db);
            \$controller->register();
        ");
    }

    protected function tearDown(): void {
        $user = $this->qb->table('users')->where('email', $this->testEmail)->first();
        if ($user) {
            $this->qb->table('customer')->where('id', $user['id'])->delete();
            $this->qb->table('users')->where('id', $user['id'])->delete();
        }
        
        // Clean up orphaned files
        $currentFiles = glob(realpath(__DIR__ . '/../../') . '/uploads/customers/*');
        $newFiles = array_diff($currentFiles, $this->initialFiles);
        foreach ($newFiles as $file) {
            if (is_file($file)) {
                @unlink($file);
            }
        }
        if (file_exists($this->wrapperPath)) {
            @unlink($this->wrapperPath);
        }
    }

    private function runRegistrationRequest($payload) {
        $boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        $body = '';
        
        foreach ($payload as $name => $value) {
            $body .= "--{$boundary}\r\n";
            $body .= "Content-Disposition: form-data; name=\"{$name}\"\r\n\r\n";
            $body .= "{$value}\r\n";
        }
        
        // Add valid 1x1 JPEG image
        $jpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
        $jpegBinary = base64_decode($jpegBase64);
        
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Disposition: form-data; name=\"profilePic\"; filename=\"test.jpg\"\r\n";
        $body .= "Content-Type: image/jpeg\r\n\r\n";
        $body .= "{$jpegBinary}\r\n";
        $body .= "--{$boundary}--\r\n";

        $contentLength = strlen($body);
        
        // Write the body to a temp file and cat it to php-cgi to avoid argument length limits and shell quoting issues with binary data
        $tmpBodyFile = sys_get_temp_dir() . '/upload_body_' . uniqid() . '.tmp';
        file_put_contents($tmpBodyFile, $body);
        
        $cmd = "cat " . escapeshellarg($tmpBodyFile) . " | SCRIPT_FILENAME=" . escapeshellarg($this->wrapperPath) . " REDIRECT_STATUS=1 REQUEST_METHOD=POST CONTENT_TYPE=\"multipart/form-data; boundary={$boundary}\" CONTENT_LENGTH={$contentLength} php-cgi 2>/dev/null";
        
        $output = shell_exec($cmd);
        @unlink($tmpBodyFile);
        
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

    public function testSuccessfulCustomerRegistration() {
        $payload = [
            'name' => 'John Doe',
            'email' => $this->testEmail,
            'phone' => '0771234567',
            'address' => '123 Test St',
            'password' => 'StrongPassword123'
        ];
        
        $response = $this->runRegistrationRequest($payload);
        
        // Output should be 201 Created
        $this->assertEquals(201, $response['status']);
        $this->assertStringContainsString('Customer registered successfully', $response['body']['message'] ?? '');
        
        // Verify in DB
        $user = $this->qb->table('users')->where('email', $this->testEmail)->first();
        $this->assertNotEmpty($user);
        $this->assertEquals('customer', $user['userRole']);
        
        $customer = $this->qb->table('customer')->where('id', $user['id'])->first();
        $this->assertNotEmpty($customer);
        $this->assertEquals('0771234567', $customer['contactNumber']);
    }

    public function testDuplicateEmailIsRejected() {
        $payload = [
            'name' => 'John Doe',
            'email' => $this->testEmail,
            'phone' => '0771234567',
            'address' => '123 Test St',
            'password' => 'StrongPassword123'
        ];
        $this->runRegistrationRequest($payload); // First works
        
        // Mark user as verified to trigger duplicate email rejection
        $this->qb->table('users')->where('email', $this->testEmail)->update(['is_email_verified' => 1]);
        
        $response = $this->runRegistrationRequest($payload); // Second fails
        $this->assertEquals(400, $response['status']);
        $this->assertStringContainsString('already registered', $response['body']['message'] ?? '');
    }

    public function testMissingRequiredFieldsReturns400() {
        $payload = [
            'email' => $this->testEmail,
            'phone' => '0771234567',
            'address' => '123 Test St',
            'password' => 'StrongPassword123'
        ];
        $response = $this->runRegistrationRequest($payload);
        $this->assertEquals(400, $response['status']);
        $this->assertStringContainsString('Missing required field: name', $response['body']['message'] ?? '');
    }

    public function testInvalidEmailFormatReturns400() {
        $payload = [
            'name' => 'John Doe',
            'email' => 'bad-email',
            'phone' => '0771234567',
            'address' => '123 Test St',
            'password' => 'StrongPassword123'
        ];
        $response = $this->runRegistrationRequest($payload);
        $this->assertEquals(400, $response['status']);
        $this->assertStringContainsString('Invalid email format', $response['body']['message'] ?? '');
    }

    public function testInvalidPhoneReturns400() {
        $payload = [
            'name' => 'John Doe',
            'email' => $this->testEmail,
            'phone' => '12345',
            'address' => '123 Test St',
            'password' => 'StrongPassword123'
        ];
        $response = $this->runRegistrationRequest($payload);
        $this->assertEquals(400, $response['status']);
        $this->assertStringContainsString('Invalid phone number format', $response['body']['message'] ?? '');
    }

    public function testWeakPasswordReturns400() {
        $payload = [
            'name' => 'John Doe',
            'email' => $this->testEmail,
            'phone' => '0771234567',
            'address' => '123 Test St',
            'password' => 'password'
        ];
        $response = $this->runRegistrationRequest($payload);
        $this->assertEquals(400, $response['status']);
        $this->assertStringContainsString('Password must be at least 8 characters long', $response['body']['message'] ?? '');
    }
}
