/**
 * E2E Test Helpers
 * أدوات مساعدة للاختبارات الشاملة
 */

import { Page, BrowserContext } from '@playwright/test';

/**
 * Test user credentials for E2E testing
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@blueprint.test',
    password: 'TestAdmin123!',
  },
  manager: {
    email: 'manager@blueprint.test',
    password: 'TestManager123!',
  },
  user: {
    email: 'user@blueprint.test',
    password: 'TestUser123!',
  },
};

/**
 * Login helper for authenticated tests
 */
export async function login(
  page: Page,
  email: string = TEST_USERS.admin.email,
  password: string = TEST_USERS.admin.password
): Promise<void> {
  await page.goto('/login');
  
  // Fill login form
  const emailInput = page.getByPlaceholder(/email|البريد الإلكتروني/i);
  const passwordInput = page.getByPlaceholder(/password|كلمة المرور/i);
  const loginButton = page.getByRole('button', { name: /login|تسجيل الدخول/i });
  
  if (await emailInput.isVisible()) {
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await loginButton.click();
    
    // Wait for redirect
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
  }
}

/**
 * Logout helper
 */
export async function logout(page: Page): Promise<void> {
  const userMenu = page.getByTestId('user-menu').or(
    page.getByRole('button', { name: /profile|account|حساب/i })
  );
  
  await userMenu.click();
  
  const logoutButton = page.getByRole('button', { name: /logout|تسجيل الخروج/i });
  await logoutButton.click();
  
  await page.waitForURL('**/login**', { timeout: 5000 }).catch(() => {});
}

/**
 * Set language preference
 */
export async function setLanguage(page: Page, lang: 'en' | 'ar'): Promise<void> {
  const langSwitcher = page.getByRole('button', { name: /english|arabic|عربي|EN|AR/i });
  
  if (await langSwitcher.isVisible()) {
    await langSwitcher.click();
    
    const langOption = page.getByRole('option', { name: lang === 'ar' ? /arabic|عربي/i : /english/i });
    if (await langOption.isVisible()) {
      await langOption.click();
    }
  }
}

/**
 * Wait for API response
 */
export async function waitForApi(
  page: Page,
  endpoint: string,
  timeout: number = 10000
): Promise<void> {
  await page.waitForResponse(
    (response) => response.url().includes(endpoint),
    { timeout }
  );
}

/**
 * Mock API response
 */
export async function mockApi(
  page: Page,
  endpoint: string,
  response: unknown,
  status: number = 200
): Promise<void> {
  await page.route(`**/api/${endpoint}**`, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Clear all mocks
 */
export async function clearMocks(page: Page): Promise<void> {
  await page.unrouteAll();
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  const box = await element.boundingBox();
  
  if (!box) return false;
  
  const viewport = page.viewportSize();
  if (!viewport) return false;
  
  return (
    box.y >= 0 &&
    box.x >= 0 &&
    box.y + box.height <= viewport.height &&
    box.x + box.width <= viewport.width
  );
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Wait for loading to complete
 */
export async function waitForLoading(page: Page): Promise<void> {
  const loadingSelector = '[data-testid="loading"], [data-loading="true"], .loading';
  
  // Wait for loading to appear
  await page.waitForSelector(loadingSelector, { timeout: 1000 }).catch(() => {});
  
  // Wait for loading to disappear
  await page.waitForSelector(loadingSelector, { state: 'hidden', timeout: 30000 }).catch(() => {});
}

/**
 * Fill form fields
 */
export async function fillForm(
  page: Page,
  fields: Record<string, string>
): Promise<void> {
  for (const [label, value] of Object.entries(fields)) {
    const input = page.getByLabel(new RegExp(label, 'i')).or(
      page.getByPlaceholder(new RegExp(label, 'i'))
    );
    await input.fill(value);
  }
}

/**
 * Generate random test data
 */
export function generateTestData() {
  const random = Math.floor(Math.random() * 100000);
  return {
    email: `test-${random}@blueprint.test`,
    username: `testuser${random}`,
    projectName: `Test Project ${random}`,
    clientName: `Test Client ${random}`,
    invoiceNumber: `INV-${random}`,
  };
}
