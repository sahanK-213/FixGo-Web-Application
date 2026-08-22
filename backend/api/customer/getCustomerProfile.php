<?php

require_once __DIR__ . '/../../config/bootstrap.php';

require_once __DIR__ . '/../../controllers/CustomerController.php';

$payload = AuthMiddleware::authenticate(['customer']);

$database = new Database();
$db = $database->connect();

$controller = new CustomerController($db);
$controller->getProfile($payload['user_id']);
