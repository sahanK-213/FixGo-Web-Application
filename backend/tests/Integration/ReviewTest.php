<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../database/QueryBuilder.php';

class ReviewTest extends TestCase {
    private $db;
    private $qb;
    private $wrapperPath;

    private $customerEmail   = 'review_customer@fixgo.com';
    private $customer2Email  = 'review_customer2@fixgo.com';
    private $shopEmail       = 'review_shop@fixgo.com';

    private $customerUserId;
    private $customer2UserId;
    private $shopUserId;
    private $serviceRequestId;

    protected function setUp(): void {
        

        $database     = new Database();
        $this->db     = $database->connect();
        $this->qb     = new QueryBuilder($this->db);

        $this->cleanUp();
        $this->createTestData();

        // Build wrapper — no file uploads in ReviewController, no file-diff pattern needed
        $this->wrapperPath = __DIR__ . '/review_wrapper.php';
        file_put_contents($this->wrapperPath,
            "<?php
            require_once '" . realpath(__DIR__ . '/../../config/Database.php')        . "';
            require_once '" . realpath(__DIR__ . '/../../database/QueryBuilder.php')  . "';
            require_once '" . realpath(__DIR__ . '/../../config/RequestValidator.php') . "';
            require_once '" . realpath(__DIR__ . '/../../models/Review.php')           . "';
            require_once '" . realpath(__DIR__ . '/../../controllers/ReviewController.php') . "';

            \$db         = (new Database())->connect();
            \$controller = new ReviewController(\$db);

            \$method = \$_SERVER['HTTP_X_METHOD'] ?? '';
            \$userId = (int)(\$_SERVER['HTTP_X_USER_ID'] ?? 0);
            \$role   = \$_SERVER['HTTP_X_USER_ROLE'] ?? 'customer';
            \$payload = ['user_id' => \$userId, 'role' => \$role];

            if (\$method === 'submit') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$controller->submit(\$payload);
            } elseif (\$method === 'getCustomerReviews') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$controller->getCustomerReviews(\$payload);
            } elseif (\$method === 'getShopReviews') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$controller->getShopReviews();
            }
        ");
    }

    protected function tearDown(): void {
        $this->cleanUp();
        if (file_exists($this->wrapperPath)) {
            @unlink($this->wrapperPath);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function cleanUp(): void {
        // Resolve IDs
        $c1 = $this->qb->table('users')->where('email', $this->customerEmail)->first();
        $c2 = $this->qb->table('users')->where('email', $this->customer2Email)->first();
        $sh = $this->qb->table('users')->where('email', $this->shopEmail)->first();

        // Delete notifications first (FK: service_request_id)
        if ($c1) $this->qb->table('notification')->where('user_id', $c1['id'])->delete();
        if ($c2) $this->qb->table('notification')->where('user_id', $c2['id'])->delete();
        if ($sh) $this->qb->table('notification')->where('user_id', $sh['id'])->delete();

        // Delete reviews (FK: service_request_id → review)
        if ($c1) $this->qb->table('review')->where('customer_id', $c1['id'])->delete();
        if ($c2) $this->qb->table('review')->where('customer_id', $c2['id'])->delete();

        // Delete service requests
        if ($c1) $this->qb->table('servicerequest')->where('customer_id', $c1['id'])->delete();
        if ($c2) $this->qb->table('servicerequest')->where('customer_id', $c2['id'])->delete();

        // Delete profiles then users
        if ($c1) { $this->qb->table('customer')->where('id', $c1['id'])->delete(); $this->qb->table('users')->where('id', $c1['id'])->delete(); }
        if ($c2) { $this->qb->table('customer')->where('id', $c2['id'])->delete(); $this->qb->table('users')->where('id', $c2['id'])->delete(); }
        if ($sh) { $this->qb->table('shop')->where('id', $sh['id'])->delete();     $this->qb->table('users')->where('id', $sh['id'])->delete(); }
    }

    private function createTestData(): void {
        // Customer 1
        $this->qb->table('users')->insert([
            'email'    => $this->customerEmail,
            'password' => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole' => 'customer',
            'isActive' => 1,
        ]);
        $row = $this->qb->table('users')->where('email', $this->customerEmail)->first();
        $this->customerUserId = $row['id'];
        $this->qb->table('customer')->insert(['id' => $this->customerUserId, 'name' => 'Review Customer']);

        // Customer 2 (for cross-customer test)
        $this->qb->table('users')->insert([
            'email'    => $this->customer2Email,
            'password' => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole' => 'customer',
            'isActive' => 1,
        ]);
        $row2 = $this->qb->table('users')->where('email', $this->customer2Email)->first();
        $this->customer2UserId = $row2['id'];
        $this->qb->table('customer')->insert(['id' => $this->customer2UserId, 'name' => 'Other Customer']);

        // Shop
        $this->qb->table('users')->insert([
            'email'    => $this->shopEmail,
            'password' => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole' => 'shop_owner',
            'isActive' => 1,
        ]);
        $shopRow = $this->qb->table('users')->where('email', $this->shopEmail)->first();
        $this->shopUserId = $shopRow['id'];
        $this->qb->table('shop')->insert(['id' => $this->shopUserId, 'name' => 'Review Shop']);

        // Completed service request for Customer 1
        $this->qb->table('servicerequest')->insert([
            'customer_id' => $this->customerUserId,
            'shop_id'     => $this->shopUserId,
            'status'      => 'Completed',
        ]);
        $req = $this->qb->table('servicerequest')
            ->where('customer_id', $this->customerUserId)->first();
        $this->serviceRequestId = $req['id'];
    }

    private function callReview(string $method, int $userId, string $role, $payload = null, string $queryString = ''): array {
        $env = "HTTP_X_METHOD={$method} HTTP_X_USER_ID={$userId} HTTP_X_USER_ROLE={$role}"
             . " REDIRECT_STATUS=1 SCRIPT_FILENAME=" . escapeshellarg($this->wrapperPath)
             . ($queryString ? " QUERY_STRING=" . escapeshellarg($queryString) : '');

        if ($payload !== null) {
            $json   = json_encode($payload);
            $len    = strlen($json);
            $cmd    = "echo " . escapeshellarg($json) . " | {$env} CONTENT_TYPE=application/json CONTENT_LENGTH={$len} php-cgi 2>/dev/null";
        } else {
            $cmd    = "{$env} REQUEST_METHOD=GET php-cgi 2>/dev/null";
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

    // ── Tests ────────────────────────────────────────────────────────────────

    /**
     * Plan: testCustomerCanSubmitReviewAfterCompletion
     * Completed request → review created (HTTP 200, success: true)
     */
    public function testCustomerCanSubmitReviewAfterCompletion(): void {
        $res = $this->callReview('submit', $this->customerUserId, 'customer', [
            'service_request_id' => $this->serviceRequestId,
            'shop_id'            => $this->shopUserId,
            'rating'             => 5,
            'comment'            => 'Excellent work!',
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);
        $this->assertArrayHasKey('review_id', $res['body']);

        // Verify DB record
        $review = $this->qb->table('review')
            ->where('customer_id', $this->customerUserId)->first();
        $this->assertNotEmpty($review);
        $this->assertEquals(5, (int)$review['rating']);
    }

    /**
     * Plan: testReviewBlockedIfRequestNotCompleted
     * Pending status → HTTP 400
     */
    public function testReviewBlockedIfRequestNotCompleted(): void {
        // Insert a Pending request
        $this->qb->table('servicerequest')->insert([
            'customer_id' => $this->customer2UserId,
            'shop_id'     => $this->shopUserId,
            'status'      => 'Pending',
        ]);
        $req = $this->qb->table('servicerequest')
            ->where('customer_id', $this->customer2UserId)->first();

        $res = $this->callReview('submit', $this->customer2UserId, 'customer', [
            'service_request_id' => $req['id'],
            'shop_id'            => $this->shopUserId,
            'rating'             => 4,
            'comment'            => 'Too soon.',
        ]);

        $this->assertEquals(400, $res['status']);
        $this->assertStringContainsString('completed', strtolower($res['body']['message'] ?? ''));
    }

    /**
     * Plan: testReviewBlockedIfWrongCustomer
     * Another customer's completed request → HTTP 403
     */
    public function testReviewBlockedIfWrongCustomer(): void {
        // Customer 2 tries to review Customer 1's request
        $res = $this->callReview('submit', $this->customer2UserId, 'customer', [
            'service_request_id' => $this->serviceRequestId,
            'shop_id'            => $this->shopUserId,
            'rating'             => 3,
            'comment'            => 'Not mine.',
        ]);

        $this->assertEquals(403, $res['status']);
        $this->assertStringContainsString('authorized', strtolower($res['body']['message'] ?? ''));
    }

    /**
     * Plan: testDuplicateReviewBlocked
     * Second review for the same request → HTTP 409
     */
    public function testDuplicateReviewBlocked(): void {
        // Submit first review
        $this->callReview('submit', $this->customerUserId, 'customer', [
            'service_request_id' => $this->serviceRequestId,
            'shop_id'            => $this->shopUserId,
            'rating'             => 4,
            'comment'            => 'Good.',
        ]);

        // Submit duplicate
        $res = $this->callReview('submit', $this->customerUserId, 'customer', [
            'service_request_id' => $this->serviceRequestId,
            'shop_id'            => $this->shopUserId,
            'rating'             => 5,
            'comment'            => 'Duplicate.',
        ]);

        $this->assertEquals(409, $res['status']);
        $this->assertStringContainsString('already reviewed', strtolower($res['body']['message'] ?? ''));
    }

    /**
     * Plan: testRatingMustBe1To5
     * rating=6 → HTTP 400 with rating message.
     * rating=0 is treated as falsy by the controller (missing field path) → also HTTP 400.
     */
    public function testRatingMustBe1To5(): void {
        // rating=6 hits the explicit "Rating must be between 1 and 5" guard
        $res = $this->callReview('submit', $this->customerUserId, 'customer', [
            'service_request_id' => $this->serviceRequestId,
            'shop_id'            => $this->shopUserId,
            'rating'             => 6,
            'comment'            => 'Too high.',
        ]);
        $this->assertEquals(400, $res['status'], 'Expected 400 for rating=6');
        $this->assertStringContainsString('rating', strtolower($res['body']['message'] ?? ''));

        // rating=0 is cast to (int)0 which is falsy → hits "Missing required fields" guard
        $res0 = $this->callReview('submit', $this->customerUserId, 'customer', [
            'service_request_id' => $this->serviceRequestId,
            'shop_id'            => $this->shopUserId,
            'rating'             => 0,
            'comment'            => 'Zero rating.',
        ]);
        $this->assertEquals(400, $res0['status'], 'Expected 400 for rating=0');
    }

    /**
     * Plan: testCommentOver255CharsRejected
     * 256-char comment → HTTP 400
     */
    public function testCommentOver255CharsRejected(): void {
        $res = $this->callReview('submit', $this->customerUserId, 'customer', [
            'service_request_id' => $this->serviceRequestId,
            'shop_id'            => $this->shopUserId,
            'rating'             => 5,
            'comment'            => str_repeat('A', 256),
        ]);

        $this->assertEquals(400, $res['status']);
        $this->assertStringContainsString('255', $res['body']['message'] ?? '');
    }

    /**
     * Plan: testGetShopReviewsReturnsAverageRating
     * Returns average_rating and total_reviews
     */
    public function testGetShopReviewsReturnsAverageRating(): void {
        // Seed a review directly so we don't depend on submit flow
        $this->qb->table('review')->insert([
            'customer_id'        => $this->customerUserId,
            'shop_id'            => $this->shopUserId,
            'service_request_id' => $this->serviceRequestId,
            'rating'             => 5,
            'comment'            => 'Direct seed',
        ]);

        $res = $this->callReview(
            'getShopReviews',
            $this->customerUserId,
            'customer',
            null,
            'shop_id=' . $this->shopUserId
        );

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);
        $this->assertArrayHasKey('average_rating', $res['body']);
        $this->assertArrayHasKey('total_reviews', $res['body']);
        $this->assertEquals(5.0, (float)$res['body']['average_rating']);
        $this->assertEquals(1, (int)$res['body']['total_reviews']);
    }
}
