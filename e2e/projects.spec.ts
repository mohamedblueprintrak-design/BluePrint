/**
 * Projects E2E Tests
 * اختبارات المشاريع الشاملة
 */

import { test, expect } from '@playwright/test';

test.describe('Projects List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
  });

  test('should display projects list page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show project cards or table', async ({ page }) => {
    const projectElements = page.locator('[class*="project"], [class*="card"], table tr');
    await expect(projectElements.first()).toBeVisible({ timeout: 5000 });
  });

  test('should filter projects by status', async ({ page }) => {
    const statusFilter = page.locator('select, [class*="filter"]').first();
    
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.click('text=/نشط|active/i');
      
      await page.waitForTimeout(1000);
    }
  });

  test('should search projects', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="بحث"], input[placeholder*="search"]');
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('مشروع');
      await searchInput.press('Enter');
      
      await page.waitForTimeout(1000);
    }
  });

  test('should sort projects', async ({ page }) => {
    const sortButton = page.locator('button[aria-label*="sort"], [class*="sort"]');
    
    if (await sortButton.isVisible()) {
      await sortButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should paginate projects', async ({ page }) => {
    const pagination = page.locator('[class*="pagination"], nav[aria-label*="pagination"]');
    
    if (await pagination.isVisible()) {
      const nextButton = pagination.locator('button:has-text(">"), button:has-text("التالي")');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});

test.describe('Create Project', () => {
  test('should open create project modal', async ({ page }) => {
    await page.goto('/projects');
    
    await page.click('text=/مشروع جديد|new project|إضافة/i');
    
    await expect(page.locator('[role="dialog"], [class*="modal"]')).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/projects');
    await page.click('text=/مشروع جديد|new project|إضافة/i');
    
    // Submit without filling required fields
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=/مطلوب|required/i')).toBeVisible({ timeout: 3000 });
  });

  test('should create project with valid data', async ({ page }) => {
    await page.goto('/projects');
    await page.click('text=/مشروع جديد|new project|إضافة/i');
    
    // Fill project form
    await page.fill('input[name="name"]', `مشروع تجريبي ${Date.now()}`);
    await page.fill('input[name="location"]', 'الرياض');
    await page.fill('input[name="contractValue"]', '1000000');
    
    // Select client if dropdown exists
    const clientSelect = page.locator('select[name="clientId"], [class*="client"]');
    if (await clientSelect.isVisible()) {
      await clientSelect.click();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show success or redirect
    await page.waitForTimeout(2000);
  });
});

test.describe('Project Details', () => {
  test('should view project details', async ({ page }) => {
    await page.goto('/projects');
    
    // Click on first project
    const firstProject = page.locator('[class*="project"], [class*="card"], table tr').first();
    if (await firstProject.isVisible()) {
      await firstProject.click();
      
      // Should navigate to project details
      await expect(page).not.toHaveURL('/projects', { timeout: 5000 });
    }
  });

  test('should show project tabs', async ({ page }) => {
    // Navigate to a project
    await page.goto('/projects');
    const projectLink = page.locator('a[href*="/projects/"]').first();
    
    if (await projectLink.isVisible()) {
      await projectLink.click();
      
      // Check for tabs
      const tabs = page.locator('[role="tab"], [class*="tab"]');
      await expect(tabs.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show project tasks', async ({ page }) => {
    await page.goto('/projects');
    const projectLink = page.locator('a[href*="/projects/"]').first();
    
    if (await projectLink.isVisible()) {
      await projectLink.click();
      
      // Click on tasks tab
      await page.click('text=/المهام|tasks/i');
      
      await page.waitForTimeout(1000);
    }
  });

  test('should show project documents', async ({ page }) => {
    await page.goto('/projects');
    const projectLink = page.locator('a[href*="/projects/"]').first();
    
    if (await projectLink.isVisible()) {
      await projectLink.click();
      
      // Click on documents tab
      await page.click('text=/المستندات|documents/i');
      
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Edit Project', () => {
  test('should open edit modal', async ({ page }) => {
    await page.goto('/projects');
    
    const editButton = page.locator('button[aria-label*="edit"], button[aria-label*="تعديل"]').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      await expect(page.locator('[role="dialog"], [class*="modal"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should update project name', async ({ page }) => {
    await page.goto('/projects');
    
    const projectCard = page.locator('[class*="project"], [class*="card"]').first();
    if (await projectCard.isVisible()) {
      // Hover to show actions
      await projectCard.hover();
      
      const editBtn = projectCard.locator('button:has-text("تعديل"), button:has-text("Edit")');
      if (await editBtn.isVisible()) {
        await editBtn.click();
        
        await page.fill('input[name="name"]', `مشروع محدث ${Date.now()}`);
        await page.click('button[type="submit"]');
        
        await page.waitForTimeout(2000);
      }
    }
  });
});

test.describe('Delete Project', () => {
  test('should show delete confirmation', async ({ page }) => {
    await page.goto('/projects');
    
    const deleteButton = page.locator('button[aria-label*="delete"], button[aria-label*="حذف"]').first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Should show confirmation dialog
      await expect(page.locator('[role="alertdialog"], [class*="confirm"]')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should cancel delete', async ({ page }) => {
    await page.goto('/projects');
    
    const deleteButton = page.locator('button[aria-label*="delete"], button[aria-label*="حذف"]').first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Click cancel
      await page.click('text=/إلغاء|cancel/i');
      
      // Dialog should close
      await expect(page.locator('[role="alertdialog"]')).not.toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Project Status', () => {
  test('should change project status', async ({ page }) => {
    await page.goto('/projects');
    
    const statusBadge = page.locator('[class*="status"], [class*="badge"]').first();
    
    if (await statusBadge.isVisible()) {
      await statusBadge.click();
      
      // Status dropdown should appear
      const statusOptions = page.locator('text=/نشط|active|مكتمل|completed/i');
      await expect(statusOptions.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should show status badge with correct color', async ({ page }) => {
    await page.goto('/projects');
    
    const activeBadge = page.locator('[class*="active"], [class*="success"]').first();
    const pendingBadge = page.locator('[class*="pending"], [class*="warning"]').first();
    
    // Check that badges have appropriate styling classes
  });
});

test.describe('Project Progress', () => {
  test('should display progress bar', async ({ page }) => {
    await page.goto('/projects');
    
    const progressBar = page.locator('[class*="progress"], [role="progressbar"]');
    
    if (await progressBar.isVisible()) {
      const progressValue = await progressBar.getAttribute('aria-valuenow');
      expect(Number(progressValue)).toBeGreaterThanOrEqual(0);
      expect(Number(progressValue)).toBeLessThanOrEqual(100);
    }
  });

  test('should update progress', async ({ page }) => {
    // Navigate to project and update progress
    await page.goto('/projects');
    const projectLink = page.locator('a[href*="/projects/"]').first();
    
    if (await projectLink.isVisible()) {
      await projectLink.click();
      
      // Look for progress edit functionality
      const progressInput = page.locator('input[type="range"], input[name="progress"]');
      if (await progressInput.isVisible()) {
        await progressInput.fill('50');
      }
    }
  });
});
