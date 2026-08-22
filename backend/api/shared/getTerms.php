<?php
require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../controllers/HomeController.php';

$db = (new Database())->connect();
$ctrl = new HomeController($db);
$ctrl->getTerms();
?>
