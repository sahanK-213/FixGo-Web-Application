<?php
include_once __DIR__ . '/../models/Category.php';

class CategoryController {
    private $db;
    private $category;

    public function __construct($db) {
        $this->db = $db;
        $this->category = new Category($this->db);
    }

    public function getAllCategories() {
        RequestValidator::enforceMethod('GET');
        try {
            // Ask Model for the data statements
            $vehiclesStmt = $this->category->getVehicleCategories();
            $servicesStmt = $this->category->getShopServices();

            // Extract the data into associative arrays
            $vehicles = $vehiclesStmt->fetchAll(PDO::FETCH_ASSOC);
            $services = $servicesStmt->fetchAll(PDO::FETCH_ASSOC);

            // Send the successful JSON response
            http_response_code(200);
            echo json_encode(array(
                "vehicles" => $vehicles,
                "services" => $services
            ));

        } catch (Exception $e) {
            // Handle any database or execution errors gracefully
            http_response_code(500);
            echo json_encode(array("message" => "Server Error: " . $e->getMessage()));
        }
    }
}
?>