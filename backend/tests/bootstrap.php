<?php

// ============================================================
// PHPUnit Test Bootstrap
// Runs once before any test class is loaded.
//
// Mirrors what bootstrap.php does for the HTTP web path —
// ensures getenv('DB_HOST'), getenv('DB_NAME'), etc. are
// available in all test setUp() calls and php-cgi subprocesses,
// regardless of whether tests run inside Docker or bare terminal.
// ============================================================

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/EnvLoader.php';

EnvLoader::load(__DIR__ . '/../.env');
