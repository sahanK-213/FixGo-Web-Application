<?php

class Review {
    private $qb;

    public function __construct($db, $queryBuilder = null) {
        $this->qb = $queryBuilder ?: new QueryBuilder($db);
    }

    public function getServiceRequest($serviceRequestId) {
        $row = $this->qb->table('servicerequest')
            ->select('status', 'customer_id', 'shop_id')
            ->where('id', $serviceRequestId)
            ->first();
        return $row ?: false;
    }

    public function findDuplicate($serviceRequestId, $customerId) {
        $row = $this->qb->table('review')
            ->select('id')
            ->where('service_request_id', $serviceRequestId)
            ->where('customer_id', $customerId)
            ->first();
        return $row ?: false;
    }

    public function create($customerId, $shopId, $serviceRequestId, $rating, $comment) {
        return $this->qb->table('review')->insertGetId([
            'customer_id' => $customerId,
            'shop_id' => $shopId,
            'service_request_id' => $serviceRequestId,
            'rating' => $rating,
            'comment' => $comment,
            'created_at' => QueryBuilder::raw('NOW()')
        ]);
    }

    public function getByCustomer($customerId) {
        return $this->qb->table('review', 'r')
            ->select('r.id', 'r.service_request_id', 'r.rating', 'r.comment', 'r.created_at', 's.name AS shop_name', 'sr.vehicle_brand', 'sr.issue_category')
            ->join('shop s', 's.id', '=', 'r.shop_id')
            ->leftJoin('servicerequest sr', 'sr.id', '=', 'r.service_request_id')
            ->where('r.customer_id', $customerId)
            ->orderBy('r.created_at', 'DESC')
            ->get();
    }

    public function getByShop($shopId) {
        return $this->qb->table('review', 'r')
            ->select('r.id', 'r.service_request_id', 'r.rating', 'r.comment', 'r.created_at', 'c.name AS customer_name')
            ->join('customer c', 'c.id', '=', 'r.customer_id')
            ->where('r.shop_id', $shopId)
            ->orderBy('r.created_at', 'DESC')
            ->get();
    }

    public function getShopAverage($shopId) {
        $row = $this->qb->table('review')
            ->select('ROUND(AVG(rating), 1) AS average_rating', 'COUNT(*) AS total_reviews')
            ->where('shop_id', $shopId)
            ->first();
        return $row ?: false;
    }

    public function getGlobalAverageRating() {
        $row = $this->qb->table('review')
            ->select('ROUND(AVG(rating), 1) AS average_rating')
            ->first();
        return $row && $row['average_rating'] !== null ? (float)$row['average_rating'] : 0.0;
    }

    public function createShopNotification($customerId, $shopId, $serviceRequestId) {
        try {
            $userRow = $this->qb->table('customer')
                ->select('name')
                ->where('id', $customerId)
                ->first();
            $customerName = $userRow ? $userRow['name'] : 'A customer';

            $this->qb->table('notification')->insert([
                'user_id' => $shopId,
                'service_request_id' => $serviceRequestId,
                'type' => 'NewReview',
                'title' => 'New Review from ' . $customerName,
                'message' => 'Has submitted a review and rating for your service.',
                'isRead' => 0
            ]);
        } catch (Throwable $t) {}
    }

    public function markCustomerNotificationAsRead($serviceRequestId, $customerId) {
        try {
            $this->qb->table('notification')
                ->where('service_request_id', $serviceRequestId)
                ->where('user_id', $customerId)
                ->update(['isRead' => 1]);
        } catch (Throwable $t) {}
    }

    public function hideReview($reviewId) {
        $this->qb->table('review')
            ->where('id', $reviewId)
            ->update(['status' => 'hidden']);
        return true;
    }
}
?>