<?php

use PHPUnit\Framework\TestCase;

// Include the class we want to test
require_once __DIR__ . '/../config/RequestValidator.php';

class RequestValidatorTest extends TestCase
{
    /**
     * Test if getPostPayload correctly returns the $_POST array when it is not empty.
     */
    public function test_getPostPayload_returns_post_array()
    {
        // 1. Arrange: Fake a $_POST request from a user
        $_POST = [
            'username' => 'sahan',
            'role' => 'admin'
        ];

        // 2. Act: Call the method
        $result = RequestValidator::getPostPayload();

        // 3. Assert: Verify the method returned exactly what was in $_POST
        $this->assertEquals('sahan', $result['username']);
        $this->assertEquals('admin', $result['role']);
        $this->assertCount(2, $result);
    }
}
