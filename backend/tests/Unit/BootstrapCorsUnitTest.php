<?php
use PHPUnit\Framework\TestCase;

class BootstrapCorsUnitTest extends TestCase {

    private function runCorsTest($origin, $configuredFrontendUrl = '') {
        $bootstrapPath = realpath(__DIR__ . '/../../config/bootstrap.php');
        
        $code = "<?php
            \$_SERVER['REQUEST_METHOD'] = 'OPTIONS';
            \$_SERVER['HTTP_ORIGIN'] = '{$origin}';
            
            if ('{$configuredFrontendUrl}' !== '') {
                putenv('FRONTEND_URL={$configuredFrontendUrl}');
                \$_ENV['FRONTEND_URL'] = '{$configuredFrontendUrl}';
            }
            
            require '{$bootstrapPath}';
        ";
        
        $cmd = "echo " . escapeshellarg($code) . " | php-cgi 2>/dev/null";
        $output = shell_exec($cmd);
        
        // Parse the headers from the output
        if (preg_match('/Access-Control-Allow-Origin:\s*([^\r\n]+)/i', $output, $matches)) {
            return trim($matches[1]);
        }
        return '';
    }

    public function testLocalhostAnyPortIsAllowed() {
        $origin = 'http://localhost:5173';
        $allowed = $this->runCorsTest($origin);
        $this->assertEquals($origin, $allowed);
        
        $origin2 = 'http://localhost:3000';
        $allowed2 = $this->runCorsTest($origin2);
        $this->assertEquals($origin2, $allowed2);
    }

    public function testLocalhostWithoutPortIsAllowed() {
        $origin = 'http://localhost';
        $allowed = $this->runCorsTest($origin);
        $this->assertEquals($origin, $allowed);
    }

    public function testExternalOriginDoesNotMatchLocalhostRegex() {
        $origin = 'http://evil.com';
        // We configure the frontend URL to be a production domain
        $allowed = $this->runCorsTest($origin, 'https://myproduction.com');
        
        // The fallback should use the configured origin instead of the malicious one
        $this->assertEquals('https://myproduction.com', $allowed);
        $this->assertNotEquals($origin, $allowed);
    }
}
