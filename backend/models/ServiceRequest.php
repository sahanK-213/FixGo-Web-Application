<?php
class ServiceRequest {
    private $qb;
    private $table_name = 'servicerequest';

    public function __construct($db, $queryBuilder = null) {
        $this->qb = $queryBuilder ?: new QueryBuilder($db);
    }

    public function hasPendingRequest($customerId, $shopId) {
        return (bool) $this->qb->table($this->table_name)
            ->select('id')
            ->where('customer_id', $customerId)
            ->where('shop_id', $shopId)
            ->where('status', 'Pending')
            ->first();
    }

    public function create($data) {
        $lat = isset($data['lat']) ? (float)$data['lat'] : 0;
        $lng = isset($data['lng']) ? (float)$data['lng'] : 0;
        
        $insertId = $this->qb->table($this->table_name)->insertGetId([
            'customer_id' => htmlspecialchars(strip_tags($data['customer_id'])),
            'shop_id' => htmlspecialchars(strip_tags($data['shop_id'])),
            'vehicle_category_id' => htmlspecialchars(strip_tags($data['vehicle_category_id'])),
            'vehicle_brand' => htmlspecialchars(strip_tags($data['vehicle_brand'] ?? 'Unknown')),
            'vehicle_color' => htmlspecialchars(strip_tags($data['vehicle_color'] ?? 'Unknown')),
            'description' => htmlspecialchars(strip_tags($data['description'] ?? '')),
            'requires_tow' => !empty($data['requires_tow']) ? 1 : 0,
            'photo' => $data['photo'] ?? null,
            'location' => QueryBuilder::raw("ST_GeomFromText('POINT({$lng} {$lat})')"),
            'status' => 'Pending',
            'urgency_level' => htmlspecialchars(strip_tags($data['urgency_level'] ?? 'Normal')),
            'issue_category' => isset($data['issue_category']) ? htmlspecialchars(strip_tags($data['issue_category'])) : null,
            'pickup_landmark' => isset($data['pickup_landmark']) ? htmlspecialchars(strip_tags($data['pickup_landmark'])) : null,
            'preferred_date' => isset($data['preferred_date']) ? htmlspecialchars(strip_tags($data['preferred_date'])) : null,
            'preferred_time' => isset($data['preferred_time']) ? htmlspecialchars(strip_tags($data['preferred_time'])) : null
        ]);
        
        return $insertId ? $insertId : false;
    }

    public function getById($request_id) {
        return $this->qb->table($this->table_name)->where('id', $request_id)->first();
    }

    public function hasAPendingRequest($customer_id, $shop_id) {
        return (bool) $this->qb->table($this->table_name)
            ->select('id')
            ->where('customer_id', $customer_id)
            ->where('shop_id', $shop_id)
            ->whereIn('status', ['Pending', 'Accepted'])
            ->first();
    }

    public function getActiveBroadcastCount($customer_id) {
        return $this->qb->table($this->table_name)
            ->where('customer_id', $customer_id)
            ->whereIn('status', ['Pending', 'Accepted'])
            ->count();
    }

    public function updateStatus($request_id, $new_status) {
        $update = ['status' => $new_status];
        if ($new_status === 'Accepted')  $update['accepted_at'] = QueryBuilder::raw('NOW()');
        if ($new_status === 'Confirmed') $update['confirmed_at'] = QueryBuilder::raw('NOW()');
        if ($new_status === 'Completed') $update['completed_at'] = QueryBuilder::raw('NOW()');
        
        $this->qb->table($this->table_name)->where('id', $request_id)->update($update);
        return true;
    }

    public function cancelRequest($request_id, $cancelled_by, $reason) {
        $this->qb->table($this->table_name)->where('id', $request_id)->update([
            'status' => 'Cancelled',
            'cancelled_at' => QueryBuilder::raw('NOW()'),
            'cancelled_by' => $cancelled_by,
            'cancellation_reason' => $reason
        ]);
        return true;
    }

    public function declineRequest($request_id, $reason) {
        $this->qb->table($this->table_name)->where('id', $request_id)->update([
            'status' => 'Declined',
            'cancelled_at' => QueryBuilder::raw('NOW()'),
            'cancelled_by' => 'Shop',
            'cancellation_reason' => $reason
        ]);
        return true;
    }

    public function getDeclinedRequestsByShop($shop_id) {
        $results = $this->qb->table($this->table_name, 'sr')
            ->select(['sr.*', 'c.name as customer_name', 'c.contactNumber as customer_phone'])
            ->leftJoin('customer c', 'sr.customer_id', '=', 'c.id')
            ->where('sr.shop_id', $shop_id)
            ->where('sr.status', 'Declined')
            ->orderBy('sr.cancelled_at', 'DESC')
            ->get();
            
        foreach ($results as &$row) unset($row['location']);
        return $results;
    }

    public function getMissedRequestsByShop($shop_id) {
        $results = $this->qb->table($this->table_name, 'sr')
            ->select(['sr.*', 'c.name as customer_name', 'c.contactNumber as customer_phone'])
            ->leftJoin('customer c', 'sr.customer_id', '=', 'c.id')
            ->where('sr.shop_id', $shop_id)
            ->where('sr.status', 'Cancelled')
            ->whereIn('sr.cancelled_by', ['System', 'Customer'])
            ->orderBy('sr.cancelled_at', 'DESC')
            ->get();
            
        foreach ($results as &$row) unset($row['location']);
        return $results;
    }

    private function getWinningRequestData($winning_request_id) {
        return $this->qb->table($this->table_name)
            ->select('created_at', 'vehicle_brand', 'issue_category')
            ->where('id', $winning_request_id)
            ->first();
    }

    public function getCompetingRequests($customer_id, $winning_request_id) {
        $winningData = $this->getWinningRequestData($winning_request_id);
        if (!$winningData) return [];

        return $this->qb->table($this->table_name)
            ->select('id', 'shop_id')
            ->where('customer_id', $customer_id)
            ->where('id', '!=', $winning_request_id)
            ->whereIn('status', ['Pending', 'Accepted'])
            ->where('vehicle_brand', $winningData['vehicle_brand'])
            ->where('issue_category', $winningData['issue_category'])
            ->whereRaw('created_at >= DATE_SUB(:created_at, INTERVAL 30 MINUTE)', ['created_at' => $winningData['created_at']])
            ->whereRaw('created_at <= DATE_ADD(:created_at2, INTERVAL 30 MINUTE)', ['created_at2' => $winningData['created_at']])
            ->get();
    }

    public function cancelCompetingRequests($customer_id, $winning_request_id) {
        $winningData = $this->getWinningRequestData($winning_request_id);
        if (!$winningData) return false;

        $this->qb->table($this->table_name)
            ->where('customer_id', $customer_id)
            ->where('id', '!=', $winning_request_id)
            ->whereIn('status', ['Pending', 'Accepted'])
            ->where('vehicle_brand', $winningData['vehicle_brand'])
            ->where('issue_category', $winningData['issue_category'])
            ->whereRaw('created_at >= DATE_SUB(:created_at, INTERVAL 30 MINUTE)', ['created_at' => $winningData['created_at']])
            ->whereRaw('created_at <= DATE_ADD(:created_at2, INTERVAL 30 MINUTE)', ['created_at2' => $winningData['created_at']])
            ->update([
                'status' => 'Cancelled',
                'cancelled_at' => QueryBuilder::raw('NOW()'),
                'cancelled_by' => 'System',
                'cancellation_reason' => 'Customer confirmed a different shop for this incident.'
            ]);
            
        return true;
    }

    public function cancelStaleRequests() {
        $this->qb->table($this->table_name)
            ->where('status', 'Pending')
            ->whereRaw("(
                (urgency_level = 'Urgent' AND created_at <= DATE_SUB(NOW(), INTERVAL 30 MINUTE))
                OR 
                (urgency_level = 'Normal' AND preferred_date IS NULL AND created_at <= DATE_SUB(NOW(), INTERVAL 24 HOUR))
                OR
                (preferred_date IS NOT NULL AND preferred_date < CURDATE())
            )")
            ->update([
                'status' => 'Cancelled',
                'cancelled_by' => 'System',
                'cancellation_reason' => 'Automatically cancelled due to shop inactivity'
            ]);
    }

    public function getRequestsByCustomer($customer_id) {
        $results = $this->qb->table($this->table_name, 'sr')
            ->select(['sr.*', 's.name as shop_name', 's.contactNumber as shop_phone'])
            ->leftJoin('shop s', 'sr.shop_id', '=', 's.id')
            ->where('sr.customer_id', $customer_id)
            ->orderBy('sr.created_at', 'DESC')
            ->get();

        foreach ($results as &$row) unset($row['location']);
        return $results;
    }

    public function getRequestsByShop($shop_id) {
        $results = $this->qb->table($this->table_name, 'sr')
            ->select([
                'sr.*', 
                'ST_Y(sr.location) AS customer_lat',
                'ST_X(sr.location) AS customer_lng',
                'c.name as customer_name', 
                'c.contactNumber as customer_phone'
            ])
            ->leftJoin('customer c', 'sr.customer_id', '=', 'c.id')
            ->where('sr.shop_id', $shop_id)
            ->whereIn('sr.status', ['Pending', 'Accepted'])
            ->orderBy('sr.created_at', 'DESC')
            ->get();

        foreach ($results as &$row) unset($row['location']);
        return $results;
    }

    public function getConfirmedRequestsByShop($shop_id) {
        return $this->qb->table($this->table_name, 'sr')
            ->select(['sr.id', 'c.name AS customer_name', 'sr.vehicle_brand'])
            ->join('customer c', 'sr.customer_id', '=', 'c.id')
            ->where('sr.shop_id', $shop_id)
            ->where('sr.status', 'Confirmed')
            ->orderBy('sr.confirmed_at', 'DESC')
            ->get();
    }

    public function getActiveRepairsByShop($shop_id) {
        return $this->qb->table($this->table_name, 'sr')
            ->select([
                'sr.id', 'sr.customer_id', 'sr.shop_id', 'sr.vehicle_brand', 'sr.vehicle_color', 
                'sr.issue_category', 'sr.description', 'sr.status', 'sr.urgency_level', 
                'sr.requires_tow', 'sr.pickup_landmark', 'sr.dispatched_driver_phone', 
                'ST_Y(sr.location) AS customer_lat', 'ST_X(sr.location) AS customer_lng',
                'c.name AS customer_name', 'c.contactNumber AS customer_phone'
            ])
            ->leftJoin('customer c', 'sr.customer_id', '=', 'c.id')
            ->where('sr.shop_id', $shop_id)
            ->whereIn('sr.status', ['Confirmed', 'In Progress'])
            ->orderBy('sr.created_at', 'DESC')
            ->get();
    }

    public function updateRepairStatus($request_id, $status) {
        $this->qb->table($this->table_name)->where('id', $request_id)->update(['status' => $status]);
        return true;
    }

    public function getServiceHistoryByShop($shop_id) {
        return $this->qb->table($this->table_name, 'sr')
            ->select([
                'sr.id', 'sr.status', 'sr.vehicle_brand', 'sr.vehicle_color', 'sr.description', 
                'sr.issue_category', 'sr.photo', 'sr.created_at', 'sr.confirmed_at', 'sr.completed_at',
                'c.name AS customer_name', 'c.contactNumber AS customer_phone'
            ])
            ->leftJoin('customer c', 'sr.customer_id', '=', 'c.id')
            ->where('sr.shop_id', $shop_id)
            ->where('sr.status', 'Completed')
            ->orderBy('sr.completed_at', 'DESC')
            ->get();
    }

    public function updateTowTruckDetails($data) {
        $this->qb->table($this->table_name)->where('id', $data['request_id'])->update([
            'dispatched_driver_name' => $data['driver_name'],
            'dispatched_driver_phone' => $data['driver_phone'],
            'dispatched_truck_brand' => $data['truck_brand'],
            'dispatched_truck_color' => $data['truck_color'],
            'dispatched_truck_plate' => $data['truck_plate'],
            'promised_eta' => $data['promised_eta'] ?? null
        ]);
        return true;
    }

    public function getServiceHistoryByCustomer($customer_id) {
        return $this->qb->table($this->table_name, 'sr')
            ->select([
                'sr.id', 'sr.status', 'sr.vehicle_brand', 'sr.vehicle_color', 'sr.description', 
                'sr.issue_category', 'sr.created_at', 'sr.completed_at',
                's.name AS shop_name', 's.address AS shop_address'
            ])
            ->leftJoin('shop s', 'sr.shop_id', '=', 's.id')
            ->where('sr.customer_id', $customer_id)
            ->where('sr.status', 'Completed')
            ->orderBy('sr.completed_at', 'DESC')
            ->get();
    }

    public function getMTDCount() {
        return $this->qb->table($this->table_name)
            ->whereRaw('MONTH(created_at) = MONTH(CURRENT_DATE())')
            ->whereRaw('YEAR(created_at) = YEAR(CURRENT_DATE())')
            ->count();
    }

    public function getDailyVolume($days = 30) {
        $results = $this->qb->table($this->table_name)
            ->select(['DATE(created_at) as date', 'COUNT(id) as count'])
            ->whereRaw('created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL :days DAY)', ['days' => $days])
            ->groupBy('DATE(created_at)')
            ->orderByRaw('date ASC')
            ->get();

        $formatted = [];
        foreach ($results as $row) {
            $formatted[] = [
                'name' => date('M d', strtotime($row['date'])),
                'requests' => (int)$row['count']
            ];
        }
        return $formatted;
    }

    public function getMonthlyVolume() {
        $results = $this->qb->table($this->table_name)
            ->select(["DATE_FORMAT(created_at, '%Y-%m') as month", 'COUNT(id) as count'])
            ->whereRaw('created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)')
            ->groupBy("DATE_FORMAT(created_at, '%Y-%m')")
            ->orderByRaw('month ASC')
            ->get();

        $formatted = [];
        foreach ($results as $row) {
            $dateObj = DateTime::createFromFormat('Y-m', $row['month']);
            $formatted[] = [
                'name' => $dateObj ? $dateObj->format('M Y') : $row['month'],
                'requests' => (int)$row['count']
            ];
        }
        return $formatted;
    }

    public function getTotalCompletedRequests() {
        return $this->qb->table($this->table_name)->where('status', 'Completed')->count();
    }

    public function getDailyVolumeByShop($shop_id, $days = 30) {
        $days = in_array((int)$days, [7, 30, 90], true) ? (int)$days : 30;
        $daysOffset = $days - 1;
        $startDateStr = date('Y-m-d', strtotime("-{$daysOffset} days"));
        $endDateStr   = date('Y-m-d');

        $results = $this->qb->table($this->table_name)
            ->select(['DATE(created_at) as date', 'COUNT(id) as count'])
            ->where('shop_id', $shop_id)
            ->whereRaw('DATE(created_at) >= :start_date', ['start_date' => $startDateStr])
            ->whereRaw('DATE(created_at) <= :end_date', ['end_date' => $endDateStr])
            ->groupBy('DATE(created_at)')
            ->orderByRaw('date ASC')
            ->get();

        $countsByDate = [];
        foreach ($results as $row) {
            $countsByDate[$row['date']] = (int)$row['count'];
        }

        $formatted = [];
        $current = new DateTime($startDateStr);
        $end     = new DateTime($endDateStr);
        $end->modify('+1 day');

        while ($current < $end) {
            $dateKey = $current->format('Y-m-d');
            $name    = $current->format('M d');
            $count   = $countsByDate[$dateKey] ?? 0;

            $formatted[] = [
                'date'     => $dateKey,
                'name'     => $name,
                'requests' => $count
            ];
            $current->modify('+1 day');
        }

        return $formatted;
    }

    public function getMonthlyVolumeByShop($shop_id) {
        $startDateStr = date('Y-m-01', strtotime('-11 months'));

        $results = $this->qb->table($this->table_name)
            ->select(["DATE_FORMAT(created_at, '%Y-%m') as month", 'COUNT(id) as count'])
            ->where('shop_id', $shop_id)
            ->whereRaw('created_at >= :start_date', ['start_date' => $startDateStr])
            ->groupBy("DATE_FORMAT(created_at, '%Y-%m')")
            ->orderByRaw('month ASC')
            ->get();

        $countsByMonth = [];
        foreach ($results as $row) {
            $countsByMonth[$row['month']] = (int)$row['count'];
        }

        $formatted = [];
        $current = new DateTime(date('Y-m-01', strtotime('-11 months')));
        $end     = new DateTime(date('Y-m-01'));
        $end->modify('+1 month');

        while ($current < $end) {
            $monthKey  = $current->format('Y-m');
            $shortName = $current->format('M');
            $fullName  = $current->format('M Y');
            $count     = $countsByMonth[$monthKey] ?? 0;

            $formatted[] = [
                'date'     => $monthKey,
                'name'     => $shortName,
                'fullName' => $fullName,
                'requests' => $count
            ];
            $current->modify('+1 month');
        }

        return $formatted;
    }
}
?>