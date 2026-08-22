<?php

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../controllers/ServiceRequestController.php';

$payload = AuthMiddleware::authenticate(['customer', 'shop_owner']);

$database = new Database();
$db = $database->connect();

$controller = new ServiceRequestController($db);
$controller->handleUpdateStatus($payload);