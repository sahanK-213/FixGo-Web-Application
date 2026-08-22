<?php

require_once __DIR__ . '/../../config/bootstrap.php';

require_once __DIR__ . '/../../controllers/ServiceRequestController.php';

$database = new Database();
$db = $database->connect();

$payload = AuthMiddleware::authenticate(['shop_owner']);

$controller = new ServiceRequestController($db);

echo $controller->handleGetConfirmedRequests($payload);