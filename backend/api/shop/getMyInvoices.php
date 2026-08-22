<?php
require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../controllers/BillingController.php';

$payload = AuthMiddleware::authenticate(['shop_owner']);

$db   = (new Database())->connect();
$ctrl = new BillingController($db);
$ctrl->getOwnerInvoices((int)$payload['user_id']);
