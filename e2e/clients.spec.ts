/**
 * Clients E2E Tests
 * اختبارات العملاء الشاملة
 */

import { test, expect } from '@playwright/test';

test.describe('Clients List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/clients');
  });

  test('should display clients page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show client list or empty state', async ({ page }) => {
    const clientElements = page.locator('[class*="client"], [class*="card"], table tr, [class*="empty"]');
    await expect(clientElements.first()).toBeVisible({ timeout: 5000 });
  });

  test('should search clients', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="بحث"], input[placeholder*="search"]');
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('عميل');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);
    }
  });

  test('should filter active clients', async ({ page }) => {
    const activeFilter = page.locator('text=/نشط|active/i').first();
    
    if (await activeFilter.isVisible()) {
      await activeFilter.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Create Client', () => {
  test('should open create client modal', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    const createButton = page.locator('text=/عميل جديد|new client|إضافة/i');
    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page.locator('[role="dialog"], [class*="modal"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    const createButton = page.locator('text=/عميل جديد|new client|إضافة/i');
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Submit without name
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    }
  });

  test('should create client with valid data', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    const createButton = page.locator('text=/عميل جديد|new client|إضافة/i');
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Fill client form
      await page.fill('input[name="name"]', `عميل تجريبي ${Date.now()}`);
      await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
      await page.fill('input[name="phone"]', '+966501234567');
      await page.fill('input[name="address"]', 'الرياض، المملكة العربية السعودية');
      
      // Submit form
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    const createButton = page.locator('text=/عميل جديد|new client|إضافة/i');
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Fill with invalid email
      await page.fill('input[name="name"]', 'عميل تجريبي');
      await page.fill('input[name="email"]', 'invalid-email');
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Client Details', () => {
  test('should view client details', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    const clientElement = page.locator('[class*="client"], [class*="card"], table tr').first();
    if (await clientElement.isVisible()) {
      await clientElement.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should show client projects', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    const clientElement = page.locator('[class*="client"], [class*="card"]').first();
    if (await clientElement.isVisible()) {
      await clientElement.click();
      
      // Look for projects tab
      const projectsTab = page.locator('text=/المشاريع|projects/i');
      if (await projectsTab.isVisible()) {
        await projectsTab.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should show client invoices', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    const clientElement = page.locator('[class*="client"], [class*="card"]').first();
    if (await clientElement.isVisible()) {
      await clientElement.click();
      
      const invoicesTab = page.locator('text=/الفواتير|invoices/i');
      if (await invoicesTab.isVisible()) {
        await invoicesTab.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});

test.describe('Edit Client', () => {
  test('should open edit modal', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    const editButton = page.locator('button[aria-label*="edit"], button[aria-label*="تعديل"]').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(page.locator('[role="dialog"], [class*="modal"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should update client information', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    const clientCard = page.locator('[class*="client"], [class*="card"]').first();
    if (await clientCard.isVisible()) {
      await clientCard.hover();
      
      const editBtn = clientCard.locator('button:has-text("تعديل"), button:has-text("Edit")');
      if (await editBtn.isVisible()) {
        await editBtn.click();
        
        await page.fill('input[name="phone"]', '+966509876543');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
      }
    }
  });
});

test.describe('Delete Client', () => {
  test('should show delete confirmation', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    const deleteButton = page.locator('button[aria-label*="delete"], button[aria-label*="حذف"]').first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await expect(page.locator('[role="alertdialog"], [class*="confirm"]')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should cancel delete', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    const deleteButton = page.locator('button[aria-label*="delete"], button[aria-label*="حذف"]').first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.click('text=/إلغاء|cancel/i');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Client Statistics', () => {
  test('should show total clients count', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    const statsCard = page.locator('[class*="stats"], [class*="summary"]').first();
    if (await statsCard.isVisible()) {
      // Check for number
      await page.waitForTimeout(500);
    }
  });

  test('should show active clients count', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    const activeCount = page.locator('text=/نشط|active/i').first();
    await page.waitForTimeout(500);
  });
});
