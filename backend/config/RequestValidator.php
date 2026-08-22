<?php

class RequestValidator {
    /**
     * Enforces the required HTTP method.
     * Halts execution with a 405 response if invalid.
     *
     * @param string|array $allowedMethods e.g., 'POST' or ['POST', 'PUT']
     */
    public static function enforceMethod($allowedMethods) {
        $method = $_SERVER['REQUEST_METHOD'];
        
        if (is_array($allowedMethods)) {
            if (!in_array($method, $allowedMethods)) {
                http_response_code(405);
                echo json_encode([
                    "success" => false, 
                    "message" => "Method not allowed. Expected one of: " . implode(', ', $allowedMethods) . "."
                ]);
                exit();
            }
        } else {
            if ($method !== $allowedMethods) {
                http_response_code(405);
                echo json_encode([
                    "success" => false, 
                    "message" => "Method not allowed. Expected $allowedMethods."
                ]);
                exit();
            }
        }
    }

    /**
     * Reads and decodes JSON from the request body.
     * Halts execution with a 400 response if JSON is malformed.
     *
     * @param bool $asArray Return as associative array (default true)
     * @return mixed
     */
    public static function getJsonPayload($asArray = true) {
        $raw = file_get_contents("php://input");
        if (empty(trim($raw))) {
            return $asArray ? [] : new stdClass();
        }
        $data = json_decode($raw, $asArray);
        
        // Check for JSON decoding errors
        if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid JSON payload."]);
            exit();
        }
        
        return $data ?: ($asArray ? [] : new stdClass());
    }

    /**
     * Safely abstracts $_POST data extraction.
     * Falls back to json_decode if $_POST is empty (to support complex clients).
     *
     * @return array
     */
    public static function getPostPayload() {
        if (!empty($_POST)) {
            return $_POST;
        }
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }

    /**
     * Handles file validation and uploading securely.
     * Halts execution with 400/500 on failure.
     *
     * @param string $fileKey The key in $_FILES
     * @param string $targetDir Absolute path to the directory (will be created if not exists)
     * @param string $prefix Prefix for the unique filename
     * @param string $dbPrefix Prefix for the path saved to the database (e.g. 'uploads/customers/')
     * @param array $allowedExtensions Allowed file extensions
     * @param int $maxSize Maximum file size in bytes
     * @return string The relative database path to the uploaded file
     */
    public static function handleFileUpload($fileKey, $targetDir, $prefix, $dbPrefix, $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'], $maxSize = 5242880) {
        if (!isset($_FILES[$fileKey]) || $_FILES[$fileKey]['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Please upload a valid file for '{$fileKey}'."]);
            exit();
        }

        $file = $_FILES[$fileKey];
        
        if ($file['size'] > $maxSize) {
            http_response_code(400);
            $maxMB = round($maxSize / (1024 * 1024), 1);
            echo json_encode(["success" => false, "message" => "File exceeds the maximum limit of {$maxMB}MB."]);
            exit();
        }

        $fileName = $file['name'];
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        if (!in_array($fileExtension, $allowedExtensions)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid file format. Allowed formats: " . implode(', ', $allowedExtensions) . "."]);
            exit();
        }

        // Strict MIME validation via finfo
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo->file($file['tmp_name']);
        
        $allowedMimes = [];
        if (in_array('jpg', $allowedExtensions) || in_array('jpeg', $allowedExtensions)) $allowedMimes[] = 'image/jpeg';
        if (in_array('png', $allowedExtensions)) $allowedMimes[] = 'image/png';
        if (in_array('webp', $allowedExtensions)) $allowedMimes[] = 'image/webp';
        if (in_array('pdf', $allowedExtensions)) $allowedMimes[] = 'application/pdf';

        if (!in_array($detectedMime, $allowedMimes, true)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid file content detected. Allowed: " . implode(', ', $allowedExtensions) . "."]);
            exit();
        }

        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $uniqueFileName = uniqid($prefix, true) . '.' . $fileExtension;
        $targetFilePath = rtrim($targetDir, '/') . '/' . $uniqueFileName;
        $dbImagePath = rtrim($dbPrefix, '/') . '/' . $uniqueFileName;

        if (!move_uploaded_file($file['tmp_name'], $targetFilePath)) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to save uploaded file."]);
            exit();
        }

        return $dbImagePath;
    }

    /**
     * Handles base64 encoded image uploads securely.
     * Halts execution with 400/500 on failure.
     *
     * @param string $base64String The base64 data string
     * @param string $targetDir Absolute path to the directory
     * @param string $prefix Prefix for the unique filename
     * @param string $dbPrefix Prefix for the path saved to the database
     * @param array $allowedExtensions Allowed file extensions
     * @return string The relative database path to the uploaded file
     */
    public static function handleBase64Upload($base64String, $targetDir, $prefix, $dbPrefix, $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']) {
        if (!preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid base64 string format."]);
            exit();
        }

        $base64Data = substr($base64String, strpos($base64String, ',') + 1);
        $fileExtension = strtolower($type[1]);

        if (!in_array($fileExtension, $allowedExtensions)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid image format. Allowed formats: " . implode(', ', $allowedExtensions) . "."]);
            exit();
        }

        $decodedImage = base64_decode($base64Data);
        if ($decodedImage === false) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Failed to decode base64 image."]);
            exit();
        }

        // Strict MIME validation via finfo
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo->buffer($decodedImage);

        $allowedMimes = [];
        if (in_array('jpg', $allowedExtensions) || in_array('jpeg', $allowedExtensions)) $allowedMimes[] = 'image/jpeg';
        if (in_array('png', $allowedExtensions)) $allowedMimes[] = 'image/png';
        if (in_array('webp', $allowedExtensions)) $allowedMimes[] = 'image/webp';

        if (!in_array($detectedMime, $allowedMimes, true)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid file content detected."]);
            exit();
        }

        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $uniqueFileName = uniqid($prefix, true) . '.' . $fileExtension;
        $targetFilePath = rtrim($targetDir, '/') . '/' . $uniqueFileName;
        $dbImagePath = rtrim($dbPrefix, '/') . '/' . $uniqueFileName;

        if (file_put_contents($targetFilePath, $decodedImage) === false) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to save uploaded photo."]);
            exit();
        }

        return $dbImagePath;
    }
}
