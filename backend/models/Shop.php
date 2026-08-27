<?php
class Shop {
    private $qb;
    private $table_name = 'shop'; 

    public function __construct($db, $queryBuilder = null) {
        $this->qb = $queryBuilder ?: new QueryBuilder($db);
    }

    public function getById($shopId) {
        return $this->qb->table('users', 'u')
            ->select([
                'u.id', 'u.email', 's.name', 's.owner', 's.address', 's.contactNumber',
                's.description', 's.openTime', 's.closeTime', 's.isAvailable',
                's.carriageService', 's.BRN', 's.verification_document', 's.is_verified', 's.profileImageURL',
                'ST_Y(s.location) AS latitude', 'ST_X(s.location) AS longitude',
                '(SELECT COALESCE(ROUND(AVG(rating), 1), 0) FROM review WHERE shop_id = s.id) AS averageRating',
                '(SELECT COUNT(*) FROM review WHERE shop_id = s.id) AS reviewCount',
                "GROUP_CONCAT(DISTINCT sc.name SEPARATOR ', ') AS categories",
                "GROUP_CONCAT(DISTINCT vc.name SEPARATOR ', ') AS vehicleCategories"
            ])
            ->join('shop s', 'u.id', '=', 's.id')
            ->leftJoin('shopCategoryMapping scm', 'scm.shop_id', '=', 's.id')
            ->leftJoin('shopCategory sc', 'sc.id', '=', 'scm.shop_category_id')
            ->leftJoin('shopVehicleCategories svc', 'svc.shop_id', '=', 's.id')
            ->leftJoin('vehicleCategory vc', 'vc.id', '=', 'svc.vehicle_category_id')
            ->where('u.id', $shopId)
            ->groupBy('u.id')
            ->groupBy('u.email')
            ->groupBy('s.name')
            ->groupBy('s.owner')
            ->groupBy('s.address')
            ->groupBy('s.contactNumber')
            ->groupBy('s.description')
            ->groupBy('s.openTime')
            ->groupBy('s.closeTime')
            ->groupBy('s.isAvailable')
            ->groupBy('s.carriageService')
            ->groupBy('s.BRN')
            ->groupBy('s.verification_document')
            ->groupBy('s.is_verified')
            ->groupBy('s.profileImageURL')
            ->first();
    }

    public function findNearby($lat, $lng, $radiusInKm, $vehicleCategoryId = null, $shopCategoryId = null, $sortBy = 'distance', $searchName = null, $needs_tow = 'false', $quickFilter = 'all', $currentTime = null) {
        $radiusInMeters = $radiusInKm * 1000;
        $safeLat = (float)$lat;
        $safeLng = (float)$lng;
        
        $query = $this->qb->table($this->table_name, 's')
            ->select([
                's.id', 's.name', 's.address', 's.openTime', 's.closeTime', 's.isAvailable', 's.is_verified', 's.verification_document',
                's.profileImageURL as thumbnail_url', 'ST_Y(s.location) as latitude', 'ST_X(s.location) as longitude',
                "ST_Distance_Sphere(s.location, POINT({$safeLng}, {$safeLat})) AS distance",
                "(SELECT COALESCE(ROUND(AVG(rating), 1), 0) FROM review WHERE shop_id = s.id) as avg_rating",
                "(SELECT COUNT(*) FROM review WHERE shop_id = s.id) as review_count",
                "(SELECT COUNT(*) FROM serviceRequest sr WHERE sr.shop_id = s.id AND sr.status = 'Completed') as services_completed",
                "(SELECT COALESCE(ROUND(AVG(TIMESTAMPDIFF(MINUTE, sr.created_at, sr.accepted_at))), 15) FROM serviceRequest sr WHERE sr.shop_id = s.id AND sr.accepted_at IS NOT NULL) as response_time_minutes",
                "GROUP_CONCAT(DISTINCT sc.name SEPARATOR ', ') as shop_tags",
                "GROUP_CONCAT(DISTINCT vc.name SEPARATOR ', ') as vehicle_tags"
            ])
            ->join('users u', 's.id', '=', 'u.id')
            ->leftJoin('shopCategoryMapping scm', 's.id', '=', 'scm.shop_id')
            ->leftJoin('shopCategory sc', 'scm.shop_category_id', '=', 'sc.id')
            ->leftJoin('shopVehicleCategories svc_all', 's.id', '=', 'svc_all.shop_id')
            ->leftJoin('vehicleCategory vc', 'svc_all.vehicle_category_id', '=', 'vc.id')
            ->where('u.isActive', 1);

        if ($vehicleCategoryId !== null) {
            $query->join('shopVehicleCategories svc_filter', 's.id', '=', 'svc_filter.shop_id');
        }

        $query->whereRaw("ST_Distance_Sphere(s.location, POINT({$safeLng}, {$safeLat})) <= :radius", ['radius' => $radiusInMeters]);

        if ($needs_tow === 'true') {
            $query->where('s.carriageService', 1);
        }

        if ($vehicleCategoryId !== null) {
            $query->where('svc_filter.vehicle_category_id', $vehicleCategoryId);
        }
        if ($shopCategoryId !== null) {
            $query->where('scm.shop_category_id', $shopCategoryId);
        }
        if ($searchName !== null && $searchName !== '') {
            $query->where('s.name', 'LIKE', '%' . $searchName . '%');
        }

        if ($quickFilter === 'open') {
            $query->where('s.isAvailable', 1);
            $query->whereRaw(":currentTime BETWEEN s.openTime AND s.closeTime", ['currentTime' => $currentTime]);
        } elseif ($quickFilter === 'roadside') {
            $query->where('s.carriageService', 1);
        }

        $query->groupBy('s.id');

        if ($quickFilter === 'top_rated') {
            $query->having('avg_rating', '>=', 4.0);
        }

        if ($quickFilter === 'nearest') {
            $query->orderBy('distance', 'ASC');
        } else if ($sortBy === 'rating') {
            $query->orderBy('avg_rating', 'DESC');
            $query->orderBy('distance', 'ASC');
        } else {
            $query->orderBy('distance', 'ASC');
        }

        return $query->execute();
    }

    public function getShopDetails($shopId, $customerId = null) {
        $details = [];

        $info = $this->qb->table('shop', 's')
            ->join('users u', 's.id', '=', 'u.id')
            ->select([
                's.id', 's.name', 's.address', 's.contactNumber as phone', 's.description', 
                's.openTime', 's.closeTime', 's.isAvailable', 's.carriageService', 's.profileImageURL',
                's.verification_document', 's.is_verified',
                "(SELECT COALESCE(ROUND(AVG(TIMESTAMPDIFF(MINUTE, sr.created_at, sr.accepted_at))), 15) FROM serviceRequest sr WHERE sr.shop_id = s.id AND sr.accepted_at IS NOT NULL) as response_time_minutes",
                "ST_Y(s.location) as lat", "ST_X(s.location) as lng"
            ])
            ->where('s.id', $shopId)
            ->where('u.isActive', 1)
            ->first();

        if (!$info) return null;

        $details['isHandshakeComplete'] = false;
        if ($customerId) {
            $handshake = $this->qb->table('serviceRequest')
                ->select('id')
                ->where('customer_id', $customerId)
                ->where('shop_id', $shopId)
                ->whereIn('status', ['Confirmed', 'In Progress', 'Diagnosis', 'Pending Parts'])
                ->first();
            if ($handshake) {
                $details['isHandshakeComplete'] = true;
            }
        }

        $details['shopCategories'] = $this->qb->table('shopCategoryMapping', 'scm')
            ->join('shopCategory sc', 'scm.shop_category_id', '=', 'sc.id')
            ->where('scm.shop_id', $shopId)
            ->pluck('sc.name');

        $isFullyUnlocked = $details['isHandshakeComplete'] || in_array('Spare Parts', $details['shopCategories']);

        if ($isFullyUnlocked) {
            $info['location'] = $info['address'];
            $info['mapQuery'] = ($info['lat'] && $info['lng']) ? $info['lat'] . ',' . $info['lng'] : $info['address'];
        } else {
            $info['phone'] = 'Protected (Available after booking)';
            $addressParts = explode(',', $info['address']);
            $generalizedArea = trim(end($addressParts)); 
            if (count($addressParts) > 1) {
                $generalizedArea = trim($addressParts[count($addressParts)-2]) . ', ' . $generalizedArea;
            }
            $info['location'] = $generalizedArea ;
            
            if ($info['lat'] && $info['lng']) {
                $offsetLat = (mt_rand(-50, 50) / 10000);
                $offsetLng = (mt_rand(-50, 50) / 10000);
                $safeLat = $info['lat'] + $offsetLat;
                $safeLng = $info['lng'] + $offsetLng;
                $info['mapQuery'] = $safeLat . ',' . $safeLng;
            } else {
                $info['mapQuery'] = $generalizedArea;
            }
        }

        unset($info['address']);
        unset($info['lat']);
        unset($info['lng']);
        
        date_default_timezone_set('Asia/Colombo');
        $currentTime = date('H:i:s');
        $isOpen = false;
        $openStatusText = "Temporarily Closed";

        if ($info['isAvailable'] == 1) {
            if ($currentTime >= $info['openTime'] && $currentTime < $info['closeTime']) {
                $isOpen = true;
                $openStatusText = "Open Now";
            } else {
                $openStatusText = "Opens " . date("g:i A", strtotime($info['openTime']));
            }
        }
        $info['is_open_now'] = $isOpen;
        $info['open_status_text'] = $openStatusText;
        $details['info'] = $info;

        $details['services'] = $this->qb->table('shopServices')
            ->select('service_name as name', 'starting_price as price', 'duration', 'category')
            ->where('shop_id', $shopId)
            ->get();

        $details['reviews'] = $this->qb->table('review', 'r')
            ->select([
                'r.rating', 
                'r.comment as summary', 
                "DATE_FORMAT(sr.created_at, '%b %d, %Y') as date", 
                'c.name as name'
            ])
            ->join('customer c', 'r.customer_id', '=', 'c.id')
            ->join('serviceRequest sr', 'r.service_request_id', '=', 'sr.id')
            ->where('r.shop_id', $shopId)
            ->orderBy('sr.created_at', 'DESC')
            ->get();

        $totalReviews = count($details['reviews']);
        $totalStars = 0;
        $recommendCount = 0;
        foreach($details['reviews'] as $rev) {
            $totalStars += $rev['rating'];
            if($rev['rating'] >= 4) $recommendCount++;
        }

        $srData = $this->qb->table('serviceRequest')
            ->select([
                'COUNT(id) as total_requests',
                "SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_requests"
            ])
            ->where('shop_id', $shopId)
            ->first();
        
        $completionRate = 0;
        if ($srData && $srData['total_requests'] > 0) {
            $completionRate = round(($srData['completed_requests'] / $srData['total_requests']) * 100);
        }

        $experience = "1+";
        if (isset($details['info']['established_year']) && !empty($details['info']['established_year'])) {
            $years = date('Y') - intval($details['info']['established_year']);
            $experience = $years > 0 ? $years . "+" : "1st Year";
        }

        $details['stats'] = [
            'jobsCompleted' => $srData['completed_requests'] ?? 0, 
            'averageRating' => $totalReviews > 0 ? round($totalStars / $totalReviews, 1) : 0,
            'yearsExperience' => $experience, 
            'completionRate' => $completionRate . "%", 
            'reviewCount' => $totalReviews,
            'recommendPercentage' => $totalReviews > 0 ? round(($recommendCount / $totalReviews) * 100) : 0
        ];

        $galleryImages = $this->qb->table('shopImage')->where('shop_id', $shopId)->pluck('url') ?: [];
        $details['gallery'] = [];
        
        $profileImg = $details['info']['profileImageURL'] ?? null;
        if (!empty($profileImg)) {
            $details['gallery'][] = $profileImg;
        }
        if (!empty($galleryImages)) {
            $details['gallery'] = array_merge($details['gallery'], $galleryImages);
        }
        unset($details['info']['profileImageURL']);

        $details['vehicleCategories'] = $this->qb->table('shopVehicleCategories', 'svc')
            ->join('vehicleCategory vc', 'svc.vehicle_category_id', '=', 'vc.id')
            ->where('svc.shop_id', $shopId)
            ->pluck('vc.name');

        return $details;
    }

    public function register($userData, $shopData, $categoryId, $vehicleIds) {
        try {
            $this->qb->beginTransaction();

            $userId = $this->qb->table('users')->insertGetId([
                'email' => $userData['email'],
                'userRole' => 'shop_owner',
                'password' => $userData['password'],
                'isActive' => 0,
                'verification_token' => $userData['verification_token'],
                'is_email_verified' => 0,
                'token_expiry' => date('Y-m-d H:i:s', time() + (5 * 60))
            ]);

            $this->qb->table('shop')->insert([
                'id' => $userId,
                'name' => $shopData['name'],
                'address' => $shopData['address'],
                'contactNumber' => $shopData['contactNumber'],
                'owner' => $shopData['owner'],
                'location' => QueryBuilder::raw("ST_GeomFromText('POINT(" . (float)$shopData['longitude'] . " " . (float)$shopData['latitude'] . ")')"),
                'description' => $shopData['description'],
                'openTime' => $shopData['openTime'],
                'closeTime' => $shopData['closeTime'],
                'isAvailable' => 1,
                'carriageService' => $shopData['carriageService'],
                'BRN' => $shopData['BRN'],
                'verification_document' => $shopData['verification_document'] ?? null,
                'is_verified' => 0,
                'profileImageURL' => $shopData['profileImageURL'],
                'default_driver_name' => $shopData['driverName'],
                'default_driver_phone' => $shopData['driverPhone'],
                'default_truck_brand' => $shopData['truckBrand'],
                'default_truck_color' => $shopData['truckColor'],
                'tow_truck_plate' => $shopData['truckPlate']
            ]);

            $this->qb->table('shopCategoryMapping')->insert([
                'shop_id' => $userId,
                'shop_category_id' => $categoryId
            ]);

            foreach ($vehicleIds as $vId) {
                $this->qb->table('shopVehicleCategories')->insert([
                    'shop_id' => $userId,
                    'vehicle_category_id' => $vId
                ]);
            }

            $this->qb->commit();
            return $userId;
        } catch (Exception $e) {
            if ($this->qb->inTransaction()) {
                $this->qb->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Re-registers an unverified user as a shop owner, overwriting their details and resetting the OTP.
     */
    public function reRegister($userId, $userData, $shopData, $categoryId, $vehicleIds) {
        try {
            $this->qb->beginTransaction();

            $this->qb->table('users')->where('id', $userId)->update([
                'userRole' => 'shop_owner',
                'password' => $userData['password'],
                'isActive' => 0,
                'verification_token' => $userData['verification_token'],
                'is_email_verified' => 0,
                'token_expiry' => date('Y-m-d H:i:s', time() + (5 * 60))
            ]);

            $existingShop = $this->qb->table('shop')->where('id', $userId)->first();
            $shopPayload = [
                'name' => $shopData['name'],
                'address' => $shopData['address'],
                'contactNumber' => $shopData['contactNumber'],
                'owner' => $shopData['owner'],
                'location' => QueryBuilder::raw("ST_GeomFromText('POINT(" . (float)$shopData['longitude'] . " " . (float)$shopData['latitude'] . ")')"),
                'description' => $shopData['description'],
                'openTime' => $shopData['openTime'],
                'closeTime' => $shopData['closeTime'],
                'isAvailable' => 1,
                'carriageService' => $shopData['carriageService'],
                'BRN' => $shopData['BRN'],
                'default_driver_name' => $shopData['driverName'],
                'default_driver_phone' => $shopData['driverPhone'],
                'default_truck_brand' => $shopData['truckBrand'],
                'default_truck_color' => $shopData['truckColor'],
                'tow_truck_plate' => $shopData['truckPlate']
            ];

            if (array_key_exists('verification_document', $shopData) && $shopData['verification_document'] !== null) {
                $shopPayload['verification_document'] = $shopData['verification_document'];
                $shopPayload['is_verified'] = 0;
            }

            if (!empty($shopData['profileImageURL'])) {
                $shopPayload['profileImageURL'] = $shopData['profileImageURL'];
            }

            if ($existingShop) {
                $this->qb->table('shop')->where('id', $userId)->update($shopPayload);
            } else {
                $shopPayload['id'] = $userId;
                $this->qb->table('shop')->insert($shopPayload);
            }

            $this->qb->table('shopCategoryMapping')->where('shop_id', $userId)->delete();
            $this->qb->table('shopCategoryMapping')->insert([
                'shop_id' => $userId,
                'shop_category_id' => $categoryId
            ]);

            $this->qb->table('shopVehicleCategories')->where('shop_id', $userId)->delete();
            foreach ($vehicleIds as $vId) {
                $this->qb->table('shopVehicleCategories')->insert([
                    'shop_id' => $userId,
                    'vehicle_category_id' => $vId
                ]);
            }

            $this->qb->commit();
            return $userId;
        } catch (Exception $e) {
            if ($this->qb->inTransaction()) {
                $this->qb->rollBack();
            }
            throw $e;
        }
    }


    public function getTowTruckDetails($shopId) {
        return $this->qb->table('shop')->select([
            'default_driver_name', 'default_driver_phone', 'default_truck_brand',
            'default_truck_color', 'tow_truck_plate'
        ])->where('id', $shopId)->first();
    }

    public function updateShopTowTruckDetails($shopId, $data) {
        $this->qb->table('shop')->where('id', $shopId)->update([
            'carriageService' => 1,
            'default_driver_name' => $data['driverName'],
            'default_driver_phone' => $data['driverPhone'],
            'default_truck_brand' => $data['truckBrand'],
            'default_truck_color' => $data['truckColor'],
            'tow_truck_plate' => $data['truckPlate']
        ]);
        return true;
    }

    public function getGalleryImages($shopId) {
        return $this->qb->table('shopImage')->select('id', 'url')->where('shop_id', $shopId)->orderBy('id', 'DESC')->get();
    }

    public function getGalleryImageCount($shopId) {
        return $this->qb->table('shopImage')->where('shop_id', $shopId)->count();
    }

    public function updateProfileImage($shopId, $imagePath) {
        $this->qb->table('shop')->where('id', $shopId)->update(['profileImageURL' => $imagePath]);
        return true;
    }

    public function addGalleryImage($shopId, $url) {
        return $this->qb->table('shopImage')->insertGetId(['shop_id' => $shopId, 'url' => $url]);
    }

    public function deleteGalleryImage($shopId, $imageId) {
        $img = $this->qb->table('shopImage')->select('url')->where('id', $imageId)->where('shop_id', $shopId)->first();
        if (!$img) return false;

        $success = $this->qb->table('shopImage')->where('id', $imageId)->where('shop_id', $shopId)->delete();
        if ($success && !empty($img['url'])) {
            $filePath = __DIR__ . '/../' . $img['url'];
            if (file_exists($filePath)) {
                @unlink($filePath);
            }
        }
        return (bool)$success;
    }

    public function updateBusinessInfo($shopId, $data, $vehicleCategoryIds) {
        try {
            $this->qb->beginTransaction();

            $this->qb->table('shop')->where('id', $shopId)->update([
                'name' => $data['name'],
                'owner' => $data['owner'],
                'contactNumber' => $data['phone'],
                'address' => $data['address'],
                'BRN' => $data['brn'],
                'openTime' => $data['openTime'],
                'closeTime' => $data['closeTime'],
                'description' => $data['description'],
                'isAvailable' => $data['isAvailable'] ?? 1
            ]);

            $this->qb->table('shopVehicleCategories')->where('shop_id', $shopId)->delete();

            if (!empty($vehicleCategoryIds)) {
                foreach ($vehicleCategoryIds as $vId) {
                    $this->qb->table('shopVehicleCategories')->insert([
                        'shop_id' => $shopId,
                        'vehicle_category_id' => $vId
                    ]);
                }
            }

            $this->qb->commit();
            return true;
        } catch (Exception $e) {
            if ($this->qb->inTransaction()) {
                $this->qb->rollBack();
            }
            throw $e;
        }
    }

    public function getServicesByShopId($shopId) {
        return $this->qb->table('shopServices')
            ->select('id', 'category', 'service_name', 'starting_price', 'duration')
            ->where('shop_id', $shopId)
            ->get();
    }

    public function updateShopServices($shopId, $services) {
        try {
            $this->qb->beginTransaction();

            $this->qb->table('shopServices')->where('shop_id', $shopId)->delete();

            if (!empty($services)) {
                foreach ($services as $svc) {
                    $categoryName = trim($svc['category'] ?? 'General');
                    $serviceName  = trim($svc['service_name'] ?? $svc['name'] ?? '');
                    $priceVal     = trim($svc['starting_price'] ?? $svc['price'] ?? 'Varies');
                    $durationVal  = trim($svc['duration'] ?? 'Varies');

                    if ($serviceName !== '') {
                        $this->qb->table('shopServices')->insert([
                            'shop_id'        => $shopId,
                            'category'       => $categoryName !== '' ? $categoryName : 'General',
                            'service_name'   => $serviceName,
                            'starting_price' => $priceVal !== '' ? $priceVal : 'Varies',
                            'duration'       => $durationVal !== '' ? $durationVal : 'Varies'
                        ]);
                    }
                }
            }

            $this->qb->commit();
            return true;
        } catch (Exception $e) {
            if ($this->qb->inTransaction()) {
                $this->qb->rollBack();
            }
            throw $e;
        }
    }

    public function getActiveCount() {
        return $this->qb->table('shop', 's')
            ->join('users u', 's.id', '=', 'u.id')
            ->where('u.isActive', 1)
            ->where('u.userRole', 'shop_owner')
            ->count();
    }

    public function getCategoryDistribution() {
        $results = $this->qb->table('shop', 's')
            ->select('sc.name as categoryName', 'COUNT(s.id) as shopCount')
            ->join('users u', 's.id', '=', 'u.id')
            ->leftJoin('shopCategoryMapping scm', 's.id', '=', 'scm.shop_id')
            ->leftJoin('shopCategory sc', 'scm.shop_category_id', '=', 'sc.id')
            ->where('u.isActive', 1)
            ->where('u.userRole', 'shop_owner')
            ->groupBy('sc.name')
            ->orderBy('shopCount', 'DESC')
            ->get();
            
        $formatted = [];
        foreach ($results as $row) {
            $formatted[] = [
                'name' => $row['categoryName'] ?: 'Uncategorized',
                'value' => (int)$row['shopCount']
            ];
        }
        return $formatted;
    }

    public function updateAvailability($shopId, $isAvailable) {
        $this->qb->table('shop')
            ->where('id', $shopId)
            ->update(['isAvailable' => $isAvailable]);
        return true;
    }

    public function approveShop(int $shopId): string {
        $stmt = $this->qb->table('users')
            ->where('id', $shopId)
            ->where('userRole', 'shop_owner')
            ->where('is_email_verified', 1)
            ->update(['isActive' => 1]);

        if ($stmt->rowCount() > 0) {
            // Check if this shop has uploaded a verification document
            $shop = $this->qb->table('shop')->where('id', $shopId)->select(['verification_document'])->first();
            if ($shop && !empty($shop['verification_document'])) {
                $this->qb->table('shop')->where('id', $shopId)->update(['is_verified' => 1]);
            }
            return 'approved';
        }

        $row = $this->qb->table('users')->where('id', $shopId)->where('userRole', 'shop_owner')->select('isActive')->first();
        if ($row && $row['isActive'] == 1) {
            return 'already_active';
        }

        return 'not_found';
    }

    public function getPendingApprovals(): array {
        return $this->qb->table('users', 'u')
            ->select([
                'u.id', 'u.email', 'u.is_email_verified', 's.name AS shopName',
                's.owner AS ownerName', 's.address', 's.contactNumber', 's.description',
                's.openTime', 's.closeTime', 's.carriageService', 's.BRN', 's.verification_document', 's.is_verified', 's.profileImageURL',
                "GROUP_CONCAT(DISTINCT sc.name  SEPARATOR ', ') AS category",
                "GROUP_CONCAT(DISTINCT vc.name  SEPARATOR ', ') AS vehicleCategories"
            ])
            ->join('shop s', 's.id', '=', 'u.id')
            ->leftJoin('shopCategoryMapping scm', 'scm.shop_id', '=', 's.id')
            ->leftJoin('shopCategory sc', 'sc.id', '=', 'scm.shop_category_id')
            ->leftJoin('shopVehicleCategories svc', 'svc.shop_id', '=', 's.id')
            ->leftJoin('vehicleCategory vc', 'vc.id', '=', 'svc.vehicle_category_id')
            ->where('u.userRole', 'shop_owner')
            ->where('u.is_email_verified', 1)
            ->where('u.isActive', 0)
            ->where('u.email', 'NOT LIKE', 'deleted_%')
            ->groupBy('u.id')
            ->groupBy('s.name')
            ->groupBy('s.owner')
            ->groupBy('s.address')
            ->groupBy('s.contactNumber')
            ->groupBy('s.description')
            ->groupBy('s.openTime')
            ->groupBy('s.closeTime')
            ->groupBy('s.carriageService')
            ->groupBy('s.BRN')
            ->groupBy('s.verification_document')
            ->groupBy('s.is_verified')
            ->groupBy('s.profileImageURL')
            ->orderBy('u.id', 'DESC')
            ->get();
    }

    public function verifyPassword($shopId, $currentPassword) {
        $user = $this->qb->table('users')->select('password')->where('id', $shopId)->first();
        if (!$user) return false;
        return password_verify($currentPassword, $user['password']);
    }

    public function isEmailTaken($email, $excludeUserId) {
        return (bool)$this->qb->table('users')->select('id')->where('email', $email)->where('id', '!=', $excludeUserId)->first();
    }

    public function updatePassword($shopId, $newPassword) {
        $this->qb->table('users')->where('id', $shopId)->update([
            'password' => password_hash($newPassword, PASSWORD_DEFAULT)
        ]);
        return true;
    }

    public function getProfileImageURL($shopId) {
        $row = $this->qb->table('shop')->select('profileImageURL')->where('id', $shopId)->first();
        return $row ? $row['profileImageURL'] : null;
    }

    public function getActiveSparePartsShopCount() {
        return $this->qb->table('shop', 's')
            ->join('users u', 's.id', '=', 'u.id')
            ->join('shopCategoryMapping scm', 's.id', '=', 'scm.shop_id')
            ->where('u.isActive', 1)
            ->where('u.userRole', 'shop_owner')
            ->where('scm.shop_category_id', 3)
            ->count();
    }
}
?>