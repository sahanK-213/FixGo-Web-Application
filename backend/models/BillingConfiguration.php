<?php

class BillingConfiguration {
    private $qb;
    private $table_name = 'billingConfiguration';

    public function __construct($db, $queryBuilder = null) {
        $this->qb = $queryBuilder ?: new QueryBuilder($db);
    }

    // ============================================================
    // Retrieve the single configuration row
    // ============================================================

    public function get(): ?array {
        $row = $this->qb->table($this->table_name)->first();
        return $row ?: null;
    }

    // ============================================================
    // Update one or more rate/grace-period constants
    // Caller is responsible for whitelisting field names.
    // $fields = ['fieldName' => value, ...]
    // ============================================================

    public function update(array $fields, int $adminId): bool {
        $updateData = $fields;
        $updateData['updatedByAdminId'] = $adminId;
        
        $this->qb->table($this->table_name)->where('id', 1)->update($updateData);
        return true;
    }
}
