<?php

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../controllers/ReviewController.php';

$payload = AuthMiddleware::authenticate(['customer']);

$db = (new Database())->connect();
$controller = new ReviewController($db);
$controller->submit($payload);