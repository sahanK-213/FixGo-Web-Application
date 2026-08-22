<?php
class CustomerVehicle {
    private $qb;
    private $table_name = 'customerVehicle';

    public function __construct($db, $queryBuilder = null) {
        $this->qb = $queryBuilder ?: new QueryBuilder($db);
    }

    public function getByCustomer($customer_id) {
        return $this->qb->table($this->table_name)
            ->select('id', 'vehicle_category_id', 'brand', 'color')
            ->where('customer_id', $customer_id)
            ->orderBy('id', 'DESC')
            ->get();
    }

    public function add($data) {
        return $this->qb->table($this->table_name)->insertGetId([
            'customer_id' => $data['customer_id'],
            'vehicle_category_id' => $data['vehicle_category_id'],
            'brand' => $data['brand'],
            'color' => $data['color']
        ]);
    }

    public function update($id, $customer_id, $data) {
        $this->qb->table($this->table_name)
            ->where('id', $id)
            ->where('customer_id', $customer_id)
            ->update([
                'vehicle_category_id' => $data['vehicle_category_id'],
                'brand' => $data['brand'],
                'color' => $data['color']
            ]);
        return true;
    }

    public function delete($id, $customer_id) {
        return $this->qb->table($this->table_name)
            ->where('id', $id)
            ->where('customer_id', $customer_id)
            ->delete();
    }

    public function exists($customer_id, $brand, $color) {
        $result = $this->qb->table($this->table_name)
            ->select('id')
            ->where('customer_id', $customer_id)
            ->whereRaw('LOWER(brand) = LOWER(:brand)', ['brand' => $brand])
            ->whereRaw('LOWER(color) = LOWER(:color)', ['color' => $color])
            ->first();
        return $result !== false && $result !== null;
    }
}
?>
