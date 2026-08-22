<?php

require_once __DIR__ . '/../../config/bootstrap.php';

require_once __DIR__ . '/../../models/Shop.php';
require_once __DIR__ . '/../../controllers/ShopController.php';

$db = new Database();
$connection = $db->connect();

$controller = new ShopController($connection);
$controller->getDetails();