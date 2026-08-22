<?php

// ============================================================
// bootstrap.php — Centralized Middleware Pipeline
// Every API endpoint requires this file first.
// Handles: Environment, CORS, Preflight, Content-Type, Auth.
// ============================================================

// ----------------------------------------------------------
// 1. Load Environment Variables
// ----------------------------------------------------------
require_once __DIR__ . '/EnvLoader.php';
EnvLoader::load(__DIR__ . '/../.env');

// ----------------------------------------------------------
// 2. Error Reporting (off in production, on in development)
// ----------------------------------------------------------
$appEnv = getenv('APP_ENV') ?: 'production';
if ($appEnv === 'development') {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}

// ----------------------------------------------------------
// 3. CORS Headers
// Reads FRONTEND_URL from .env so a single env change
// switches the allowed origin between local dev and hosted.
// Supports both localhost (any port) and the hosted URL.
// ----------------------------------------------------------
$allowedOrigins = [];

// Always permit any localhost port for local development
$allowedOrigins[] = 'localhost';

// Add the configured frontend URL from .env (e.g., hosted domain)
$configuredOrigin = getenv('FRONTEND_URL');
if ($configuredOrigin) {
    $allowedOrigins[] = rtrim($configuredOrigin, '/');
}

$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';

$originAllowed = false;

// Check exact match against configured origins
if (in_array($requestOrigin, $allowedOrigins, true)) {
    $originAllowed = true;
}

// Check if origin is any localhost port (e.g., localhost:5173, localhost:3000)
if (!$originAllowed && preg_match('/^http:\/\/localhost(:\d+)?$/', $requestOrigin)) {
    $originAllowed = true;
}

if ($originAllowed) {
    header("Access-Control-Allow-Origin: $requestOrigin");
} else {
    // Fallback: use the configured origin or the most common dev origin
    $fallback = $configuredOrigin ?: 'http://localhost:5173';
    header("Access-Control-Allow-Origin: $fallback");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Access-Control-Allow-Headers");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

// ----------------------------------------------------------
// 4. OPTIONS Preflight — answer and exit immediately
// ----------------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ----------------------------------------------------------
// 5. Core Dependencies (always needed by every endpoint)
// ----------------------------------------------------------
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/../database/QueryBuilder.php';
require_once __DIR__ . '/AuthMiddleware.php';
require_once __DIR__ . '/RequestValidator.php';
