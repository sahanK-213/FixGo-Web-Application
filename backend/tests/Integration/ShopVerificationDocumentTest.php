<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../database/QueryBuilder.php';
require_once __DIR__ . '/../../models/Shop.php';
require_once __DIR__ . '/../../models/Category.php';

class ShopVerificationDocumentTest extends TestCase {
    private $db;
    private $qb;
    private $testEmailWithDoc = 'shop_with_doc_test@fixgo.com';
    private $testEmailWithoutDoc = 'shop_without_doc_test@fixgo.com';
    private $createdUserIds = [];

    protected function setUp(): void {
        $database = new Database();
        $this->db = $database->connect();
        $this->qb = new QueryBuilder($this->db);
        $this->cleanup();
    }

    protected function tearDown(): void {
        $this->cleanup();
    }

    private function cleanup(): void {
        $emails = [$this->testEmailWithDoc, $this->testEmailWithoutDoc];
        foreach ($emails as $email) {
            $user = $this->qb->table('users')->where('email', $email)->first();
            if ($user) {
                $this->qb->table('shopcategorymapping')->where('shop_id', $user['id'])->delete();
                $this->qb->table('shopvehiclecategories')->where('shop_id', $user['id'])->delete();
                $this->qb->table('shop')->where('id', $user['id'])->delete();
                $this->qb->table('users')->where('id', $user['id'])->delete();
            }
        }
    }

    public function testShopRegistrationWithDocumentAndAdminApprovalSetsVerifiedBadge(): void {
        $shopModel = new Shop($this->db);

        $userData = [
            'email' => $this->testEmailWithDoc,
            'password' => password_hash('Secret123', PASSWORD_DEFAULT),
            'verification_token' => '123456'
        ];

        $shopData = [
            'name' => 'Auto Elite Care',
            'address' => '100 Galle Road, Colombo',
            'contactNumber' => '0771122334',
            'owner' => 'Kamal Perera',
            'latitude' => 6.9271,
            'longitude' => 79.8612,
            'description' => 'Certified Auto Care Service',
            'openTime' => '08:00',
            'closeTime' => '18:00',
            'carriageService' => 0,
            'BRN' => 'BRN-998877',
            'verification_document' => 'uploads/verificationDocs/doc_sample.pdf',
            'profileImageURL' => 'uploads/shopOwners/shop_sample.jpg',
            'driverName' => '',
            'driverPhone' => '',
            'truckBrand' => '',
            'truckColor' => '',
            'truckPlate' => ''
        ];

        $categoryId = 1; // Default Garages category
        $vehicleIds = [1];

        // 1. Register shop
        $userId = $shopModel->register($userData, $shopData, $categoryId, $vehicleIds);
        $this->assertNotEmpty($userId);

        // Verify initial state: isActive=0, is_verified=0, verification_document is stored
        $user = $this->qb->table('users')->where('id', $userId)->first();
        $this->assertEquals(0, (int)$user['isActive']);

        $shop = $this->qb->table('shop')->where('id', $userId)->first();
        $this->assertEquals('uploads/verificationDocs/doc_sample.pdf', $shop['verification_document']);
        $this->assertEquals(0, (int)$shop['is_verified']);

        // Verify email to simulate user completing OTP
        $this->qb->table('users')->where('id', $userId)->update(['is_email_verified' => 1]);

        // 2. Pending approvals list includes document info
        $pending = $shopModel->getPendingApprovals();
        $found = null;
        foreach ($pending as $p) {
            if ((int)$p['id'] === (int)$userId) {
                $found = $p;
                break;
            }
        }
        $this->assertNotNull($found, 'Shop must be present in pending approvals list.');
        $this->assertEquals('uploads/verificationDocs/doc_sample.pdf', $found['verification_document']);
        $this->assertEquals(0, (int)$found['is_verified']);

        // 3. Admin approves the shop
        $result = $shopModel->approveShop($userId);
        $this->assertEquals('approved', $result);

        // 4. Verify shop is active and is_verified is now 1
        $updatedUser = $this->qb->table('users')->where('id', $userId)->first();
        $this->assertEquals(1, (int)$updatedUser['isActive']);

        $updatedShop = $this->qb->table('shop')->where('id', $userId)->first();
        $this->assertEquals(1, (int)$updatedShop['is_verified']);

        // 5. getById returns verified status and document
        $profile = $shopModel->getById($userId);
        $this->assertNotNull($profile);
        $this->assertEquals(1, (int)$profile['is_verified']);
        $this->assertEquals('uploads/verificationDocs/doc_sample.pdf', $profile['verification_document']);

        // 6. getShopDetails returns is_verified = 1
        $shopDetails = $shopModel->getShopDetails($userId);
        $this->assertNotNull($shopDetails);
        $this->assertEquals(1, (int)$shopDetails['info']['is_verified']);
    }

    public function testShopRegistrationWithoutDocumentLeavesIsVerifiedZeroAfterApproval(): void {
        $shopModel = new Shop($this->db);

        $userData = [
            'email' => $this->testEmailWithoutDoc,
            'password' => password_hash('Secret123', PASSWORD_DEFAULT),
            'verification_token' => '654321'
        ];

        $shopData = [
            'name' => 'Standard Garage',
            'address' => '200 Kandy Road, Kadawatha',
            'contactNumber' => '0779988776',
            'owner' => 'Nimal Silva',
            'latitude' => 6.9271,
            'longitude' => 79.8612,
            'description' => 'Standard Repair Shop',
            'openTime' => '08:00',
            'closeTime' => '17:00',
            'carriageService' => 0,
            'BRN' => 'BRN-112233',
            'verification_document' => null, // Optional document not uploaded
            'profileImageURL' => 'uploads/shopOwners/shop_sample2.jpg',
            'driverName' => '',
            'driverPhone' => '',
            'truckBrand' => '',
            'truckColor' => '',
            'truckPlate' => ''
        ];

        $categoryId = 1;
        $vehicleIds = [1];

        $userId = $shopModel->register($userData, $shopData, $categoryId, $vehicleIds);
        $this->assertNotEmpty($userId);

        $this->qb->table('users')->where('id', $userId)->update(['is_email_verified' => 1]);

        // Admin approves standard shop
        $result = $shopModel->approveShop($userId);
        $this->assertEquals('approved', $result);

        // Shop is active, but is_verified remains 0
        $user = $this->qb->table('users')->where('id', $userId)->first();
        $this->assertEquals(1, (int)$user['isActive']);

        $shop = $this->qb->table('shop')->where('id', $userId)->first();
        $this->assertNull($shop['verification_document']);
        $this->assertEquals(0, (int)$shop['is_verified']);

        $profile = $shopModel->getById($userId);
        $this->assertEquals(0, (int)$profile['is_verified']);

        $shopDetails = $shopModel->getShopDetails($userId);
        $this->assertNotNull($shopDetails);
        $this->assertEquals(0, (int)$shopDetails['info']['is_verified']);
    }

    public function testUnapprovedShopIsExcludedFromFindNearbyAndShopDetailsUntilAdminApproval(): void {
        $shopModel = new Shop($this->db);

        $userData = [
            'email' => $this->testEmailWithDoc,
            'password' => password_hash('Secret123', PASSWORD_DEFAULT),
            'verification_token' => '777888'
        ];

        $shopData = [
            'name' => 'Pending Approval Garage',
            'address' => '300 Negombo Road, Wattala',
            'contactNumber' => '0712345678',
            'owner' => 'Sunil Fernando',
            'latitude' => 6.9271,
            'longitude' => 79.8612,
            'description' => 'Unapproved Garage Test',
            'openTime' => '08:00',
            'closeTime' => '18:00',
            'carriageService' => 0,
            'BRN' => 'BRN-777888',
            'verification_document' => 'uploads/verificationDocs/doc_test.pdf',
            'profileImageURL' => 'uploads/shopOwners/shop_test.jpg',
            'driverName' => '',
            'driverPhone' => '',
            'truckBrand' => '',
            'truckColor' => '',
            'truckPlate' => ''
        ];

        $userId = $shopModel->register($userData, $shopData, 1, [1]);
        $this->assertNotEmpty($userId);

        // Before Admin Approval (isActive = 0)
        // 1. getShopDetails MUST return null
        $detailsBefore = $shopModel->getShopDetails($userId);
        $this->assertNull($detailsBefore, "Unapproved shop details must not be accessible publicly.");

        // 2. findNearby MUST NOT include this unapproved shop
        $stmt = $shopModel->findNearby(6.9271, 79.8612, 15);
        $foundBefore = false;
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if ((int)$row['id'] === (int)$userId) {
                $foundBefore = true;
                break;
            }
        }
        $this->assertFalse($foundBefore, "Unapproved shop must not appear in Find Nearby search results.");

        // Email verified + Admin Approves Shop
        $this->qb->table('users')->where('id', $userId)->update(['is_email_verified' => 1]);
        $result = $shopModel->approveShop($userId);
        $this->assertEquals('approved', $result);

        // After Admin Approval (isActive = 1)
        // 3. getShopDetails MUST return shop details
        $detailsAfter = $shopModel->getShopDetails($userId);
        $this->assertNotNull($detailsAfter, "Approved shop details should be accessible.");
        $this->assertEquals('Pending Approval Garage', $detailsAfter['info']['name']);

        // 4. findNearby MUST now include this approved shop
        $stmtAfter = $shopModel->findNearby(6.9271, 79.8612, 15);
        $foundAfter = false;
        while ($row = $stmtAfter->fetch(PDO::FETCH_ASSOC)) {
            if ((int)$row['id'] === (int)$userId) {
                $foundAfter = true;
                break;
            }
        }
        $this->assertTrue($foundAfter, "Approved shop must appear in Find Nearby search results.");
    }
}
