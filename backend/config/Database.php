<?php
class Database {
    private $host;
    private $db_name; 
    private $username;
    private $password;
    private $conn;

    public function __construct() {
        $this->host = getenv('DB_HOST');
        $this->db_name = getenv('DB_NAME');
        $this->username = getenv('DB_USER');
        $this->password = getenv('DB_PASS');
    }

    public function connect() {
        $this->conn = null;
        $isCli = (php_sapi_name() === 'cli');
        $maxRetries = $isCli ? 10 : 1; // Retry up to 10 times (20 seconds) in CLI mode (Docker boot)
        
        for ($i = 0; $i < $maxRetries; $i++) {
            try {
                $options = [];
                // The "Toggle Trap": Only enforce SSL if this variable is injected.
                // This completely protects your local Docker environment.
                if (getenv('ENFORCE_SSL') === 'true') {
                    // Use __DIR__ to construct an unbreakable absolute file path to the certificate.
                    $options[PDO::MYSQL_ATTR_SSL_CA] = __DIR__ . '/DigiCertGlobalRootG2.crt.pem';
                }

                $this->conn = new PDO('mysql:host=' . $this->host . ';dbname=' . $this->db_name, $this->username, $this->password, $options);
                $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                return $this->conn;
            } catch(PDOException $e) {
                if ($i === $maxRetries - 1) {
                    if ($isCli) {
                        echo "❌ Database Connection Error: " . $e->getMessage() . "\n";
                        exit(1); // CRITICAL: Fail with code 1 so CI pipelines abort properly!
                    }
                    if (!headers_sent()) http_response_code(500);
                    echo json_encode(["error" => "Connection Error: " . $e->getMessage()]);
                    exit;
                }
                if ($isCli) {
                    echo "⏳ Waiting for database to boot... (" . ($i + 1) . "/$maxRetries)\n";
                    sleep(2);
                }
            }
        }
    }
}
?>