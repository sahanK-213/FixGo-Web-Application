<?php
class HomeController {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }

    public function getStats() {
        RequestValidator::enforceMethod('GET');
        require_once __DIR__ . '/../models/Shop.php';
        require_once __DIR__ . '/../models/ServiceRequest.php';
        require_once __DIR__ . '/../models/Review.php';

        $shopModel = new Shop($this->db);
        $srModel = new ServiceRequest($this->db);
        $reviewModel = new Review($this->db);

        $verifiedGarages = $shopModel->getActiveCount();
        $successfulBookings = $srModel->getTotalCompletedRequests();
        $averageRating = $reviewModel->getGlobalAverageRating();

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "data" => [
                "verifiedGarages" => $verifiedGarages,
                "successfulBookings" => $successfulBookings,
                "averageRating" => $averageRating
            ]
        ]);
    }

    public function getTerms() {
        RequestValidator::enforceMethod('GET');
        require_once __DIR__ . '/../models/SystemConfig.php';

        $configModel = new SystemConfig();
        $terms = $configModel->getTerms();

        if (!empty($terms)) {
            http_response_code(200);
            echo json_encode($terms);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Terms and conditions not found."]);
        }
    }
}
?>
