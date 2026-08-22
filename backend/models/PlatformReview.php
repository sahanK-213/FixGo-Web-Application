<?php

class PlatformReview {
    private $qb;

    public function __construct($db, $queryBuilder = null) {
        $this->qb = $queryBuilder ?: new QueryBuilder($db);
    }

    public function submitReview($userId, $rating, $comment) {
        $this->qb->table('platform_reviews')->insert([
            'user_id' => $userId,
            'rating' => $rating,
            'comment' => $comment,
            'created_at' => QueryBuilder::raw('NOW()')
        ]);
        return true;
    }

    public function getReviews() {
        return $this->qb->table('platform_reviews', 'pr')
            ->select([
                'pr.id',
                'pr.rating AS stars',
                'pr.comment AS text',
                'pr.created_at',
                'u.userRole',
                'c.name AS customerName',
                'c.profilePhoto AS customerPhoto',
                'c.address AS customerAddress',
                's.owner AS shopOwnerName',
                's.name AS shopName',
                's.profileImageURL AS shopPhoto',
                's.address AS shopAddress'
            ])
            ->join('users u', 'u.id', '=', 'pr.user_id')
            ->leftJoin('customer c', "c.id = u.id AND u.userRole = 'customer'")
            ->leftJoin('shop s', "s.id = u.id AND u.userRole = 'shop_owner'")
            ->orderBy('pr.rating', 'DESC')
            ->orderBy('pr.created_at', 'DESC')
            ->limit(15)
            ->get();
    }
}
