<?php

require_once __DIR__ . '/../models/Review.php';

class ReviewController {
    private $review;

    public function __construct($db) {
        $this->review = new Review($db);
    }

    public function submit(array $payload) {
        RequestValidator::enforceMethod('POST');

        $customerId = (int)$payload['user_id'];

        $input = RequestValidator::getJsonPayload();
        $serviceRequestId = $input['service_request_id'] ?? null;
        $shopId           = $input['shop_id'] ?? null;
        $rating           = (int)($input['rating'] ?? 0);
        $comment          = trim($input['comment'] ?? '');

        if (!$serviceRequestId || !$shopId || !$rating) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            return;
        }
        if ($rating < 1 || $rating > 5) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Rating must be between 1 and 5']);
            return;
        }
        if (strlen($comment) > 255) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Comment must be 255 characters or fewer']);
            return;
        }

        try {
            $request = $this->review->getServiceRequest($serviceRequestId);

            if (!$request || $request['customer_id'] != $customerId) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Not authorized to review this request']);
                return;
            }
            if ($request['shop_id'] != $shopId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Shop does not match this service request']);
                return;
            }
            if ($request['status'] !== 'Completed') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'You can only review completed services']);
                return;
            }
            if ($this->review->findDuplicate($serviceRequestId, $customerId)) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'You already reviewed this service']);
                return;
            }

            $reviewId = $this->review->create($customerId, $shopId, $serviceRequestId, $rating, $comment);

            // Create notification for the shop owner
            $this->review->createShopNotification($customerId, $shopId, $serviceRequestId);

            // Mark the customer's notification for this service request as read
            $this->review->markCustomerNotificationAsRead($serviceRequestId, $customerId);

            echo json_encode(['success' => true, 'message' => 'Review submitted', 'review_id' => $reviewId]);

        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'You already reviewed this service']);
                return;
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
        }
    }

    public function getCustomerReviews(array $payload) {
        RequestValidator::enforceMethod('GET');

        $customerId = (int)$payload['user_id'];

        try {
            $reviews = $this->review->getByCustomer($customerId);
            echo json_encode(['success' => true, 'data' => $reviews]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
        }
    }

    public function getShopReviews() {
        RequestValidator::enforceMethod('GET');
        $shopId = $_GET['shop_id'] ?? null;
        if (!$shopId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'shop_id is required']);
            return;
        }

        try {
            $reviews = $this->review->getByShop($shopId);
            $summary = $this->review->getShopAverage($shopId);

            echo json_encode([
                'success' => true,
                'average_rating' => $summary['average_rating'] ? (float)$summary['average_rating'] : 0,
                'total_reviews' => (int)$summary['total_reviews'],
                'data' => $reviews
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
        }
    }
}