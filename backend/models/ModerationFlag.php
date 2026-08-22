<?php

class ModerationFlag {
    private $qb;
    private $table = 'moderation_flags';
    private $logsTable = 'moderation_logs';

    public function __construct($db, $queryBuilder = null) {
        $this->qb = $queryBuilder ?: new QueryBuilder($db);
    }

    public function getSummaryCounts() {
        $row = $this->qb->table($this->table)
            ->select(
                "SUM(CASE WHEN flag_type = 'REVIEW REPORT' AND status != 'dismissed' THEN 1 ELSE 0 END) AS review_reports",
                "SUM(CASE WHEN flag_type = 'PROFILE FLAG' AND status != 'dismissed' THEN 1 ELSE 0 END) AS profile_flags",
                "SUM(CASE WHEN flag_type = 'FRAUD SIGNAL' AND status != 'dismissed' THEN 1 ELSE 0 END) AS fraud_signals",
                "COUNT(*) AS total_flags"
            )->first();

        return [
            'reviewReports' => intval($row['review_reports'] ?? 0),
            'profileFlags' => intval($row['profile_flags'] ?? 0),
            'fraudSignals' => intval($row['fraud_signals'] ?? 0),
            'totalFlags' => intval($row['total_flags'] ?? 0),
        ];
    }

    public function getAllFlags($status = null, $flagType = null) {
        $query = $this->qb->table($this->table, 'f')
            ->select('f.id', 'f.entity_type', 'f.entity_id', 'f.flag_type', 'f.severity', 'f.reported_by_user', 'f.shop_name', 'f.description', 'f.status', 'f.created_at', 's.isAvailable AS shop_is_available')
            ->leftJoin('shop s', 'f.entity_id', '=', 's.id AND f.entity_type = \'shop\'');

        if ($status && $status !== 'ALL') {
            $query->where('f.status', strtolower($status));
        }

        if ($flagType && $flagType !== 'ALL') {
            $query->where('f.flag_type', $flagType);
        }

        return $query->orderBy('f.created_at', 'DESC')->get();
    }

    public function getById($flagId) {
        $row = $this->qb->table($this->table)
            ->select('id', 'entity_type', 'entity_id', 'shop_name', 'flag_type', 'status')
            ->where('id', $flagId)
            ->first();
        return $row ?: null;
    }

    public function updateStatus($flagId, $newStatus) {
        $this->qb->table($this->table)
            ->where('id', $flagId)
            ->update([
                'status' => $newStatus,
                'updated_at' => QueryBuilder::raw('NOW()')
            ]);
        return true;
    }

    public function logAction($flagId, $adminId, $actionTaken, $notes) {
        $this->qb->table($this->logsTable)->insert([
            'flag_id'      => $flagId,
            'admin_id'     => $adminId,
            'action_taken' => $actionTaken,
            'notes'        => $notes
        ]);
        return true;
    }

    public function submitReport($shopId, $flagType, $reporterName, $shopName, $description) {
        $this->qb->table($this->table)->insert([
            'entity_type' => 'shop',
            'entity_id' => $shopId,
            'flag_type' => $flagType,
            'severity' => 'medium',
            'reported_by_user' => $reporterName,
            'shop_name' => $shopName,
            'description' => $description,
            'status' => 'pending',
            'created_at' => QueryBuilder::raw('NOW()')
        ]);
        return true;
    }
}
?>
