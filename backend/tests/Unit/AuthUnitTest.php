<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../controllers/AuthController.php';

class AuthUnitTest extends TestCase {

    private function getRateLimitKey($email, $ip) {
        $_SERVER['REMOTE_ADDR'] = $ip;
        
        $controller = new AuthController(null);
        $reflection = new ReflectionClass(AuthController::class);
        $method = $reflection->getMethod('getRateLimitKey');
        $method->setAccessible(true);
        
        return $method->invokeArgs($controller, [$email]);
    }

    public function testRateLimitKeyIsConsistentForSameEmailAndIp() {
        $key1 = $this->getRateLimitKey('test@example.com', '192.168.1.1');
        $key2 = $this->getRateLimitKey('test@example.com', '192.168.1.1');
        
        $this->assertEquals($key1, $key2);
    }

    public function testRateLimitKeyDiffersAcrossIps() {
        $key1 = $this->getRateLimitKey('test@example.com', '192.168.1.1');
        $key2 = $this->getRateLimitKey('test@example.com', '192.168.1.2');
        
        $this->assertNotEquals($key1, $key2);
    }
    
    public function testRateLimitKeyDiffersAcrossEmails() {
        $key1 = $this->getRateLimitKey('user1@example.com', '192.168.1.1');
        $key2 = $this->getRateLimitKey('user2@example.com', '192.168.1.1');
        
        $this->assertNotEquals($key1, $key2);
    }

    private function validatePasswordStrength($password) {
        return preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $password) === 1;
    }

    public function testPasswordStrengthRegexAcceptsValidPassword() {
        $this->assertTrue($this->validatePasswordStrength('Password123'));
        $this->assertTrue($this->validatePasswordStrength('StrongP@ssw0rd!'));
    }

    public function testPasswordStrengthRegexRejectsWeakPasswords() {
        $this->assertFalse($this->validatePasswordStrength('password')); // no uppercase, no digit
        $this->assertFalse($this->validatePasswordStrength('PASSWORD123')); // no lowercase
        $this->assertFalse($this->validatePasswordStrength('pass1234')); // no uppercase
        $this->assertFalse($this->validatePasswordStrength('PassWord')); // no digit
    }

    public function testPasswordStrengthRegexRejectsTooShort() {
        $this->assertFalse($this->validatePasswordStrength('Pa1')); // 3 chars
        $this->assertFalse($this->validatePasswordStrength('Passw1')); // 6 chars
    }
}
