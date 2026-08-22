<?php

require_once __DIR__ . '/../models/PlatformReview.php';

class PlatformReviewController {
    private $db;
    private $platformReviewModel;

    public function __construct($db) {
        $this->db = $db;
        $this->platformReviewModel = new PlatformReview($db);
    }

    /**
     * Submit a platform review (logged-in users only)
     */
    public function submitReview($payload) {
        RequestValidator::enforceMethod('POST');
        $userId = $payload['user_id'] ?? null;

        $data = RequestValidator::getJsonPayload(false);

        $rating = isset($data->rating) ? intval($data->rating) : 0;
        $comment = isset($data->comment) ? trim($data->comment) : '';

        if ($rating < 1 || $rating > 5) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Rating must be between 1 and 5 stars."]);
            return;
        }

        if (empty($comment)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Review comment cannot be empty."]);
            return;
        }

        try {
            $this->platformReviewModel->submitReview($userId, $rating, $comment);

            http_response_code(201);
            echo json_encode([
                "success" => true,
                "message" => "Thank you for your review!"
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to submit review: " . $e->getMessage()]);
        }
    }

    /**
     * Extract hometown from address (last word/segment after last comma)
     */
    private function extractHometown($address) {
        if (empty($address)) {
            return "Sri Lanka";
        }
        $parts = explode(',', $address);
        $lastPart = trim(end($parts));
        return !empty($lastPart) ? $lastPart : "Sri Lanka";
    }

    /**
     * Retrieve top & recent platform reviews for homepage/support page carousel
     */
    public function getReviews() {
        RequestValidator::enforceMethod('GET');

        try {
            $rows = $this->platformReviewModel->getReviews();

            $reviews = [];
            foreach ($rows as $row) {
                $name = "Anonymous User";
                $avatar = null;
                $address = "";

                if ($row['userRole'] === 'customer') {
                    $name = $row['customerName'] ?: "FixGo User";
                    $avatar = $row['customerPhoto'];
                    $address = $row['customerAddress'];
                } else if ($row['userRole'] === 'shop_owner') {
                    $name = $row['shopOwnerName'] ?: ($row['shopName'] ?: "Shop Owner");
                    $avatar = $row['shopPhoto'];
                    $address = $row['shopAddress'];
                }

                $hometown = $this->extractHometown($address);

                $reviews[] = [
                    "id"       => intval($row['id']),
                    "name"     => $name,
                    "location" => $hometown,
                    "stars"    => intval($row['stars']),
                    "text"     => $row['text'],
                    "avatar"   => $avatar,
                    "date"     => $row['created_at']
                ];
            }

            http_response_code(200);
            echo json_encode([
                "success" => true,
                "data"    => $reviews
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to fetch reviews: " . $e->getMessage()]);
        }
    }
}
