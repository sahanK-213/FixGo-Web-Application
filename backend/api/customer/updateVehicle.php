<?php
require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../config/AuthMiddleware.php';
require_once __DIR__ . '/../../controllers/CustomerController.php';

$payload = AuthMiddleware::authenticate(['customer']);

$db = (new Database())->connect();
$controller = new CustomerController($db);
$controller->handleUpdateVehicle($payload);
?>
