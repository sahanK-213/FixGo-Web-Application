<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../config/EnvLoader.php';

class EnvLoaderUnitTest extends TestCase {
    private $tempEnvPath;

    protected function setUp(): void {
        $this->tempEnvPath = sys_get_temp_dir() . '/.test_env';
        // Ensure we don't have lingering vars
        putenv('TEST_VAR');
        putenv('TEST_QUOTES');
        putenv('TEST_SINGLE');
        unset($_ENV['TEST_VAR']);
        unset($_SERVER['TEST_VAR']);
    }

    protected function tearDown(): void {
        if (file_exists($this->tempEnvPath)) {
            unlink($this->tempEnvPath);
        }
    }

    public function testLoadsEnvFileIntoGetenv() {
        file_put_contents($this->tempEnvPath, "TEST_VAR=hello_world\n");
        EnvLoader::load($this->tempEnvPath);

        $this->assertEquals('hello_world', getenv('TEST_VAR'));
        $this->assertEquals('hello_world', $_ENV['TEST_VAR']);
    }

    public function testSkipsCommentLines() {
        file_put_contents($this->tempEnvPath, "# This is a comment\nTEST_VAR=hello\n");
        EnvLoader::load($this->tempEnvPath);

        $this->assertEquals('hello', getenv('TEST_VAR'));
        $this->assertFalse(getenv('#')); // Ensure comment wasn't parsed as key
    }

    public function testStripsWrappingQuotesFromValues() {
        file_put_contents($this->tempEnvPath, "TEST_QUOTES=\"secret_value\"\nTEST_SINGLE='secret2'\n");
        EnvLoader::load($this->tempEnvPath);

        $this->assertEquals('secret_value', getenv('TEST_QUOTES'));
        $this->assertEquals('secret2', getenv('TEST_SINGLE'));
    }

    public function testDoesNotOverrideExistingSystemVars() {
        putenv('TEST_VAR=system_value');
        file_put_contents($this->tempEnvPath, "TEST_VAR=file_value\n");
        
        EnvLoader::load($this->tempEnvPath);

        $this->assertEquals('system_value', getenv('TEST_VAR'));
    }

    public function testSilentlyReturnsIfFileNotFoundAndCloudVarsPresent() {
        putenv('APP_ENV=azure');
        
        // This should NOT throw an exception, even though path doesn't exist
        EnvLoader::load('/non/existent/path/.env');
        
        $this->assertTrue(true); // If we reach here, it passed
    }

    public function testThrowsIfFileNotFoundAndNoCloudVars() {
        putenv('APP_ENV'); // clear it
        putenv('ENFORCE_SSL'); // clear it
        
        $this->expectException(Exception::class);
        $this->expectExceptionMessage("CRITICAL ERROR: .env file not found");
        
        EnvLoader::load('/non/existent/path/.env');
    }
}
