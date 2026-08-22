<?php

require_once __DIR__ . '/../models/Customer.php';
require_once __DIR__ . '/../models/userRole.php';
require_once __DIR__ . '/../config/EmailSender.php';
require_once __DIR__ . '/../models/CustomerVehicle.php';
require_once __DIR__ . '/../models/ModerationFlag.php';
require_once __DIR__ . '/../models/Shop.php';

class CustomerController {
    private $db;
    private $baseUrl;

    public function __construct($db) {
        $this->db = $db;
        $this->baseUrl = rtrim(getenv('APP_URL') ?: 'http://localhost:8000', '/');
    }

    public function getProfile($customerId, $isInternal = false) {
        if (!$isInternal) {
            RequestValidator::enforceMethod('GET');
        }

        $customerModel = new Customer($this->db);
        $customer = $customerModel->getById($customerId);

        if (!$customer) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Customer not found'
            ]);
            return;
        }

        $photoUrl = null;
        if (!empty($customer['profilePhoto'])) {
            $photoUrl = $customer['profilePhoto'];
        }

        echo json_encode([
            'success'       => true,
            'id'            => $customer['id'],
            'name'          => $customer['name'],
            'email'         => $customer['email'],
            'contactNumber' => $customer['contactNumber'],
            'address'       => $customer['address'],
            'profilePhoto'  => $photoUrl,
            'memberSince'   => date('F d, Y', strtotime($customer['createdAt'])),
        ]);
    }

    public function register() {
        // Only handle POST requests
        RequestValidator::enforceMethod('POST');

        $input = RequestValidator::getPostPayload();

        // Check inputs in $input
        $requiredFields = ['name', 'email', 'phone', 'address', 'password'];
        foreach ($requiredFields as $field) {
            if (!isset($input[$field]) || trim($input[$field]) === '') {
                http_response_code(400);
                echo json_encode(["message" => "Missing required field: $field"]);
                return;
            }
        }

        $name = trim($input['name']);
        if (mb_strlen($name) < 2 || preg_match('/^\d+$/', $name) || !preg_match('/^[a-zA-Z\p{L}\s\.\'-]{2,100}$/u', $name)) {
            http_response_code(400);
            echo json_encode(["message" => "Please enter a valid full name (letters only, at least 2 characters)."]);
            return;
        }

        $email = trim($input['email']);
        $phone = trim($input['phone']);
        $address = trim($input['address']);
        $password = $input['password'];

        $sanitizedEmail = filter_var($email, FILTER_SANITIZE_EMAIL);
        if (!filter_var($sanitizedEmail, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["message" => "Invalid email format."]);
            return;
        }

        if (!preg_match('/^(?:\+94\d{9}|0\d{9})$/', $phone)) {
            http_response_code(400);
            echo json_encode(["message" => "Invalid phone number format. Valid formats: +94123456789 or 0123456789."]);
            return;
        }

        if (mb_strlen($address) < 5 || preg_match('/^(n\/?a|none|nil|null|test|no|abc)$/i', $address)) {
            http_response_code(400);
            echo json_encode(["message" => "Please enter a valid personal address (at least 5 characters; placeholders like N/A are not allowed)."]);
            return;
        }

        if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $password)) {
            http_response_code(400);
            echo json_encode(["message" => "Password must be at least 8 characters long and include an uppercase letter, lowercase letter, and a number."]);
            return;
        }

        // Handle file upload securely
        $targetDir = __DIR__ . '/../uploads/customers/';
        $dbImagePath = RequestValidator::handleFileUpload('profilePic', $targetDir, 'customer_', 'uploads/customers/');

        $userModel = new User($this->db);
        $customerModel = new Customer($this->db);

        // Check if email already exists
        if ($userModel->findByEmail($sanitizedEmail)) {
            // If the account exists but is NOT yet verified, allow re-registration
            // by overwriting it with fresh data and a new 5-minute OTP.
            if (!$userModel->is_email_verified) {
                try {
                    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                    $verificationToken = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);

                    $userData = [
                        'password' => $passwordHash,
                        'verification_token' => $verificationToken
                    ];

                    $customerData = [
                        'name' => $name,
                        'contactNumber' => $phone,
                        'address' => $address,
                        'profilePhoto' => $dbImagePath
                    ];

                    $customerModel->reRegister($userModel->id, $userData, $customerData);

                    EmailSender::sendVerificationEmail($sanitizedEmail, $verificationToken);

                    http_response_code(200);
                    echo json_encode(["message" => "A new OTP has been sent to your email. Please verify within 5 minutes."]);
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(["message" => "Re-registration failed: " . $e->getMessage()]);
                }
                return;
            }

            // Email exists AND is verified — genuine duplicate
            http_response_code(400);
            echo json_encode(["message" => "Email is already registered."]);
            return;
        }

        try {
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            $verificationToken = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            $userData = [
                'email' => $sanitizedEmail,
                'password' => $passwordHash,
                'verification_token' => $verificationToken
            ];

            $customerData = [
                'name' => $name,
                'contactNumber' => $phone,
                'address' => $address,
                'profilePhoto' => $dbImagePath
            ];

            $customerModel->register($userData, $customerData);

            // Send verification email
            EmailSender::sendVerificationEmail($sanitizedEmail, $verificationToken);

            http_response_code(201);
            echo json_encode(["message" => "Customer registered successfully. Please check your email to verify your account."]);

        } catch (Exception $e) {
            // Delete file if db commit failed
            $targetFilePath = __DIR__ . '/../' . $dbImagePath;
            if (file_exists($targetFilePath)) {
                unlink($targetFilePath);
            }
            http_response_code(500);
            echo json_encode(["message" => "Database registration failed: " . $e->getMessage()]);
        }
    }

    public function updateProfile($customerId) {
        RequestValidator::enforceMethod('POST');
        $input = RequestValidator::getPostPayload();

        $customerModel = new Customer($this->db);
        $existingCustomer = $customerModel->getById($customerId);
        if (!$existingCustomer) {
            http_response_code(404);
            echo json_encode(["message" => "Customer not found."]);
            return;
        }

        $updateData = [];

        // Validate Name
        if (isset($input['name'])) {
            $name = trim($input['name']);
            if ($name === '') {
                http_response_code(400);
                echo json_encode(["message" => "Name cannot be empty."]);
                return;
            }
            $updateData['name'] = $name;
        }

        // Validate Phone Number
        $phone = isset($input['phone']) ? trim($input['phone']) : (isset($input['contactNumber']) ? trim($input['contactNumber']) : null);
        if ($phone !== null) {
            if ($phone === '') {
                http_response_code(400);
                echo json_encode(["message" => "Phone number cannot be empty."]);
                return;
            }
            if (!preg_match('/^(?:\+94\d{9}|0\d{9})$/', $phone)) {
                http_response_code(400);
                echo json_encode(["message" => "Invalid phone number format. Valid formats: +94123456789 or 0123456789."]);
                return;
            }
            $updateData['contactNumber'] = $phone;
        }

        // Validate Address
        if (isset($input['address'])) {
            $address = trim($input['address']);
            if ($address === '') {
                http_response_code(400);
                echo json_encode(["message" => "Address cannot be empty."]);
                return;
            }
            $updateData['address'] = $address;
        }

        // Handle Profile Photo Upload
        $fileKey = isset($_FILES['profilePic']) ? 'profilePic' : (isset($_FILES['profilePhoto']) ? 'profilePhoto' : null);
        if ($fileKey && isset($_FILES[$fileKey]) && $_FILES[$fileKey]['error'] === UPLOAD_ERR_OK) {
            $targetDir = __DIR__ . '/../uploads/customers/';
            $updateData['profilePhoto'] = RequestValidator::handleFileUpload($fileKey, $targetDir, 'customer_', 'uploads/customers/');
        }

        // Handle Password Change
        $newPassword = isset($input['newPassword']) ? $input['newPassword'] : (isset($input['password']) ? $input['password'] : null);
        if ($newPassword !== null && trim($newPassword) !== '') {
            $currentPassword = isset($input['currentPassword']) ? $input['currentPassword'] : null;
            if (!$currentPassword || trim($currentPassword) === '') {
                http_response_code(400);
                echo json_encode(["message" => "Current password is required to change password."]);
                return;
            }

            // Verify current password
            require_once __DIR__ . '/../models/userRole.php';
            $userModel = new User($this->db);

            if (!$userModel->verifyPassword($customerId, $currentPassword)) {
                http_response_code(400);
                echo json_encode(["message" => "Current password is incorrect."]);
                return;
            }

            if (strlen($newPassword) < 6) {
                http_response_code(400);
                echo json_encode(["message" => "New password must be at least 6 characters long."]);
                return;
            }
        } else {
            $newPassword = null;
        }

        try {
            $customerModel->updateProfile($customerId, $updateData, $newPassword);
            $this->getProfile($customerId, true);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Failed to update profile: " . $e->getMessage()]);
        }
    }

    // ==========================================
    // "My Garage" Vehicle Management
    // ==========================================

    public function handleGetVehicles($payload) {
        RequestValidator::enforceMethod('GET');

        $customer_id = $payload['user_id'];
        $vehicleModel = new CustomerVehicle($this->db);
        $vehicles = $vehicleModel->getByCustomer($customer_id);

        echo json_encode([
            'success' => true,
            'vehicles' => $vehicles
        ]);
    }

    public function handleAddVehicle($payload) {
        RequestValidator::enforceMethod('POST');

        $input = RequestValidator::getPostPayload();

        $required = ['vehicle_category_id', 'brand', 'color'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "Missing field: $field"]);
                return;
            }
        }

        $customer_id = $payload['user_id'];
        $vehicleModel = new CustomerVehicle($this->db);

        // Optional: Check if already exists to prevent duplicates
        if ($vehicleModel->exists($customer_id, $input['brand'], $input['color'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Vehicle already exists in your garage.']);
            return;
        }

        $data = [
            'customer_id' => $customer_id,
            'vehicle_category_id' => $input['vehicle_category_id'],
            'brand' => $input['brand'],
            'color' => $input['color']
        ];

        $vehicleId = $vehicleModel->add($data);

        if ($vehicleId) {
            echo json_encode(['success' => true, 'message' => 'Vehicle added successfully', 'id' => $vehicleId]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to add vehicle.']);
        }
    }

    public function handleUpdateVehicle($payload) {
        RequestValidator::enforceMethod(['PUT', 'POST']);

        $input = RequestValidator::getJsonPayload();
        
        $required = ['id', 'vehicle_category_id', 'brand', 'color'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "Missing field: $field"]);
                return;
            }
        }

        $customer_id = $payload['user_id'];
        $vehicleModel = new CustomerVehicle($this->db);
        
        $data = [
            'vehicle_category_id' => $input['vehicle_category_id'],
            'brand' => $input['brand'],
            'color' => $input['color']
        ];

        if ($vehicleModel->update($input['id'], $customer_id, $data)) {
            echo json_encode(['success' => true, 'message' => 'Vehicle updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update vehicle.']);
        }
    }

    public function handleDeleteVehicle($payload) {
        RequestValidator::enforceMethod(['DELETE', 'POST']);

        $input = RequestValidator::getJsonPayload();
        $vehicle_id = $input['id'] ?? null;
        
        if (isset($_GET['id'])) {
            $vehicle_id = $_GET['id'];
        }

        if (!$vehicle_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing vehicle ID.']);
            return;
        }

        $customer_id = $payload['user_id'];
        $vehicleModel = new CustomerVehicle($this->db);
        
        if ($vehicleModel->delete($vehicle_id, $customer_id)) {
            echo json_encode(['success' => true, 'message' => 'Vehicle deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete vehicle.']);
        }
    }

    public function reportShop($payload) {
        RequestValidator::enforceMethod('POST');

        $userId = $payload['user_id'] ?? null;

        $input = RequestValidator::getJsonPayload();
        $shopId = isset($input['shop_id']) ? (int)$input['shop_id'] : 0;
        $flagType = trim($input['flag_type'] ?? 'PROFILE FLAG');
        $description = trim($input['description'] ?? '');

        if ($shopId <= 0 || empty($description)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Shop ID and report description are required."]);
            return;
        }

        try {
            $reporterName = $payload['name'] ?? $payload['email'] ?? null;
            if (!$reporterName) {
                $customerModel = new Customer($this->db);
                $customer = $customerModel->getById($userId);
                $reporterName = $customer ? $customer['name'] : "User #{$userId}";
            }

            $shopModel = new Shop($this->db);
            $shop = $shopModel->getById($shopId);
            $shopName = $shop ? $shop['name'] : "Garage #{$shopId}";

            $moderationModel = new ModerationFlag($this->db);
            $moderationModel->submitReport($shopId, $flagType, $reporterName, $shopName, $description);

            echo json_encode([
                "success" => true,
                "message" => "Report submitted successfully. Our admin team will investigate this garage."
            ]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to submit report.", "error" => $e->getMessage()]);
        }
    }

    public function deleteAccount($payload) {
        RequestValidator::enforceMethod('POST');
        
        $userId = $payload['user_id'] ?? null;
        $email = $payload['email'] ?? null;

        if (!$userId || !$email) {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Unauthorized."]);
            return;
        }

        try {
            $userModel = new User($this->db);
            $userModel->deleteAccount($userId, $email);

            echo json_encode([
                "success" => true,
                "message" => "Account deleted successfully."
            ]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Failed to delete account.",
                "error" => $e->getMessage()
            ]);
        }
    }
}