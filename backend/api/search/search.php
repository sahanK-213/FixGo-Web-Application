<?php

require_once __DIR__ . '/../../config/bootstrap.php';

require_once __DIR__ . '/../../models/Shop.php';
require_once __DIR__ . '/../../controllers/SearchController.php';

$payload = AuthMiddleware::authenticate();

$database = new Database();
$db = $database->connect();

$controller = new SearchController($db);

echo $controller->handleSearchRequest($_GET);