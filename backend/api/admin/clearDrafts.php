<?php

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../controllers/BillingController.php';

$payload = AuthMiddleware::authenticate(['admin']);

$db = (new Database())->connect();
$controller = new BillingController($db);

$controller->clearDrafts();
