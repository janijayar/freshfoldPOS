import { test, expect, checkA11y, checkConsoleErrors, checkNetworkErrors } from './fixtures';

test.describe('F07-F08 - Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@freshfold.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('F07-H1: Product list search and filter', async ({ page, axeBuilder }) => {
    const consoleCheck = checkConsoleErrors(page);
    const networkCheck = checkNetworkErrors(page);

    await page.goto('/inventory');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible({ timeout: 15000 });

    // Search input - correct placeholder
    await page.fill('input[placeholder="Search products, SKU, or barcode..."]', 'latte');
    await expect(page.getByText(/latte/i)).toBeVisible();

    // Category filter - Radix Select with placeholder "All Categories"
    await page.click('button:has-text("All Categories")');
    await page.getByRole('option', { name: 'Beverages' }).click();

    // Verify filter worked - check for Beverages badge in table body (not the combobox)
    await expect(page.locator('tbody').getByText('Beverages')).toBeVisible();

    await checkA11y(page, axeBuilder);
    consoleCheck();
    networkCheck();
  });

  test('F07-H2: View product detail', async ({ page, axeBuilder }) => {
    await page.goto('/inventory');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible({ timeout: 15000 });

    // View button is inside a DropdownMenu - click the dropdown trigger first
    const firstRow = page.locator('tbody tr').first();
    await firstRow.locator('button[aria-label^="Actions for"]').click();
    await page.getByRole('menuitem', { name: 'View' }).click();

    // Product detail page loads - check for product name heading
    await expect(page).toHaveURL(/\/inventory\//);
    await expect(page.getByRole('heading', { name: /americano|latte|cappuccino|cold brew|croissant|bagel|muffin|avocado|tote|mug|gift card/i })).toBeVisible();
    await checkA11y(page, axeBuilder);
  });

  test('F07-H3: Create new product', async ({ page, axeBuilder }) => {
    const consoleCheck = checkConsoleErrors(page);
    const networkCheck = checkNetworkErrors(page);

    await page.goto('/inventory/new');

    // Wait for form to load
    await expect(page.getByRole('heading', { name: /new product/i })).toBeVisible({ timeout: 15000 });

    // Fill Basic Info tab - name, sku, category
    await page.fill('#name', 'Test Product');
    await page.fill('#sku', 'TEST-001');

    // Category - Radix Select (on Basic Info tab)
    await page.click('button:has-text("Select category")');
    await page.getByRole('option', { name: 'Beverages' }).click();

    // Switch to Pricing tab for price
    await page.click('button[role="tab"]:has-text("Pricing")');
    await page.fill('#price', '5.00');

    // Save button
    await page.click('button:has-text("Save")');

    // Should redirect back to inventory (mock doesn't persist, just verify redirect)
    await expect(page).toHaveURL('/inventory');

    await checkA11y(page, axeBuilder);
    consoleCheck();
    networkCheck();
  });

  test('F07-H4: Create variant product', async ({ page, axeBuilder }) => {
    await page.goto('/inventory/new');

    await expect(page.getByRole('heading', { name: /new product/i })).toBeVisible({ timeout: 15000 });

    await page.fill('#name', 'T-Shirt');
    await page.fill('#sku', 'TSHIRT-001');

    // Category (on Basic Info tab)
    await page.click('button:has-text("Select category")');
    await page.getByRole('option', { name: 'Merchandise' }).click();

    // Switch to Pricing tab for price
    await page.click('button[role="tab"]:has-text("Pricing")');
    await page.fill('#price', '20.00');

    await page.click('button:has-text("Save")');
    await expect(page).toHaveURL('/inventory');

    await checkA11y(page, axeBuilder);
  });

  test('F08-H1: Create inventory adjustment', async ({ page, axeBuilder }) => {
    const consoleCheck = checkConsoleErrors(page);
    const networkCheck = checkNetworkErrors(page);

    await page.goto('/inventory/adjustments');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /inventory adjustments/i })).toBeVisible({ timeout: 15000 });

    // Click "New Adjustment" button
    await page.click('button:has-text("New Adjustment")');

    // Wait for dialog
    await expect(page.getByRole('dialog', { name: /new inventory adjustment/i })).toBeVisible({ timeout: 10000 });

    // Product - Radix Select
    await page.click('button:has-text("Select product")');
    await page.getByRole('option', { name: /americano/i }).click();

    // Location - Radix Select
    await page.click('button:has-text("Select location")');
    await page.getByRole('option', { name: 'Main Street Store' }).click();

    // Quantity
    await page.fill('#quantity', '10');

    // Reason - Radix Select
    await page.click('button:has-text("Select reason")');
    await page.getByRole('option', { name: 'Stock Count' }).click();

    // Notes
    await page.fill('#notes', 'Monthly stock count');

    // Create button
    await page.click('button:has-text("Create Adjustment")');

    // Dialog should close
    await expect(page.getByRole('dialog', { name: /new inventory adjustment/i })).toBeHidden({ timeout: 5000 });

    await checkA11y(page, axeBuilder);
    consoleCheck();
    networkCheck();
  });

  test('F08-H2: Transfer between locations', async ({ page, axeBuilder }) => {
    await page.goto('/inventory/adjustments');

    await expect(page.getByRole('heading', { name: /inventory adjustments/i })).toBeVisible({ timeout: 15000 });

    // Click "New Adjustment" button
    await page.click('button:has-text("New Adjustment")');

    await expect(page.getByRole('dialog', { name: /new inventory adjustment/i })).toBeVisible({ timeout: 10000 });

    // Product
    await page.click('button:has-text("Select product")');
    await page.getByRole('option', { name: /americano/i }).click();

    // Select Transfer type button
    await page.click('button:has-text("Transfer")');

    // Location
    await page.click('button:has-text("Select location")');
    await page.getByRole('option', { name: 'Main Street Store' }).click();

    await page.fill('#quantity', '5');

    // Reason - select Transfer
    await page.click('button:has-text("Select reason")');
    await page.getByRole('option', { name: 'Inter-location Transfer' }).click();

    await page.fill('#notes', 'Transfer to downtown');

    await page.click('button:has-text("Create Adjustment")');

    // Dialog should close
    await expect(page.getByRole('dialog', { name: /new inventory adjustment/i })).toBeHidden({ timeout: 5000 });

    await checkA11y(page, axeBuilder);
  });

  test('F07-E8: Mobile inventory layout', async ({ page, axeBuilder }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/inventory');
    await expect(page.getByPlaceholder(/search products, sku, or barcode/i)).toBeVisible();
    await checkA11y(page, axeBuilder);
  });

  test('F07-N1: Required field validation shows error', async ({ page, axeBuilder }) => {
    await page.goto('/inventory/new');

    await expect(page.getByRole('heading', { name: /new product/i })).toBeVisible({ timeout: 15000 });

    // Try to save without filling required fields
    await page.click('button:has-text("Save")');

    // Should show validation errors for required fields
    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/sku is required/i)).toBeVisible();
    await expect(page.getByText(/category is required/i)).toBeVisible();
    await checkA11y(page, axeBuilder);
  });
});