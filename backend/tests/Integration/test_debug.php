<?php
require_once "tests/Integration/AuthenticationIntegrationTest.php";
$test = new AuthenticationIntegrationTest("testInvalidPasswordRejected");
$test->setUp();
$res = $test->runLoginRequest("integration_test_user@fixgo.com", "WrongPassword123");
var_dump($res);
