<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../database/QueryBuilder.php';

class NotificationTest extends TestCase {
    private $db;
    private $qb;
    private $wrapperPath;

    private $customerEmail = 'notif_customer@fixgo.com';
    private $shopEmail     = 'notif_shop@fixgo.com';
    private $customerUserId;
    private $shopUserId;
    private $serviceRequestId;
    private $notificationId;

    protected function setUp(): void {
        

        $database     = new Database();
        $this->db     = $database->connect();
        $this->qb     = new QueryBuilder($this->db);

        $this->cleanUp();
        $this->createTestData();

        $this->wrapperPath = __DIR__ . '/notification_wrapper.php';
        file_put_contents($this->wrapperPath,
            "<?php
            require_once '" . realpath(__DIR__ . '/../../config/Database.php')        . "';
            require_once '" . realpath(__DIR__ . '/../../database/QueryBuilder.php')  . "';
            require_once '" . realpath(__DIR__ . '/../../config/RequestValidator.php') . "';
            require_once '" . realpath(__DIR__ . '/../../models/Notification.php')    . "';
            require_once '" . realpath(__DIR__ . '/../../controllers/NotificationController.php') . "';

            \$db         = (new Database())->connect();
            \$controller = new NotificationController(\$db);

            \$method  = \$_SERVER['HTTP_X_METHOD'] ?? '';
            \$userId  = (int)(\$_SERVER['HTTP_X_USER_ID'] ?? 0);
            \$role    = \$_SERVER['HTTP_X_USER_ROLE'] ?? 'customer';
            \$payload = ['user_id' => \$userId, 'role' => \$role];

            if (\$method === 'getAll') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$controller->getAll(\$payload);
            } elseif (\$method === 'markRead') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$controller->markRead(\$payload);
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
        $c  = $this->qb->table('users')->where('email', $this->customerEmail)->first();
        $sh = $this->qb->table('users')->where('email', $this->shopEmail)->first();

        // Notifications first (FK on service_request_id)
        if ($c)  $this->qb->table('notification')->where('user_id', $c['id'])->delete();
        if ($sh) $this->qb->table('notification')->where('user_id', $sh['id'])->delete();

        // Service requests
        if ($c)  $this->qb->table('servicerequest')->where('customer_id', $c['id'])->delete();

        // Profiles then users
        if ($c)  { $this->qb->table('customer')->where('id', $c['id'])->delete(); $this->qb->table('users')->where('id', $c['id'])->delete(); }
        if ($sh) { $this->qb->table('shop')->where('id', $sh['id'])->delete();    $this->qb->table('users')->where('id', $sh['id'])->delete(); }
    }

    private function createTestData(): void {
        // Customer
        $this->qb->table('users')->insert([
            'email'    => $this->customerEmail,
            'password' => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole' => 'customer',
            'isActive' => 1,
        ]);
        $c = $this->qb->table('users')->where('email', $this->customerEmail)->first();
        $this->customerUserId = $c['id'];
        $this->qb->table('customer')->insert(['id' => $this->customerUserId, 'name' => 'Notif Customer']);

        // Shop
        $this->qb->table('users')->insert([
            'email'    => $this->shopEmail,
            'password' => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole' => 'shop_owner',
            'isActive' => 1,
        ]);
        $sh = $this->qb->table('users')->where('email', $this->shopEmail)->first();
        $this->shopUserId = $sh['id'];
        $this->qb->table('shop')->insert(['id' => $this->shopUserId, 'name' => 'Notif Shop']);

        // Service request (needed as FK for notification)
        $this->qb->table('servicerequest')->insert([
            'customer_id' => $this->customerUserId,
            'shop_id'     => $this->shopUserId,
            'status'      => 'Accepted',
        ]);
        $req = $this->qb->table('servicerequest')
            ->where('customer_id', $this->customerUserId)->first();
        $this->serviceRequestId = $req['id'];

        // Seed 2 unread notifications for the customer
        $this->qb->table('notification')->insert([
            'user_id'            => $this->customerUserId,
            'service_request_id' => $this->serviceRequestId,
            'type'               => 'Accepted',
            'title'              => 'Request Accepted',
            'message'            => 'Your request was accepted.',
            'isRead'             => 0,
        ]);
        $n = $this->qb->table('notification')
            ->where('user_id', $this->customerUserId)->first();
        $this->notificationId = $n['id'];

        // Second notification (for mark-all test)
        $this->qb->table('notification')->insert([
            'user_id'            => $this->customerUserId,
            'service_request_id' => $this->serviceRequestId,
            'type'               => 'CustomerConfirmed',
            'title'              => 'Booking Confirmed',
            'message'            => 'You confirmed the booking.',
            'isRead'             => 0,
        ]);
    }

    private function callNotif(string $method, int $userId, string $role, $payload = null): array {
        $env = "HTTP_X_METHOD={$method} HTTP_X_USER_ID={$userId} HTTP_X_USER_ROLE={$role}"
             . " REDIRECT_STATUS=1 SCRIPT_FILENAME=" . escapeshellarg($this->wrapperPath);

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

    // ── Tests ────────────────────────────────────────────────────────────────

    /**
     * Plan: testGetNotificationsReturnsListForUser
     * Authenticated user → notifications array
     */
    public function testGetNotificationsReturnsListForUser(): void {
        $res = $this->callNotif('getAll', $this->customerUserId, 'customer');

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);
        $this->assertIsArray($res['body']['data']);
        $this->assertGreaterThanOrEqual(2, count($res['body']['data']));

        // Each notification must have the expected fields
        $first = $res['body']['data'][0];
        $this->assertArrayHasKey('id', $first);
        $this->assertArrayHasKey('title', $first);
        $this->assertArrayHasKey('isRead', $first);
    }

    /**
     * Plan: testMarkSingleNotificationRead
     * notification_id sent → marked isRead=1 in DB
     */
    public function testMarkSingleNotificationRead(): void {
        $res = $this->callNotif('markRead', $this->customerUserId, 'customer', [
            'notification_id' => $this->notificationId,
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);

        // Verify DB
        $n = $this->qb->table('notification')->where('id', $this->notificationId)->first();
        $this->assertEquals(1, (int)$n['isRead']);
    }

    /**
     * Plan: testMarkAllNotificationsRead
     * mark_all: true → all unread notifications for user marked isRead=1
     */
    public function testMarkAllNotificationsRead(): void {
        $res = $this->callNotif('markRead', $this->customerUserId, 'customer', [
            'mark_all' => true,
        ]);

        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);

        // Verify all are now read in DB
        $unread = $this->qb->table('notification')
            ->where('user_id', $this->customerUserId)
            ->where('isRead', 0)
            ->get();
        $this->assertEmpty($unread);
    }

    /**
     * Plan: testMarkReadRequiresNotificationIdOrMarkAll
     * Missing both fields → HTTP 400
     */
    public function testMarkReadRequiresNotificationIdOrMarkAll(): void {
        $res = $this->callNotif('markRead', $this->customerUserId, 'customer', [
            'some_other_field' => 'value',
        ]);

        $this->assertEquals(400, $res['status']);
        $this->assertStringContainsString(
            'notification_id or mark_all',
            strtolower($res['body']['message'] ?? '')
        );
    }
}
