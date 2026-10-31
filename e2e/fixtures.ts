import { test as base, expect, Page, ConsoleMessage } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type TestFixtures = {
  axeBuilder: AxeBuilder;
};

export const test = base.extend<TestFixtures>({
  axeBuilder: async ({ page }, use) => {
    const builder = new AxeBuilder({ page });
    await use(builder);
  },
});

export { expect } from '@playwright/test';

export async function checkA11y(page: Page, builder: AxeBuilder) {
  const results = await builder.analyze();
  if (results.violations.length > 0) {
    console.log('Accessibility violations found:', results.violations.length);
    results.violations.forEach((v) => {
      console.log(`  ${v.id}: ${v.impact} - ${v.help}`);
    });
  }
  const critical = results.violations.filter((v) =>
    v.impact === 'critical' &&
    !['color-contrast', 'label-content-name-mismatch', 'page-has-heading-one', 'button-name', 'label'].includes(v.id)
  );
  expect(critical).toEqual([]);
}

export function checkConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore 404 network errors for missing resources (favicon, etc.)
      // Ignore React development warnings (key prop, etc.)
      if (!text.includes('404 (Not Found)') &&
          !text.includes('Warning:') &&
          !text.includes('react-jsx-dev-runtime') &&
          !text.includes('is not a prop')) {
        errors.push(text);
      }
    }
  });
  page.on('pageerror', (error: Error) => {
    // Ignore React development errors
    if (!error.message.includes('Warning:') &&
        !error.message.includes('is not a prop')) {
      errors.push(error.message);
    }
  });
  return () => {
    expect(errors).toEqual([]);
  };
}

export function checkNetworkErrors(page: Page) {
  const errors: string[] = [];
  page.on('response', (response: any) => {
    if (response.status() >= 500) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });
  return () => {
    expect(errors).toEqual([]);
  };
}