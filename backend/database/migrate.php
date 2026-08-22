<?php
// Run this file from your terminal: php database/migrate.php

require_once __DIR__ . '/../config/EnvLoader.php';
EnvLoader::load(__DIR__ . '/../.env');
require_once __DIR__ . '/../config/Database.php';

echo "🚀 Starting Database Migrations...\n";

try {
    $db = (new Database())->connect();

    // --- AZURE FIX: Disable Automatic Invisible Primary Keys ---
    // Azure MySQL 8.0 Flexible Server automatically adds invisible primary keys to tables 
    // that don't have them defined in the CREATE TABLE statement. This breaks phpMyAdmin dumps.
    try {
        $db->exec("SET SESSION sql_generate_invisible_primary_key = OFF;");
    } catch (PDOException $e) {
        // Ignore if running on MariaDB or older MySQL versions that don't support this variable
    }
    // -----------------------------------------------------------

    // 1. Create the 'migrations' tracking table if it doesn't exist
    $db->exec("
        CREATE TABLE IF NOT EXISTS migrations_tracker (
            id INT AUTO_INCREMENT PRIMARY KEY,
            migration_file VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");

    // 2. Get all already-executed migrations from the database
    $stmt = $db->query("SELECT migration_file FROM migrations_tracker");
    $executedMigrations = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // 3. Scan the migrations folder for .sql files
    $migrationFiles = glob(__DIR__ . '/migrations/*.sql');
    sort($migrationFiles); // Ensure they run in alphabetical/numerical order

    // --- NEW PRE-FLIGHT CHECK: Prevent prefix collisions ---
    $prefixes = [];
    foreach ($migrationFiles as $file) {
        $basename = basename($file);
        // Extract everything before the first underscore (e.g., "008" or "008a")
        if (preg_match('/^([^_]+)_/', $basename, $matches)) {
            $prefix = $matches[1];
            if (isset($prefixes[$prefix])) {
                echo "❌ Migration Collision Detected!\n";
                echo "Multiple files share the prefix '{$prefix}_' (e.g., {$prefixes[$prefix]} and {$basename}).\n";
                echo "Please rename them to ensure strict execution order.\n";
                exit(1);
            }
            $prefixes[$prefix] = $basename;
        }
    }
    // -------------------------------------------------------

    $newMigrationsRun = 0;

    // 4. Loop through the files
    foreach ($migrationFiles as $file) {
        $fileName = basename($file);

        // If this file hasn't been executed yet, run it!
        if (!in_array($fileName, $executedMigrations)) {
            echo "⚙️  Migrating: $fileName...\n";
            
            // Execute the SQL file reliably by splitting on semicolons
            // This is 100% robust across all OSes and prevents the Docker Compose entrypoint from hanging
            $expectedSize = filesize($file);
            $sql = file_get_contents($file);
            
            // Verification check: ensure the file was completely read (protects against Docker volume sync lag in CI)
            if ($sql === false || strlen($sql) !== $expectedSize) {
                echo "❌ CRITICAL: Failed to read the entire migration file: $fileName\n";
                echo "Expected $expectedSize bytes, but read " . strlen((string)$sql) . " bytes.\n";
                exit(1);
            }

            $queries = explode(';', $sql);
            
            foreach ($queries as $query) {
                $query = trim($query);
                if (empty($query)) continue;
                
                try {
                    $db->exec($query);
                } catch (PDOException $innerE) {
                    $mysqlCode = $innerE->errorInfo[1] ?? null;
                    // Ignore "already exists" (1050, 1060, 1061, 1068) and "doesn't exist" (1091) errors for idempotency
                    if (!in_array($mysqlCode, [1050, 1060, 1061, 1068, 1091])) {
                        echo "❌ Error in query: " . substr($query, 0, 100) . "...\n";
                        throw $innerE;
                    }
                }
            }
            
            // Record that we ran it so we never run it again
            $insertStmt = $db->prepare("INSERT INTO migrations_tracker (migration_file) VALUES (:file)");
            $insertStmt->execute([':file' => $fileName]);
            
            echo "✅ Success: $fileName\n";
            $newMigrationsRun++;
        }
    }

    if ($newMigrationsRun === 0) {
        echo "✨ Database is already up to date!\n";
    } else {
        echo "🎉 Finished! Executed $newMigrationsRun new migrations.\n";
    }

} catch (PDOException $e) {
    echo "❌ Migration Failed!\n";
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}


// ### Step 4: How Your Team Uses It
// Now, let's look at the workflow. Imagine your teammate wants to add a new column for "Customer Loyalty Points".

// 1. **They write the script:** They create `backend/database/migrations/002_add_loyalty_points.sql`.
// 2. **They push to Git:** They commit their code and push it to GitHub.
// 3. **You pull the code:** You pull their branch down to your localhost.
// 4. **You run the migrator:** You open your terminal, navigate to the backend folder, and run this simple command:

//    php database/migrate.php