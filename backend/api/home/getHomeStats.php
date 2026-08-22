<?php
require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../controllers/HomeController.php';

// Home stats are public, so no AuthMiddleware::authenticate() is required.

$db = (new Database())->connect();
$ctrl = new HomeController($db);
$ctrl->getStats();
?>
