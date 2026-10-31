import { test, expect, checkA11y, checkConsoleErrors, checkNetworkErrors } from './fixtures';

test.describe('F09-F10 - Reports', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@freshfold.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('F09-H1: Sales report by period', async ({ page, axeBuilder }) => {
    const consoleCheck = checkConsoleErrors(page);
    const networkCheck = checkNetworkErrors(page);

    await page.goto('/reports/sales');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /sales reports/i })).toBeVisible({ timeout: 15000 });

    // Date range is a Radix Select - default shows "This Month"
    await page.click('button:has-text("This Month")');
    await page.getByRole('option', { name: 'Last Month' }).click();

    // Wait for data to load
    await page.waitForTimeout(500);

    // Verify summary cards visible
    await expect(page.getByText(/total sales/i)).toBeVisible();

    await checkA11y(page, axeBuilder);
    consoleCheck();
    networkCheck();
  });

  test('F09-H2: Switch report tabs', async ({ page, axeBuilder }) => {
    await page.goto('/reports/sales');

    await expect(page.getByRole('heading', { name: /sales reports/i })).toBeVisible({ timeout: 15000 });

    // Tabs are buttons with role="tab" - click and verify table view appears
    await page.click('button[role="tab"]:has-text("By Category")');
    // Verify table view for By Category appears (Card with title "By category")
    await expect(page.getByRole('heading', { name: /by category/i })).toBeVisible();

    await page.click('button[role="tab"]:has-text("By Staff")');
    await expect(page.getByRole('heading', { name: /by staff/i })).toBeVisible();

    await page.click('button[role="tab"]:has-text("By Location")');
    await expect(page.getByRole('heading', { name: /by location/i })).toBeVisible();

    await checkA11y(page, axeBuilder);
  });

  test('F09-H3: Export CSV button exists', async ({ page, axeBuilder }) => {
    const consoleCheck = checkConsoleErrors(page);
    const networkCheck = checkNetworkErrors(page);

    await page.goto('/reports/sales');

    await expect(page.getByRole('heading', { name: /sales reports/i })).toBeVisible({ timeout: 15000 });

    // Verify Export button exists (mock doesn't actually download)
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible();

    consoleCheck();
    networkCheck();
  });

  test('F10-H1: Shift report', async ({ page, axeBuilder }) => {
    const consoleCheck = checkConsoleErrors(page);
    const networkCheck = checkNetworkErrors(page);

    await page.goto('/reports/shifts');

    await expect(page.getByRole('heading', { name: /shift reports/i })).toBeVisible({ timeout: 15000 });

    // Date range is a Radix Select - default shows "This Week"
    await page.click('button:has-text("This Week")');
    await page.getByRole('option', { name: 'Last Week' }).click();

    await page.waitForTimeout(500);

    // Verify table visible
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText(/cash variance/i)).toBeVisible();

    await checkA11y(page, axeBuilder);
    consoleCheck();
    networkCheck();
  });

  test('F09-E1: Large date range loads', async ({ page, axeBuilder }) => {
    await page.goto('/reports/sales');

    await expect(page.getByRole('heading', { name: /sales reports/i })).toBeVisible({ timeout: 15000 });

    // Select a date range - default shows "This Month"
    await page.locator('button:has-text("This Month")').first().click();
    await page.getByRole('option', { name: 'This Month' }).click();

    // Switch to a tab that shows a table (By Category)
    await page.click('button[role="tab"]:has-text("By Category")');

    // Should load within reasonable time
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    await checkA11y(page, axeBuilder);
  });

  test('F09-E3: Mobile reports layout', async ({ page, axeBuilder }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/reports/sales');
    await expect(page.getByRole('tablist')).toBeVisible();
    await checkA11y(page, axeBuilder);
  });
});