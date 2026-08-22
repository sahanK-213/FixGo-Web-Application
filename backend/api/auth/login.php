<?php

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../controllers/AuthController.php';

$database = new Database();
$db = $database->connect();

$authController = new AuthController($db);
$authController->login();