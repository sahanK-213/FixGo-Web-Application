<?php

require_once __DIR__ . '/../models/userRole.php';
require_once __DIR__ . '/../models/Shop.php';
require_once __DIR__ . '/../models/Customer.php';
require_once __DIR__ . '/../config/JwtHandler.php';


class AuthController{

    private $db;
    private $rateLimitFile;

    public function __construct($dbconnection){
        $this->db = $dbconnection;
        $this->rateLimitFile = __DIR__ . '/../uploads/login_attempts.json';
    }

    public function login(){

        RequestValidator::enforceMethod('POST');

        $data = RequestValidator::getJsonPayload(false);
        
        if(empty($data->email) || empty($data->password)){
            http_response_code(400);
            echo json_encode(["message"=>"Email and password are required."]);
            return;
        }

        $email = trim($data->email);
        $password = $data->password;

        if ($this->isRateLimited($email)) {
            http_response_code(429);
            echo json_encode(["message"=>"Too many login attempts. Please try again later."]);
            return;
        }

        $user = new User($this->db);
        
        if($user->findByEmail($email)){
            
            if(!$user->is_email_verified){
                http_response_code(403);
                echo json_encode(["message"=>"Please verify your email address before logging in."]);
                return;
            }
            
            if(!$user->isActive){

                http_response_code(403);
                if ($user->userRole === 'shop_owner') {
                    echo json_encode(["message"=>"Your account is pending admin approval."]);
                } else {
                    echo json_encode(["message"=>"Account is inactive. Please contact support."]);
                }
                return;
            }

            $isPasswordValid = password_verify($password, $user->password);

            if($isPasswordValid){
                $this->clearRateLimit($email);

                try {
                    $jwtHandler = new JwtHandler();
                } catch (RuntimeException $e) {
                    http_response_code(500);
                    echo json_encode(["message"=>"Server authentication configuration error."]);
                    return;
                }
                
                $tokenPayload = [
                    "user_id" => $user->id,
                    "email" => $user->email,
                    "role" => $user->userRole
                ];

                $jwt = $jwtHandler->generate($tokenPayload);

                // Fetch profile image URL
                $profileImage = null;
                if ($user->userRole === 'shop_owner') {
                    $shopModel = new Shop($this->db);
                    $profileImage = $shopModel->getProfileImageURL($user->id);
                } else if ($user->userRole === 'customer') {
                    $customerModel = new Customer($this->db);
                    $profileImage = $customerModel->getProfilePhoto($user->id);
                }

                http_response_code(200);

                echo json_encode([
                    "message" => "Login successful.",
                    "token" => $jwt,
                    "role" => $user->userRole,
                    "id" => $user->id,
                    "profileImage" => $profileImage
                ]);

                return;

            }

            $this->recordFailedAttempt($email);

            http_response_code(401);
            echo json_encode(["message"=>"Invalid email or password."]);
        } else {
            $this->recordFailedAttempt($email);
            http_response_code(401);
            echo json_encode(["message"=>"Invalid email or password."]);
        }
    }

    private function getRateLimitKey($email) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $ip = preg_replace('/[^a-zA-Z0-9._:-]/', '', $ip);
        return hash('sha256', strtolower(trim($email)) . ':' . $ip);
    }

    private function loadRateLimitData() {
        if (!file_exists($this->rateLimitFile)) {
            return [];
        }

        $contents = @file_get_contents($this->rateLimitFile);
        if ($contents === false) {
            return [];
        }

        $decoded = json_decode($contents, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function saveRateLimitData($data) {
        $directory = dirname($this->rateLimitFile);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        file_put_contents($this->rateLimitFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
    }

    private function isRateLimited($email) {
        $data = $this->loadRateLimitData();
        $key = $this->getRateLimitKey($email);

        if (!isset($data[$key])) {
            return false;
        }

        $entry = $data[$key];
        $now = time();

        if (($entry['blocked_until'] ?? 0) > $now) {
            return true;
        }

        if (($entry['last_attempt'] ?? 0) + 900 < $now) {
            unset($data[$key]);
            $this->saveRateLimitData($data);
            return false;
        }

        return ($entry['attempts'] ?? 0) >= 5;
    }

    private function recordFailedAttempt($email) {
        $data = $this->loadRateLimitData();
        $key = $this->getRateLimitKey($email);
        $now = time();

        if (!isset($data[$key]) || ($data[$key]['last_attempt'] ?? 0) + 900 < $now) {
            $data[$key] = [
                'attempts' => 1,
                'last_attempt' => $now,
                'blocked_until' => 0
            ];
        } else {
            $data[$key]['attempts'] = ($data[$key]['attempts'] ?? 0) + 1;
            $data[$key]['last_attempt'] = $now;

            if (($data[$key]['attempts'] ?? 0) >= 5) {
                $data[$key]['blocked_until'] = $now + 900;
            }
        }

        $this->saveRateLimitData($data);
    }

    private function clearRateLimit($email) {
        $data = $this->loadRateLimitData();
        $key = $this->getRateLimitKey($email);
        unset($data[$key]);
        $this->saveRateLimitData($data);
    }

    public function verifyEmail() {
        // Only handle POST and GET requests
        RequestValidator::enforceMethod(['POST', 'GET']);

        // Retrieve token
        $token = null;
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = RequestValidator::getJsonPayload(false);
            $token = isset($data->token) ? trim($data->token) : null;
        } else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $token = isset($_GET['token']) ? trim($_GET['token']) : null;
        }

        if (empty($token)) {
            http_response_code(400);
            echo json_encode(["message" => "OTP is required."]);
            return;
        }

        try {
            $user = new User($this->db);

            if (!$user->findByVerificationToken($token)) {
                http_response_code(400);
                echo json_encode(["message" => "Invalid OTP. Please check the code sent to your email."]);
                return;
            }

            if($user->token_expiry && strtotime($user->token_expiry)<time()){
                http_response_code(400);
                echo json_encode(["message" => "Verification OTP has expired. Please try again later." ]);
                return;
            }

            $user->verifyEmail($user->id);

            http_response_code(200);
            if ($user->userRole === 'shop_owner') {
                echo json_encode(["message" => "Email verified successfully. Your account is pending admin approval."]);
            } else {
                echo json_encode(["message" => "Email verified successfully. You can now log in to your account."]);
            }
            return;
    
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Verification failed: " . $e->getMessage()]);
            return;
        }
    }

    public function forgotPassword() {
        RequestValidator::enforceMethod('POST');

        $data = RequestValidator::getJsonPayload(false);
        $email = isset($data->email) ? trim($data->email) : '';

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["message" => "A valid email address is required."]);
            return;
        }

        $user = new User($this->db);
        if (!$user->findByEmail($email)) {
            http_response_code(404);
            echo json_encode(["message" => "No account found with that email address."]);
            return;
        }

        $otp = sprintf("%06d", random_int(0, 999999));

        if (!$user->setResetOtp($email, $otp, 15)) {
            http_response_code(500);
            echo json_encode(["message" => "Failed to process request. Please try again."]);
            return;
        }

        require_once __DIR__ . '/../config/EmailSender.php';
        $emailSent = EmailSender::sendPasswordResetEmail($email, $otp);

        http_response_code(200);
        echo json_encode([
            "message" => "Password reset OTP sent to your email address.",
            "otp_sent" => $emailSent
        ]);
    }

    public function verifyResetOtp() {
        RequestValidator::enforceMethod('POST');

        $data = RequestValidator::getJsonPayload(false);
        $otp = isset($data->otp) ? trim($data->otp) : '';

        if (empty($otp)) {
            http_response_code(400);
            echo json_encode(["message" => "OTP is required."]);
            return;
        }

        $user = new User($this->db);
        if (!$user->findByResetOtp($otp)) {
            http_response_code(400);
            echo json_encode(["message" => "Invalid OTP code."]);
            return;
        }

        if ($user->reset_token_expiry && strtotime($user->reset_token_expiry) < time()) {
            http_response_code(400);
            echo json_encode(["message" => "OTP has expired. Please request a new one."]);
            return;
        }

        http_response_code(200);
        echo json_encode(["message" => "OTP verified successfully."]);
    }

    public function resetPassword() {
        RequestValidator::enforceMethod('POST');

        $data = RequestValidator::getJsonPayload(false);
        $otp = isset($data->otp) ? trim($data->otp) : '';
        $newPassword = isset($data->password) ? $data->password : '';

        if (empty($otp) || empty($newPassword)) {
            http_response_code(400);
            echo json_encode(["message" => "OTP and new password are required."]);
            return;
        }

        if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $newPassword)) {
            http_response_code(400);
            echo json_encode(["message" => "Password must be at least 8 characters long and include an uppercase letter, lowercase letter, and a number."]);
            return;
        }

        $user = new User($this->db);
        if (!$user->findByResetOtp($otp)) {
            http_response_code(400);
            echo json_encode(["message" => "Invalid OTP code."]);
            return;
        }

        if ($user->reset_token_expiry && strtotime($user->reset_token_expiry) < time()) {
            http_response_code(400);
            echo json_encode(["message" => "OTP has expired. Please request a new password reset."]);
            return;
        }

        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
        if ($user->updatePassword($user->id, $hashedPassword)) {
            http_response_code(200);
            echo json_encode(["message" => "Password updated successfully! You can now log in."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to update password. Please try again."]);
        }
    }

    public function resendOtp() {
        RequestValidator::enforceMethod('POST');

        $data = RequestValidator::getJsonPayload(false);
        $email = isset($data->email) ? trim($data->email) : '';

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["message" => "A valid email address is required."]);
            return;
        }

        $user = new User($this->db);
        if (!$user->findByEmail($email)) {
            // Don't reveal whether the email exists — generic message
            http_response_code(200);
            echo json_encode(["message" => "If that email is registered and unverified, a new OTP has been sent."]);
            return;
        }

        if ($user->is_email_verified) {
            http_response_code(400);
            echo json_encode(["message" => "This account is already verified. Please log in."]);
            return;
        }

        $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->refreshVerificationToken($email, $otp);

        require_once __DIR__ . '/../config/EmailSender.php';
        EmailSender::sendVerificationEmail($email, $otp);

        http_response_code(200);
        echo json_encode(["message" => "A new OTP has been sent to your email. It expires in 5 minutes."]);
    }

}