<?php
require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../config/AuthMiddleware.php';
require_once __DIR__ . '/../../controllers/AdminController.php';

// Ensure only admins can access this route
$payload = AuthMiddleware::authenticate(['admin']);

$db = (new Database())->connect();
$ctrl = new AdminController($db);
$ctrl->updateTerms($payload);
?>
