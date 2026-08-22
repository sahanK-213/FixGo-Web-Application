<?php

require_once __DIR__ . '/../../config/bootstrap.php';

require_once __DIR__ . '/../../controllers/CategoryController.php';

$database = new Database();
$db = $database->connect();

$controller = new CategoryController($db);
$controller->getAllCategories();
?>