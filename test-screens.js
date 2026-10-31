const { chromium } = require('playwright');

async function testScreens() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1440, height: 900 },
  ];

  // First, log in
  console.log('Logging in...');
  await page.goto('http://localhost:3000/login');
  await page.fill('#email', 'admin@freshfold.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('Logged in successfully!');

  const screens = [
    { path: '/dashboard', name: 'dashboard' },
    { path: '/pos/REG-001', name: 'pos' },
    { path: '/shifts', name: 'shifts' },
    { path: '/receipts/1', name: 'receipt' },
  ];

  for (const screen of screens) {
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      console.log(`Testing ${screen.name} at ${vp.name} (${vp.width}x${vp.height})...`);
      await page.goto(`http://localhost:3000${screen.path}`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `replica/clone-screens/${screen.name}-${vp.name}.png`, fullPage: true });
      console.log(`  Screenshot saved: ${screen.name}-${vp.name}.png`);
    }
  }

  // Test keyboard navigation
  console.log('\nTesting keyboard navigation...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');

  // Tab through elements
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
  }

  await browser.close();
  console.log('\nAll tests completed!');
}

testScreens().catch(console.error);