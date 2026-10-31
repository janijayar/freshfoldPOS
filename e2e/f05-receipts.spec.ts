import { test, expect, checkA11y, checkConsoleErrors, checkNetworkErrors } from './fixtures';

test.describe('F05 - Receipt Detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@freshfold.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('F05-H1: View receipt detail page', async ({ page, axeBuilder }) => {
    const consoleCheck = checkConsoleErrors(page);
    const networkCheck = checkNetworkErrors(page);

    // Navigate directly to mock receipt
    await page.goto('/receipts/receipt-1');

    await expect(page).toHaveURL('/receipts/receipt-1');
    await expect(page.getByRole('heading', { name: /receipt detail/i })).toBeVisible();
    await expect(page.getByText(/american/i)).toBeVisible();
    await expect(page.getByText(/card/i)).toBeVisible(); // Mock receipt uses card payment
    await expect(page.getByText(/visa/i)).toBeVisible();

    await checkA11y(page, axeBuilder);
    consoleCheck();
    networkCheck();
  });

  test('F05-H2: Print receipt button exists', async ({ page, axeBuilder }) => {
    await page.goto('/receipts/receipt-1');

    // Verify Print button exists in dropdown menu
    await page.click('button:has-text("Actions")');
    await expect(page.getByRole('menuitem', { name: /print receipt/i })).toBeVisible();

    await checkA11y(page, axeBuilder);
  });

  test('F05-H3: Download PDF button exists', async ({ page, axeBuilder }) => {
    await page.goto('/receipts/receipt-1');

    // Verify Download PDF button exists in dropdown menu
    await page.click('button:has-text("Actions")');
    await expect(page.getByRole('menuitem', { name: /download pdf/i })).toBeVisible();

    await checkA11y(page, axeBuilder);
  });

  test('F05-N1: Invalid receipt ID shows 404', async ({ page, axeBuilder }) => {
    await page.goto('/receipts/INVALID-ID');
    await expect(page.getByText(/receipt not found/i)).toBeVisible();
    await checkA11y(page, axeBuilder);
  });
});