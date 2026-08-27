<?php
require_once __DIR__ . '/../config/JwtHandler.php';

class SearchController {
    private $shopModel;

    public function __construct($db) {
        $this->shopModel = new Shop($db);
        date_default_timezone_set('Asia/Colombo');
    }

    public function handleSearchRequest($requestData) {
        RequestValidator::enforceMethod('GET');
        $lat = isset($requestData['lat']) ? (float) $requestData['lat'] : null;
        $lng = isset($requestData['lng']) ? (float) $requestData['lng'] : null;
        $needs_tow = isset($requestData['needs_tow']) ? $requestData['needs_tow'] : 'false';
        $radius = isset($requestData['radius']) ? (float) $requestData['radius'] : 15;
        
        $vehicleCategory = isset($requestData['vehicle_category']) ? (int) $requestData['vehicle_category'] : null;
        $shopCategory = isset($requestData['shop_category']) ? (int) $requestData['shop_category'] : null;
        $sort = isset($requestData['sort']) ? $requestData['sort'] : 'distance';

        // 1. ADDED: Extract the new 'name' parameter from the GET request
        $searchName = isset($requestData['name']) ? trim($requestData['name']) : null;
        $quickFilter = isset($requestData['quick_filter']) ? $requestData['quick_filter'] : 'all';

        if ($lat === null || $lng === null) {
            http_response_code(400);
            return json_encode(["message" => "Latitude and longitude parameters are required."]);
        }
        $currentTime = date('H:i:s'); // Needed for the 'open_now' SQL calculation

        // 2. CHANGED: Pass $searchName as the 7th argument to the Model
        $stmt = $this->shopModel->findNearby($lat, $lng, $radius, $vehicleCategory, $shopCategory, $sort, $searchName, $needs_tow, $quickFilter, $currentTime);
        $num = $stmt->rowCount();
        
        if ($num > 0) {
            $results = array();
            $results["data"] = array();

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                
                $isOpen = false;
                $openStatusText = "Temporarily Closed";

                if ($row['isAvailable'] == 1) {
                    if ($currentTime >= $row['openTime'] && $currentTime < $row['closeTime']) {
                        $isOpen = true;
                        $openStatusText = "Open Now";
                    } else {
                        $openStatusText = "Opens " . date("g:i A", strtotime($row['openTime']));
                    }
                }

                // CHANGED: Merge the shop tags and vehicle tags into one seamless array for the UI
                $rawShopTags = $row['shop_tags'] ? explode(', ', $row['shop_tags']) : [];
                $rawVehicleTags = $row['vehicle_tags'] ? explode(', ', $row['vehicle_tags']) : [];
                
                // Combine arrays and remove any duplicates or empty values
                $combinedTags = array_unique(array_filter(array_merge($rawVehicleTags, $rawShopTags)));

                $formattedShop = array(
                    "id" => (int) $row['id'],
                    "name" => $row['name'],
                    "location_text" => $row['address'], 
                    "distance_km" => round($row['distance'] / 1000, 2),
                    "avg_rating" => (float) $row['avg_rating'],
                    "review_count" => (int) $row['review_count'],
                    "is_open_now" => $isOpen,
                    "open_status_text" => $openStatusText,
                    "opening_time" => date("g:i A", strtotime($row['openTime'])),
                    "services_completed" => strval($row['services_completed']),
                    "response_time" => $row['response_time_minutes'] . " mins",
                    "thumbnail_url" => $row['thumbnail_url'] ? $row['thumbnail_url'] : 'https://via.placeholder.com/300x200?text=No+Image',
                    "tags" => array_values($combinedTags),
                    "is_verified" => (int)($row['is_verified'] ?? 0) === 1,
                    
                    // ADDED: Pass the coordinates from the SQL row into the JSON output
                    "latitude" => (float) $row['latitude'],
                    "longitude" => (float) $row['longitude']
                );
                
                array_push($results["data"], $formattedShop);
            }

            http_response_code(200);
            return json_encode($results);
        } else {
            http_response_code(404);
            return json_encode(["message" => "No service locations found matching the criteria."]);
        }
    }
}
?>