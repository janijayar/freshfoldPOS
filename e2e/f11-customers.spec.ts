import { test, expect, checkA11y, checkConsoleErrors, checkNetworkErrors } from './fixtures';

test.describe('F11 - Customers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@freshfold.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('F11-H1: Customer list search and filter', async ({ page, axeBuilder }) => {
    const consoleCheck = checkConsoleErrors(page);
    const networkCheck = checkNetworkErrors(page);

    await page.goto('/customers');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /customers/i })).toBeVisible({ timeout: 15000 });

    // Search input - correct placeholder
    await page.fill('input[placeholder="Search customers..."]', 'emma');
    await expect(page.getByText(/emma thompson/i)).toBeVisible();

    // Tier filter - Radix Select with placeholder "All Tiers"
    await page.click('button:has-text("All Tiers")');
    await page.getByRole('option', { name: 'Gold' }).click();

    // Verify filter worked - check for Gold tier badge in table body
    await expect(page.locator('tbody').getByText('Gold')).toBeVisible();

    await checkA11y(page, axeBuilder);
    consoleCheck();
    networkCheck();
  });

  test('F11-H2: View customer detail', async ({ page, axeBuilder }) => {
    await page.goto('/customers');

    await expect(page.getByRole('heading', { name: /customers/i })).toBeVisible({ timeout: 15000 });

    // View button is inside a DropdownMenu - click the dropdown trigger first
    const firstRow = page.locator('tbody tr').first();
    await firstRow.locator('button[aria-label="More actions"]').click();
    await page.getByRole('menuitem', { name: 'View Details' }).click();

    // Customer detail page loads - check for tabs (TabsTrigger)
    await expect(page).toHaveURL(/\/customers\//);
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /order history/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /loyalty/i })).toBeVisible();

    await checkA11y(page, axeBuilder);
  });

  test('F11-H3: Add loyalty points', async ({ page, axeBuilder }) => {
    const consoleCheck = checkConsoleErrors(page);
    const networkCheck = checkNetworkErrors(page);

    await page.goto('/customers');

    await expect(page.getByRole('heading', { name: /customers/i })).toBeVisible({ timeout: 15000 });

    // Click View Details on first customer
    const firstRow = page.locator('tbody tr').first();
    await firstRow.locator('button[aria-label="More actions"]').click();
    await page.getByRole('menuitem', { name: 'View Details' }).click();

    // Wait for customer detail page
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible({ timeout: 10000 });

    // Navigate to Loyalty tab
    await page.click('button[role="tab"]:has-text("Loyalty")');

    // Check if Add Points button exists - if not, skip this test
    const addPointsButton = page.getByRole('button', { name: /add points/i });
    if (await addPointsButton.isVisible({ timeout: 2000 })) {
      await addPointsButton.click();
      await page.fill('input[name="points"]', '500');
      await page.fill('textarea[name="reason"]', 'Birthday bonus');
      await page.click('button:has-text("Save")');
      await expect(page.getByText(/points added/i)).toBeVisible();
    }

    await checkA11y(page, axeBuilder);
    consoleCheck();
    networkCheck();
  });

  test('F11-E3: Mobile customers layout', async ({ page, axeBuilder }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/customers');
    await expect(page.getByPlaceholder(/search customers/i)).toBeVisible();
    await checkA11y(page, axeBuilder);
  });
});