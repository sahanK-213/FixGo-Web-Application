<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../database/QueryBuilder.php';

class HomeAndSystemTest extends TestCase {
    private $db;
    private $qb;
    private $wrapperPath;
    private $termsFilePath;
    private $originalTerms;

    protected function setUp(): void {
        
        putenv('MIGRATION_API_KEY=test-migration-key');

        $database = new Database();
        $this->db = $database->connect();
        $this->qb = new QueryBuilder($this->db);

        // Backup terms.json if it exists
        $this->termsFilePath = __DIR__ . '/../../config/terms.json';
        if (file_exists($this->termsFilePath)) {
            $this->originalTerms = file_get_contents($this->termsFilePath);
        } else {
            $this->originalTerms = null;
        }

        $this->wrapperPath = __DIR__ . '/home_system_wrapper.php';
        file_put_contents($this->wrapperPath,
            "<?php
            require_once '" . realpath(__DIR__ . '/../../config/Database.php')            . "';
            require_once '" . realpath(__DIR__ . '/../../database/QueryBuilder.php')      . "';
            require_once '" . realpath(__DIR__ . '/../../config/RequestValidator.php')    . "';
            require_once '" . realpath(__DIR__ . '/../../models/Shop.php')                . "';
            require_once '" . realpath(__DIR__ . '/../../models/ServiceRequest.php')      . "';
            require_once '" . realpath(__DIR__ . '/../../models/Review.php')              . "';
            require_once '" . realpath(__DIR__ . '/../../models/SystemConfig.php')        . "';
            require_once '" . realpath(__DIR__ . '/../../controllers/HomeController.php')  . "';
            require_once '" . realpath(__DIR__ . '/../../controllers/AdminController.php') . "';

            \$db = (new Database())->connect();
            \$method = \$_SERVER['HTTP_X_METHOD'] ?? '';
            \$userId = (int)(\$_SERVER['HTTP_X_USER_ID'] ?? 0);
            \$role   = \$_SERVER['HTTP_X_USER_ROLE'] ?? 'admin';
            \$payload = ['user_id' => \$userId, 'role' => \$role];

            if (\$method === 'getStats') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$ctrl = new HomeController(\$db);
                \$ctrl->getStats();
            } elseif (\$method === 'getTerms') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                \$ctrl = new HomeController(\$db);
                \$ctrl->getTerms();
            } elseif (\$method === 'updateTerms') {
                \$_SERVER['REQUEST_METHOD'] = 'POST';
                \$ctrl = new AdminController(\$db);
                \$ctrl->updateTerms(\$payload);
            } elseif (\$method === 'migrate') {
                \$_SERVER['REQUEST_METHOD'] = 'GET';
                // Simply mock the migrate execution since the real script stops/exits
                // we'll just require it and let it run
                require '" . realpath(__DIR__ . '/../../api/system/triggerMigrations.php') . "';
            }
        ");
    }

    protected function tearDown(): void {
        if (file_exists($this->wrapperPath)) {
            @unlink($this->wrapperPath);
        }

        // Restore original terms.json
        if ($this->originalTerms !== null) {
            file_put_contents($this->termsFilePath, $this->originalTerms);
        } elseif (file_exists($this->termsFilePath)) {
            @unlink($this->termsFilePath);
        }
    }

    private function call(string $method, array $headers = [], $payload = null): array {
        $env = "HTTP_X_METHOD={$method} REDIRECT_STATUS=1 SCRIPT_FILENAME=" . escapeshellarg($this->wrapperPath);
        
        foreach ($headers as $key => $value) {
            $env .= " HTTP_" . strtoupper(str_replace('-', '_', $key)) . "=" . escapeshellarg($value);
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

        return ['status' => $status, 'body' => json_decode($body, true) ?: $body, 'raw' => $body];
    }

    /**
     * Plan: testGetHomeStatsReturnsKpis
     * Returns verifiedGarages, successfulBookings, averageRating
     */
    public function testGetHomeStatsReturnsKpis(): void {
        $res = $this->call('getStats');
        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);
        
        $data = $res['body']['data'] ?? [];
        $this->assertArrayHasKey('verifiedGarages', $data);
        $this->assertArrayHasKey('successfulBookings', $data);
        $this->assertArrayHasKey('averageRating', $data);
    }

    /**
     * Plan: testGetTermsReturnsContent
     * Returns terms JSON if exists
     */
    public function testGetTermsReturnsContent(): void {
        // Ensure terms.json has content
        file_put_contents($this->termsFilePath, json_encode([['title' => 'Test', 'content' => 'Test Terms']]));

        $res = $this->call('getTerms');
        $this->assertEquals(200, $res['status']);
        $this->assertIsArray($res['body']);
        $this->assertNotEmpty($res['body']);
    }

    /**
     * Plan: testAdminCanUpdateTerms
     * Valid terms array → saved to terms.json
     */
    public function testAdminCanUpdateTerms(): void {
        $newTerms = [
            ['title' => 'Updated Terms', 'content' => 'These are updated.']
        ];

        $res = $this->call('updateTerms', [], ['terms' => $newTerms]);
        
        $this->assertEquals(200, $res['status']);
        $this->assertTrue($res['body']['success'] ?? false);

        // Verify file updated
        $saved = json_decode(file_get_contents($this->termsFilePath), true);
        $this->assertEquals($newTerms[0]['title'], $saved[0]['title']);
    }

    /**
     * Plan: testUpdateTermsRejectsNonArray
     * String instead of array → HTTP 400
     */
    public function testUpdateTermsRejectsNonArray(): void {
        $res = $this->call('updateTerms', [], ['terms' => 'Invalid string terms']);
        
        $this->assertEquals(400, $res['status']);
        $this->assertFalse($res['body']['success'] ?? true);
        $this->assertStringContainsString('Invalid input format', $res['body']['message'] ?? '');
    }

    /**
     * Plan: testMigrationEndpointBlocksWithoutKey
     * No X-Migration-Key → HTTP 403
     */
    public function testMigrationEndpointBlocksWithoutKey(): void {
        $res = $this->call('migrate', []); // No headers
        
        $this->assertEquals(403, $res['status']);
        $this->assertStringContainsString('Forbidden', $res['raw']);
    }

    /**
     * Plan: testMigrationEndpointBlocksWrongKey
     * Wrong key value → HTTP 403
     */
    public function testMigrationEndpointBlocksWrongKey(): void {
        $res = $this->call('migrate', ['X-Migration-Key' => 'wrong-key']);
        
        $this->assertEquals(403, $res['status']);
        $this->assertStringContainsString('Forbidden', $res['raw']);
    }
}
