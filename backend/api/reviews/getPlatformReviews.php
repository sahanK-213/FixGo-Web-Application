<?php

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../controllers/PlatformReviewController.php';

$database = new Database();
$db = $database->connect();

$controller = new PlatformReviewController($db);
$controller->getReviews();
