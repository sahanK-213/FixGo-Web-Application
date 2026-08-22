<?php

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../controllers/AdminController.php';

$payload = AuthMiddleware::authenticate(['admin']);

$db = (new Database())->connect();
$controller = new AdminController($db);
$controller->getModerationFlags($payload);
