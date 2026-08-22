<?php
// Run this file from your terminal: php database/seed.php

require_once __DIR__ . '/../config/EnvLoader.php';
EnvLoader::load(__DIR__ . '/../.env');
require_once __DIR__ . '/../config/Database.php';

echo "🌱 Starting Database Seeding...\n";

// --- Asset Seeding ---
$sourceDir = __DIR__ . '/seedData/shopOwners/';
$destDir = __DIR__ . '/../uploads/shopOwners/';

if (file_exists($sourceDir)) {
    if (!file_exists($destDir)) {
        mkdir($destDir, 0777, true);
    }
    $files = glob($sourceDir . '*');
    $copiedCount = 0;
    foreach ($files as $file) {
        if (is_file($file)) {
            copy($file, $destDir . basename($file));
            $copiedCount++;
        }
    }
    if ($copiedCount > 0) {
        echo "🖼️  Copied $copiedCount seed images to uploads folder.\n";
    }
}

try {
    $db = (new Database())->connect();

    // 1. Create the 'seeds' tracking table if it doesn't exist
    $db->exec("
        CREATE TABLE IF NOT EXISTS seeds_tracker (
            id INT AUTO_INCREMENT PRIMARY KEY,
            seed_file VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");

    // 2. Get all already-executed seeds from the database
    $stmt = $db->query("SELECT seed_file FROM seeds_tracker");
    $executedSeeds = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // 3. Scan the seeds folder for .sql files
    $seedFiles = glob(__DIR__ . '/seeds/*.sql');
    sort($seedFiles); // Ensure they run in alphabetical/numerical order

    $newSeedsRun = 0;

    // 4. Loop through the files
    foreach ($seedFiles as $file) {
        $fileName = basename($file);

        // If this file hasn't been executed yet, run it!
        if (!in_array($fileName, $executedSeeds)) {
            echo "⚙️  Seeding: $fileName...\n";
            
            // Execute the SQL file reliably by splitting on semicolons
            $expectedSize = filesize($file);
            $sql = file_get_contents($file);
            
            // Verification check: ensure the file was completely read (protects against Docker volume sync lag in CI)
            if ($sql === false || strlen($sql) !== $expectedSize) {
                echo "❌ CRITICAL: Failed to read the entire seed file: $fileName\n";
                echo "Expected $expectedSize bytes, but read " . strlen((string)$sql) . " bytes.\n";
                exit(1);
            }

            $queries = explode(';', $sql);
            
            try {
                $db->exec("SET FOREIGN_KEY_CHECKS=0;");
                
                foreach ($queries as $query) {
                    $query = trim($query);
                    if (empty($query)) continue;
                    $db->exec($query);
                }
                
                $db->exec("SET FOREIGN_KEY_CHECKS=1;");
            } catch (PDOException $innerE) {
                $db->exec("SET FOREIGN_KEY_CHECKS=1;");
                echo "❌ Error in query: " . substr($query, 0, 100) . "...\n";
                throw $innerE;
            }
            
            // Record that we ran it so we never run it again
            $insertStmt = $db->prepare("INSERT INTO seeds_tracker (seed_file) VALUES (:file)");
            $insertStmt->execute([':file' => $fileName]);
            
            echo "✅ Success: $fileName\n";
            $newSeedsRun++;
        }
    }

    if ($newSeedsRun === 0) {
        echo "✨ Database is already fully seeded!\n";
    } else {
        echo "🎉 Finished! Executed $newSeedsRun new seeds.\n";
    }

} catch (PDOException $e) {
    echo "❌ Seeding Failed!\n";
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
