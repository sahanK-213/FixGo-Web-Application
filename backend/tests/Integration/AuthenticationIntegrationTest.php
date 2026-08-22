<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../database/QueryBuilder.php';

class AuthenticationIntegrationTest extends TestCase {
    private $db;
    private $qb;
    private $testEmail = 'integration_test_user@fixgo.com';
    private $testPassword = 'Password123';
    private $testUserId;
    private $wrapperPath;

    protected function setUp(): void {
        putenv('JWT_SECRET=supersecret1234567890abcdef');
        
        $database = new Database();
        $this->db = $database->connect();
        $this->qb = new QueryBuilder($this->db);
        
        $this->qb->table('users')->where('email', $this->testEmail)->delete();
        
        // Ensure rate limits are cleared
        $rateLimitFile = realpath(__DIR__ . '/../../uploads') . '/login_attempts.json';
        if (file_exists($rateLimitFile)) {
            @unlink($rateLimitFile);
        }

        $this->wrapperPath = __DIR__ . '/login_wrapper.php';
        file_put_contents($this->wrapperPath, "<?php
            require_once '" . realpath(__DIR__ . '/../../config/Database.php') . "';
            require_once '" . realpath(__DIR__ . '/../../controllers/AuthController.php') . "';
            require_once '" . realpath(__DIR__ . '/../../config/RequestValidator.php') . "';
            require_once '" . realpath(__DIR__ . '/../../database/QueryBuilder.php') . "';
            \$db = (new Database())->connect();
            \$controller = new AuthController(\$db);
            \$method = \$_SERVER['HTTP_X_METHOD'] ?? 'login';
            if (\$method === 'login') \$controller->login();
            elseif (\$method === 'forgotPassword') \$controller->forgotPassword();
            elseif (\$method === 'verifyResetOtp') \$controller->verifyResetOtp();
            elseif (\$method === 'resetPassword') \$controller->resetPassword();
            elseif (\$method === 'resendOtp') \$controller->resendOtp();
        ");
    }

    protected function tearDown(): void {
        if ($this->testUserId) {
            $this->qb->table('users')->where('id', $this->testUserId)->delete();
        }
        
        $rateLimitFile = realpath(__DIR__ . '/../../uploads') . '/login_attempts.json';
        if (file_exists($rateLimitFile)) {
            @unlink($rateLimitFile);
        }

        if (file_exists($this->wrapperPath)) {
            @unlink($this->wrapperPath);
        }
    }

    private function createTestUser($isActive = 1, $isVerified = 1, $role = 'customer') {
        $this->qb->table('users')->insert([
            'email' => $this->testEmail,
            'password' => password_hash($this->testPassword, PASSWORD_BCRYPT),
            'userRole' => $role,
            'isActive' => $isActive,
            'is_email_verified' => $isVerified
        ]);
        
        $user = $this->qb->table('users')->where('email', $this->testEmail)->first();
        $this->testUserId = $user['id'];
        return $user;
    }

    private function runAuthRequest($method, $payload) {
        $payloadStr = json_encode($payload);
        $contentLength = strlen($payloadStr);
        $cmd = "echo " . escapeshellarg($payloadStr) . " | SCRIPT_FILENAME=" . escapeshellarg($this->wrapperPath) . " REDIRECT_STATUS=1 REQUEST_METHOD=POST CONTENT_TYPE=application/json CONTENT_LENGTH={$contentLength} HTTP_X_METHOD={$method} JWT_SECRET=supersecret1234567890abcdef php-cgi 2>/dev/null";
        
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

    public function testUnverifiedEmailCannotLogin() {
        $this->createTestUser(1, 0, 'customer');
        
        $response = $this->runAuthRequest('login', ['email' => $this->testEmail, 'password' => $this->testPassword]);
        
        $this->assertEquals(403, $response['status']);
        $this->assertStringContainsString('Please verify your email', $response['body']['message'] ?? '');
    }

    public function testVerifiedActiveUserCanLogin() {
        $this->createTestUser(1, 1, 'customer');
        
        $response = $this->runAuthRequest('login', ['email' => $this->testEmail, 'password' => $this->testPassword]);
        
        $this->assertEquals(200, $response['status']);
        $this->assertArrayHasKey('token', $response['body']);
        $this->assertEquals('customer', $response['body']['role']);
    }

    public function testInactiveUserBlocked() {
        $this->createTestUser(0, 1, 'customer');
        
        $response = $this->runAuthRequest('login', ['email' => $this->testEmail, 'password' => $this->testPassword]);
        
        $this->assertEquals(403, $response['status']);
        $this->assertStringContainsString('inactive', strtolower($response['body']['message'] ?? ''));
    }

    public function testInvalidPasswordRejected() {
        $this->createTestUser(1, 1, 'customer');
        
        $response = $this->runAuthRequest('login', ['email' => $this->testEmail, 'password' => 'WrongPassword123']);
        
        $this->assertEquals(401, $response['status']);
        $this->assertStringContainsString('Invalid email or password', $response['body']['message'] ?? '');
    }

    public function testRateLimitBlocksBruteForce() {
        $this->createTestUser(1, 1, 'customer');
        
        // 5 bad attempts
        for ($i = 0; $i < 5; $i++) {
            $res = $this->runAuthRequest('login', ['email' => $this->testEmail, 'password' => 'WrongPassword123']);
            $this->assertEquals(401, $res['status']);
        }
        
        // 6th attempt (even with correct password) should be blocked by rate limiting
        $response = $this->runAuthRequest('login', ['email' => $this->testEmail, 'password' => $this->testPassword]);
        
        $this->assertEquals(429, $response['status']);
        $this->assertStringContainsString('Too many login attempts', $response['body']['message'] ?? '');
    }

    public function testPasswordResetOtpFlow() {
        $this->createTestUser(1, 1, 'customer');
        
        // 1. forgotPassword
        $res1 = $this->runAuthRequest('forgotPassword', ['email' => $this->testEmail]);
        $this->assertEquals(200, $res1['status']);
        
        // Retrieve OTP from DB
        $user = $this->qb->table('users')->where('email', $this->testEmail)->first();
        $otp = $user['reset_token'];
        $this->assertNotEmpty($otp);
        
        // 2. verifyResetOtp
        $res2 = $this->runAuthRequest('verifyResetOtp', ['otp' => $otp]);
        $this->assertEquals(200, $res2['status']);
        
        // 3. resetPassword
        $res3 = $this->runAuthRequest('resetPassword', ['otp' => $otp, 'password' => 'NewStrongPass123']);
        $this->assertEquals(200, $res3['status']);
        
        // 4. Verify login with new password
        $res4 = $this->runAuthRequest('login', ['email' => $this->testEmail, 'password' => 'NewStrongPass123']);
        $this->assertEquals(200, $res4['status']);
    }

    public function testExpiredOtpIsRejected() {
        $this->createTestUser(1, 1, 'customer');
        $otp = '123456';
        
        // Set expired OTP
        $this->qb->table('users')->where('email', $this->testEmail)->update([
            'reset_token' => $otp,
            'reset_token_expiry' => date('Y-m-d H:i:s', time() - 3600) // 1 hour ago
        ]);
        
        $res = $this->runAuthRequest('resetPassword', ['otp' => $otp, 'password' => 'NewStrongPass123']);
        $this->assertEquals(400, $res['status']);
        $this->assertStringContainsString('OTP has expired', $res['body']['message'] ?? '');
    }

    public function testResendOtpUpdatesDatabase() {
        // 1. Create an unverified user
        $this->createTestUser(1, 0, 'customer');

        // 2. Fetch the old verification token and expiry to compare later
        $oldUser = $this->qb->table('users')->where('email', $this->testEmail)->first();
        $oldToken = $oldUser['verification_token'];
        $oldExpiry = $oldUser['token_expiry'];

        // Sleep briefly to ensure timestamps would differ if we relied purely on timestamp precision
        usleep(1000000); // 1 second

        // 3. Hit the resendOtp endpoint
        $response = $this->runAuthRequest('resendOtp', ['email' => $this->testEmail]);
        
        // 4. Assert success response (Email failure is swallowed by try/catch in EmailSender)
        $this->assertEquals(200, $response['status']);
        $this->assertStringContainsString('A new OTP has been sent', $response['body']['message'] ?? '');

        // 5. Query the database to verify the token actually changed
        $newUser = $this->qb->table('users')->where('email', $this->testEmail)->first();
        
        $this->assertNotEquals($oldToken, $newUser['verification_token'], "The OTP token should be regenerated.");
        $this->assertNotNull($newUser['token_expiry'], "Token expiry should be set.");
        $this->assertNotEquals($oldExpiry, $newUser['token_expiry'], "Token expiry timestamp should be updated.");
    }

    public function testResendOtpRejectsVerifiedUser() {
        // Create a verified user
        $this->createTestUser(1, 1, 'customer');

        $response = $this->runAuthRequest('resendOtp', ['email' => $this->testEmail]);
        
        $this->assertEquals(400, $response['status']);
        $this->assertStringContainsString('already verified', $response['body']['message'] ?? '');
    }
}
