<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../database/QueryBuilder.php';

class SearchTest extends TestCase {
    private $db;
    private $qb;
    private $customerEmail = 'search_customer@fixgo.com';
    private $shopEmail = 'search_shop@fixgo.com';
    private $customerUserId;
    private $shopUserId;
    private $wrapperPath;

    protected function setUp(): void {
        
        
        $database = new Database();
        $this->db = $database->connect();
        $this->qb = new QueryBuilder($this->db);
        
        $this->cleanUp();
        $this->createTestData();

        $this->wrapperPath = __DIR__ . '/search_wrapper.php';
        file_put_contents($this->wrapperPath, "<?php
            require_once '" . realpath(__DIR__ . '/../../config/Database.php') . "';
            require_once '" . realpath(__DIR__ . '/../../database/QueryBuilder.php') . "';
            require_once '" . realpath(__DIR__ . '/../../config/RequestValidator.php') . "';
            require_once '" . realpath(__DIR__ . '/../../controllers/SearchController.php') . "';
            require_once '" . realpath(__DIR__ . '/../../models/Shop.php') . "';
            \$db = (new Database())->connect();
            \$controller = new SearchController(\$db);
            
            // Reconstruct \$_GET from query string
            parse_str(\$_SERVER['QUERY_STRING'] ?? '', \$_GET);
            
            \$_SERVER['REQUEST_METHOD'] = 'GET';
            echo \$controller->handleSearchRequest(\$_GET);
        ");
    }

    protected function tearDown(): void {
        $this->cleanUp();
        if (file_exists($this->wrapperPath)) {
            @unlink($this->wrapperPath);
        }
    }

    private function cleanUp() {
        $customer = $this->qb->table('users')->where('email', $this->customerEmail)->first();
        $shop = $this->qb->table('users')->where('email', $this->shopEmail)->first();

        if ($customer) {
            $this->qb->table('customer')->where('id', $customer['id'])->delete();
            $this->qb->table('users')->where('id', $customer['id'])->delete();
        }
        if ($shop) {
            $this->qb->table('shopcategorymapping')->where('shop_id', $shop['id'])->delete();
            $this->qb->table('shopvehiclecategories')->where('shop_id', $shop['id'])->delete();
            $this->qb->table('shop')->where('id', $shop['id'])->delete();
            $this->qb->table('users')->where('id', $shop['id'])->delete();
        }
    }

    private function createTestData() {
        // Customer
        $this->qb->table('users')->insert([
            'email' => $this->customerEmail,
            'password' => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole' => 'customer',
            'isActive' => 1
        ]);
        $customerUser = $this->qb->table('users')->where('email', $this->customerEmail)->first();
        $this->customerUserId = $customerUser['id'];
        $this->qb->table('customer')->insert([
            'id' => $this->customerUserId,
            'name' => 'Search Customer'
        ]);

        // Shop (Service Center)
        $this->qb->table('users')->insert([
            'email' => $this->shopEmail,
            'password' => password_hash('Pass123', PASSWORD_BCRYPT),
            'userRole' => 'shop_owner',
            'isActive' => 1
        ]);
        $shopUser = $this->qb->table('users')->where('email', $this->shopEmail)->first();
        $this->shopUserId = $shopUser['id'];
        $this->qb->table('shop')->insert([
            'id' => $this->shopUserId,
            'name' => 'Colombo City Service Center',
            'isAvailable' => 1,
            'openTime' => '00:00:00',
            'closeTime' => '23:59:59' // Always open
        ]);
        
        // Update the spatial POINT column separately
        $this->db->query("UPDATE shop SET location = ST_GeomFromText('POINT(79.8612 6.9271)') WHERE id = " . $this->shopUserId);

        // Map to Service Center (2)
        $this->qb->table('shopcategorymapping')->insert([
            'shop_id' => $this->shopUserId,
            'shop_category_id' => 2 // 2 = Service Center
        ]);

        // Map to 4 Wheelers (2)
        $this->qb->table('shopvehiclecategories')->insert([
            'shop_id' => $this->shopUserId,
            'vehicle_category_id' => 2 // 2 = 4 Wheelers
        ]);
    }

    private function runSearchRequest($queryString) {
        $cmdEnv = "REDIRECT_STATUS=1 SCRIPT_FILENAME=" . escapeshellarg($this->wrapperPath) . " QUERY_STRING=" . escapeshellarg($queryString);
        $cmd = "{$cmdEnv} REQUEST_METHOD=GET php-cgi 2>/dev/null";
        
        $output = shell_exec($cmd);
        
        if (preg_match('/Status: (\d+)/i', $output, $matches)) {
            $status = (int)$matches[1];
        } else {
            echo "Raw Output: $output\n";
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

    public function testSearchRequiresLatLng() {
        $res = $this->runSearchRequest("radius=15");
        $this->assertEquals(400, $res['status']);
        $this->assertStringContainsString('Latitude and longitude parameters are required', $res['body']['message'] ?? '');
    }

    public function testSearchReturnsNearbyShops() {
        // Search exactly at Colombo coordinates
        $res = $this->runSearchRequest("lat=6.9271&lng=79.8612&radius=15");
        $this->assertEquals(200, $res['status']);
        $this->assertArrayHasKey('data', $res['body']);
        
        $found = false;
        foreach ($res['body']['data'] as $shop) {
            if ($shop['id'] === $this->shopUserId) {
                $found = true;
                break;
            }
        }
        $this->assertTrue($found, "Seeded shop was not found in the nearby search results.");
    }

    public function testSearchFiltersByVehicleCategory() {
        // 4 Wheelers = 2
        $res = $this->runSearchRequest("lat=6.9271&lng=79.8612&radius=15&vehicle_category=2");
        $this->assertEquals(200, $res['status']);
        $found = false;
        foreach ($res['body']['data'] as $shop) {
            if ($shop['id'] === $this->shopUserId) $found = true;
        }
        $this->assertTrue($found, "Shop should appear when filtering by its supported vehicle category.");

        // 3 Wheelers & Bikes = 1
        $res2 = $this->runSearchRequest("lat=6.9271&lng=79.8612&radius=15&vehicle_category=1");
        // Could be 404 if no other shops, or 200 without our seeded shop
        if ($res2['status'] === 200) {
            $found2 = false;
            foreach ($res2['body']['data'] as $shop) {
                if ($shop['id'] === $this->shopUserId) $found2 = true;
            }
            $this->assertFalse($found2, "Shop should NOT appear when filtering by unsupported vehicle category.");
        } else {
            $this->assertEquals(404, $res2['status']);
        }
    }

    public function testSearchFiltersByShopCategory() {
        // Service Center = 2
        $res = $this->runSearchRequest("lat=6.9271&lng=79.8612&radius=15&shop_category=2");
        $this->assertEquals(200, $res['status']);
        $found = false;
        foreach ($res['body']['data'] as $shop) {
            if ($shop['id'] === $this->shopUserId) $found = true;
        }
        $this->assertTrue($found, "Shop should appear when filtering by its shop category.");

        // Garage = 1
        $res2 = $this->runSearchRequest("lat=6.9271&lng=79.8612&radius=15&shop_category=1");
        if ($res2['status'] === 200) {
            $found2 = false;
            foreach ($res2['body']['data'] as $shop) {
                if ($shop['id'] === $this->shopUserId) $found2 = true;
            }
            $this->assertFalse($found2, "Shop should NOT appear when filtering by unmatched shop category.");
        } else {
            $this->assertEquals(404, $res2['status']);
        }
    }
    public function testSearchFiltersByName() {
        // Search by name "Colombo"
        $res = $this->runSearchRequest("lat=6.9271&lng=79.8612&radius=15&name=Colombo");
        $this->assertEquals(200, $res['status']);
        
        $found = false;
        foreach ($res['body']['data'] as $shop) {
            if ($shop['id'] === $this->shopUserId) $found = true;
            $this->assertStringContainsStringIgnoringCase('Colombo', $shop['name']);
        }
        $this->assertTrue($found, "Shop with 'Colombo' in name should be found.");

        // Search by non-existent name
        $res2 = $this->runSearchRequest("lat=6.9271&lng=79.8612&radius=15&name=AutoFix");
        if ($res2['status'] === 200) {
            $found2 = false;
            foreach ($res2['body']['data'] as $shop) {
                if ($shop['id'] === $this->shopUserId) $found2 = true;
            }
            $this->assertFalse($found2, "Shop should NOT appear when name does not match.");
        } else {
            $this->assertEquals(404, $res2['status']);
        }
    }

    public function testSearchReturnsDistanceInKm() {
        $res = $this->runSearchRequest("lat=6.9271&lng=79.8612&radius=15");
        $this->assertEquals(200, $res['status']);
        $this->assertArrayHasKey('data', $res['body']);
        
        foreach ($res['body']['data'] as $shop) {
            if ($shop['id'] === $this->shopUserId) {
                $this->assertArrayHasKey('distance_km', $shop);
                $this->assertIsNumeric($shop['distance_km']);
            }
        }
    }

    public function testSearchExcludesInactiveShops() {
        // Set shop to inactive
        $this->qb->table('shop')->where('id', $this->shopUserId)->update(['isAvailable' => 0]);
        
        $res = $this->runSearchRequest("lat=6.9271&lng=79.8612&radius=15");
        
        $this->assertEquals(200, $res['status']);
        $found = false;
        foreach ($res['body']['data'] as $shop) {
            if ($shop['id'] === $this->shopUserId) {
                $found = true;
                $this->assertFalse($shop['is_open_now']);
                $this->assertEquals('Temporarily Closed', $shop['open_status_text']);
            }
        }
        $this->assertTrue($found, "Inactive shop SHOULD appear in search results, but marked as Temporarily Closed.");
        
        // Restore for cleanup/other tests
        $this->qb->table('shop')->where('id', $this->shopUserId)->update(['isAvailable' => 1]);
    }
}
