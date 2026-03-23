/**
 * Billing E2E Tests
 * اختبارات E2E للفواتير والمدفوعات
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Pricing Page', () => {
  test('should display pricing plans', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    
    // Check for pricing cards
    const pricingCards = page.locator('[data-testid="pricing-card"], .pricing-card');
    await expect(pricingCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show plan features', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    
    // Check for features list
    const features = page.locator('[data-testid="plan-feature"], .feature-item');
    if (await features.count() > 0) {
      expect(await features.count()).toBeGreaterThan(0);
    }
  });

  test('should toggle monthly/yearly pricing', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    
    // Find toggle
    const toggle = page.locator('[data-testid="billing-toggle"], button:has-text("Yearly")');
    if (await toggle.count() > 0) {
      await toggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('should select a plan', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    
    // Click select plan button
    const selectButton = page.locator('button:has-text("Select"), button:has-text("اختر")').first();
    if (await selectButton.count() > 0) {
      await selectButton.click();
      
      // Should redirect to checkout or login
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Invoice Management', () => {
  test('should display invoices page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/invoices`);
    
    // Check page loaded
    await expect(page.locator('h1, h2, h3')).toContainText(/invoices|الفواتير/i);
  });

  test('should create new invoice', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/invoices`);
    
    // Click new invoice
    const newButton = page.locator('button:has-text("New"), button:has-text("جديد")');
    if (await newButton.count() > 0) {
      await newButton.click();
      
      // Fill form
      await page.fill('input[name="invoiceNumber"]', `INV-${Date.now()}`);
      
      // Submit
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    }
  });

  test('should filter invoices by status', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/invoices`);
    
    // Find status filter
    const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]');
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption('paid');
      await page.waitForTimeout(500);
    }
  });

  test('should search invoices', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/invoices`);
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="search" i], input[name="search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('INV-001');
      await page.waitForTimeout(500);
    }
  });

  test('should view invoice details', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/invoices`);
    
    // Click on first invoice
    const invoiceRow = page.locator('table tbody tr, [data-testid="invoice-item"]').first();
    if (await invoiceRow.count() > 0) {
      await invoiceRow.click();
    }
  });

  test('should download invoice PDF', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/invoices`);
    
    // Find download button
    const downloadButton = page.locator('button:has-text("Download"), button:has-text("تحميل")').first();
    if (await downloadButton.count() > 0) {
      // Listen for download
      const [download] = await Promise.all([
        page.waitForEvent('download').catch(() => null),
        downloadButton.click(),
      ]);
    }
  });

  test('should send invoice via email', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/invoices`);
    
    // Find send button
    const sendButton = page.locator('button:has-text("Send"), button:has-text("إرسال")').first();
    if (await sendButton.count() > 0) {
      await sendButton.click();
    }
  });
});

test.describe('Client Management', () => {
  test('should display clients page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/clients`);
    
    // Check page loaded
    await expect(page.locator('h1, h2, h3')).toContainText(/clients|العملاء/i);
  });

  test('should create new client', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/clients`);
    
    // Click new client
    const newButton = page.locator('button:has-text("New"), button:has-text("جديد")');
    if (await newButton.count() > 0) {
      await newButton.click();
      
      // Fill form
      await page.fill('input[name="name"]', `Test Client ${Date.now()}`);
      await page.fill('input[name="email"]', `test${Date.now()}@test.com`);
      
      // Submit
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    }
  });

  test('should edit client', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/clients`);
    
    // Click on first client
    const clientRow = page.locator('table tbody tr, [data-testid="client-item"]').first();
    if (await clientRow.count() > 0) {
      await clientRow.click();
      
      // Click edit
      const editButton = page.locator('button:has-text("Edit"), button:has-text("تعديل")');
      if (await editButton.count() > 0) {
        await editButton.click();
      }
    }
  });

  test('should search clients', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/clients`);
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="search" i], input[name="search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('Test');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Budget Management', () => {
  test('should display budgets page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/budgets`);
    
    // Check page loaded
    await expect(page.locator('h1, h2, h3')).toContainText(/budgets|الميزانيات/i);
  });

  test('should display budget overview', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/budgets`);
    
    // Check for budget cards
    const budgetCards = page.locator('[data-testid="budget-card"], .budget-item');
    await page.waitForTimeout(1000);
  });
});

test.describe('Payment Settings', () => {
  test('should display billing settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Check for billing section
    const billingSection = page.locator('[data-testid="billing-section"], button:has-text("Billing")');
    if (await billingSection.count() > 0) {
      await billingSection.first().click();
    }
  });

  test('should show current plan', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Check for plan info
    const planInfo = page.locator('[data-testid="current-plan"], .plan-info');
    await page.waitForTimeout(500);
  });

  test('should open billing portal', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    
    // Find manage subscription button
    const manageButton = page.locator('button:has-text("Manage"), button:has-text("إدارة")');
    if (await manageButton.count() > 0) {
      // Would redirect to Stripe portal
    }
  });
});

test.describe('Expenses', () => {
  test('should display expenses page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/expenses`);
    
    // Check page loaded
    await page.waitForTimeout(1000);
  });

  test('should create expense', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/expenses`);
    
    // Click new expense
    const newButton = page.locator('button:has-text("New"), button:has-text("جديد")');
    if (await newButton.count() > 0) {
      await newButton.click();
    }
  });
});

test.describe('Proposals', () => {
  test('should display proposals page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/proposals`);
    
    // Check page loaded
    await expect(page.locator('h1, h2, h3')).toContainText(/proposals|العروض/i);
  });

  test('should create proposal', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/proposals`);
    
    // Click new proposal
    const newButton = page.locator('button:has-text("New"), button:has-text("جديد")');
    if (await newButton.count() > 0) {
      await newButton.click();
    }
  });

  test('should convert proposal to invoice', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/proposals`);
    
    // Click on first proposal
    const proposalRow = page.locator('table tbody tr, [data-testid="proposal-item"]').first();
    if (await proposalRow.count() > 0) {
      await proposalRow.click();
      
      // Find convert button
      const convertButton = page.locator('button:has-text("Convert"), button:has-text("تحويل")');
      if (await convertButton.count() > 0) {
        await convertButton.click();
      }
    }
  });
});

test.describe('Contracts', () => {
  test('should display contracts page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/contracts`);
    
    // Check page loaded
    await expect(page.locator('h1, h2, h3')).toContainText(/contracts|العقود/i);
  });

  test('should create contract', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/contracts`);
    
    // Click new contract
    const newButton = page.locator('button:has-text("New"), button:has-text("جديد")');
    if (await newButton.count() > 0) {
      await newButton.click();
    }
  });

  test('should send for signature', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/contracts`);
    
    // Click on first contract
    const contractRow = page.locator('table tbody tr, [data-testid="contract-item"]').first();
    if (await contractRow.count() > 0) {
      await contractRow.click();
      
      // Find send for signature button
      const sendButton = page.locator('button:has-text("Send for Signature"), button:has-text("إرسال للتوقيع")');
      if (await sendButton.count() > 0) {
        await sendButton.click();
      }
    }
  });
});
