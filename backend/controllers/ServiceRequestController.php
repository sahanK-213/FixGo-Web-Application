<?php
class ServiceRequestController {
    private $serviceRequestModel;
    private $shopModel;
    private $db;

    public function __construct($db) {
        $this->db = $db;
        require_once __DIR__ . '/../models/ServiceRequest.php';
        require_once __DIR__ . '/../models/Shop.php';

        $this->serviceRequestModel = new ServiceRequest($db);
        $this->shopModel           = new Shop($db);
    }

    // ==========================================
    // NOTIFICATION HELPER
    // ==========================================
    // Inserts a row into `notification`. Message is left NULL on purpose —
    // Notification.jsx derives the live message text from the joined
    // servicerequest/shop data (shop name, tow details, etc.) so it never
    // goes stale. `type` already stores the status value at creation time
    // (e.g. 'Accepted', 'In Progress', 'Completed'), so getNotifications.php
    // selects it as `status` — no separate status column needed.
    // Failure here should never break the main status-update flow.
    private function notifyCustomer($userId, $requestId, $type, $title) {
        try {
            require_once __DIR__ . '/../models/Notification.php';
            $notificationModel = new Notification($this->db);
            $notificationModel->createNotification($userId, $requestId, $type, $title);
        } catch (Throwable $e) {
            error_log("notifyCustomer failed: " . $e->getMessage());
        }
    }

    private function notifyShop($shopId, $requestId, $type, $title)
{
    try {
        error_log("notifyShop called");
        require_once __DIR__ . '/../models/Notification.php';
        $notificationModel = new Notification($this->db);
        $notificationModel->createNotification($shopId, $requestId, $type, $title);
    } catch(Throwable $e){
        error_log($e->getMessage());
    }
}

    public function handleCreateRequest($payload)
{
    RequestValidator::enforceMethod('POST');
    $requestData = RequestValidator::getJsonPayload();

    $requestData['customer_id'] = $payload['user_id'];

        if (
            empty($requestData['shop_id']) ||
            empty($requestData['customer_id']) ||
            empty($requestData['vehicle_category_id'])
        ) {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data. Shop ID, Customer ID, and Vehicle Category are required."]);
            return;
        }

        if (
            $this->serviceRequestModel->hasPendingRequest(
                $requestData['customer_id'],
                $requestData['shop_id']
            )
        ) {
            http_response_code(429);
            echo json_encode([
                "message" => "You already have a pending request for this shop."
            ]);
            return;
        }

        $photoPath = null;
        if (!empty($requestData['problem_image'])) {
            $base64Str = $requestData['problem_image'];
            $targetDir = __DIR__ . '/../uploads/serviceRequests/';
            $photoPath = RequestValidator::handleBase64Upload($base64Str, $targetDir, 'req_', 'uploads/serviceRequests/');
        }

        $requestData['photo'] = $photoPath;

        $insertId = $this->serviceRequestModel->create($requestData);

        if ($insertId) {
            $this->notifyShop(
    $requestData['shop_id'],
    $insertId,
    "NewRequest",
    "New Service Request"
);
            http_response_code(201);
            echo json_encode([
                "message"    => "Service request created successfully.",
                "request_id" => $insertId
                
            ]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to create service request."]);
        }
    }

    public function handleUpdateStatus($payload)
{
    RequestValidator::enforceMethod('POST');
    $requestData = RequestValidator::getJsonPayload();

    $actor_id = $payload['user_id'] ?? null;
    $actor_role = $payload['role'] ?? null;

    if (!$actor_id || !$actor_role) {
        http_response_code(401);
        echo json_encode(["message" => "Unauthorized."]);
        return;
    }

        if (empty($requestData['request_id']) || empty($requestData['new_status'])) {
            http_response_code(400);
            echo json_encode(["message" => "Request ID and New Status are required."]);
            return;
        }

        $request_id = $requestData['request_id'];
        $new_status = $requestData['new_status'];

        $currentRequest = $this->serviceRequestModel->getById($request_id);
        if (!$currentRequest) {
            http_response_code(404);
            echo json_encode(["message" => "Service request not found."]); return;
        }

        $current_status = $currentRequest['status'];
        $customer_id    = $currentRequest['customer_id'];

        if ($actor_role === 'customer' && $currentRequest['customer_id'] != $actor_id) {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden: You do not own this request."]); return;
        }
        if ($actor_role === 'shop_owner' && $currentRequest['shop_id'] != $actor_id) {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden: This request does not belong to your shop."]); return;
        }

        // --- CUSTOMER RULES ---
        if ($actor_role === 'customer') {

            if ($new_status === 'Confirmed') {
                if ($current_status !== 'Accepted') {
                    http_response_code(400);
                    echo json_encode(["message" => "Illegal Move: You can only confirm an 'Accepted' request."]); return;
                }

                $this->serviceRequestModel->updateStatus($request_id, 'Confirmed');
                
                // Get the list of competing requests BEFORE cancelling them
                $losing_requests = $this->serviceRequestModel->getCompetingRequests($actor_id, $request_id);
                
                $this->serviceRequestModel->cancelCompetingRequests($actor_id, $request_id);
                
                // Notify all losing shops
                foreach ($losing_requests as $losing_req) {
                    $this->notifyShop(
                        $losing_req['shop_id'],
                        $losing_req['id'],
                        "SystemCancelled",
                        "Request No Longer Available"
                    );
                }

                $this->notifyShop(
                    $currentRequest['shop_id'],
                    $request_id,
                    "CustomerConfirmed",
                    "Customer confirmed booking"
                );
             

                http_response_code(200);
                echo json_encode(["message" => "Handshake Confirmed! Shop details unlocked."]); return;
            }

            elseif ($new_status === 'Cancelled') {
                $reason = rtrim($requestData['reason'] ?? "Customer cancelled the request.");

                if (in_array($current_status, ['Confirmed', 'In Progress', 'Diagnosis', 'Pending Parts'])) {
                    require_once __DIR__ . '/../models/Customer.php';
                    $customerModel = new Customer($this->db);
                    $customerModel->incrementCancellationStrikes($actor_id);
                    $penaltyMsg = " Note: A cancellation strike has been applied to your account.";
                } else {
                    $penaltyMsg = "";
                }

                $this->serviceRequestModel->cancelRequest($request_id, 'Customer', $reason);
            

                $this->notifyShop(
                    $currentRequest['shop_id'],
                    $request_id,
                    "CustomerCancelled",
                    "Customer cancelled booking"
                );
                http_response_code(200);
                echo json_encode(["message" => "Request cancelled." . $penaltyMsg]); return;
            }

            else {
                http_response_code(403);
                echo json_encode(["message" => "Customers cannot manually set status to '$new_status'."]); return;
            }
        }

        // --- SHOP OWNER RULES ---
        if ($actor_role === 'shop_owner') {

            if ($new_status === 'Confirmed') {
                http_response_code(403);
                echo json_encode(["message" => "Shops cannot force a confirmation. Only customers can confirm."]); return;
            }

            if ($new_status === 'Accepted') {
                if ($current_status === 'Cancelled') {
                    http_response_code(400);
                    echo json_encode(["message" => "This request is no longer available as the customer confirmed a different shop."]); return;
                }
                
                if ($current_status !== 'Pending') {
                    http_response_code(400);
                    echo json_encode(["message" => "You can only accept 'Pending' requests."]); return;
                }


                $this->serviceRequestModel->updateStatus($request_id, 'Accepted');

                $this->notifyCustomer($customer_id, $request_id, 'Accepted', 'Request accepted');

                http_response_code(200);
                echo json_encode(["message" => "Request Accepted. Waiting for customer confirmation."]); return;
            }

          elseif ($new_status === 'Declined') {
                $reason = $requestData['reason'] ?? "Shop declined the request.";
                $this->serviceRequestModel->declineRequest($request_id, $reason);

                $this->notifyCustomer($customer_id, $request_id, 'Declined', 'Request declined');

                http_response_code(200);
                echo json_encode(["message" => "Request successfully declined."]); return;
            }

            elseif ($new_status === 'Cancelled') {
                $reason = $requestData['reason'] ?? "Shop cancelled the request.";
                $this->serviceRequestModel->cancelRequest($request_id, 'Shop', $reason);


                $this->notifyCustomer($customer_id, $request_id, 'Cancelled', 'Booking cancelled by shop');

                http_response_code(200);
                echo json_encode(["message" => "Request successfully cancelled."]); return;
            } 

            elseif (in_array($new_status, ['Diagnosis', 'Pending Parts', 'In Progress', 'Completed'])) {

                if (in_array($current_status, ['Pending', 'Accepted', 'Cancelled'])) {
                    http_response_code(400);
                    echo json_encode(["message" => "Cannot update repair milestones until the customer Confirms the request."]); return;
                }

                $this->serviceRequestModel->updateStatus($request_id, $new_status);

                $this->notifyCustomer($customer_id, $request_id, $new_status, "Repair status: $new_status");

                http_response_code(200);
                echo json_encode(["message" => "Repair milestone updated to: $new_status."]); return;
            }

            else {
                http_response_code(400);
                echo json_encode(["message" => "Invalid status update requested."]); return;
            }
        }

        http_response_code(400);
        echo json_encode(["message" => "Invalid user role."]); return;
    }

    // ==========================================
    // DASHBOARD RETRIEVAL & PRIVACY MASKING
    // ==========================================
public function handleGetCustomerRequests($payload)
{
    RequestValidator::enforceMethod('GET');

    $customer_id = $payload['user_id'];
        $this->serviceRequestModel->cancelStaleRequests();
        $requests = $this->serviceRequestModel->getRequestsByCustomer($customer_id);

        foreach ($requests as &$req) {
            $safeStatus = strtolower(trim($req['status']));
            if (in_array($safeStatus, ['pending', 'accepted', 'cancelled', 'canceled'])) {
                $req['shop_phone'] = 'Locked until Confirmed';
            }
        }

        http_response_code(200);
        echo json_encode(["success" => true, "data" => $requests]); return;
    }

 public function handleGetShopRequests($payload)
{
    RequestValidator::enforceMethod('GET');

    $shop_id = $payload['user_id'];   
        $this->serviceRequestModel->cancelStaleRequests();
        $requests = $this->serviceRequestModel->getRequestsByShop($shop_id);

        foreach ($requests as &$req) {
            $safeStatus = strtolower(trim($req['status']));
            if (in_array($safeStatus, ['pending', 'accepted', 'cancelled', 'canceled'])) {
                $req['customer_phone'] = 'Locked until Confirmed';
            }
        }

        http_response_code(200);
        echo json_encode(["success" => true, "data" => $requests]); return;
    }

    public function handleGetDeclinedRequests($payload)
    {
        RequestValidator::enforceMethod('GET');

        $shop_id = $payload['user_id'];
        $requests = $this->serviceRequestModel->getDeclinedRequestsByShop($shop_id);

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "data"    => $requests
        ]); return;
    }

    public function handleGetMissedRequests($payload)
    {
        RequestValidator::enforceMethod('GET');

        $shop_id = $payload['user_id'];
        $requests = $this->serviceRequestModel->getMissedRequestsByShop($shop_id);

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "data"    => $requests
        ]);
    }

    
 public function handleGetConfirmedRequests($payload)
{
    RequestValidator::enforceMethod('GET');

    $shop_id = $payload['user_id'];   
        $requests = $this->serviceRequestModel->getConfirmedRequestsByShop($shop_id);

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "data"    => $requests
        ]); return;
    }

    public function handleGetActiveRepairs($payload)
{
    RequestValidator::enforceMethod('GET');

    $shop_id = $payload['user_id'];
    $repairs = $this->serviceRequestModel->getActiveRepairsByShop($shop_id);

    http_response_code(200);

    echo json_encode([
        "success" => true,
        "data" => $repairs
    ]); return;
}

    public function handleGetServiceHistory($payload)
{
    RequestValidator::enforceMethod('GET');

    $shop_id = $payload['user_id'];
        $history = $this->serviceRequestModel->getServiceHistoryByShop($shop_id);

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "data"    => $history
        ]); return;
    }
public function updateTowTruckDetails($payload)
{
    RequestValidator::enforceMethod('POST');

    $shop_id = $payload['user_id'];

    // Read request body first
    $data = RequestValidator::getJsonPayload();

    if (empty($data['request_id'])) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Request ID is required."
        ]);
        return;
    }

    // Check that the request belongs to this shop
    $request = $this->serviceRequestModel->getById($data['request_id']);

    if (!$request || $request['shop_id'] != $shop_id) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Unauthorized."
        ]);
        return;
    }

    try {
        $result = $this->serviceRequestModel->updateTowTruckDetails($data);

        if ($result) {
            echo json_encode([
                "success" => true
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Update failed — no rows affected."
            ]);
        }
    } catch (Throwable $e) {
        http_response_code(500);
        error_log("updateTowTruckDetails failed: " . $e->getMessage());
        echo json_encode([
            "success" => false,
            "message" => "Server error."
        ]);
    }
}


    public function handleGetServiceRequestVolume($payload)
    {
        RequestValidator::enforceMethod('GET');

        $userId = $payload['user_id'] ?? null;
        if (!$userId) {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Unauthorized."]);
            return;
        }

        // Verify shop identity using existing Shop model logic
        $shopProfile = $this->shopModel->getById($userId);
        if (!$shopProfile) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Shop profile not found."]);
            return;
        }

        $shop_id = (int)$shopProfile['id'];
        $timeframe = $_GET['timeframe'] ?? ($_GET['days'] ?? '30days');

        if ($timeframe === '12months' || $timeframe === '12') {
            $volumeData = $this->serviceRequestModel->getMonthlyVolumeByShop($shop_id);
        } else {
            $days = ($timeframe === '7days' || $timeframe === '7' || $timeframe === 7) ? 7 : 30;
            $volumeData = $this->serviceRequestModel->getDailyVolumeByShop($shop_id, $days);
        }

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "data"    => $volumeData
        ]);
    }
}
?>
