<?php

require_once __DIR__ . '/../../config/bootstrap.php';

require_once __DIR__ . '/../../controllers/CustomerController.php';

$database = new Database();
$db = $database->connect();

$controller = new CustomerController($db);
$controller->register();
?>
