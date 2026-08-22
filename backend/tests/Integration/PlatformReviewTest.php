<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../database/QueryBuilder.php';

class PlatformReviewTest extends TestCase {
    private $db;
    private $qb;
    private $wrapperPath;

    private $customerEmail = 'review_customer@fixgo.com';
    private $customerUserId;

    protected function setUp(): void {
        putenv('JWT_SECRET=supersecret1234567890abcdef');

        $database = new Database();
        $this->db = $database->connect();
        $this->qb = new QueryBuilder($this->db);

        $this->cleanUp();
        $this->createTestData();

        $this->wrapperPath = __DIR__ . '/platform_review_wrapper.php';
        file_put_contents($this->wrapperPath,
            "<?php
            require_once '" . realpath(__DIR__ . '/../../config/Database.php')            . "';
            require_once '" . realpath(__DIR__ . '/../../database/QueryBuilder.php')      . "';
            require_once '" . realpath(__DIR__ . '/../../config/RequestValidator.php')    . "';
            require_once '" . realpath(__DIR__ . '/../../models/PlatformReview.php')      . "';
            require_once '" . realpath(__DIR__ . '/../../controllers/PlatformReviewController.php') . "';

            \$db = (new Database())->connect();
            \$method = \$_SERVER['HTTP_X_METHOD'] ?? '';
            \$userId = (int)(\$_SERVER['HTTP_X_USER_ID'] ?? 0);
            \$role   = \$_SERVER['HTTP_X_USER_ROLE'] ?? 'customer';
            \$payload = ['user_id' => \$userId, 'role' => \$role];

            \$ctrl = new PlatformReviewController(\$db);

            if (\$method === 'getReviews') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$ctrl->getReviews();
            } elseif (\$method === 'submitReview') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$ctrl->submitReview(\$payload);
            }
        ");
    }

    protected function tearDown(): void {
        $this->cleanUp();
        if (file_exists($this->wrapperPath)) {
            @unlink($this->wrapperPath);
        }
    }

    private function cleanUp(): void {
        $c = $this->qb->table('users')->where('email', $this->customerEmail)->first();
        if ($c) {
            $this->qb->table('platform_reviews')->where('user_id', $c['id'])->delete();
            $this->qb->table('customer')->where('id', $c['id'])->delete();
            $this->qb->table('users')->where('id', $c['id'])->delete();
        }
    }

    private function createTestData(): void {
        $this->qb->table('users')->insert([
            'email'             => $this->customerEmail,
            'password'          => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole'          => 'customer',
            'isActive'          => 1,
            'is_email_verified' => 1,
        ]);
        $c = $this->qb->table('users')->where('email', $this->customerEmail)->first();
        $this->customerUserId = $c['id'];
        $this->qb->table('customer')->insert([
            'id' => $this->customerUserId, 
            'name' => 'Review Customer',
            'address' => 'No 1, Main St, Colombo'
        ]);
    }

    private function call(string $method, int $userId = 0, string $role = '', $payload = null): array {
        $env = "HTTP_X_METHOD={$method} REDIRECT_STATUS=1 SCRIPT_FILENAME=" . escapeshellarg($this->wrapperPath);
        if ($userId > 0) {
            $env .= " HTTP_X_USER_ID={$userId} HTTP_X_USER_ROLE={$role}";
        }

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

    /**
     * Plan: testLoggedInUserCanSubmitPlatformReview
     * Valid rating + comment → HTTP 201
     */
    public function testLoggedInUserCanSubmitPlatformReview(): void {
        $res = $this->call('submitReview', $this->customerUserId, 'customer', [
            'rating'  => 5,
            'comment' => 'Great platform!',
        ]);

        $this->assertEquals(201, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);

        // Verify in DB
        $review = $this->qb->table('platform_reviews')->where('user_id', $this->customerUserId)->first();
        $this->assertNotEmpty($review);
        $this->assertEquals(5, $review['rating']);
    }

    /**
     * Plan: testPlatformReviewRatingMustBe1To5
     * rating=0 and rating=6 → HTTP 400
     */
    public function testPlatformReviewRatingMustBe1To5(): void {
        $res0 = $this->call('submitReview', $this->customerUserId, 'customer', [
            'rating'  => 0,
            'comment' => 'Great platform!',
        ]);
        $this->assertEquals(400, $res0['status']);
        $this->assertStringContainsString('Rating', $res0['body']['message'] ?? '');

        $res6 = $this->call('submitReview', $this->customerUserId, 'customer', [
            'rating'  => 6,
            'comment' => 'Great platform!',
        ]);
        $this->assertEquals(400, $res6['status']);
    }

    /**
     * Plan: testPlatformReviewRequiresComment
     * Empty comment → HTTP 400
     */
    public function testPlatformReviewRequiresComment(): void {
        $res = $this->call('submitReview', $this->customerUserId, 'customer', [
            'rating'  => 4,
            'comment' => '',
        ]);

        $this->assertEquals(400, $res['status']);
        $this->assertStringContainsString('comment', strtolower($res['body']['message'] ?? ''));
    }

    /**
     * Plan: testGetPlatformReviewsReturnsPublicList
     * Returns array with name, stars, text
     */
    public function testGetPlatformReviewsReturnsPublicList(): void {
        // Seed a review first
        $this->qb->table('platform_reviews')->insert([
            'user_id' => $this->customerUserId,
            'rating' => 4,
            'comment' => 'Very useful app.'
        ]);

        $res = $this->call('getReviews'); // Public call, no auth headers needed

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);
        $this->assertIsArray($res['body']['data']);
        $this->assertNotEmpty($res['body']['data']);

        $first = $res['body']['data'][0];
        $this->assertArrayHasKey('name', $first);
        $this->assertArrayHasKey('stars', $first);
        $this->assertArrayHasKey('text', $first);
        $this->assertArrayHasKey('location', $first);
    }
}
