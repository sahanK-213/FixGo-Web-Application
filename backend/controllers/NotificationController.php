<?php

require_once __DIR__ . '/../models/Notification.php';

class NotificationController {
    private $notification;

    public function __construct($db) {
        $this->notification = new Notification($db);
    }

    public function getAll($payload) {
        RequestValidator::enforceMethod('GET');

        $userId  = $payload['user_id'] ?? null;



        try {
            $notifications = $this->notification->getByUser($userId);
            http_response_code(200);
            echo json_encode(["success" => true, "data" => $notifications]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Server error.",
                "debug"   => $e->getMessage() // Remove in production
            ]);
        }
    }

    public function markRead(array $payload) {
        RequestValidator::enforceMethod('POST');

        $userId = (int)$payload['user_id'];

        $rawData = RequestValidator::getJsonPayload();

        try {
            if (!empty($rawData['notification_id'])) {
                $this->notification->markOneRead($userId, $rawData['notification_id']);
            } elseif (!empty($rawData['mark_all'])) {
                $this->notification->markAllRead($userId);
            } else {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Missing notification_id or mark_all."]);
                return;
            }

            http_response_code(200);
            echo json_encode(["success" => true]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Server error.",
                "debug"   => $e->getMessage() // Remove in production
            ]);
        }
    }
}