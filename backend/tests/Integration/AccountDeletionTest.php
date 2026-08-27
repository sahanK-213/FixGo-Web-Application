<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../database/QueryBuilder.php';

class AccountDeletionTest extends TestCase {
    private $db;
    private $qb;
    private $testEmail = 'delete_me_test@fixgo.com';
    private $wrapperPathCustomer;
    private $wrapperPathShop;

    protected function setUp(): void {
        
        
        $database = new Database();
        $this->db = $database->connect();
        $this->qb = new QueryBuilder($this->db);
        
        $this->cleanup();

        $this->wrapperPathCustomer = __DIR__ . '/delete_acc_wrapper_c.php';
        file_put_contents($this->wrapperPathCustomer, "<?php
            \$_SERVER['HTTP_AUTHORIZATION'] = \$_SERVER['HTTP_AUTHORIZATION'] ?? '';
            require_once '" . realpath(__DIR__ . '/../../api/customer/deleteAccount.php') . "';
        ");
        
        $this->wrapperPathShop = __DIR__ . '/delete_acc_wrapper_s.php';
        file_put_contents($this->wrapperPathShop, "<?php
            \$_SERVER['HTTP_AUTHORIZATION'] = \$_SERVER['HTTP_AUTHORIZATION'] ?? '';
            require_once '" . realpath(__DIR__ . '/../../api/shop/deleteAccount.php') . "';
        ");
    }

    protected function tearDown(): void {
        $this->cleanup();
        @unlink($this->wrapperPathCustomer);
        @unlink($this->wrapperPathShop);
    }

    private function cleanup() {
        // Find users starting with deleted_..._testEmail
        $users = $this->qb->table('users')->where('email', 'like', '%' . $this->testEmail)->get();
        foreach ($users as $u) {
            $this->qb->table('customer')->where('id', $u['id'])->delete();
            $this->qb->table('shop')->where('id', $u['id'])->delete();
            $this->qb->table('users')->where('id', $u['id'])->delete();
        }
    }

    private function createTestUser($role) {
        $userId = $this->qb->table('users')->insertGetId([
            'email' => $this->testEmail,
            'userRole' => $role,
            'password' => password_hash('password123', PASSWORD_DEFAULT),
            'isActive' => 1,
            'is_email_verified' => 1
        ]);

        if ($role === 'customer') {
            $this->qb->table('customer')->insert([
                'id' => $userId,
                'name' => 'Test Customer',
                'contactNumber' => '0770000000',
                'address' => 'Test Address'
            ]);
        } else {
            $this->qb->table('shop')->insert([
                'id' => $userId,
                'name' => 'Test Shop',
                'contactNumber' => '0770000000',
                'address' => 'Test Address',
                'owner' => 'Test Owner',
                'isAvailable' => 1,
                'openTime' => '08:00:00',
                'closeTime' => '17:00:00'
            ]);
        }

        return $userId;
    }

    private function generateJwt($userId, $email, $role) {
        require_once __DIR__ . '/../../config/JwtHandler.php';
        $jwtHandler = new JwtHandler();
        return $jwtHandler->generate([
            'user_id' => $userId,
            'email' => $email,
            'role' => $role
        ]);
    }

    private function runDeleteRequest($wrapperPath, $jwt) {
        $payload = json_encode([]);
        $tmpBodyFile = sys_get_temp_dir() . '/delete_acc_' . uniqid() . '.tmp';
        file_put_contents($tmpBodyFile, $payload);
        
        $cmd = "cat " . escapeshellarg($tmpBodyFile) . " | SCRIPT_FILENAME=" . escapeshellarg($wrapperPath) . " REDIRECT_STATUS=1 REQUEST_METHOD=POST CONTENT_TYPE=\"application/json\" HTTP_AUTHORIZATION=\"Bearer {$jwt}\" php-cgi 2>/dev/null";
        
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

    public function testCustomerAccountDeletion() {
        $userId = $this->createTestUser('customer');
        $jwt = $this->generateJwt($userId, $this->testEmail, 'customer');

        $res = $this->runDeleteRequest($this->wrapperPathCustomer, $jwt);
        $this->assertEquals(200, $res['status']);

        $user = $this->qb->table('users')->where('id', $userId)->first();
        $this->assertEquals(0, $user['isActive']);
        $this->assertStringStartsWith('deleted_', $user['email']);
        $this->assertStringContainsString($this->testEmail, $user['email']);
    }

    public function testShopAccountDeletion() {
        $userId = $this->createTestUser('shop_owner');
        $jwt = $this->generateJwt($userId, $this->testEmail, 'shop_owner');

        $res = $this->runDeleteRequest($this->wrapperPathShop, $jwt);
        $this->assertEquals(200, $res['status']);

        $user = $this->qb->table('users')->where('id', $userId)->first();
        $this->assertEquals(0, $user['isActive']);
        $this->assertStringStartsWith('deleted_', $user['email']);
    }
}
