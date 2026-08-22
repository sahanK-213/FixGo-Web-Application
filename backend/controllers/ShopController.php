<?php

require_once __DIR__ . '/../models/Shop.php';
require_once __DIR__ . '/../models/userRole.php';
require_once __DIR__ . '/../models/Category.php';
require_once __DIR__ . '/../config/EmailSender.php';

class ShopController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getProfile($shopId) {
        RequestValidator::enforceMethod('GET');

        $shopModel = new Shop($this->db);
        $shopProfile = $shopModel->getById($shopId);

        if (!$shopProfile) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Shop not found.'
            ]);
            return;
        }

        echo json_encode([
            'success' => true,
            'data' => $shopProfile
        ]);
    }

    // --- OUR NEW METHOD FOR THE SHOP DETAILS PAGE ---
    public function getDetails() {
        // 1. Only accept GET requests
        RequestValidator::enforceMethod('GET');

        // 2. Validate that the ID exists in the URL
        if (!isset($_GET['id']) || empty($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Shop ID is required']);
            return;
        }

        $shopId = intval($_GET['id']);
        
        // 3. SECURE JWT AUTHENTICATION CHECK
        $customerId = null;
        
        // Get headers (works across different server environments like Apache/Nginx)
        $headers = null;
        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER["Authorization"]);
        } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }

        // Extract and cryptographically verify the token
        if (!empty($headers)) {
            if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
                $jwt = $matches[1];
                
                // IMPORTANT: Adjust this path to where your JwtHandler.php is located if needed
                require_once __DIR__ . '/../config/JwtHandler.php'; 
                
                $jwtHandler = new JwtHandler();
                $payload = $jwtHandler->decode($jwt);
                
                // If decode() returns an array (not false), the signature is valid and it hasn't expired!
                if ($payload !== false) {
                    
                    // THE FIX: Check for 'role' first, fallback to 'userRole' just in case
                    $role = $payload['role'] ?? $payload['userRole'] ?? '';
                    
                    // Check if the user is specifically a customer
                    if ($role === 'customer') {
                        // Extract the user ID safely using null coalescing
                        $extractedId = $payload['user_id'] ?? $payload['id'] ?? null;
                        if ($extractedId) {
                            $customerId = intval($extractedId); 
                        }
                    }
                }
            }
        }

        // 4. Instantiate the model using your existing DB connection
        $shopModel = new Shop($this->db);

        // 5. Pass BOTH the shopId and the extracted customerId to the model
        $shopData = $shopModel->getShopDetails($shopId, $customerId);

        // 5. Return the JSON payload
        if ($shopData) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $shopData
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Shop not found or is no longer active'
            ]);
        }
    }

    public function register() {
        // Only handle POST requests
        RequestValidator::enforceMethod('POST');

        $input = RequestValidator::getPostPayload();

        // Check inputs in $input
        $requiredFields = [
            'ownerName', 'shopName', 'email', 'phone', 'address',
            'openTime', 'closeTime', 'providesCarriage',
            'category', 'vehicleCategory', 'description', 'latitude', 'longitude', 'password'
        ];

        foreach ($requiredFields as $field) {
            if (!isset($input[$field])) {
                http_response_code(400);
                echo json_encode(["message" => "Missing required field: $field"]);
                return;
            }
            if (is_array($input[$field])) {
                if (empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(["message" => "Missing required field: $field"]);
                    return;
                }
            } else {
                if (trim($input[$field]) === '') {
                    http_response_code(400);
                    echo json_encode(["message" => "Missing required field: $field"]);
                    return;
                }
            }
        }

        $ownerName = trim($input['ownerName']);
        if (mb_strlen($ownerName) < 2 || preg_match('/^\d+$/', $ownerName) || !preg_match('/^[a-zA-Z\p{L}\s\.\'-]{2,100}$/u', $ownerName)) {
            http_response_code(400);
            echo json_encode(["message" => "Please enter a valid owner name (letters only, at least 2 characters)."]);
            return;
        }

        $shopName = trim($input['shopName']);
        if (mb_strlen($shopName) < 2 || preg_match('/^\d+$/', $shopName) || !preg_match('/[\p{L}a-zA-Z]/u', $shopName)) {
            http_response_code(400);
            echo json_encode(["message" => "Please enter a valid shop name (must contain letters and be at least 2 characters)."]);
            return;
        }

        $email = trim($input['email']);
        $phone = trim($input['phone']);
        $address = trim($input['address']);
        $licenseNumber = isset($input['licenseNumber']) ? trim($input['licenseNumber']) : '';
        $openTime = trim($input['openTime']);
        $closeTime = trim($input['closeTime']);
        $providesCarriage = (int)$input['providesCarriage'];
        $category = trim($input['category']);
        $vehicleCategory = $input['vehicleCategory'];
        $description = trim($input['description']);
        $latitude = (float)$input['latitude'];
        $longitude = (float)$input['longitude'];
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
            echo json_encode(["message" => "Please enter a valid shop physical address (at least 5 characters; placeholders like N/A are not allowed)."]);
            return;
        }

        if (!empty($licenseNumber) && !preg_match('/^[a-zA-Z0-9\-\/]{3,30}$/', $licenseNumber)) {
            http_response_code(400);
            echo json_encode(["message" => "Invalid Business License / BRN format (3-30 characters, alphanumeric, hyphens, or slashes)."]);
            return;
        }

        if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $password)) {
            http_response_code(400);
            echo json_encode(["message" => "Password must be at least 8 characters long and include an uppercase letter, lowercase letter, and a number."]);
            return;
        }

        $defaultDriverName = '';
        $defaultDriverPhone = '';
        $defaultTruckBrand = '';
        $defaultTruckColor = '';
        $towTruckPlate = '';

        if ($providesCarriage === 1) {
            $towFields = ['defaultDriverName', 'defaultDriverPhone', 'defaultTruckBrand', 'defaultTruckColor', 'towTruckPlate'];
            foreach ($towFields as $tf) {
                if (!isset($input[$tf]) || trim($input[$tf]) === '') {
                    http_response_code(400);
                    echo json_encode(["message" => "Missing required towing field: $tf"]);
                    return;
                }
            }
            $defaultDriverName = trim($input['defaultDriverName']);
            if (mb_strlen($defaultDriverName) < 2 || preg_match('/^\d+$/', $defaultDriverName) || !preg_match('/^[a-zA-Z\p{L}\s\.\'-]{2,100}$/u', $defaultDriverName)) {
                http_response_code(400);
                echo json_encode(["message" => "Please enter a valid driver name (letters only, at least 2 characters)."]);
                return;
            }
            $defaultDriverPhone = trim($input['defaultDriverPhone']);
            if (!preg_match('/^(?:\+94\d{9}|0\d{9})$/', $defaultDriverPhone)) {
                http_response_code(400);
                echo json_encode(["message" => "Invalid driver phone number format. Valid formats: +94123456789 or 0123456789."]);
                return;
            }
            $defaultTruckBrand = trim($input['defaultTruckBrand']);
            if (mb_strlen($defaultTruckBrand) < 2 || preg_match('/^(n\/?a|none|nil|null|test|no|abc)$/i', $defaultTruckBrand) || !preg_match('/^[a-zA-Z0-9\s\.\'-]{2,50}$/', $defaultTruckBrand)) {
                http_response_code(400);
                echo json_encode(["message" => "Please enter a valid truck brand name (e.g. Isuzu, Toyota)."]);
                return;
            }
            $defaultTruckColor = trim($input['defaultTruckColor']);
            if (mb_strlen($defaultTruckColor) < 3 || preg_match('/^(n\/?a|none|nil|null|test|no|abc)$/i', $defaultTruckColor) || !preg_match('/^[a-zA-Z\s\-]{3,30}$/', $defaultTruckColor)) {
                http_response_code(400);
                echo json_encode(["message" => "Please enter a valid truck color (e.g. White, Blue)."]);
                return;
            }
            $towTruckPlate = trim($input['towTruckPlate']);
            $plateRegex = '/^(?:(?:WP|CP|SP|NP|EP|NW|NC|UP|SG)[\s\-]?)?(?:[a-zA-Z]{1,3}|\d{1,3})[\s\-]?\d{4}$/i';
            if (!preg_match($plateRegex, $towTruckPlate)) {
                http_response_code(400);
                echo json_encode(["message" => "Please enter a valid vehicle plate number in standard format (e.g. WP GA-1234, GA-1234, or CAB-1234)."]);
                return;
            }
        }

        // Handle shop image upload securely
        $targetDir = __DIR__ . '/../uploads/shopOwners/';
        $dbImagePath = RequestValidator::handleFileUpload('shopImage', $targetDir, 'shop_', 'uploads/shopOwners/');

        // Map Shop Category dynamically from database
        $categoryModel = new Category($this->db);
        $categoryId = $categoryModel->resolveShopCategoryId($category);

        if ($categoryId === null) {
            http_response_code(400);
            echo json_encode(["message" => "Invalid workshop category: $category"]);
            return;
        }

        // Map Vehicle Categories dynamically from database
        $vehicleIds = [];
        $categoriesToProcess = [];
        if (is_array($vehicleCategory)) {
            $categoriesToProcess = $vehicleCategory;
        } else {
            $trimmed = trim($vehicleCategory);
            if (strpos($trimmed, '[') === 0) {
                $decoded = json_decode($trimmed, true);
                if (is_array($decoded)) {
                    $categoriesToProcess = $decoded;
                } else {
                    $categoriesToProcess = [$trimmed];
                }
            } else {
                $categoriesToProcess = array_map('trim', explode(',', $trimmed));
            }
        }

        foreach ($categoriesToProcess as $cat) {
            $vId = $categoryModel->resolveVehicleCategoryId($cat);
            if ($vId !== null) {
                $vehicleIds[] = $vId;
            }
        }

        $vehicleIds = array_unique($vehicleIds);

        if (empty($vehicleIds)) {
            http_response_code(400);
            $errMessage = is_array($vehicleCategory) ? implode(', ', $vehicleCategory) : $vehicleCategory;
            echo json_encode(["message" => "Invalid vehicle category: $errMessage"]);
            return;
        }

        $userModel = new User($this->db);
        $shopModel = new Shop($this->db);

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

                    $shopData = [
                        'name' => $shopName,
                        'address' => $address,
                        'contactNumber' => $phone,
                        'owner' => $ownerName,
                        'latitude' => $latitude,
                        'longitude' => $longitude,
                        'description' => $description,
                        'openTime' => $openTime,
                        'closeTime' => $closeTime,
                        'carriageService' => $providesCarriage,
                        'BRN' => $licenseNumber,
                        'profileImageURL' => $dbImagePath,
                        'driverName' => $defaultDriverName,
                        'driverPhone' => $defaultDriverPhone,
                        'truckBrand' => $defaultTruckBrand,
                        'truckColor' => $defaultTruckColor,
                        'truckPlate' => $towTruckPlate
                    ];

                    $shopModel->reRegister($userModel->id, $userData, $shopData, $categoryId, $vehicleIds);

                    // Send verification email
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

            $shopData = [
                'name' => $shopName,
                'address' => $address,
                'contactNumber' => $phone,
                'owner' => $ownerName,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'description' => $description,
                'openTime' => $openTime,
                'closeTime' => $closeTime,
                'carriageService' => $providesCarriage,
                'BRN' => $licenseNumber,
                'profileImageURL' => $dbImagePath,
                'driverName' => $defaultDriverName,
                'driverPhone' => $defaultDriverPhone,
                'truckBrand' => $defaultTruckBrand,
                'truckColor' => $defaultTruckColor,
                'truckPlate' => $towTruckPlate
            ];

            $shopModel->register($userData, $shopData, $categoryId, $vehicleIds);

            // Send verification email
            EmailSender::sendVerificationEmail($sanitizedEmail, $verificationToken);

            http_response_code(201);
            echo json_encode(["message" => "Shop owner registered successfully. Please check your email to verify your account."]);

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

public function getTowTruckDetails($payload)
{
    RequestValidator::enforceMethod('GET');

    $shopId = $payload['user_id'] ?? null;

    if (!$shopId) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Unauthorized."
        ]);
        return;
    }

    $shopModel = new Shop($this->db);

    $details = $shopModel->getTowTruckDetails($shopId);

    if ($details) {
        echo json_encode([
            "success" => true,
            "data" => $details
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Tow truck details not found."
        ]);
    }
}

public function updateShopTowTruckDetails($payload)
{
    RequestValidator::enforceMethod('POST');

    // Get shop ID from JWT payload
    $shopId = $payload['user_id'] ?? null;

    if (!$shopId) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Unauthorized."
        ]);
        return;
    }

    $input = RequestValidator::getJsonPayload();

    foreach (['driverName', 'driverPhone', 'truckBrand', 'truckColor', 'truckPlate'] as $field) {
        if (!isset($input[$field]) || trim($input[$field]) === '') {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => "Missing required field: $field"
            ]);
            return;
        }
    }

    if (!preg_match('/^(?:\+94\d{9}|0\d{9})$/', $input['driverPhone'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid driver phone number format. Valid formats: +94123456789 or 0123456789.'
        ]);
        return;
    }

    $shopModel = new Shop($this->db);

    try {
        $success = $shopModel->updateShopTowTruckDetails($shopId, $input);

        if ($success) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Tow truck details updated successfully.'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update tow truck details.'
            ]);
        }
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Server error: ' . $e->getMessage()
        ]);
    }
}

    public function getGalleryImages($payload) {
        RequestValidator::enforceMethod('GET');
        $shopId = $payload['user_id'] ?? null;
        if (!$shopId) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Unauthorized."]);
            return;
        }
        $shopModel = new Shop($this->db);
        $images = $shopModel->getGalleryImages($shopId);
        echo json_encode(["success" => true, "data" => $images]);
    }

    public function uploadGalleryImage($payload) {
        RequestValidator::enforceMethod('POST');
        $shopId = $payload['user_id'] ?? null;
        if (!$shopId) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Unauthorized."]);
            return;
        }

        $shopModel = new Shop($this->db);
        $imageCount = $shopModel->getGalleryImageCount($shopId);
        if ($imageCount >= 4) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Maximum of 4 gallery images allowed per shop."]);
            return;
        }

        $targetDir = __DIR__ . '/../uploads/gallery/';
        $dbPath = RequestValidator::handleFileUpload('image', $targetDir, 'gallery_', 'uploads/gallery/');

        $shopModel = new Shop($this->db);
        $imageId = $shopModel->addGalleryImage($shopId, $dbPath);
        echo json_encode([
            "success" => true,
            "message" => "Gallery image uploaded successfully.",
            "data" => ["id" => $imageId, "url" => $dbPath]
        ]);
    }

    public function deleteGalleryImage($payload) {
        RequestValidator::enforceMethod('POST');
        $shopId = $payload['user_id'] ?? null;
        if (!$shopId) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Unauthorized."]);
            return;
        }

        $input = RequestValidator::getJsonPayload();
        $imageId = $input['image_id'] ?? null;
        if (!$imageId) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Image ID is required."]);
            return;
        }

        $shopModel = new Shop($this->db);
        $success = $shopModel->deleteGalleryImage($shopId, $imageId);
        if ($success) {
            echo json_encode(["success" => true, "message" => "Gallery image deleted successfully."]);
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Failed to delete image."]);
        }
    }

    public function uploadProfileImage($payload) {
        RequestValidator::enforceMethod('POST');
        $shopId = $payload['user_id'] ?? null;
        if (!$shopId) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Unauthorized."]);
            return;
        }

        $targetDir = __DIR__ . '/../uploads/shopOwners/';
        $dbPath = RequestValidator::handleFileUpload('image', $targetDir, 'profile_', 'uploads/shopOwners/');

        $shopModel = new Shop($this->db);
        $shopModel->updateProfileImage($shopId, $dbPath);

        echo json_encode([
            "success" => true,
            "message" => "Profile photo updated successfully.",
            "profileImageURL" => $dbPath
        ]);
    }

    public function updateBusinessInfo($payload) {
        RequestValidator::enforceMethod('POST');
        $shopId = $payload['user_id'] ?? null;
        if (!$shopId) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Unauthorized."]);
            return;
        }

        $input = RequestValidator::getJsonPayload();

        // SERVER-SIDE IMMUTABILITY: Remove email & category if sent in payload
        unset($input['email'], $input['category'], $input['categories']);

        $name = trim($input['name'] ?? '');
        $owner = trim($input['owner'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $address = trim($input['address'] ?? '');
        $brn = trim($input['brn'] ?? '');
        $openTime = trim($input['openTime'] ?? '');
        $closeTime = trim($input['closeTime'] ?? '');
        $description = trim($input['description'] ?? '');
        $isAvailable = isset($input['isAvailable']) ? (int)$input['isAvailable'] : 1;
        $vehicleCategories = $input['vehicleCategories'] ?? [];

        if (empty($name) || empty($owner) || empty($phone) || empty($address)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Name, Owner, Phone, and Address are required."]);
            return;
        }

        if (!preg_match('/^(?:\+94\d{9}|0\d{9})$/', $phone)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid phone number format."]);
            return;
        }

        // Map vehicle categories text to IDs (1: 3 Wheelers & Bikes, 2: 4 Wheelers, 3: Commercial Vehicles)
        $vIds = [];
        if (is_array($vehicleCategories)) {
            foreach ($vehicleCategories as $v) {
                if (strcasecmp($v, '3 Wheelers & Bikes') === 0 || $v == 1) $vIds[] = 1;
                elseif (strcasecmp($v, '4 Wheelers') === 0 || $v == 2) $vIds[] = 2;
                elseif (strcasecmp($v, 'Commercial Vehicles') === 0 || $v == 3) $vIds[] = 3;
            }
        }

        $data = [
            'name' => $name,
            'owner' => $owner,
            'phone' => $phone,
            'address' => $address,
            'brn' => $brn,
            'openTime' => $openTime,
            'closeTime' => $closeTime,
            'description' => $description,
            'isAvailable' => $isAvailable
        ];

        $shopModel = new Shop($this->db);
        try {
            $shopModel->updateBusinessInfo($shopId, $data, array_unique($vIds));
            echo json_encode(["success" => true, "message" => "Business information updated successfully."]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
        }
    }

    public function getShopServices($payload) {
        RequestValidator::enforceMethod('GET');
        $shopId = $payload['user_id'] ?? null;
        if (!$shopId) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Unauthorized."]);
            return;
        }
        $shopModel = new Shop($this->db);
        $services = $shopModel->getServicesByShopId($shopId);
        echo json_encode(["success" => true, "data" => $services]);
    }

    public function updateShopServices($payload) {
        RequestValidator::enforceMethod('POST');
        $shopId = $payload['user_id'] ?? null;
        if (!$shopId) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Unauthorized."]);
            return;
        }

        $input = RequestValidator::getJsonPayload();
        $services = $input['services'] ?? [];

        $shopModel = new Shop($this->db);
        try {
            $shopModel->updateShopServices($shopId, $services);
            echo json_encode(["success" => true, "message" => "Services updated successfully."]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
        }
    }




    public function updatePassword($payload) {
        RequestValidator::enforceMethod('POST');
        $shopId = $payload['user_id'] ?? null;

        $data = RequestValidator::getJsonPayload(true);
        if (empty($data)) {
            $data = RequestValidator::getPostPayload();
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

        $shopModel = new Shop($this->db);

        if (!$shopModel->verifyPassword($shopId, $currentPassword)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Current password is incorrect."]);
            return;
        }

        if ($shopModel->updatePassword($shopId, trim($newPassword))) {
            http_response_code(200);
            echo json_encode(["success" => true, "message" => "Password updated successfully!"]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to update password."]);
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