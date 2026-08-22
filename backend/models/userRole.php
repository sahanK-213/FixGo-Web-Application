<?php

class User {
    private $qb;
    private $table_name = "users";

    public $id;
    public $email;
    public $userRole;
    public $password;
    public $isActive;
    public $is_email_verified;
    public $verification_token;
    public $token_expiry;
    public $reset_token;
    public $reset_token_expiry;

    public function __construct($db, $queryBuilder = null) {
        $this->qb = $queryBuilder ?: new QueryBuilder($db);
    }

    private function mapRowToProperties($row) {
        $this->id = $row['id'];
        $this->email = $row['email'];
        $this->userRole = $row['userRole'];
        $this->password = $row['password'];
        $this->isActive = $row['isActive'];
        $this->is_email_verified = $row['is_email_verified'] ?? 0;
        $this->verification_token = $row['verification_token'] ?? null;
        $this->token_expiry = $row['token_expiry'] ?? null;
        $this->reset_token = $row['reset_token'] ?? null;
        $this->reset_token_expiry = $row['reset_token_expiry'] ?? null;
        return true;
    }

    public function findByEmail($email){
        $row = $this->qb->table($this->table_name)->where('email', $email)->first();
        if ($row) {
            return $this->mapRowToProperties($row);
        }
        return false;
    }

    public function findByVerificationToken($token) {
        $row = $this->qb->table($this->table_name)->where('verification_token', $token)->first();
        if ($row) {
            return $this->mapRowToProperties($row);
        }
        return false;
    }

    public function verifyEmail($userId) {
        try {
            $this->qb->beginTransaction();
            
            if ($this->userRole === 'shop_owner') {
                $this->qb->table($this->table_name)
                    ->where('id', $userId)
                    ->update([
                        'is_email_verified' => 1,
                        'verification_token' => null
                    ]);
            } else {
                $this->qb->table($this->table_name)
                    ->where('id', $userId)
                    ->update([
                        'is_email_verified' => 1,
                        'isActive' => 1,
                        'verification_token' => null
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

    public function setResetOtp($email, $otp, $expiryMinutes = 15) {
        $expiry = date('Y-m-d H:i:s', time() + ($expiryMinutes * 60));
        $this->qb->table($this->table_name)
            ->where('email', $email)
            ->update([
                'reset_token' => $otp,
                'reset_token_expiry' => $expiry
            ]);
        return true;
    }

    public function findByResetOtp($otp) {
        $row = $this->qb->table($this->table_name)->where('reset_token', $otp)->first();
        if ($row) {
            return $this->mapRowToProperties($row);
        }
        return false;
    }

    public function updatePassword($userId, $newPasswordHash) {
        $this->qb->table($this->table_name)
            ->where('id', $userId)
            ->update([
                'password' => $newPasswordHash,
                'reset_token' => null,
                'reset_token_expiry' => null
            ]);
        return true;
    }

    public function getActiveCustomerCount() {
        return $this->qb->table($this->table_name)
            ->where('isActive', 1)
            ->where('userRole', 'customer')
            ->count();
    }

    public function getUserRoleDistribution() {
        $results = $this->qb->table($this->table_name)
            ->select('userRole', 'COUNT(id) as count')
            ->where('isActive', 1)
            ->whereIn('userRole', ['customer', 'shop_owner'])
            ->groupBy('userRole')
            ->get();
            
        $formatted = [];
        foreach ($results as $row) {
            $formatted[] = [
                'name' => ucfirst(str_replace('_', ' ', $row['userRole'])),
                'value' => (int)$row['count']
            ];
        }
        return $formatted;
    }

    public function getPendingShopOwnerCount() {
        return $this->qb->table($this->table_name)
            ->where('userRole', 'shop_owner')
            ->where('is_email_verified', 1)
            ->where('isActive', 0)
            ->count();
    }

    public function verifyPassword($userId, $currentPassword) {
        $user = $this->qb->table($this->table_name)->select('password')->where('id', $userId)->first();
        if (!$user) {
            return false;
        }
        return password_verify($currentPassword, $user['password']);
    }

    public function isEmailTaken($email, $excludeUserId) {
        $row = $this->qb->table($this->table_name)
            ->select('id')
            ->where('email', $email)
            ->where('id', '!=', $excludeUserId)
            ->first();
        return (bool)$row;
    }

    /**
     * Refreshes the verification token and expiry for an unverified user.
     * Used by the Resend OTP feature.
     *
     * @param string $email The user's email
     * @param string $otp   New 6-digit OTP
     * @return bool
     */
    public function refreshVerificationToken($email, $otp) {
        $expiry = date('Y-m-d H:i:s', time() + (5 * 60)); // 5 minutes from now
        $this->qb->table($this->table_name)
            ->where('email', $email)
            ->update([
                'verification_token' => $otp,
                'token_expiry'       => $expiry
            ]);
        return true;
    }

    public function activateUser($userId) {
        $this->qb->table($this->table_name)
            ->where('id', $userId)
            ->update(['isActive' => 1]);
        return true;
    }

    /**
     * Soft deletes a user account by setting isActive = 0 and anonymizing their email
     * to free it up for future registrations.
     */
    public function deleteAccount($userId, $currentEmail) {
        $timestamp = time();
        $anonymizedEmail = 'deleted_' . $timestamp . '_' . $currentEmail;
        
        $this->qb->table($this->table_name)
            ->where('id', $userId)
            ->update([
                'isActive' => 0,
                'email' => $anonymizedEmail,
                'password' => '',
                'verification_token' => null,
                'reset_token' => null,
                'token_expiry' => null,
                'reset_token_expiry' => null
            ]);
        return true;
    }
}
?>