<?php

class QueryBuilder {
    private $conn;
    private $table;
    private $action = 'select';
    private $selects = ['*'];
    private $joins = [];
    private $wheres = [];
    private $groups = [];
    private $havings = [];
    private $orders = [];
    private $limit = null;
    private $offset = null;
    
    private $insertData = [];
    private $updateData = [];
    
    private $params = [];
    private $paramCounter = 1;

    public function __construct($db) {
        $this->conn = $db;
    }

    public static function raw($expression) {
        $obj = new stdClass();
        $obj->raw = $expression;
        return $obj;
    }

    public function table($table, $alias = null) {
        $this->table = $alias ? "$table $alias" : $table;
        return $this;
    }

    public function select($fields = ['*']) {
        $this->selects = is_array($fields) ? $fields : func_get_args();
        return $this;
    }
    
    public function selectRaw($expression, $bindings = []) {
        $this->selects[] = $expression;
        $this->addBindings($bindings);
        return $this;
    }

    public function join($table, $first, $operator = null, $second = null, $type = 'INNER') {
        if ($second === null) {
            $condition = $first;
        } else {
            $condition = "$first $operator $second";
        }
        $this->joins[] = "$type JOIN $table ON $condition";
        return $this;
    }

    public function leftJoin($table, $first, $operator = null, $second = null) {
        return $this->join($table, $first, $operator, $second, 'LEFT');
    }

    public function where($column, $operator = null, $value = null, $boolean = 'AND') {
        if ($value === null) {
            $value = $operator;
            $operator = '=';
        }
        
        $paramName = "p" . $this->paramCounter++;
        $this->wheres[] = [
            'type' => 'basic',
            'column' => $column,
            'operator' => $operator,
            'boolean' => $boolean,
            'param' => $paramName
        ];
        $this->params[":$paramName"] = $value;
        return $this;
    }
    
    public function orWhere($column, $operator = null, $value = null) {
        return $this->where($column, $operator, $value, 'OR');
    }

    public function whereRaw($sql, $bindings = [], $boolean = 'AND') {
        $this->wheres[] = [
            'type' => 'raw',
            'sql' => $sql,
            'boolean' => $boolean
        ];
        $this->addBindings($bindings);
        return $this;
    }

    public function whereIn($column, $values, $boolean = 'AND') {
        if (empty($values)) {
            return $this->whereRaw('1 = 0', [], $boolean);
        }
        
        $paramNames = [];
        foreach ($values as $value) {
            $paramName = "p" . $this->paramCounter++;
            $paramNames[] = ":$paramName";
            $this->params[":$paramName"] = $value;
        }
        
        $placeholders = implode(', ', $paramNames);
        $this->wheres[] = [
            'type' => 'raw',
            'sql' => "$column IN ($placeholders)",
            'boolean' => $boolean
        ];
        return $this;
    }

    public function groupBy($column) {
        $this->groups[] = $column;
        return $this;
    }

    public function having($column, $operator = null, $value = null) {
         if ($value === null) {
             $value = $operator;
             $operator = '=';
         }
         $paramName = "p" . $this->paramCounter++;
         $this->havings[] = "$column $operator :$paramName";
         $this->params[":$paramName"] = $value;
         return $this;
    }
    
    public function havingRaw($sql, $bindings = []) {
        $this->havings[] = $sql;
        $this->addBindings($bindings);
        return $this;
    }

    public function orderBy($column, $direction = 'ASC') {
        $this->orders[] = "$column $direction";
        return $this;
    }
    
    public function orderByRaw($sql) {
        $this->orders[] = $sql;
        return $this;
    }

    public function limit($value) {
        $this->limit = $value;
        return $this;
    }

    public function offset($value) {
        $this->offset = $value;
        return $this;
    }

    private function addBindings($bindings) {
        if (is_array($bindings)) {
             foreach ($bindings as $key => $val) {
                 if (is_int($key)) {
                     $paramName = "p" . $this->paramCounter++;
                     $this->params[":$paramName"] = $val;
                 } else {
                     $paramName = str_starts_with($key, ':') ? $key : ":$key";
                     $this->params[$paramName] = $val;
                 }
             }
        }
    }

    public function insert($data) {
        $this->action = 'insert';
        $this->insertData = $data;
        return $this->execute();
    }
    
    public function insertGetId($data) {
        $this->insert($data);
        return $this->conn->lastInsertId();
    }

    public function update($data) {
        $this->action = 'update';
        $this->updateData = $data;
        return $this->execute();
    }

    public function delete() {
        $this->action = 'delete';
        return $this->execute();
    }

    public function toSql() {
        if ($this->action === 'select') {
            $sql = "SELECT " . implode(', ', $this->selects);
            $sql .= " FROM " . $this->table;
            
            if (!empty($this->joins)) {
                $sql .= " " . implode(' ', $this->joins);
            }
            
            $sql .= $this->compileWheres();
            
            if (!empty($this->groups)) {
                $sql .= " GROUP BY " . implode(', ', $this->groups);
            }
            
            if (!empty($this->havings)) {
                $sql .= " HAVING " . implode(' AND ', $this->havings);
            }
            
            if (!empty($this->orders)) {
                $sql .= " ORDER BY " . implode(', ', $this->orders);
            }
            
            if ($this->limit !== null) {
                $sql .= " LIMIT " . (int)$this->limit;
            }
            if ($this->offset !== null) {
                $sql .= " OFFSET " . (int)$this->offset;
            }
            return $sql;
        } elseif ($this->action === 'insert') {
            $columns = array_keys($this->insertData);
            $paramNames = [];
            foreach ($columns as $col) {
                $val = $this->insertData[$col];
                if ($val instanceof stdClass && isset($val->raw)) {
                    $paramNames[] = $val->raw;
                } else {
                    $paramName = "p" . $this->paramCounter++;
                    $paramNames[] = ":$paramName";
                    $this->params[":$paramName"] = $val;
                }
            }
            
            $sql = "INSERT INTO " . $this->table . " (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $paramNames) . ")";
            return $sql;
        } elseif ($this->action === 'update') {
            $set = [];
            foreach ($this->updateData as $col => $val) {
                 if ($val instanceof stdClass && isset($val->raw)) {
                     $set[] = "$col = {$val->raw}";
                 } else {
                     $paramName = "p" . $this->paramCounter++;
                     $set[] = "$col = :$paramName";
                     $this->params[":$paramName"] = $val;
                 }
            }
            $sql = "UPDATE " . $this->table . " SET " . implode(', ', $set);
            $sql .= $this->compileWheres();
            return $sql;
        } elseif ($this->action === 'delete') {
            $sql = "DELETE FROM " . $this->table;
            $sql .= $this->compileWheres();
            return $sql;
        }
        return '';
    }

    private function compileWheres() {
        if (empty($this->wheres)) return '';
        
        $sql = " WHERE ";
        foreach ($this->wheres as $i => $where) {
            $boolean = $i == 0 ? '' : ' ' . $where['boolean'] . ' ';
            if ($where['type'] === 'basic') {
                $sql .= $boolean . "{$where['column']} {$where['operator']} :{$where['param']}";
            } elseif ($where['type'] === 'raw') {
                $sql .= $boolean . $where['sql'];
            }
        }
        return $sql;
    }

    public function getBindings() {
        return $this->params;
    }

    public function execute() {
        $sql = $this->toSql();
        $stmt = $this->conn->prepare($sql);
        foreach ($this->params as $key => $val) {
            $type = PDO::PARAM_STR;
            if (is_int($val)) $type = PDO::PARAM_INT;
            elseif (is_bool($val)) $type = PDO::PARAM_BOOL;
            elseif (is_null($val)) $type = PDO::PARAM_NULL;
            
            $stmt->bindValue($key, $val, $type);
        }
        
        $stmt->execute();
        $this->reset();
        return $stmt;
    }

    public function get() {
        $this->action = 'select';
        $stmt = $this->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function first() {
        $this->limit(1);
        $this->action = 'select';
        $stmt = $this->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function count() {
        $this->selects = ['COUNT(*)'];
        $this->action = 'select';
        $stmt = $this->execute();
        return (int)$stmt->fetchColumn();
    }
    
    public function pluck($column) {
         $this->selects = [$column];
         $this->action = 'select';
         $stmt = $this->execute();
         return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function reset() {
        $this->action = 'select';
        $this->selects = ['*'];
        $this->wheres = [];
        $this->joins = [];
        $this->groups = [];
        $this->havings = [];
        $this->orders = [];
        $this->limit = null;
        $this->offset = null;
        $this->params = [];
        $this->paramCounter = 1;
        $this->insertData = [];
        $this->updateData = [];
        return $this;
    }

    public function beginTransaction() {
        return $this->conn->beginTransaction();
    }

    public function commit() {
        return $this->conn->commit();
    }

    public function rollBack() {
        return $this->conn->rollBack();
    }

    public function inTransaction() {
        return $this->conn->inTransaction();
    }
}
