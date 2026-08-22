<?php

require_once __DIR__ . '/../models/Shop.php';
require_once __DIR__ . '/../models/ServiceRequest.php';
require_once __DIR__ . '/../models/userRole.php';
require_once __DIR__ . '/../models/ShopInvoice.php';
require_once __DIR__ . '/../models/Category.php';
require_once __DIR__ . '/../models/ModerationFlag.php';

class AdminController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Dashboard Overview API
     * Orchestrates data collection from multiple models to populate the Admin Dashboard.
     * Follows 'Thin Controller' pattern by delegating SQL to Models.
     */
    public function getDashboardOverview() {
        RequestValidator::enforceMethod('GET');

        try {
            // Instantiate models
            $shopModel = new Shop($this->db);
            $serviceRequestModel = new ServiceRequest($this->db);
            $userRoleModel = new User($this->db);
            $shopInvoiceModel = new ShopInvoice($this->db);

            // Fetch Pending Shops logic
            // We just need a count of active=0 and is_email_verified=1 shop owners.
            $pendingShopCount = $userRoleModel->getPendingShopOwnerCount();

            // Fetch Pending Invoices
            $pendingInvoiceCount = $shopInvoiceModel->getPendingInvoiceCount();

            // Combine for the single 'Pending Verifications' KPI card
            $totalPendingVerifications = $pendingShopCount + $pendingInvoiceCount;

            // Determine which timeline to fetch based on filter
            $timelineFilter = $_GET['timelineFilter'] ?? '30days';
            $timelineData = ($timelineFilter === '12months') 
                ? $serviceRequestModel->getMonthlyVolume() 
                : $serviceRequestModel->getDailyVolume(30);

            // Assemble data
            $data = [
                'kpis' => [
                    'activeShops' => $shopModel->getActiveCount(),
                    'pendingVerifications' => $totalPendingVerifications,
                    'mtdServiceRequests' => $serviceRequestModel->getMTDCount(),
                    'activeCustomers' => $userRoleModel->getActiveCustomerCount(),
                ],
                'financialSnapshot' => [
                    'pendingInvoices' => $pendingInvoiceCount,
                    'overdueInvoices' => $shopInvoiceModel->getOverdueInvoiceCount(),
                ],
                'charts' => [
                    'serviceRequestsTimeline' => $timelineData,
                    'shopCategoryDistribution' => $shopModel->getCategoryDistribution(),
                    'userRoleDistribution' => $userRoleModel->getUserRoleDistribution(),
                ]
            ];

            http_response_code(200);
            echo json_encode([
                "success" => true,
                "data" => $data
            ]);

        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Failed to load dashboard data.",
                "error" => $e->getMessage()
            ]);
        }
    }


    /**
     * Admin: Approve a pending shop owner account.
     * Reads { shopId } from the JSON request body.
     */
    public function approveShop(): void {
        RequestValidator::enforceMethod('POST');

        $data   = RequestValidator::getJsonPayload(false);
        $shopId = isset($data->shopId) ? intval($data->shopId) : 0;

        if ($shopId <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Valid shopId is required."]);
            return;
        }

        try {
            $shopModel = new Shop($this->db);
            $result    = $shopModel->approveShop($shopId);

            switch ($result) {
                case 'approved':
                    http_response_code(200);
                    echo json_encode(["success" => true, "message" => "Shop approved successfully."]);
                    break;
                case 'already_active':
                    http_response_code(200);
                    echo json_encode(["success" => true, "message" => "Shop is already active."]);
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(["success" => false, "message" => "Shop not found or email not yet verified."]);
            }
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Server error.", "debug" => $e->getMessage()]);
        }
    }

    /**
     * Admin: Get all shop owner accounts pending approval.
     */
    public function getPendingShops(): void {
        RequestValidator::enforceMethod('GET');

        try {
            $shopModel = new Shop($this->db);
            $shops     = $shopModel->getPendingApprovals();
            http_response_code(200);
            echo json_encode(["success" => true, "data" => $shops]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Server error.", "debug" => $e->getMessage()]);
        }
    }


    public function updatePassword($payload) {
        RequestValidator::enforceMethod('POST');
        $userId = $payload['user_id'] ?? null;

        $data = RequestValidator::getJsonPayload();
        if (empty($data)) {
            $data = $_POST;
        }

        $currentPassword = isset($data['currentPassword']) ? $data['currentPassword'] : '';
        $newPassword = isset($data['newPassword']) ? $data['newPassword'] : '';
        $confirmPassword = isset($data['confirmPassword']) ? $data['confirmPassword'] : '';

        if (empty(trim($currentPassword)) || empty(trim($newPassword))) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Current password and new password are required."]);
            return;
        }

        if (strlen(trim($newPassword)) < 6) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "New password must be at least 6 characters long."]);
            return;
        }

        if (trim($newPassword) !== trim($confirmPassword)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "New password and confirm password do not match."]);
            return;
        }

        $userModel = new User($this->db);

        if (!$userModel->verifyPassword($userId, $currentPassword)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Current password is incorrect."]);
            return;
        }

        $hashedPassword = password_hash(trim($newPassword), PASSWORD_DEFAULT);
        if ($userModel->updatePassword($userId, $hashedPassword)) {
            http_response_code(200);
            echo json_encode(["success" => true, "message" => "Admin password updated successfully!"]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to update password."]);
        }
    }

    // ── Category Management Actions ─────────────────────────────────────────

    public function getCategories($payload) {
        RequestValidator::enforceMethod('GET');
        $adminId = $payload['user_id'] ?? null;

        try {
            $categoryModel = new Category($this->db);
            $shopCategories = $categoryModel->getAllShopCategories();
            $vehicleCategories = $categoryModel->getAllVehicleCategoriesList();

            http_response_code(200);
            echo json_encode([
                "success" => true,
                "data" => [
                    "shopCategories" => $shopCategories,
                    "vehicleCategories" => $vehicleCategories
                ]
            ]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to fetch categories."]);
        }
    }

    public function addCategory($payload) {
        RequestValidator::enforceMethod('POST');
        $adminId = $payload['user_id'] ?? null;

        $input = RequestValidator::getJsonPayload();
        $type = trim($input['type'] ?? '');
        $name = trim($input['name'] ?? '');
        $description = trim($input['description'] ?? '');

        if (!in_array($type, ['shop', 'vehicle'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid category type."]);
            return;
        }

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Category name is required."]);
            return;
        }

        $categoryModel = new Category($this->db);

        if ($type === 'shop') {
            if ($categoryModel->isShopCategoryNameTaken($name)) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "A shop category with this name already exists."]);
                return;
            }
            $newId = $categoryModel->addShopCategory($name, $description);
            echo json_encode(["success" => true, "message" => "Shop category added successfully!", "data" => ["id" => $newId]]);
        } else {
            if ($categoryModel->isVehicleCategoryNameTaken($name)) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "A vehicle type with this name already exists."]);
                return;
            }
            $newId = $categoryModel->addVehicleCategory($name, $description);
            echo json_encode(["success" => true, "message" => "Vehicle type added successfully!", "data" => ["id" => $newId]]);
        }
    }

    public function updateCategory($payload) {
        RequestValidator::enforceMethod('POST');
        $adminId = $payload['user_id'] ?? null;

        $input = RequestValidator::getJsonPayload();
        $type = trim($input['type'] ?? '');
        $id = isset($input['id']) ? (int)$input['id'] : 0;
        $name = trim($input['name'] ?? '');
        $description = trim($input['description'] ?? '');

        if (!in_array($type, ['shop', 'vehicle']) || $id <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid parameters."]);
            return;
        }

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Category name is required."]);
            return;
        }

        $categoryModel = new Category($this->db);

        if ($type === 'shop') {
            if ($categoryModel->isShopCategoryNameTaken($name, $id)) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "A shop category with this name already exists."]);
                return;
            }
            $categoryModel->updateShopCategory($id, $name, $description);
            echo json_encode(["success" => true, "message" => "Shop category updated successfully!"]);
        } else {
            if ($categoryModel->isVehicleCategoryNameTaken($name, $id)) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "A vehicle type with this name already exists."]);
                return;
            }
            $categoryModel->updateVehicleCategory($id, $name, $description);
            echo json_encode(["success" => true, "message" => "Vehicle type updated successfully!"]);
        }
    }

    public function deleteCategory($payload) {
        RequestValidator::enforceMethod('POST');
        $adminId = $payload['user_id'] ?? null;

        $input = RequestValidator::getJsonPayload();
        $type = trim($input['type'] ?? '');
        $id = isset($input['id']) ? (int)$input['id'] : 0;

        if (!in_array($type, ['shop', 'vehicle']) || $id <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid parameters."]);
            return;
        }

        $categoryModel = new Category($this->db);
        try {
            if ($type === 'shop') {
                $categoryModel->deleteShopCategory($id);
                echo json_encode(["success" => true, "message" => "Shop category deleted successfully!"]);
            } else {
                $categoryModel->deleteVehicleCategory($id);
                echo json_encode(["success" => true, "message" => "Vehicle type deleted successfully!"]);
            }
        } catch (PDOException $e) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Cannot delete item because it is currently assigned to existing records."]);
        }
    }

    public function getModerationFlags($payload) {
        RequestValidator::enforceMethod('GET');
        $adminId = $payload['user_id'] ?? null;

        try {
            $status = $_GET['status'] ?? 'ALL';
            $type = $_GET['type'] ?? 'ALL';

            $model = new ModerationFlag($this->db);
            $summary = $model->getSummaryCounts();
            $rows = $model->getAllFlags($status, $type);

            $alerts = array_map(function($row) {
                $created = strtotime($row['created_at']);
                $diffMins = round((time() - $created) / 60);

                if ($diffMins < 60) {
                    $timeStr = max(1, $diffMins) . " mins ago";
                } elseif ($diffMins < 1440) {
                    $timeStr = floor($diffMins / 60) . " hours ago";
                } else {
                    $timeStr = floor($diffMins / 1440) . " days ago";
                }

                $isShopSuspended = isset($row['shop_is_available']) && (int)$row['shop_is_available'] === 0;

                $actions = [];
                if ($row['flag_type'] === 'REVIEW REPORT') {
                    $actions = ['Dismiss Review', 'Hide Review', 'Ignore'];
                } elseif ($row['flag_type'] === 'PROFILE FLAG') {
                    if ($isShopSuspended) {
                        $actions = ['Investigate', 'Reactivate Shop', 'Ignore'];
                    } else {
                        $actions = ['Investigate', 'Suspend Shop', 'Ignore'];
                    }
                } else {
                    if ($isShopSuspended) {
                        $actions = ['Audit Logs', 'Reactivate Shop', 'Ignore'];
                    } else {
                        $actions = ['Audit Logs', 'Freeze Ratings', 'Suspend Shop', 'Ignore'];
                    }
                }

                return [
                    'id' => intval($row['id']),
                    'type' => $row['flag_type'],
                    'severity' => $row['severity'],
                    'time' => $timeStr,
                    'desc' => $row['description'],
                    'user' => $row['reported_by_user'],
                    'shop' => $row['shop_name'],
                    'status' => $row['status'],
                    'isShopSuspended' => $isShopSuspended,
                    'actions' => $actions,
                    'createdAt' => $row['created_at']
                ];
            }, $rows);

            echo json_encode([
                "success" => true,
                "data" => [
                    "summary" => $summary,
                    "alerts" => $alerts
                ]
            ]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to load moderation data.", "error" => $e->getMessage()]);
        }
    }

    public function resolveModerationFlag($payload) {
        RequestValidator::enforceMethod('POST');
        $adminId = $payload['user_id'] ?? null;

        $input = RequestValidator::getJsonPayload();
        $flagId = isset($input['flagId']) ? (int)$input['flagId'] : 0;
        $action = trim($input['action'] ?? '');
        $notes = trim($input['notes'] ?? '');

        if ($flagId <= 0 || empty($action)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Flag ID and action are required."]);
            return;
        }

        try {
            $model = new ModerationFlag($this->db);
            $flag = $model->getById($flagId);

            if (!$flag) {
                http_response_code(404);
                echo json_encode(["success" => false, "message" => "Flag not found."]);
                return;
            }

            $responseMsg = "Moderation action '{$action}' executed successfully.";

            $actionLower = strtolower($action);
            $newStatus = 'action_taken';
            if (in_array($actionLower, ['dismiss review', 'dismiss', 'ignore'])) {
                $newStatus = 'dismissed';
            } elseif (in_array($actionLower, ['investigate', 'audit logs'])) {
                $newStatus = 'under_review';
            }

            $entityId = (int)($flag['entity_id'] ?? 0);
            $shopName = !empty($flag['shop_name']) ? $flag['shop_name'] : "Garage #{$entityId}";

            if ($actionLower === 'suspend shop' && $entityId > 0) {
                $shopModel = new Shop($this->db);
                $shopModel->updateAvailability($entityId, 0);
                $responseMsg = "Garage '{$shopName}' has been successfully suspended and deactivated.";
            }

            if (($actionLower === 'reactivate shop' || $actionLower === 'reactivate') && $entityId > 0) {
                $shopModel = new Shop($this->db);
                $shopModel->updateAvailability($entityId, 1);
                $responseMsg = "Garage '{$shopName}' has been successfully reactivated.";
            }

            if ($actionLower === 'hide review' && $entityId > 0) {
                require_once __DIR__ . '/../models/Review.php';
                $reviewModel = new Review($this->db);
                $reviewModel->hideReview($entityId);
                $responseMsg = "Review #{$entityId} has been hidden from public view.";
            }

            $model->updateStatus($flagId, $newStatus);
            $model->logAction($flagId, $adminId, $action, $notes);

            echo json_encode([
                "success" => true,
                "message" => $responseMsg
            ]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to process moderation action.", "error" => $e->getMessage()]);
        }
    }

    /**
     * Admin: Update Terms and Conditions
     */
    public function updateTerms($payload) {
        RequestValidator::enforceMethod('POST');
        require_once __DIR__ . '/../models/SystemConfig.php';

        $input = RequestValidator::getJsonPayload(true);
        
        if (!isset($input['terms']) || !is_array($input['terms'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid input format. Expected a 'terms' array."]);
            return;
        }

        $configModel = new SystemConfig();
        if ($configModel->updateTerms($input['terms'])) {
            http_response_code(200);
            echo json_encode(["success" => true, "message" => "Terms and conditions updated successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to update terms and conditions."]);
        }
    }
}
