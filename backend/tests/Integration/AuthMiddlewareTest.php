<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/JwtHandler.php';

class AuthMiddlewareTest extends TestCase {

    protected function setUp(): void {
        
    }

    private function runIsolatedAuth($token, $requiredRole = '') {
        $middlewarePath = realpath(__DIR__ . '/../../config/AuthMiddleware.php');
        
        $authHeader = $token ? "Bearer {$token}" : '';
        $roleParam = $requiredRole ? "['{$requiredRole}']" : "[]";
        
        // We override $_SERVER to ensure getallheaders() works even if php-cgi strips it
        // Note: getallheaders() in php-cgi usually reads from $_SERVER['HTTP_*']
        $code = "<?php
            \$_SERVER['HTTP_AUTHORIZATION'] = '{$authHeader}';
            // Polyfill getallheaders if needed or override the way it's fetched by mocking the HTTP_AUTHORIZATION
            require '{$middlewarePath}';
            
            // To ensure AuthMiddleware uses our token, we will simulate the header lookup
            // Wait, getallheaders() cannot be overridden. But php-cgi populates it from HTTP_AUTHORIZATION.
            AuthMiddleware::authenticate({$roleParam});
            echo 'SUCCESS';
        ";
        
        $actualSecret = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET');
        $cmd = "echo " . escapeshellarg($code) . " | REDIRECT_STATUS=1 JWT_SECRET=" . escapeshellarg($actualSecret) . " HTTP_AUTHORIZATION=" . escapeshellarg($authHeader) . " php-cgi 2>/dev/null";
        $output = shell_exec($cmd);
        
        // Parse HTTP Status code
        if (preg_match('/Status: (\d+)/i', $output, $matches)) {
            $status = (int)$matches[1];
        } else {
            $status = 200;
        }
        
        return [
            'status' => $status,
            'output' => $output,
            'success' => strpos($output, 'SUCCESS') !== false
        ];
    }

    public function testMissingTokenBlocked() {
        $result = $this->runIsolatedAuth(null);
        $this->assertEquals(401, $result['status']);
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Authorization token missing', $result['output']);
    }

    public function testInvalidTokenBlocked() {
        $result = $this->runIsolatedAuth('ey12345.badtoken.67890');
        $this->assertEquals(401, $result['status']);
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Invalid or expired token', $result['output']);
    }

    public function testValidTokenAllowsAccess() {
        $jwtHandler = new JwtHandler();
        $token = $jwtHandler->generate([
            'user_id' => 1,
            'email' => 'customer@test.com',
            'role' => 'customer'
        ]);
        
        $result = $this->runIsolatedAuth($token, 'customer');
        $this->assertEquals(200, $result['status']);
        $this->assertTrue($result['success']);
    }

    public function testRoleMismatchBlocked() {
        $jwtHandler = new JwtHandler();
        $token = $jwtHandler->generate([
            'user_id' => 1,
            'email' => 'customer@test.com',
            'role' => 'customer' 
        ]);
        
        // Authenticate with wrong role requirement
        $result = $this->runIsolatedAuth($token, 'shop_owner');
        
        $this->assertEquals(403, $result['status']);
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Forbidden. You do not have the required permissions', $result['output']);
    }
    public function testCustomerTokenCannotAccessAdminRoute() {
        $jwtHandler = new JwtHandler();
        $token = $jwtHandler->generate([
            'user_id' => 1,
            'email' => 'customer@test.com',
            'role' => 'customer' 
        ]);
        
        $result = $this->runIsolatedAuth($token, 'admin');
        
        $this->assertEquals(403, $result['status']);
        $this->assertFalse($result['success']);
    }

    public function testShopOwnerTokenCannotAccessAdminRoute() {
        $jwtHandler = new JwtHandler();
        $token = $jwtHandler->generate([
            'user_id' => 2,
            'email' => 'shop@test.com',
            'role' => 'shop_owner' 
        ]);
        
        $result = $this->runIsolatedAuth($token, 'admin');
        
        $this->assertEquals(403, $result['status']);
        $this->assertFalse($result['success']);
    }

    public function testAdminTokenCanAccessAdminRoute() {
        $jwtHandler = new JwtHandler();
        $token = $jwtHandler->generate([
            'user_id' => 3,
            'email' => 'admin@test.com',
            'role' => 'admin' 
        ]);
        
        $result = $this->runIsolatedAuth($token, 'admin');
        
        $this->assertEquals(200, $result['status']);
        $this->assertTrue($result['success']);
    }

    public function testCustomerTokenAllowedOnCustomerRoute() {
        $jwtHandler = new JwtHandler();
        $token = $jwtHandler->generate([
            'user_id' => 1,
            'email' => 'customer@test.com',
            'role' => 'customer' 
        ]);
        
        $result = $this->runIsolatedAuth($token, 'customer');
        
        $this->assertEquals(200, $result['status']);
        $this->assertTrue($result['success']);
    }
}
