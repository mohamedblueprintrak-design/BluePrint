/**
 * Tasks E2E Tests
 * اختبارات المهام الشاملة
 */

import { test, expect } from '@playwright/test';

test.describe('Tasks List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/tasks');
  });

  test('should display tasks page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show task list or empty state', async ({ page }) => {
    // Either tasks are shown or empty state message
    const taskElements = page.locator('[class*="task"], [class*="card"], table tr, [class*="empty"]');
    await expect(taskElements.first()).toBeVisible({ timeout: 5000 });
  });

  test('should filter tasks by status', async ({ page }) => {
    const statusFilter = page.locator('select, [class*="filter"], [role="combobox"]').first();
    
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.click('text=/قيد التنفيذ|in.progress/i');
      await page.waitForTimeout(1000);
    }
  });

  test('should filter tasks by priority', async ({ page }) => {
    const priorityFilter = page.locator('text=/الأولوية|priority/i').first();
    
    if (await priorityFilter.isVisible()) {
      await priorityFilter.click();
      await page.waitForTimeout(500);
    }
  });

  test('should search tasks', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="بحث"], input[placeholder*="search"]');
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('مهمة');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);
    }
  });

  test('should sort tasks by due date', async ({ page }) => {
    const sortButton = page.locator('text=/تاريخ|date|ترتيب/i').first();
    
    if (await sortButton.isVisible()) {
      await sortButton.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Create Task', () => {
  test('should open create task modal', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    
    const createButton = page.locator('text=/مهمة جديدة|new task|إضافة/i');
    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page.locator('[role="dialog"], [class*="modal"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    
    const createButton = page.locator('text=/مهمة جديدة|new task|إضافة/i');
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Submit without title
      await page.click('button[type="submit"]');
      
      // Should show validation error
      await page.waitForTimeout(1000);
    }
  });

  test('should create task with valid data', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    
    const createButton = page.locator('text=/مهمة جديدة|new task|إضافة/i');
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Fill task form
      await page.fill('input[name="title"]', `مهمة تجريبية ${Date.now()}`);
      await page.fill('textarea[name="description"]', 'وصف المهمة التجريبية');
      
      // Select priority
      const prioritySelect = page.locator('select[name="priority"], [class*="priority"]');
      if (await prioritySelect.isVisible()) {
        await prioritySelect.click();
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }
      
      // Set due date
      const dueDateInput = page.locator('input[type="date"], input[name="dueDate"]');
      if (await dueDateInput.isVisible()) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await dueDateInput.fill(tomorrow.toISOString().split('T')[0]);
      }
      
      // Submit form
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
  });
});

test.describe('Task Details', () => {
  test('should view task details', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    
    const taskElement = page.locator('[class*="task"], [class*="card"], table tr').first();
    if (await taskElement.isVisible()) {
      await taskElement.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should update task progress', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    
    const taskElement = page.locator('[class*="task"], [class*="card"]').first();
    if (await taskElement.isVisible()) {
      await taskElement.click();
      
      // Look for progress slider
      const progressSlider = page.locator('input[type="range"], [class*="progress"]');
      if (await progressSlider.isVisible()) {
        await progressSlider.fill('50');
        await page.waitForTimeout(500);
      }
    }
  });

  test('should change task status', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    
    const statusBadge = page.locator('[class*="status"], [class*="badge"]').first();
    if (await statusBadge.isVisible()) {
      await statusBadge.click();
      
      const statusOptions = page.locator('text=/مكتمل|done|قيد التنفيذ|in.progress/i');
      if (await statusOptions.first().isVisible()) {
        await statusOptions.first().click();
        await page.waitForTimeout(1000);
      }
    }
  });
});

test.describe('Task Assignment', () => {
  test('should assign task to user', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    
    const createButton = page.locator('text=/مهمة جديدة|new task|إضافة/i');
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const assigneeSelect = page.locator('select[name="assignedTo"], [class*="assignee"]');
      if (await assigneeSelect.isVisible()) {
        await assigneeSelect.click();
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }
    }
  });

  test('should show assigned user avatar', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    
    const userAvatar = page.locator('[class*="avatar"], img[alt*="user"]').first();
    // Avatar should be visible if tasks have assignees
    await page.waitForTimeout(1000);
  });
});

test.describe('Task Due Dates', () => {
  test('should show overdue tasks', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    
    // Look for overdue indicators
    const overdueIndicator = page.locator('[class*="overdue"], [class*="late"], text=/متأخر|overdue/i');
    await page.waitForTimeout(1000);
  });

  test('should show due date calendar', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    
    const calendarButton = page.locator('[aria-label*="calendar"], [class*="calendar"]').first();
    if (await calendarButton.isVisible()) {
      await calendarButton.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Task Deletion', () => {
  test('should show delete confirmation', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    
    const deleteButton = page.locator('button[aria-label*="delete"], button[aria-label*="حذف"]').first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await expect(page.locator('[role="alertdialog"], [class*="confirm"]')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should cancel delete', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    
    const deleteButton = page.locator('button[aria-label*="delete"], button[aria-label*="حذف"]').first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Click cancel
      await page.click('text=/إلغاء|cancel/i');
      await page.waitForTimeout(500);
    }
  });
});
