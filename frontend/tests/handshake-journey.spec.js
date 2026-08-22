import { test, expect } from '@playwright/test';

test.describe('3-Way Handshake Journey', () => {
  test('Customer sends request, Shop accepts, Customer confirms, Shop completes, Customer reviews', async ({ browser }) => {
    // Create two isolated browser contexts to simulate two users on different devices
    const customerContext = await browser.newContext();
    const shopContext = await browser.newContext();
    
    const customerPage = await customerContext.newPage();
    const shopPage = await shopContext.newPage();

    // ==========================================================
    // STEP 1: Customer (Tharaka) logs in and sends a request
    // ==========================================================
    await customerPage.goto('/');
    
    // Login
    await customerPage.getByRole('banner').getByRole('button', { name: 'Log In' }).click();
    await customerPage.getByRole('textbox', { name: 'you@example.com' }).fill('tharaka.silva@gmail.com');
    await customerPage.getByRole('textbox', { name: 'Enter your password' }).fill('password');
    
    const [customerLoginResponse] = await Promise.all([
      customerPage.waitForResponse(res => res.url().includes('auth/login.php')),
      customerPage.getByRole('button', { name: 'Sign in' }).click()
    ]);
    expect(customerLoginResponse.status()).toBe(200);
    await customerPage.waitForLoadState('load');

    // Navigate to Search
    await customerPage.getByRole('banner').getByRole('link', { name: 'Find Shops' }).click();
    await customerPage.waitForLoadState('load');

    // Click on Dasun Malabe's Shop explicitly to ensure the handshake is routed correctly
    const viewShopBtn = customerPage.locator('article', { hasText: 'Malabe Speed Auto Center' }).getByRole('button', { name: 'View Shop' });
    await viewShopBtn.click();
    await customerPage.waitForLoadState('load');

    // Open Request Form and wait for modal
    const requestServiceBtn = customerPage.getByRole('button', { name: 'Request Service' });
    await expect(requestServiceBtn).toBeVisible();
    await requestServiceBtn.click();
    
    // Click 'Use a different vehicle' to expose the manual entry form
    const diffVehicleBtn = customerPage.getByRole('button', { name: 'Use a different vehicle' });
    await expect(diffVehicleBtn).toBeVisible();
    await diffVehicleBtn.click();
    
    const toyotaInput = customerPage.getByPlaceholder('e.g. Toyota');
    await expect(toyotaInput).toBeVisible({ timeout: 15000 });

    // Fill Vehicle details
    await customerPage.getByPlaceholder('e.g. Toyota').fill('Toyota');
    await customerPage.getByPlaceholder('e.g. Silver').fill('White');

    // Choose Service Type
    await customerPage.getByRole('button', { name: 'No, I need roadside' }).click();
    await customerPage.getByRole('button', { name: 'Engine' }).click();

    // Fill Description
    await customerPage.getByPlaceholder(/What seems to be the problem/i).fill('Engine dead');

    // Submit Request
    await customerPage.getByRole('button', { name: 'Review Request' }).click();
    await customerPage.locator('.mt-0\\.5.w-5').click(); // Terms checkbox
    
    const [requestResponse] = await Promise.all([
      customerPage.waitForResponse(res => res.url().includes('createServiceRequest.php')), // wait for backend POST
      customerPage.getByRole('button', { name: 'Send Request' }).click()
    ]);
    
    // Proceed to Tracking page
    await customerPage.getByRole('button', { name: 'Track Request' }).click();
    await customerPage.waitForLoadState('load');

    // ==========================================================
    // STEP 2: Shop receives and accepts the request
    // ==========================================================
    await shopPage.goto('/');
    
    // Login as Shop Owner (Dasun Malabe)
    await shopPage.getByRole('banner').getByRole('button', { name: 'Log In' }).click();
    await shopPage.getByRole('textbox', { name: 'you@example.com' }).fill('dasun.malabe@gmail.com');
    await shopPage.getByRole('textbox', { name: 'Enter your password' }).fill('password');
    
    const [shopLoginResponse] = await Promise.all([
      shopPage.waitForResponse(res => res.url().includes('auth/login.php')),
      shopPage.getByRole('button', { name: 'Sign in' }).click()
    ]);
    expect(shopLoginResponse.status()).toBe(200);
    await shopPage.waitForLoadState('load');

    // Go to Notifications and click View Requests on the first notification
    await shopPage.getByRole('button', { name: 'Notifications' }).click();
    await shopPage.waitForLoadState('load');
    
    // We use .first() here instead of the dynamic ID #notif-card-138
    await shopPage.getByRole('button', { name: 'View Requests' }).first().click();
    await shopPage.waitForLoadState('load');

    // View Details, Close, and Accept
    const viewDetailsBtn = shopPage.getByRole('button', { name: 'View Details' }).first();
    await expect(viewDetailsBtn).toBeVisible({ timeout: 15000 });
    await viewDetailsBtn.click();
    
    await shopPage.getByRole('button', { name: 'Close', exact: true }).click();
    
    await shopPage.getByRole('button', { name: 'Accept' }).click();
    
    const [acceptResponse] = await Promise.all([
      shopPage.waitForResponse(res => res.url().includes('updateStatus.php')), // wait for POST
      shopPage.getByRole('button', { name: 'Confirm' }).click()
    ]);
    await shopPage.waitForLoadState('load');

    // ==========================================================
    // STEP 3: Customer confirms
    // ==========================================================
    // Refresh the page so the Customer's app fetches the new 'Accepted' status from the backend
    await customerPage.reload();
    await customerPage.waitForLoadState('load');

    // Open notifications and confirm booking
    await customerPage.getByRole('button', { name: 'Notifications' }).click();
    await customerPage.waitForLoadState('load');
    
    // We expect the 'Confirm Booking' button to be visible now that it was accepted
    const confirmBookingBtn = customerPage.getByRole('button', { name: 'Confirm Booking' }).first();
    await expect(confirmBookingBtn).toBeVisible({ timeout: 15000 });
    
    // Send the confirmation
    const [confirmResponse] = await Promise.all([
      customerPage.waitForResponse(res => res.url().includes('updateStatus.php')), // wait for POST
      confirmBookingBtn.click()
    ]);
    await customerPage.waitForLoadState('load');

    // Customer checks Repair Status page
    await customerPage.getByRole('button', { name: 'Repair Status' }).click();
    await customerPage.waitForLoadState('load');
    
    // Verify it is actually confirmed
    await expect(customerPage.locator('text=Confirmed').first()).toBeVisible({ timeout: 15000 });

    // ==========================================================
    // STEP 4: Shop completes & Customer Reviews
    // ==========================================================
    
    // Shop refreshes to see the Customer's confirmation notification
    await shopPage.reload();
    await shopPage.waitForLoadState('load');

    // Shop opens notifications
    await shopPage.getByRole('button', { name: 'Notifications' }).click();
    await shopPage.waitForLoadState('load');

    // Click 'View Active Jobs' on the latest notification
    await shopPage.getByRole('button', { name: 'View Active Jobs' }).first().click();
    await shopPage.waitForLoadState('load');

    // Start and Complete the repair
    await shopPage.getByRole('button', { name: 'Start Repair' }).click();
    await shopPage.waitForLoadState('load'); // wait for state change
    
    const [completeResponse] = await Promise.all([
      shopPage.waitForResponse(res => res.url().includes('updateStatus.php')), // wait for POST
      shopPage.getByRole('button', { name: 'Mark Completed' }).click()
    ]);
    await shopPage.waitForLoadState('load');

    // ==========================================================
    // STEP 5: Customer leaves a Review
    // ==========================================================
    
    // Customer refreshes to see the Shop's completion notification
    await customerPage.reload();
    await customerPage.waitForLoadState('load');

    // Customer opens notifications
    await customerPage.getByRole('button', { name: 'Notifications' }).click();
    await customerPage.waitForLoadState('load');

    // Click 'Review & Rate' on the latest notification
    const reviewBtn = customerPage.getByRole('button', { name: 'Review & Rate' }).first();
    await expect(reviewBtn).toBeVisible({ timeout: 15000 });
    await reviewBtn.click();
    await customerPage.waitForLoadState('load');

    // Fill out the review
    // Click the 5th star (SVG)
    await customerPage.locator('svg:nth-child(5)').first().click();
    
    // Write comment
    await customerPage.getByRole('textbox', { name: 'Tell others about your' }).fill('Great Work - Automated E2E Test');
    
    // Submit
    const [reviewResponse] = await Promise.all([
      customerPage.waitForResponse(res => res.url().includes('submitReview.php')), // wait for POST
      customerPage.getByRole('button', { name: 'Submit Review' }).click()
    ]);
    await customerPage.waitForLoadState('load');

    // Verify it appears in Reviews & Ratings tab
    await customerPage.getByRole('button', { name: 'Reviews & Ratings' }).click();
    await customerPage.waitForLoadState('networkidle');
    await expect(customerPage.locator('text=Great Work - Automated E2E Test').first()).toBeVisible({ timeout: 15000 });

    // Cleanup
    await customerContext.close();
    await shopContext.close();
  });
});
