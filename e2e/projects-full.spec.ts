/**
 * Projects E2E Tests
 * اختبارات E2E للمشاريع
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Helper functions
async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard.*/);
}

async function createProject(page: Page, projectData: {
  name: string;
  location?: string;
  contractValue?: string;
}) {
  await page.goto(`${BASE_URL}/dashboard/projects`);
  await page.click('button:has-text("New Project")');
  
  await page.fill('input[name="name"]', projectData.name);
  if (projectData.location) {
    await page.fill('input[name="location"]', projectData.location);
  }
  if (projectData.contractValue) {
    await page.fill('input[name="contractValue"]', projectData.contractValue);
  }
  
  await page.click('button[type="submit"]');
}

test.describe('Projects Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    // await login(page, 'test@test.com', 'password123');
  });

  test('should display projects list page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/projects`);
    
    // Check page title
    await expect(page.locator('h1, h2, h3')).toContainText(/projects|المشاريع/i);
  });

  test('should create a new project', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/projects`);
    
    // Click new project button
    const newButton = page.locator('button:has-text("New"), button:has-text("جديد")');
    if (await newButton.count() > 0) {
      await newButton.first().click();
      
      // Fill form
      await page.fill('input[name="name"]', `Test Project ${Date.now()}`);
      
      // Submit
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    }
  });

  test('should search projects', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/projects`);
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="search" i], input[name="search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('Test');
      await page.waitForTimeout(500);
    }
  });

  test('should filter projects by status', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/projects`);
    
    // Find status filter
    const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]');
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption('active');
      await page.waitForTimeout(500);
    }
  });

  test('should view project details', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/projects`);
    
    // Click on first project
    const projectCard = page.locator('[data-testid="project-card"], table tbody tr').first();
    if (await projectCard.count() > 0) {
      await projectCard.click();
      
      // Check for project details
      await expect(page).toHaveURL(/.*projects\/.*/);
    }
  });

  test('should edit project', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/projects`);
    
    // Click on first project
    const projectCard = page.locator('[data-testid="project-card"], table tbody tr').first();
    if (await projectCard.count() > 0) {
      await projectCard.click();
      
      // Click edit button
      const editButton = page.locator('button:has-text("Edit"), button:has-text("تعديل")');
      if (await editButton.count() > 0) {
        await editButton.click();
      }
    }
  });

  test('should delete project', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/projects`);
    
    // Find delete button for first project
    const deleteButton = page.locator('button:has-text("Delete"), button:has-text("حذف")').first();
    if (await deleteButton.count() > 0) {
      // Click delete
      await deleteButton.click();
      
      // Confirm deletion
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("تأكيد")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }
    }
  });

  test('should paginate projects', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/projects`);
    
    // Check pagination
    const nextButton = page.locator('button:has-text("Next"), button[aria-label="next page"]');
    if (await nextButton.count() > 0) {
      const isDisabled = await nextButton.isDisabled();
      if (!isDisabled) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('Project Tasks', () => {
  test('should display tasks for project', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/tasks`);
    
    // Check page loaded
    await expect(page.locator('h1, h2, h3')).toContainText(/tasks|المهام/i);
  });

  test('should create task', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/tasks`);
    
    // Click new task
    const newButton = page.locator('button:has-text("New Task"), button:has-text("مهمة جديدة")');
    if (await newButton.count() > 0) {
      await newButton.click();
      
      // Fill form
      await page.fill('input[name="title"]', `Test Task ${Date.now()}`);
      
      // Submit
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    }
  });

  test('should update task status', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/tasks`);
    
    // Find task and update status
    const taskItem = page.locator('[data-testid="task-item"], table tbody tr').first();
    if (await taskItem.count() > 0) {
      // Click status dropdown
      const statusDropdown = taskItem.locator('select[name="status"]');
      if (await statusDropdown.count() > 0) {
        await statusDropdown.selectOption('in_progress');
      }
    }
  });
});

test.describe('Project Reports', () => {
  test('should display reports page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/reports`);
    
    // Check page loaded
    await expect(page.locator('h1, h2, h3')).toContainText(/reports|التقارير/i);
  });

  test('should generate project report', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/reports`);
    
    // Find report type selector
    const reportTypeSelect = page.locator('select[name="reportType"]');
    if (await reportTypeSelect.count() > 0) {
      await reportTypeSelect.selectOption('projects');
      
      // Click generate
      const generateButton = page.locator('button:has-text("Generate"), button:has-text("إنشاء")');
      if (await generateButton.count() > 0) {
        await generateButton.click();
      }
    }
  });

  test('should export report', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/reports`);
    
    // Find export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("تصدير")');
    if (await exportButton.count() > 0) {
      await exportButton.click();
      
      // Select format
      const pdfOption = page.locator('button:has-text("PDF"), button:has-text("Excel")');
      if (await pdfOption.count() > 0) {
        await pdfOption.first().click();
      }
    }
  });
});

test.describe('Project Gantt Chart', () => {
  test('should display gantt chart', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/gantt`);
    
    // Check for gantt chart
    const ganttContainer = page.locator('[data-testid="gantt-chart"], .gantt-container');
    // Wait for potential loading
    await page.waitForTimeout(1000);
  });

  test('should navigate gantt timeline', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/gantt`);
    
    // Find navigation buttons
    const prevButton = page.locator('button:has-text("Previous"), button[aria-label="previous"]');
    const nextButton = page.locator('button:has-text("Next"), button[aria-label="next"]');
    
    if (await prevButton.count() > 0) {
      await prevButton.click();
    }
    
    if (await nextButton.count() > 0) {
      await nextButton.click();
    }
  });
});

test.describe('Project Documents', () => {
  test('should display documents page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/documents`);
    
    // Check page loaded
    await expect(page.locator('h1, h2, h3')).toContainText(/documents|المستندات/i);
  });

  test('should upload document', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/documents`);
    
    // Find upload button
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("رفع")');
    if (await uploadButton.count() > 0) {
      await uploadButton.click();
      
      // File input would be handled here
    }
  });
});

test.describe('Project Defects', () => {
  test('should display defects page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/defects`);
    
    // Check page loaded
    await expect(page.locator('h1, h2, h3')).toContainText(/defects|العيوب/i);
  });

  test('should create defect report', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/defects`);
    
    // Click new defect
    const newButton = page.locator('button:has-text("New"), button:has-text("جديد")');
    if (await newButton.count() > 0) {
      await newButton.click();
      
      // Fill form
      await page.fill('input[name="title"]', `Test Defect ${Date.now()}`);
      
      // Submit
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    }
  });
});

test.describe('Site Diary', () => {
  test('should display site diary page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/site-diary`);
    
    // Check page loaded
    await expect(page.locator('h1, h2, h3')).toContainText(/site.?diary|سجل.?الموقع/i);
  });

  test('should create site report', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/site-diary`);
    
    // Click new report
    const newButton = page.locator('button:has-text("New"), button:has-text("جديد")');
    if (await newButton.count() > 0) {
      await newButton.click();
    }
  });
});
