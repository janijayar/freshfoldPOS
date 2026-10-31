import { test, expect, checkA11y, checkConsoleErrors, checkNetworkErrors } from './fixtures';

test.describe('F01 - Staff Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('F01-H1: Valid login redirects to dashboard', async ({ page, axeBuilder }) => {
    const consoleCheck = checkConsoleErrors(page);
    const networkCheck = checkNetworkErrors(page);

    await page.fill('input[type="email"]', 'admin@freshfold.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    await checkA11y(page, axeBuilder);
    consoleCheck();
    networkCheck();
  });

  test('F01-E1: Empty email shows browser validation', async ({ page }) => {
    await page.click('button[type="submit"]');
    // HTML5 validation prevents form submission
    await expect(page.locator('input[type="email"]:invalid')).toBeTruthy();
  });

  test('F01-E2: Empty password shows browser validation', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@freshfold.com');
    await page.click('button[type="submit"]');
    // HTML5 validation prevents form submission
    await expect(page.locator('input[type="password"]:invalid')).toBeTruthy();
  });

  test('F01-N1: Invalid credentials show error', async ({ page, axeBuilder }) => {
    const consoleCheck = checkConsoleErrors(page);
    const networkCheck = checkNetworkErrors(page);

    await page.fill('input[type="email"]', 'wrong@freshfold.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    await checkA11y(page, axeBuilder);
    consoleCheck();
    networkCheck();
  });

  test('F01-E11: Mobile layout works', async ({ page, axeBuilder }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
    await checkA11y(page, axeBuilder);
  });

  test('F01-E12: Keyboard navigation works', async ({ page }) => {
    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    // Focus email field directly and test tab order
    await page.getByRole('textbox', { name: /email/i }).focus();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeFocused();

    // Tab to forgot password link (comes before password input in DOM)
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeFocused();

    // Tab to password field
    await page.keyboard.press('Tab');
    await expect(page.getByRole('textbox', { name: /password/i })).toBeFocused();

    // Tab to show/hide password button
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /show password/i })).toBeFocused();

    // Tab to sign in button
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeFocused();
  });
});