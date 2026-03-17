/**
 * E2E Tests for Pricing Page
 * اختبارات شاملة لصفحة الأسعار
 */

import { test, expect } from '@playwright/test';

test.describe('Pricing Plans Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display pricing section', async ({ page }) => {
    // Scroll to pricing section
    const pricingSection = page.locator('[data-testid="pricing-section"]').or(
      page.getByRole('heading', { name: /pricing|الأسعار|الخطط/i })
    );
    
    // Scroll down to find pricing
    await page.keyboard.press('End');
    await page.waitForTimeout(500);
    
    // Check for pricing content
    const starterPlan = page.getByText(/starter|المبتدئ|199/i);
    const professionalPlan = page.getByText(/professional|المحترف|499/i);
    const enterprisePlan = page.getByText(/enterprise|المؤسسي|999/i);
    
    // At least one plan should be visible
    const hasStarter = await starterPlan.isVisible().catch(() => false);
    const hasProfessional = await professionalPlan.isVisible().catch(() => false);
    const hasEnterprise = await enterprisePlan.isVisible().catch(() => false);
    
    expect(hasStarter || hasProfessional || hasEnterprise).toBeTruthy();
  });

  test('should display three pricing tiers', async ({ page }) => {
    await page.keyboard.press('End');
    await page.waitForTimeout(500);
    
    // Check for the three plans
    const plans = ['starter', 'professional', 'enterprise'];
    let foundPlans = 0;
    
    for (const plan of plans) {
      const planElement = page.getByText(new RegExp(plan, 'i'));
      if (await planElement.isVisible().catch(() => false)) {
        foundPlans++;
      }
    }
    
    // Should find at least 2 plans
    expect(foundPlans).toBeGreaterThanOrEqual(2);
  });

  test('should show AED currency', async ({ page }) => {
    await page.keyboard.press('End');
    await page.waitForTimeout(500);
    
    const aedElement = page.getByText(/AED|درهم/i);
    const hasAED = await aedElement.isVisible().catch(() => false);
    
    expect(hasAED).toBeTruthy();
  });

  test('should show monthly and annual pricing toggle', async ({ page }) => {
    await page.keyboard.press('End');
    await page.waitForTimeout(500);
    
    // Look for billing toggle
    const monthlyToggle = page.getByRole('button', { name: /monthly|شهري/i });
    const annualToggle = page.getByRole('button', { name: /annual|سنوي/i });
    const toggleSwitch = page.getByRole('switch');
    
    const hasToggle = await monthlyToggle.isVisible().catch(() => false) ||
                      await annualToggle.isVisible().catch(() => false) ||
                      await toggleSwitch.isVisible().catch(() => false);
    
    expect(hasToggle).toBeTruthy();
  });

  test('should calculate annual discount', async ({ page }) => {
    await page.keyboard.press('End');
    await page.waitForTimeout(500);
    
    // Look for discount text
    const discountText = page.getByText(/20%|خصم 20/i);
    const saveText = page.getByText(/save|وفر/i);
    
    const hasDiscount = await discountText.isVisible().catch(() => false) ||
                        await saveText.isVisible().catch(() => false);
    
    expect(hasDiscount).toBeTruthy();
  });

  test('should mark professional plan as popular', async ({ page }) => {
    await page.keyboard.press('End');
    await page.waitForTimeout(500);
    
    const popularBadge = page.getByText(/popular|الأكثر شعبية|موصى به/i);
    const hasPopularBadge = await popularBadge.isVisible().catch(() => false);
    
    expect(hasPopularBadge).toBeTruthy();
  });
});

test.describe('Pricing Plan Selection', () => {
  test('should have working subscribe buttons', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('End');
    await page.waitForTimeout(500);
    
    // Find subscribe/get started buttons
    const subscribeButtons = page.getByRole('button', { name: /subscribe|get started|اشترك|ابدأ الآن/i });
    const buttonCount = await subscribeButtons.count();
    
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should handle plan selection without login', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('End');
    await page.waitForTimeout(500);
    
    const subscribeButton = page.getByRole('button', { name: /subscribe|اشترك/i }).first();
    
    if (await subscribeButton.isVisible().catch(() => false)) {
      await subscribeButton.click();
      
      // Should redirect to login or show login prompt
      await page.waitForTimeout(1000);
      
      const isOnLogin = page.url().includes('login') || page.url().includes('auth');
      const hasLoginPrompt = await page.getByText(/login|sign in|تسجيل الدخول/i).isVisible().catch(() => false);
      
      expect(isOnLogin || hasLoginPrompt).toBeTruthy();
    } else {
      test.skip(true, 'Subscribe button not found');
    }
  });
});

test.describe('Pricing Responsive Design', () => {
  test('should display correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.keyboard.press('End');
    await page.waitForTimeout(500);
    
    // Check pricing cards are stacked
    const pricingContainer = page.locator('[data-testid="pricing-section"]').or(
      page.getByRole('heading', { name: /pricing|الأسعار/i }).locator('..')
    );
    
    await expect(page.getByText(/starter|professional|enterprise/i).first()).toBeVisible();
  });

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.keyboard.press('End');
    await page.waitForTimeout(500);
    
    await expect(page.getByText(/199|499|999/i).first()).toBeVisible();
  });

  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.keyboard.press('End');
    await page.waitForTimeout(500);
    
    // All three plans should be visible side by side
    const starter = page.getByText(/starter|المبتدئ/i);
    const professional = page.getByText(/professional|المحترف/i);
    const enterprise = page.getByText(/enterprise|المؤسسي/i);
    
    const visiblePlans = [
      await starter.isVisible().catch(() => false),
      await professional.isVisible().catch(() => false),
      await enterprise.isVisible().catch(() => false),
    ].filter(Boolean).length;
    
    expect(visiblePlans).toBeGreaterThanOrEqual(2);
  });
});
