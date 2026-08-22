<?php
/**
 * Web-Triggered Database Migration Endpoint
 * 
 * This script provides a secure way to trigger database migrations over HTTP.
 * It is primarily used by the Continuous Deployment (CD) pipeline (e.g., GitHub Actions)
 * to update the database schema automatically after deploying code to a server
 * that does not provide terminal/SSH access (like InfinityFree).
 */

// 1. Load Environment Variables
require_once __DIR__ . '/../../config/EnvLoader.php';
EnvLoader::load(__DIR__ . '/../../.env');

// 2. Check for the Secret Key
// We expect the key to be sent as an HTTP Header (X-Migration-Key) for security.
// We also allow it via $_GET['key'] for easier manual testing if absolutely necessary,
// but the header approach is the standard for automated pipelines.
$providedKey = $_SERVER['HTTP_X_MIGRATION_KEY'] ?? $_GET['key'] ?? null;
$expectedKey = getenv('MIGRATION_API_KEY');

// 3. Strict Security Gate
if (empty($expectedKey) || $providedKey !== $expectedKey) {
    // If the key is wrong, missing, or not configured on the server, deny access immediately.
    http_response_code(403);
    echo "❌ Forbidden: Invalid or missing Migration Key.\n";
    exit(1);
}

// 4. Trigger the Migration
// Since the key matches, we simply include the original migration script.
// This preserves all the original procedural logic (preventing duplicate code)
// while allowing it to run within this HTTP request lifecycle.
echo "🔓 Access Granted. Triggering Migration Script...\n";
echo "--------------------------------------------------\n";

require_once __DIR__ . '/../../database/migrate.php';
