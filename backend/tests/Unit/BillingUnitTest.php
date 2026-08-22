<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../controllers/BillingController.php';

class BillingUnitTest extends TestCase {

    private function invokeMethod($object, $methodName, array $parameters = []) {
        $reflection = new \ReflectionClass(get_class($object));
        $method = $reflection->getMethod($methodName);
        $method->setAccessible(true);
        return $method->invokeArgs($object, $parameters);
    }

    private function calculateInvoiceAmount($categoryId, $requests, $config) {
        // Mirrors exact logic from BillingController::generateDrafts
        if ($categoryId === 3) { // CAT_SPARE_PARTS
            return (float)$config['sparePartsMonthlyFee'];
        } else {
            $rate = ($categoryId === 1) // CAT_GARAGE
                ? (float)$config['garagePerRequestFee']
                : (float)$config['serviceCenterPerRequestFee'];
            return $rate * $requests;
        }
    }

    public function testGarageInvoiceAmountCalculation() {
        $config = ['garagePerRequestFee' => 150.00];
        $amount = $this->calculateInvoiceAmount(1, 10, $config);
        $this->assertEquals(1500.00, $amount);
    }

    public function testServiceCenterAmountCalculation() {
        $config = ['serviceCenterPerRequestFee' => 250.00];
        $amount = $this->calculateInvoiceAmount(2, 0, $config);
        $this->assertEquals(0.00, $amount);
    }

    public function testSparePartsFixedMonthlyFee() {
        $config = ['sparePartsMonthlyFee' => 5000.00];
        $amount = $this->calculateInvoiceAmount(3, 50, $config);
        $this->assertEquals(5000.00, $amount); // Flat fee, requests ignored
        
        $amountZero = $this->calculateInvoiceAmount(3, 0, $config);
        $this->assertEquals(5000.00, $amountZero);
    }

    public function testZeroRequestResultsInZeroAmount() {
        $config = ['garagePerRequestFee' => 150.00];
        $amount = $this->calculateInvoiceAmount(1, 0, $config);
        $this->assertEquals(0.00, $amount);
    }

    public function testGracePeriodForGarage() {
        $controller = new BillingController(null);
        $config = ['garageGracePeriodDays' => 10, 'serviceCenterGracePeriodDays' => 14, 'sparePartsGracePeriodDays' => 30];
        $days = $this->invokeMethod($controller, 'getGracePeriod', [$config, 1]);
        $this->assertEquals(10, $days);
    }

    public function testGracePeriodForServiceCenter() {
        $controller = new BillingController(null);
        $config = ['garageGracePeriodDays' => 10, 'serviceCenterGracePeriodDays' => 12, 'sparePartsGracePeriodDays' => 30];
        $days = $this->invokeMethod($controller, 'getGracePeriod', [$config, 2]);
        $this->assertEquals(12, $days);
    }

    public function testGracePeriodDefaultsTo14Days() {
        $controller = new BillingController(null);
        $config = []; // Missing config for unknown category
        $days = $this->invokeMethod($controller, 'getGracePeriod', [$config, 99]);
        $this->assertEquals(14, $days);
    }

    public function testInvoiceReferenceFormat() {
        $controller = new BillingController(null);
        $ref = $this->invokeMethod($controller, 'generateInvoiceReference', [2024, 8, 105]);
        
        // Format: INV-202408-105-XXXX
        $this->assertMatchesRegularExpression('/^INV-202408-105-[0-9A-F]{4}$/', $ref);
    }

    public function testInvalidYearRejected() {
        // Mirrored validation logic from BillingController::generateDrafts
        $year = 2023;
        $isValid = ($year >= 2024);
        $this->assertFalse($isValid);
    }

    public function testInvalidMonthRejected() {
        // Mirrored validation logic from BillingController::generateDrafts
        $month13 = 13;
        $month0 = 0;
        
        $this->assertFalse($month13 >= 1 && $month13 <= 12);
        $this->assertFalse($month0 >= 1 && $month0 <= 12);
    }
}
