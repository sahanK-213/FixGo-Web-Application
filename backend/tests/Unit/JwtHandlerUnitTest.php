<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/JwtHandler.php';

class JwtHandlerUnitTest extends TestCase {
    
    protected function setUp(): void {
        // Mock the JWT_SECRET environment variable
        $_ENV['JWT_SECRET'] = 'test_secret_key_123';
        putenv('JWT_SECRET=test_secret_key_123');
    }

    public function testGeneratesTokenWithThreeParts() {
        $handler = new JwtHandler();
        $token = $handler->generate(['user_id' => 1]);
        
        $parts = explode('.', $token);
        $this->assertCount(3, $parts, "Token should have exactly 3 parts separated by dots");
    }

    public function testGeneratedTokenDecodesSuccessfully() {
        $handler = new JwtHandler();
        $token = $handler->generate(['user_id' => 99]);
        
        $decoded = $handler->decode($token);
        $this->assertIsArray($decoded);
        $this->assertEquals(99, $decoded['user_id']);
    }

    public function testDecodedPayloadContainsCorrectRole() {
        $handler = new JwtHandler();
        $token = $handler->generate(['user_id' => 1, 'role' => 'admin']);
        
        $decoded = $handler->decode($token);
        $this->assertEquals('admin', $decoded['role']);
    }

    public function testTokenExpiresAfter2Hours() {
        $handler = new JwtHandler();
        $token = $handler->generate(['user_id' => 1]);
        
        $decoded = $handler->decode($token);
        
        $this->assertArrayHasKey('exp', $decoded);
        $this->assertArrayHasKey('iat', $decoded);
        
        $difference = $decoded['exp'] - $decoded['iat'];
        $this->assertEquals(7200, $difference, "Expiration should be exactly 2 hours (7200 seconds) after issue time");
    }

    public function testTamperedSignatureReturnsFalse() {
        $handler = new JwtHandler();
        $token = $handler->generate(['user_id' => 1]);
        
        // Tamper with the signature (the 3rd part)
        $parts = explode('.', $token);
        $parts[2] = 'tampered_signature_string';
        $tamperedToken = implode('.', $parts);
        
        $this->assertFalse($handler->decode($tamperedToken));
    }

    public function testMalformedTokenReturnsFalse() {
        $handler = new JwtHandler();
        $this->assertFalse($handler->decode("not.a.token.at.all"));
        $this->assertFalse($handler->decode("just_one_string"));
    }

    public function testExpiredTokenReturnsFalse() {
        $secretKey = 'test_secret_key_123';
        
        $headers = ['alg' => 'HS256', 'typ' => 'JWT'];
        $headers_encoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($headers)));
        
        $payload = ['user_id' => 1, 'iat' => time() - 8000, 'exp' => time() - 100]; // expired 100 seconds ago
        $payload_encoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));
        
        $signature = hash_hmac('sha256', "$headers_encoded.$payload_encoded", $secretKey, true);
        $signature_encoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        $expiredToken = "$headers_encoded.$payload_encoded.$signature_encoded";
        
        $handler = new JwtHandler();
        $this->assertFalse($handler->decode($expiredToken));
    }

    public function testThrowsIfJwtSecretEnvMissing() {
        // Remove the secret
        unset($_ENV['JWT_SECRET']);
        putenv('JWT_SECRET'); // clear it
        
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('JWT_SECRET environment variable is required.');
        
        new JwtHandler();
    }
}
