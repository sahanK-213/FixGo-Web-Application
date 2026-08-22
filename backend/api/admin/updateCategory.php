<?php
require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../controllers/AdminController.php';

$payload = AuthMiddleware::authenticate(['admin']);
$database = new Database();
$db = $database->connect();

$controller = new AdminController($db);
$controller->updateCategory($payload);
