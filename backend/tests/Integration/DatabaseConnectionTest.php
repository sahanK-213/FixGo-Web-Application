<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/Database.php';

class DatabaseConnectionTest extends TestCase {

    public function testDatabaseConnectionSucceeds() {
        $db = new Database();
        $conn = $db->connect();
        
        $this->assertInstanceOf(PDO::class, $conn);
        
        $stmt = $conn->query("SELECT 1");
        $this->assertEquals(1, $stmt->fetchColumn());
    }

    public function testLocalEnvironmentDoesNotEnforceSsl() {
        // The Toggle Trap relies on ENFORCE_SSL not being 'true' in the local environment.
        $this->assertNotEquals('true', getenv('ENFORCE_SSL'));
    }
}
