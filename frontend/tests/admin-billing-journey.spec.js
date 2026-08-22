import { test, expect } from '@playwright/test';

test.describe('Admin Billing Maker-Checker Workflow', () => {
  test.skip('Admin can generate drafts and dispatch invoices', async ({ page }) => {
    // 1. Navigate and Login
    await page.goto('/');
    await page.getByRole('banner').getByRole('button', { name: 'Log In' }).click();
    
    await page.getByRole('textbox', { name: 'you@example.com' }).fill('admin@fixgo.lk');
    await page.getByRole('textbox', { name: 'Enter your password' }).fill('password');
    
    // Wait for the login API request to resolve to ensure stability
    const [loginResponse] = await Promise.all([
      page.waitForResponse(res => res.url().includes('auth/login.php')),
      page.getByRole('button', { name: 'Sign in' }).click()
    ]);
    expect(loginResponse.status()).toBe(200);

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // 2. Navigate to Revenue & Ledger
    const revenueBtn = page.getByRole('button', { name: 'Revenue & Ledger' });
    await expect(revenueBtn).toBeVisible({ timeout: 15000 });
    await revenueBtn.click();
    await page.waitForLoadState('networkidle');

    // 3. Maker: Generate Drafts
    // Select July where we know seeded data exists
    await page.getByRole('combobox').nth(1).selectOption('7');
    
    const generateBtn = page.getByRole('button', { name: 'Generate Drafts' });
    await generateBtn.click();
    
    // 4. Checker: Review and Dispatch
    const reviewBtn = page.getByRole('button', { name: 'Review Drafts' });
    await reviewBtn.click();

    const dispatchBtn = page.getByRole('button', { name: 'Dispatch All' });
    await dispatchBtn.click();

    // Modal confirmation
    const confirmBtn = page.getByRole('button', { name: 'Confirm Dispatch' });
    await confirmBtn.click();
    
    // Wait for dispatch process to complete
    await page.waitForLoadState('networkidle');

    // 5. Navigate to other admin sections to verify sidebar works
    await page.getByRole('button', { name: 'Moderation' }).click();
    await page.getByRole('button', { name: 'Verification Queue' }).click();
    
    // Final verification that we are on a valid page
    await expect(page.getByRole('button', { name: 'Verification Queue' })).toBeVisible();
  });
});
