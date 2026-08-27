<?php

require_once __DIR__ . '/JwtHandler.php';

class AuthMiddleware
{
    /**
     * Authenticates the incoming request by verifying the JWT Bearer token.
     *
     * @param  array  $allowedRoles  Optional. If provided, the decoded role must be
     *                               one of these values or a 403 is returned immediately.
     *                               Example: AuthMiddleware::authenticate(['admin'])
     *                               Example: AuthMiddleware::authenticate(['shop_owner'])
     *                               Example: AuthMiddleware::authenticate(['customer'])
     *                               Leave empty to authenticate any logged-in user regardless of role.
     * @return array  The decoded JWT payload (contains user_id, email, role).
     */
    public static function authenticate(array $allowedRoles = [])
    {
        // php-cgi (used in tests) and some servers alter header casing.
        // Convert all headers to UPPERCASE for reliable extraction.
        // php-cgi (used in tests) and some servers alter header casing or don't have getallheaders().
        $headers = [];
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            if (is_array($headers)) {
                $headers = array_change_key_case($headers, CASE_UPPER);
            }
        }
        
        $authHeader = $headers['AUTHORIZATION'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            http_response_code(401);
            echo json_encode([
                "success" => false,
                "message" => "Authorization token missing."
            ]);
            exit();
        }

        $jwtHandler = new JwtHandler();
        $payload = $jwtHandler->decode($matches[1]);

        if ($payload === false) {
            http_response_code(401);
            echo json_encode([
                "success" => false,
                "message" => "Invalid or expired token."
            ]);
            exit();
        }

        // ----------------------------------------------------------
        // Role Enforcement (only runs when $allowedRoles is provided)
        // ----------------------------------------------------------
        if (!empty($allowedRoles)) {
            $userRole = $payload['role'] ?? '';
            if (!in_array($userRole, $allowedRoles, true)) {
                http_response_code(403);
                echo json_encode([
                    "success" => false,
                    "message" => "Forbidden. You do not have the required permissions."
                ]);
                exit();
            }
        }

        return $payload;
    }
}