<?php

require_once __DIR__ . '/../../config/bootstrap.php';

require_once __DIR__ . '/../../controllers/ServiceRequestController.php';

$database = new Database();
$db = $database->connect();

$payload = AuthMiddleware::authenticate(['customer']);

$controller = new ServiceRequestController($db);

echo $controller->handleGetCustomerRequests($payload);