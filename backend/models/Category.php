<?php
class Category {
    private $qb;

    public function __construct($db, $queryBuilder = null) {
        $this->qb = $queryBuilder ?: new QueryBuilder($db);
    }

    // Fetch Vehicle Categories
    public function getVehicleCategories() {
        return $this->qb->table('vehicleCategory')
            ->select('id', 'name', 'name as label')
            ->orderBy('id', 'ASC')
            ->execute();
    }

    // Fetch Shop Services
    public function getShopServices() {
        return $this->qb->table('shopCategory')
            ->select('id', 'name', 'name as label')
            ->orderBy('id', 'ASC')
            ->execute();
    }

    // ── Shop Categories CRUD ──────────────────────────────────────────

    public function getAllShopCategories() {
        return $this->qb->table('shopCategory')
            ->select('id', 'name', 'description')
            ->orderBy('id', 'ASC')
            ->get();
    }

    public function isShopCategoryNameTaken($name, $excludeId = null) {
        $query = $this->qb->table('shopCategory')
            ->select('id')
            ->whereRaw('LOWER(name) = LOWER(:name)', ['name' => trim($name)]);
            
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        return (bool)$query->first();
    }

    public function addShopCategory($name, $description = '') {
        return $this->qb->table('shopCategory')->insertGetId([
            'name' => trim($name),
            'description' => trim($description)
        ]);
    }

    public function updateShopCategory($id, $name, $description = '') {
        $this->qb->table('shopCategory')->where('id', $id)->update([
            'name' => trim($name),
            'description' => trim($description)
        ]);
        return true;
    }

    public function deleteShopCategory($id) {
        $this->qb->table('shopCategory')->where('id', $id)->delete();
        return true;
    }

    // ── Vehicle Categories CRUD ───────────────────────────────────────

    public function getAllVehicleCategoriesList() {
        return $this->qb->table('vehicleCategory')
            ->select('id', 'name', 'description')
            ->orderBy('id', 'ASC')
            ->get();
    }

    public function isVehicleCategoryNameTaken($name, $excludeId = null) {
        $query = $this->qb->table('vehicleCategory')
            ->select('id')
            ->whereRaw('LOWER(name) = LOWER(:name)', ['name' => trim($name)]);
            
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        return (bool)$query->first();
    }

    public function addVehicleCategory($name, $description = '') {
        return $this->qb->table('vehicleCategory')->insertGetId([
            'name' => trim($name),
            'description' => trim($description)
        ]);
    }

    public function updateVehicleCategory($id, $name, $description = '') {
        $this->qb->table('vehicleCategory')->where('id', $id)->update([
            'name' => trim($name),
            'description' => trim($description)
        ]);
        return true;
    }

    public function deleteVehicleCategory($id) {
        $this->qb->table('vehicleCategory')->where('id', $id)->delete();
        return true;
    }

    public function resolveShopCategoryId($identifier) {
        $query = $this->qb->table('shopCategory')->select('id');
        
        if (is_numeric($identifier)) {
            $query->where('id', (int)$identifier);
        } else {
            $query->whereRaw('LOWER(name) = LOWER(:name)', ['name' => trim($identifier)]);
        }
        
        $row = $query->first();
        return $row ? (int)$row['id'] : null;
    }

    public function resolveVehicleCategoryId($identifier) {
        $query = $this->qb->table('vehicleCategory')->select('id');
        
        if (is_numeric($identifier)) {
            $query->where('id', (int)$identifier);
        } else {
            $query->whereRaw('LOWER(name) = LOWER(:name)', ['name' => trim($identifier)]);
        }
        
        $row = $query->first();
        return $row ? (int)$row['id'] : null;
    }
}
?>