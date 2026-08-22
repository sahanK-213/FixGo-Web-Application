<?php

require_once __DIR__ . '/../models/BillingConfiguration.php';
require_once __DIR__ . '/../models/ShopInvoice.php';
require_once __DIR__ . '/../models/Shop.php';
require_once __DIR__ . '/../models/userRole.php';
require_once __DIR__ . '/../config/EmailSender.php';

class BillingController {

    private $db;

    // shopCategory IDs — must match seeded data in shopCategory table
    private const CAT_GARAGE         = 1;
    private const CAT_SERVICE_CENTER  = 2;
    private const CAT_SPARE_PARTS    = 3;

    public function __construct($db) {
        $this->db = $db;
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    private function generateInvoiceReference(int $year, int $month, int $shopId): string {
        $rand = strtoupper(bin2hex(random_bytes(2)));
        return sprintf('INV-%04d%02d-%d-%s', $year, $month, $shopId, $rand);
    }

    private function getGracePeriod(array $config, int $categoryId): int {
        return match ($categoryId) {
            self::CAT_GARAGE         => (int)$config['garageGracePeriodDays'],
            self::CAT_SERVICE_CENTER => (int)$config['serviceCenterGracePeriodDays'],
            self::CAT_SPARE_PARTS    => (int)$config['sparePartsGracePeriodDays'],
            default                  => 14,
        };
    }

    private function getActiveShopCount(): int {
        $shopModel = new Shop($this->db);
        return $shopModel->getActiveCount();
    }

    private function getActiveSparePartsShopCount(): int {
        $shopModel = new Shop($this->db);
        return $shopModel->getActiveSparePartsShopCount();
    }

    // ============================================================
    // ADMIN: GET billing configuration
    // ============================================================

    public function getRates(): void {
        RequestValidator::enforceMethod('GET');
        $model  = new BillingConfiguration($this->db);
        $config = $model->get();

        http_response_code(200);
        echo json_encode(["success" => true, "data" => $config]);
    }

    // ============================================================
    // ADMIN: UPDATE billing configuration
    // ============================================================

    public function updateRates(int $adminId): void {
        RequestValidator::enforceMethod('POST');

        $data = RequestValidator::getJsonPayload();

        $allowed = [
            'garagePerRequestFee', 'serviceCenterPerRequestFee', 'sparePartsMonthlyFee',
            'garageGracePeriodDays', 'serviceCenterGracePeriodDays', 'sparePartsGracePeriodDays',
        ];

        $validated = [];
        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                if (!is_numeric($data[$field]) || $data[$field] < 0) {
                    http_response_code(400);
                    echo json_encode(["success" => false, "message" => "Invalid value for field: $field"]);
                    return;
                }
                $validated[$field] = $data[$field];
            }
        }

        if (empty($validated)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "No valid fields provided."]);
            return;
        }

        $model = new BillingConfiguration($this->db);
        $model->update($validated, $adminId);

        http_response_code(200);
        echo json_encode(["success" => true, "message" => "Billing rates updated successfully."]);
    }

    // ============================================================
    // ADMIN: GENERATE draft invoices for a billing period
    // ============================================================

    public function generateDrafts(): void {
        RequestValidator::enforceMethod('POST');

        $data = RequestValidator::getJsonPayload();
        if (!isset($data['year'], $data['month'])) {
            http_response_code(400);
            echo json_encode(["message" => "Required fields: year, month."]);
            return;
        }

        $year  = (int)$data['year'];
        $month = (int)$data['month'];

        if ($year < 2024 || $month < 1 || $month > 12) {
            http_response_code(400);
            echo json_encode(["message" => "Invalid year or month value."]);
            return;
        }

        $invoiceModel = new ShopInvoice($this->db);
        $configModel  = new BillingConfiguration($this->db);

        if ($invoiceModel->existsForPeriod($year, $month)) {
            http_response_code(409);
            echo json_encode(["success" => false, "message" => "Invoices for this period already exist."]);
            return;
        }

        $config = $configModel->get();
        $shops  = $invoiceModel->getShopsForBilling();

        if (empty($shops)) {
            http_response_code(200);
            echo json_encode(["success" => true, "message" => "No shops to bill.", "invoicesCreated" => 0]);
            return;
        }

        $this->db->beginTransaction();
        try {
            $created = 0;
            foreach ($shops as $shop) {
                $catId  = (int)$shop['shopCategoryId'];
                $shopId = (int)$shop['shopId'];

                if ($catId === self::CAT_SPARE_PARTS) {
                    $rate     = (float)$config['sparePartsMonthlyFee'];
                    $requests = 0;
                    $amount   = $rate;
                } else {
                    $rate = ($catId === self::CAT_GARAGE)
                        ? (float)$config['garagePerRequestFee']
                        : (float)$config['serviceCenterPerRequestFee'];

                    $requests = $invoiceModel->countCompletedRequests($shopId, $year, $month);
                    $amount   = $rate * $requests;
                }

                $invoiceModel->insertDraft([
                    'shopId'             => $shopId,
                    'billingPeriodYear'  => $year,
                    'billingPeriodMonth' => $month,
                    'shopCategoryId'     => $catId,
                    'rateSnapshot'       => $rate,
                    'completedRequests'  => $requests,
                    'totalAmount'        => $amount,
                    'invoiceReference'   => $this->generateInvoiceReference($year, $month, $shopId),
                ]);
                $created++;
            }

            $this->db->commit();
            http_response_code(200);
            echo json_encode([
                "success"         => true,
                "message"         => "Draft invoices generated successfully.",
                "invoicesCreated" => $created,
            ]);
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // ============================================================
    // ADMIN: GET draft invoices for the review panel
    // ============================================================

    public function getDrafts(array $queryParams): void {
        RequestValidator::enforceMethod('GET');

        $year  = isset($queryParams['year'])  ? (int)$queryParams['year']  : null;
        $month = isset($queryParams['month']) ? (int)$queryParams['month'] : null;

        $model  = new ShopInvoice($this->db);
        $drafts = $model->getDrafts($year, $month);

        http_response_code(200);
        echo json_encode(["success" => true, "data" => $drafts]);
    }

    // ============================================================
    // ADMIN: CLEAR all draft invoices for a specific period
    // ============================================================

    public function clearDrafts(): void {
        RequestValidator::enforceMethod('POST');

        $data = RequestValidator::getJsonPayload();
        if (!isset($data['year'], $data['month'])) {
            http_response_code(400);
            echo json_encode(["message" => "Required fields: year, month."]);
            return;
        }

        $year  = (int)$data['year'];
        $month = (int)$data['month'];

        if ($year < 2024 || $month < 1 || $month > 12) {
            http_response_code(400);
            echo json_encode(["message" => "Invalid year or month value."]);
            return;
        }

        $invoiceModel = new ShopInvoice($this->db);
        $invoiceModel->clearDrafts($year, $month);

        http_response_code(200);
        echo json_encode([
            "success" => true, 
            "message" => "Draft invoices cleared successfully."
        ]);
    }

    // ============================================================
    // ADMIN: DISPATCH all drafts for a period
    // ============================================================

    public function dispatchInvoices(): void {
        RequestValidator::enforceMethod('POST');

        $data = RequestValidator::getJsonPayload();
        if (!isset($data['year'], $data['month'])) {
            http_response_code(400);
            echo json_encode(["message" => "Required fields: year, month."]);
            return;
        }

        $year  = (int)$data['year'];
        $month = (int)$data['month'];

        if ($year < 2024 || $month < 1 || $month > 12) {
            http_response_code(400);
            echo json_encode(["message" => "Invalid year or month value."]);
            return;
        }

        $invoiceModel = new ShopInvoice($this->db);
        $configModel  = new BillingConfiguration($this->db);

        $drafts = $invoiceModel->getDraftsForDispatch($year, $month);

        if (empty($drafts)) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "No draft invoices found for this period."]);
            return;
        }

        $config = $configModel->get();

        $this->db->beginTransaction();
        try {
            foreach ($drafts as $inv) {
                if ((float)$inv['totalAmount'] == 0) {
                    $invoiceModel->ignore((int)$inv['id']);
                } else {
                    $graceDays = $this->getGracePeriod($config, (int)$inv['shopCategoryId']);
                    $invoiceModel->dispatch((int)$inv['id'], $graceDays);
                }
            }
            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        // Send emails AFTER commit — email failure must not roll back the dispatched state
        $emailsSent = 0;
        foreach ($drafts as $inv) {
            if ((float)$inv['totalAmount'] > 0 && !empty($inv['shopEmail'])) {
                $graceDays = $this->getGracePeriod($config, (int)$inv['shopCategoryId']);
                $sent = EmailSender::sendInvoiceEmail($inv['shopEmail'], $inv['shopName'], [
                    'invoiceReference'   => $inv['invoiceReference'],
                    'billingPeriodYear'  => $inv['billingPeriodYear'],
                    'billingPeriodMonth' => $inv['billingPeriodMonth'],
                    'totalAmount'        => $inv['totalAmount'],
                    'dueDate'            => date('Y-m-d', strtotime("+{$graceDays} days")),
                ]);
                if ($sent) {
                    $emailsSent++;
                    // Add a 0.5 second delay to prevent triggering Google's Anti-Spam lock during batch dispatch
                    usleep(500000); 
                }
            }
        }

        http_response_code(200);
        echo json_encode([
            "success"    => true,
            "message"    => "Invoices dispatched successfully.",
            "dispatched" => count($drafts),
            "emailsSent" => $emailsSent,
        ]);
    }

    // ============================================================
    // ADMIN: GET full invoice ledger for a specific shop
    // ============================================================

    public function getShopLedger(array $queryParams): void {
        RequestValidator::enforceMethod('GET');

        if (empty($queryParams['shopId'])) {
            http_response_code(400);
            echo json_encode(["message" => "Query parameter 'shopId' is required."]);
            return;
        }

        $shopId = (int)$queryParams['shopId'];
        $model  = new ShopInvoice($this->db);
        $ledger = $model->getLedgerByShop($shopId);

        http_response_code(200);
        echo json_encode(["success" => true, "data" => $ledger]);
    }

    // ============================================================
    // ADMIN: GET all invoices across all shops (global ledger)
    // Optional GET params: shopId, status, year, month
    // ============================================================

    public function getAllInvoices(array $queryParams): void {
        RequestValidator::enforceMethod('GET');

        $filters = [];
        if (!empty($queryParams['shopId']))  $filters['shopId']  = $queryParams['shopId'];
        if (!empty($queryParams['status']))  $filters['status']  = $queryParams['status'];
        if (!empty($queryParams['year']))    $filters['year']    = $queryParams['year'];
        if (!empty($queryParams['month']))   $filters['month']   = $queryParams['month'];

        $model = new ShopInvoice($this->db);
        $data  = $model->getAllInvoices($filters);

        http_response_code(200);
        echo json_encode(["success" => true, "data" => $data, "count" => count($data)]);
    }


    // ============================================================
    // ADMIN: GET pending verification queue
    // ============================================================

    public function getPendingVerifications(): void {
        RequestValidator::enforceMethod('GET');
        $model   = new ShopInvoice($this->db);
        $pending = $model->getPendingVerifications();

        http_response_code(200);
        echo json_encode(["success" => true, "data" => $pending]);
    }

    // ============================================================
    // ADMIN: PROCESS a payment verification (approve / reject)
    // ============================================================

    public function processVerification(int $adminId): void {
        RequestValidator::enforceMethod('POST');

        $data = RequestValidator::getJsonPayload();
        if (!isset($data['invoiceId'], $data['action'])) {
            http_response_code(400);
            echo json_encode(["message" => "Required fields: invoiceId, action."]);
            return;
        }

        $invoiceId = (int)$data['invoiceId'];
        $action    = (string)$data['action'];
        $reason    = isset($data['reason']) ? (string)$data['reason'] : null;

        if (!in_array($action, ['approve', 'reject'], true)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Action must be 'approve' or 'reject'."]);
            return;
        }
        if ($action === 'reject' && empty(trim($reason ?? ''))) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "A rejection reason is required."]);
            return;
        }

        $model   = new ShopInvoice($this->db);
        $invoice = $model->findPendingVerification($invoiceId);

        if (!$invoice) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Invoice not found or not in Verification Pending state."]);
            return;
        }

        $this->db->beginTransaction();
        try {
            if ($action === 'approve') {
                $model->markPaid($invoiceId, $adminId);
                $userModel = new User($this->db);
                $userModel->activateUser($invoice['shopId']);
            } else {
                $model->rejectVerification($invoiceId, trim($reason));
            }
            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        // Post-commit: fire rejection email
        if ($action === 'reject' && !empty($invoice['shopEmail'])) {
            EmailSender::sendRejectionEmail($invoice['shopEmail'], $invoice['shopName'], [
                'invoiceReference'   => $invoice['invoiceReference'],
                'billingPeriodYear'  => $invoice['billingPeriodYear'],
                'billingPeriodMonth' => $invoice['billingPeriodMonth'],
                'totalAmount'        => $invoice['totalAmount'],
                'dueDate'            => $invoice['dueDate'],
            ], trim($reason));
        }

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Invoice " . ($action === 'approve' ? 'approved' : 'rejected') . " successfully.",
        ]);
    }

    // ============================================================
    // ADMIN: GET analytics (KPIs + revenue chart + collection health)
    // ============================================================

    public function getAnalytics(): void {
        RequestValidator::enforceMethod('GET');
        $invoiceModel = new ShopInvoice($this->db);
        $configModel  = new BillingConfiguration($this->db);

        $config = $configModel->get();

        // --- KPI: Active shops ---
        $activeShops = $this->getActiveShopCount();

        // --- KPI: MRR ---
        $activeSpareShops = $this->getActiveSparePartsShopCount();
        $mrr              = $activeSpareShops * (float)$config['sparePartsMonthlyFee'];

        // --- KPI: Projected current month revenue ---
        $curYear  = (int)date('Y');
        $curMonth = (int)date('n');

        $volumeRows       = $invoiceModel->getCurrentMonthVolumeByCategory(
            $curYear, $curMonth, [self::CAT_GARAGE, self::CAT_SERVICE_CENTER]
        );
        $projectedRevenue = $mrr;
        foreach ($volumeRows as $row) {
            $rate = (int)$row['shop_category_id'] === self::CAT_GARAGE
                ? (float)$config['garagePerRequestFee']
                : (float)$config['serviceCenterPerRequestFee'];
            $projectedRevenue += $row['cnt'] * $rate;
        }

        // --- Revenue chart (last 12 months, Paid invoices) ---
        $rawChart = $invoiceModel->getRevenueChartData();
        $chartMap = [];
        foreach ($rawChart as $row) {
            $key = $row['billingPeriodYear'] . '-' . str_pad($row['billingPeriodMonth'], 2, '0', STR_PAD_LEFT);
            if (!isset($chartMap[$key])) {
                $chartMap[$key] = [
                    'year'        => $row['billingPeriodYear'],
                    'month'       => $row['billingPeriodMonth'],
                    'monthLabel'  => date('M Y', mktime(0, 0, 0, $row['billingPeriodMonth'], 1, $row['billingPeriodYear'])),
                    'garages'       => 0,
                    'serviceCenters'=> 0,
                    'spareParts'    => 0,
                ];
            }
            $catKey = match ((int)$row['shopCategoryId']) {
                self::CAT_GARAGE         => 'garages',
                self::CAT_SERVICE_CENTER => 'serviceCenters',
                self::CAT_SPARE_PARTS    => 'spareParts',
                default                  => 'other',
            };
            $chartMap[$key][$catKey] = (float)$row['revenue'];
        }

        // --- Collection health (pie chart) ---
        $healthRaw = $invoiceModel->getCollectionHealth();
        $healthAll = [];
        $healthMonths = [];
        
        foreach ($healthRaw as $row) {
            $status = $row['invoiceStatus'];
            $amt = (float)$row['amount'];
            $cnt = (int)$row['cnt'];
            $year = (int)$row['billingPeriodYear'];
            $month = (int)$row['billingPeriodMonth'];
            $label = date('M Y', mktime(0, 0, 0, $month, 1, $year));
            
            // Global aggregation
            if (!isset($healthAll[$status])) $healthAll[$status] = ['count' => 0, 'amount' => 0];
            $healthAll[$status]['count'] += $cnt;
            $healthAll[$status]['amount'] += $amt;
            
            // Month aggregation
            if (!isset($healthMonths[$label])) {
                $healthMonths[$label] = ['label' => $label, 'data' => []];
            }
            if (!isset($healthMonths[$label]['data'][$status])) {
                $healthMonths[$label]['data'][$status] = ['count' => 0, 'amount' => 0];
            }
            $healthMonths[$label]['data'][$status]['count'] += $cnt;
            $healthMonths[$label]['data'][$status]['amount'] += $amt;
        }
        
        $health = [
            'all_time' => $healthAll,
            'months'   => array_values($healthMonths)
        ];

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "data"    => [
                "kpis" => [
                    "projectedRevenue" => round($projectedRevenue, 2),
                    "mrr"              => round($mrr, 2),
                    "activeShops"      => $activeShops,
                ],
                "revenueChart"     => array_values($chartMap),
                "collectionHealth" => $health,
            ],
        ]);
    }

    // ============================================================
    // SHOP OWNER: GET own invoices (Draft excluded)
    // ============================================================

    public function getOwnerInvoices(int $shopId): void {
        RequestValidator::enforceMethod('GET');
        $model    = new ShopInvoice($this->db);
        $invoices = $model->getOwnerInvoices($shopId);

        $bankDetails = [
            'bankName'      => getenv('BANK_NAME')           ?: 'Bank of Ceylon',
            'accountName'   => getenv('BANK_ACCOUNT_NAME')   ?: 'FixGo Pvt Ltd',
            'accountNumber' => getenv('BANK_ACCOUNT_NUMBER') ?: 'N/A',
            'branch'        => getenv('BANK_BRANCH')         ?: 'Colombo',
        ];

        http_response_code(200);
        echo json_encode(["success" => true, "data" => $invoices, "bankDetails" => $bankDetails]);
    }

    // ============================================================
    // SHOP OWNER: SUBMIT payment slip
    // ============================================================

    public function submitPaymentSlip(int $shopId): void {
        RequestValidator::enforceMethod('POST');

        $input = RequestValidator::getPostPayload();

        if (empty($input['invoiceId']) || empty($input['paymentReference'])) {
            http_response_code(400);
            echo json_encode(["message" => "Required fields: invoiceId, paymentReference."]);
            return;
        }

        $invoiceId        = (int)$input['invoiceId'];
        $paymentReference = trim($input['paymentReference']);

        $model   = new ShopInvoice($this->db);
        $invoice = $model->findPayable($invoiceId, $shopId);

        if (!$invoice) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Invoice not found or not eligible for payment submission."]);
            return;
        }

        $uploadDir = __DIR__ . '/../uploads/paymentSlips/';
        $prefix = 'slip_' . $invoiceId . '_';
        $slipUrl = RequestValidator::handleFileUpload('paymentSlip', $uploadDir, $prefix, 'uploads/paymentSlips/', ['jpg', 'jpeg', 'png', 'pdf']);

        $this->db->beginTransaction();
        try {
            $model->submitPaymentSlip($invoiceId, $slipUrl, $paymentReference);
            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            $destPath = __DIR__ . '/../' . $slipUrl;
            @unlink($destPath);
            throw $e;
        }

        http_response_code(200);
        echo json_encode(["success" => true, "message" => "Payment slip submitted. Your invoice is now under review."]);
    }
}
