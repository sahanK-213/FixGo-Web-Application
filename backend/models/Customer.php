<?php

class Customer {
    private $qb;

    public function __construct($db, $queryBuilder = null) {
        $this->qb = $queryBuilder ?: new QueryBuilder($db);
    }

    public function getById($customerId) {
        return $this->qb->table('customer', 'c')
            ->select([
                'c.id',
                'c.name',
                'c.contactNumber',
                'c.address',
                'c.profilePhoto',
                'c.createdAt',
                'u.email'
            ])
            ->join('users u', 'c.id', '=', 'u.id')
            ->where('c.id', $customerId)
            ->first();
    }

    // Adds a penalty strike if a customer cancels a Confirmed handshake
    public function incrementCancellationStrikes($customer_id) {
        $this->qb->table('customer')
            ->where('id', $customer_id)
            ->update([
                'cancellation_strikes' => QueryBuilder::raw('cancellation_strikes + 1')
            ]);
        return true;
    }

    /**
     * Registers a new customer by inserting into both 'users' and 'customer' tables.
     * Starts a database transaction.
     * 
     * @param array $userData Contains email, password, verification_token
     * @param array $customerData Contains name, contactNumber, address, profilePhoto
     * @return int The newly created user/customer ID
     * @throws Exception if registration fails
     */
    public function register($userData, $customerData) {
        try {
            $this->qb->beginTransaction();

            // 1. Insert into users
            $userId = $this->qb->table('users')->insertGetId([
                'email' => $userData['email'],
                'userRole' => 'customer',
                'password' => $userData['password'],
                'isActive' => 0,
                'verification_token' => $userData['verification_token'],
                'is_email_verified' => 0,
                'token_expiry' => date('Y-m-d H:i:s', time() + (5 * 60))
            ]);

            // 2. Insert into customer
            $this->qb->table('customer')->insert([
                'id' => $userId,
                'name' => $customerData['name'],
                'contactNumber' => $customerData['contactNumber'],
                'address' => $customerData['address'],
                'profilePhoto' => $customerData['profilePhoto']
            ]);

            $this->qb->commit();
            return $userId;
        } catch (Exception $e) {
            if ($this->qb->inTransaction()) {
                $this->qb->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Re-registers an unverified customer, updating their user and customer details with a fresh 5-minute OTP.
     */
    public function reRegister($userId, $userData, $customerData) {
        try {
            $this->qb->beginTransaction();

            $this->qb->table('users')->where('id', $userId)->update([
                'userRole' => 'customer',
                'password' => $userData['password'],
                'isActive' => 0,
                'verification_token' => $userData['verification_token'],
                'is_email_verified' => 0,
                'token_expiry' => date('Y-m-d H:i:s', time() + (5 * 60))
            ]);

            $existing = $this->qb->table('customer')->where('id', $userId)->first();
            $customerPayload = [
                'name' => $customerData['name'],
                'contactNumber' => $customerData['contactNumber'],
                'address' => $customerData['address']
            ];
            if (!empty($customerData['profilePhoto'])) {
                $customerPayload['profilePhoto'] = $customerData['profilePhoto'];
            }

            if ($existing) {
                $this->qb->table('customer')->where('id', $userId)->update($customerPayload);
            } else {
                $customerPayload['id'] = $userId;
                $this->qb->table('customer')->insert($customerPayload);
            }

            $this->qb->commit();
            return $userId;
        } catch (Exception $e) {
            if ($this->qb->inTransaction()) {
                $this->qb->rollBack();
            }
            throw $e;
        }
    }


    /**
     * Updates customer profile details and optionally user password.
     */
    public function updateProfile($customerId, $data, $newPassword = null) {
        try {
            $this->qb->beginTransaction();

            $updateData = [];
            if (array_key_exists('name', $data)) $updateData['name'] = $data['name'];
            if (array_key_exists('contactNumber', $data)) $updateData['contactNumber'] = $data['contactNumber'];
            if (array_key_exists('address', $data)) $updateData['address'] = $data['address'];
            if (array_key_exists('profilePhoto', $data)) $updateData['profilePhoto'] = $data['profilePhoto'];

            if (!empty($updateData)) {
                $this->qb->table('customer')->where('id', $customerId)->update($updateData);
            }

            if (!empty($newPassword)) {
                $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
                $this->qb->table('users')->where('id', $customerId)->update([
                    'password' => $passwordHash
                ]);
            }

            $this->qb->commit();
            return true;
        } catch (Exception $e) {
            if ($this->qb->inTransaction()) {
                $this->qb->rollBack();
            }
            throw $e;
        }
    }

    public function getProfilePhoto($customerId) {
        $row = $this->qb->table('customer')->where('id', $customerId)->select('profilePhoto')->first();
        return $row ? $row['profilePhoto'] : null;
    }
}