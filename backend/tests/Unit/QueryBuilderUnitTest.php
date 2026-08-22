<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../database/QueryBuilder.php';

// Mock PDO to intercept prepared statements without a real database
class MockPDO {
    public $lastSql = '';
    public $mockStatement;
    
    public function __construct() {
        $this->mockStatement = new class {
            public function bindValue($param, $value, $type = null) {}
            public function execute() { return true; }
            public function fetchAll() { return []; }
            public function fetch() { return []; }
            public function fetchColumn() { return 0; }
        };
    }
    
    public function prepare($sql) {
        $this->lastSql = $sql;
        return $this->mockStatement;
    }
    
    public function lastInsertId() { return 1; }
}

class QueryBuilderUnitTest extends TestCase {

    private $db;
    private $qb;

    protected function setUp(): void {
        $this->db = new MockPDO();
        $this->qb = new QueryBuilder($this->db);
    }

    public function testSelectGeneratesCorrectSql() {
        $sql = $this->qb->table('users')->select(['id', 'email'])->toSql();
        $this->assertEquals("SELECT id, email FROM users", $sql);
    }

    public function testWhereClauseAddedCorrectly() {
        $sql = $this->qb->table('users')->where('id', 1)->toSql();
        $this->assertStringContainsString("WHERE id = :p1", $sql);
        
        $bindings = $this->qb->getBindings();
        $this->assertEquals(1, $bindings[':p1']);
    }

    public function testOrWhereClause() {
        $sql = $this->qb->table('users')
                        ->where('id', 1)
                        ->orWhere('role', 'admin')
                        ->toSql();
                        
        $this->assertStringContainsString("WHERE id = :p1 OR role = :p2", $sql);
        $bindings = $this->qb->getBindings();
        $this->assertEquals(1, $bindings[':p1']);
        $this->assertEquals('admin', $bindings[':p2']);
    }

    public function testWhereInClause() {
        $sql = $this->qb->table('users')->whereIn('id', [1, 2, 3])->toSql();
        $this->assertStringContainsString("WHERE id IN (:p1, :p2, :p3)", $sql);
        
        $bindings = $this->qb->getBindings();
        $this->assertEquals(1, $bindings[':p1']);
        $this->assertEquals(2, $bindings[':p2']);
        $this->assertEquals(3, $bindings[':p3']);
    }

    public function testEmptyWhereInGeneratesFalseCondition() {
        $sql = $this->qb->table('users')->whereIn('id', [])->toSql();
        $this->assertStringContainsString("WHERE 1 = 0", $sql);
    }

    public function testInsertGeneratesCorrectSql() {
        // insert() automatically executes, so we catch the SQL in the mock PDO
        $this->qb->table('users')->insert(['name' => 'test_user']);
        
        $this->assertStringContainsString("INSERT INTO users (name) VALUES (:p1)", $this->db->lastSql);
    }

    public function testUpdateGeneratesCorrectSql() {
        // update() automatically executes, so we catch it
        $this->qb->table('users')->where('id', 1)->update(['name' => 'updated_user']);
        
        $this->assertStringContainsString("UPDATE users SET name = :p2 WHERE id = :p1", $this->db->lastSql);
    }

    public function testDeleteGeneratesCorrectSql() {
        // delete() automatically executes
        $this->qb->table('users')->where('id', 1)->delete();
        
        $this->assertStringContainsString("DELETE FROM users WHERE id = :p1", $this->db->lastSql);
    }

    public function testLimitAndOffsetAppended() {
        $sql = $this->qb->table('users')->limit(10)->offset(20)->toSql();
        
        $this->assertStringContainsString("LIMIT 10", $sql);
        $this->assertStringContainsString("OFFSET 20", $sql);
    }

    public function testOrderByAppended() {
        $sql = $this->qb->table('users')->orderBy('created_at', 'DESC')->toSql();
        $this->assertStringContainsString("ORDER BY created_at DESC", $sql);
    }

    public function testResetClearsAllState() {
        $this->qb->table('users')->where('id', 1)->limit(5);
        $this->qb->reset();
        
        // table name persists after reset so you can query it again!
        // wait, the reset() method doesn't clear $this->table.
        $sql = $this->qb->toSql();
        $this->assertEquals("SELECT * FROM users", $sql);
        
        $bindings = $this->qb->getBindings();
        $this->assertEmpty($bindings);
    }

    public function testRawExpressionBypassesBinding() {
        $this->qb->table('users')->insert([
            'name' => 'test_user',
            'created_at' => QueryBuilder::raw('NOW()')
        ]);
        
        $this->assertStringContainsString("INSERT INTO users (name, created_at) VALUES (:p1, NOW())", $this->db->lastSql);
    }
}
