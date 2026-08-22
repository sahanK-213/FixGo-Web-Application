<?php
use PHPUnit\Framework\TestCase;

class ServiceRequestUnitTest extends TestCase {

    /**
     * Replicates the exact state machine rules from ServiceRequestController::handleUpdateStatus
     * Returns true if allowed, or an error string if blocked.
     */
    private function evaluateStatusChange($actorRole, $currentStatus, $newStatus) {
        if ($actorRole === 'customer') {
            if ($newStatus === 'Confirmed') {
                if ($currentStatus !== 'Accepted') {
                    return "Illegal Move: You can only confirm an 'Accepted' request.";
                }
                return true;
            } elseif ($newStatus === 'Cancelled') {
                return true;
            } else {
                return "Customers cannot manually set status to '$newStatus'.";
            }
        }

        if ($actorRole === 'shop_owner') {
            if ($newStatus === 'Confirmed') {
                return "Shops cannot force a confirmation. Only customers can confirm.";
            }

            if ($newStatus === 'Accepted') {
                if ($currentStatus === 'Cancelled') {
                    return "This request is no longer available as the customer confirmed a different shop.";
                }
                if ($currentStatus !== 'Pending') {
                    return "You can only accept 'Pending' requests.";
                }
                return true;
            } elseif ($newStatus === 'Declined' || $newStatus === 'Cancelled') {
                return true;
            } elseif (in_array($newStatus, ['Diagnosis', 'Pending Parts', 'In Progress', 'Completed'])) {
                if (in_array($currentStatus, ['Pending', 'Accepted', 'Cancelled'])) {
                    return "Cannot update repair milestones until the customer Confirms the request.";
                }
                return true;
            } else {
                return "Invalid status update requested.";
            }
        }

        return "Invalid user role.";
    }

    public function testCustomerCannotConfirmPendingRequest() {
        $result = $this->evaluateStatusChange('customer', 'Pending', 'Confirmed');
        $this->assertStringContainsString("Illegal Move", $result);
        
        $resultSuccess = $this->evaluateStatusChange('customer', 'Accepted', 'Confirmed');
        $this->assertTrue($resultSuccess);
    }

    public function testShopCannotForceConfirm() {
        $result = $this->evaluateStatusChange('shop_owner', 'Accepted', 'Confirmed');
        $this->assertStringContainsString("Shops cannot force a confirmation", $result);
    }

    public function testCustomerCannotSetInProgress() {
        $result = $this->evaluateStatusChange('customer', 'Confirmed', 'In Progress');
        $this->assertStringContainsString("Customers cannot manually set status", $result);
    }

    public function testShopCannotAcceptCancelledRequest() {
        $result = $this->evaluateStatusChange('shop_owner', 'Cancelled', 'Accepted');
        $this->assertStringContainsString("no longer available", $result);
    }

    public function testRepairMilestonesRequireConfirmation() {
        // Try setting In Progress when still Pending
        $result1 = $this->evaluateStatusChange('shop_owner', 'Pending', 'In Progress');
        $this->assertStringContainsString("Cannot update repair milestones until the customer Confirms", $result1);

        // Try setting Diagnosis when Accepted
        $result2 = $this->evaluateStatusChange('shop_owner', 'Accepted', 'Diagnosis');
        $this->assertStringContainsString("Cannot update repair milestones until the customer Confirms", $result2);

        // Should work when Confirmed
        $resultSuccess = $this->evaluateStatusChange('shop_owner', 'Confirmed', 'In Progress');
        $this->assertTrue($resultSuccess);
    }
}
