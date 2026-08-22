<?php

class ShopInvoice {
    private $qb;
    private $table_name = 'shopInvoice';

    public function __construct($db, $queryBuilder = null) {
        $this->qb = $queryBuilder ?: new QueryBuilder($db);
    }

    public function existsForPeriod(int $year, int $month): bool {
        $count = $this->qb->table($this->table_name)
            ->where('billingPeriodYear', $year)
            ->where('billingPeriodMonth', $month)
            ->count();
        return $count > 0;
    }

    public function getShopsForBilling(): array {
        return $this->qb->table('shop', 's')
            ->select('s.id AS shopId', 'scm.shop_category_id AS shopCategoryId')
            ->join('users u', 's.id', '=', 'u.id')
            ->join('shopCategoryMapping scm', 's.id', '=', 'scm.shop_id')
            ->where('u.userRole', 'shop_owner')
            ->groupBy('s.id')
            ->groupBy('scm.shop_category_id')
            ->get();
    }

    public function countCompletedRequests(int $shopId, int $year, int $month): int {
        return $this->qb->table('serviceRequest')
            ->where('shop_id', $shopId)
            ->where('status', 'Completed')
            ->whereRaw('YEAR(completed_at) = :y', ['y' => $year])
            ->whereRaw('MONTH(completed_at) = :m', ['m' => $month])
            ->count();
    }

    public function insertDraft(array $data): bool {
        $this->qb->table($this->table_name)->insert([
            'shopId' => $data['shopId'],
            'billingPeriodYear' => $data['billingPeriodYear'],
            'billingPeriodMonth' => $data['billingPeriodMonth'],
            'shopCategoryId' => $data['shopCategoryId'],
            'rateSnapshot' => $data['rateSnapshot'],
            'completedRequests' => $data['completedRequests'],
            'totalAmount' => $data['totalAmount'],
            'invoiceReference' => $data['invoiceReference'],
            'invoiceStatus' => 'Draft'
        ]);
        return true;
    }

    public function clearDrafts(int $year, int $month): bool {
        $this->qb->table($this->table_name)
            ->where('billingPeriodYear', $year)
            ->where('billingPeriodMonth', $month)
            ->where('invoiceStatus', 'Draft')
            ->delete();
        return true;
    }

    public function getDrafts(?int $year, ?int $month): array {
        $query = $this->qb->table($this->table_name, 'si')
            ->select('si.*', 's.name AS shopName', 'sc.name AS categoryName')
            ->join('shop s', 'si.shopId', '=', 's.id')
            ->join('shopCategory sc', 'si.shopCategoryId', '=', 'sc.id')
            ->where('si.invoiceStatus', 'Draft');

        if ($year) {
            $query->where('si.billingPeriodYear', $year);
        }
        if ($month) {
            $query->where('si.billingPeriodMonth', $month);
        }

        return $query->orderBy('si.billingPeriodYear', 'DESC')
            ->orderBy('si.billingPeriodMonth', 'DESC')
            ->orderBy('s.name', 'ASC')
            ->get();
    }

    public function getDraftsForDispatch(int $year, int $month): array {
        return $this->qb->table($this->table_name, 'si')
            ->select('si.*', 'u.email AS shopEmail', 's.name AS shopName')
            ->join('shop s', 'si.shopId', '=', 's.id')
            ->join('users u', 'si.shopId', '=', 'u.id')
            ->where('si.billingPeriodYear', $year)
            ->where('si.billingPeriodMonth', $month)
            ->where('si.invoiceStatus', 'Draft')
            ->get();
    }

    public function dispatch(int $id, int $graceDays): bool {
        $this->qb->table($this->table_name)
            ->where('id', $id)
            ->update([
                'invoiceStatus' => 'Dispatched',
                'dispatchedAt' => QueryBuilder::raw('NOW()'),
                'dueDate' => QueryBuilder::raw("DATE_ADD(CURDATE(), INTERVAL " . (int)$graceDays . " DAY)")
            ]);
        return true;
    }

    public function ignore(int $id): bool {
        $this->qb->table($this->table_name)
            ->where('id', $id)
            ->update([
                'invoiceStatus' => 'Ignored',
                'dispatchedAt' => QueryBuilder::raw('NOW()')
            ]);
        return true;
    }

    public function getLedgerByShop(int $shopId): array {
        return $this->qb->table($this->table_name, 'si')
            ->select('si.*', 'sc.name AS categoryName')
            ->join('shopCategory sc', 'si.shopCategoryId', '=', 'sc.id')
            ->where('si.shopId', $shopId)
            ->orderBy('si.billingPeriodYear', 'DESC')
            ->orderBy('si.billingPeriodMonth', 'DESC')
            ->get();
    }

    public function getAllInvoices(array $filters = []): array {
        $query = $this->qb->table($this->table_name, 'si')
            ->select('si.*', 's.name AS shopName', 'u.email AS shopEmail', 'sc.name AS shopCategory')
            ->join('shop s', 'si.shopId', '=', 's.id')
            ->join('users u', 'si.shopId', '=', 'u.id')
            ->join('shopCategory sc', 'si.shopCategoryId', '=', 'sc.id');

        if (!empty($filters['shopId'])) {
            $query->where('si.shopId', (int)$filters['shopId']);
        }
        if (!empty($filters['status'])) {
            $query->where('si.invoiceStatus', $filters['status']);
        }
        if (!empty($filters['year'])) {
            $query->where('si.billingPeriodYear', (int)$filters['year']);
        }
        if (!empty($filters['month'])) {
            $query->where('si.billingPeriodMonth', (int)$filters['month']);
        }

        return $query->orderBy('si.billingPeriodYear', 'DESC')
            ->orderBy('si.billingPeriodMonth', 'DESC')
            ->orderBy('s.name', 'ASC')
            ->limit(200)
            ->get();
    }

    public function getPendingVerifications(): array {
        return $this->qb->table($this->table_name, 'si')
            ->select('si.*', 's.name AS shopName', 's.contactNumber', 'u.email AS shopEmail', 'sc.name AS categoryName')
            ->join('shop s', 'si.shopId', '=', 's.id')
            ->join('users u', 'si.shopId', '=', 'u.id')
            ->join('shopCategory sc', 'si.shopCategoryId', '=', 'sc.id')
            ->where('si.invoiceStatus', 'Verification Pending')
            ->orderBy('si.slipSubmittedAt', 'ASC')
            ->get();
    }

    public function findPendingVerification(int $invoiceId): ?array {
        $row = $this->qb->table($this->table_name, 'si')
            ->select('si.*', 'u.email AS shopEmail', 's.name AS shopName')
            ->join('shop s', 'si.shopId', '=', 's.id')
            ->join('users u', 'si.shopId', '=', 'u.id')
            ->where('si.id', $invoiceId)
            ->where('si.invoiceStatus', 'Verification Pending')
            ->first();
        return $row ?: null;
    }

    public function markPaid(int $invoiceId, int $adminId): bool {
        $this->qb->table($this->table_name)
            ->where('id', $invoiceId)
            ->update([
                'invoiceStatus' => 'Paid',
                'verifiedAt' => QueryBuilder::raw('NOW()'),
                'verifiedByAdminId' => $adminId
            ]);
        return true;
    }

    public function rejectVerification(int $invoiceId, string $reason): bool {
        $this->qb->table($this->table_name)
            ->where('id', $invoiceId)
            ->update([
                'invoiceStatus' => 'Dispatched',
                'rejectionReason' => $reason
            ]);
        return true;
    }

    public function getOwnerInvoices(int $shopId): array {
        return $this->qb->table($this->table_name, 'si')
            ->select('si.*', 'sc.name AS categoryName')
            ->join('shopCategory sc', 'si.shopCategoryId', '=', 'sc.id')
            ->where('si.shopId', $shopId)
            ->where('si.invoiceStatus', '!=', 'Draft')
            ->orderBy('si.billingPeriodYear', 'DESC')
            ->orderBy('si.billingPeriodMonth', 'DESC')
            ->get();
    }

    public function findPayable(int $invoiceId, int $shopId): ?array {
        $row = $this->qb->table($this->table_name)
            ->where('id', $invoiceId)
            ->where('shopId', $shopId)
            ->whereIn('invoiceStatus', ['Dispatched', 'Overdue'])
            ->first();
        return $row ?: null;
    }

    public function submitPaymentSlip(int $invoiceId, string $slipUrl, string $paymentReference): bool {
        $this->qb->table($this->table_name)
            ->where('id', $invoiceId)
            ->update([
                'invoiceStatus' => 'Verification Pending',
                'paymentSlipUrl' => $slipUrl,
                'paymentReference' => $paymentReference,
                'slipSubmittedAt' => QueryBuilder::raw('NOW()')
            ]);
        return true;
    }

    public function findOverdueForSweep(): array {
        return $this->qb->table($this->table_name, 'si')
            ->select('si.*', 's.name AS shopName', 'u.email AS shopEmail')
            ->join('shop s', 'si.shopId', '=', 's.id')
            ->join('users u', 'si.shopId', '=', 'u.id')
            ->where('si.invoiceStatus', 'Dispatched')
            ->whereRaw('si.dueDate < CURDATE()')
            ->get();
    }

    public function markOverdue(int $invoiceId): bool {
        $this->qb->table($this->table_name)
            ->where('id', $invoiceId)
            ->update(['invoiceStatus' => 'Overdue']);
        return true;
    }

    public function getRevenueChartData(): array {
        return $this->qb->table($this->table_name)
            ->select('billingPeriodYear', 'billingPeriodMonth', 'shopCategoryId', 'SUM(totalAmount) AS revenue')
            ->where('invoiceStatus', 'Paid')
            ->groupBy('billingPeriodYear')
            ->groupBy('billingPeriodMonth')
            ->groupBy('shopCategoryId')
            ->orderBy('billingPeriodYear', 'DESC')
            ->orderBy('billingPeriodMonth', 'DESC')
            ->limit(36)
            ->get();
    }

    public function getCollectionHealth(): array {
        return $this->qb->table($this->table_name)
            ->select('billingPeriodYear', 'billingPeriodMonth', 'invoiceStatus', 'COUNT(*) AS cnt', 'COALESCE(SUM(totalAmount), 0) AS amount')
            ->whereIn('invoiceStatus', ['Paid', 'Verification Pending', 'Overdue', 'Dispatched'])
            ->groupBy('billingPeriodYear')
            ->groupBy('billingPeriodMonth')
            ->groupBy('invoiceStatus')
            ->orderBy('billingPeriodYear', 'DESC')
            ->orderBy('billingPeriodMonth', 'DESC')
            ->get();
    }

    public function getCurrentMonthVolumeByCategory(int $year, int $month, array $categoryIds): array {
        if (empty($categoryIds)) return [];
        return $this->qb->table('serviceRequest', 'sr')
            ->select('sr.shop_id', 'scm.shop_category_id', 'COUNT(*) AS cnt')
            ->join('shopCategoryMapping scm', 'sr.shop_id', '=', 'scm.shop_id')
            ->where('sr.status', 'Completed')
            ->whereRaw('YEAR(sr.completed_at) = :y', ['y' => $year])
            ->whereRaw('MONTH(sr.completed_at) = :m', ['m' => $month])
            ->whereIn('scm.shop_category_id', $categoryIds)
            ->groupBy('sr.shop_id')
            ->groupBy('scm.shop_category_id')
            ->get();
    }

    public function getPendingInvoiceCount(): int {
        return $this->qb->table($this->table_name)
            ->where('invoiceStatus', 'Verification Pending')
            ->count();
    }

    public function getOverdueInvoiceCount(): int {
        return $this->qb->table($this->table_name)
            ->where('invoiceStatus', 'Overdue')
            ->count();
    }
}
?>
