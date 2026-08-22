<?php
require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../controllers/ShopController.php';

$payload = AuthMiddleware::authenticate(['shop_owner']);
$database = new Database();
$db = $database->connect();

$controller = new ShopController($db);
$controller->getGalleryImages($payload);
