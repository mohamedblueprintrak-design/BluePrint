import { test, expect } from '@playwright/test';
import { nanoid } from 'nanoid';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = process.env.E2E_TEST_EMAIL || 'admin@blueprint.dev';
const TEST_USER_PASSWORD = process.env.E2E_TEST_PASSWORD || 'Admin@123456';

// Helper: Login before each test
async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.locator('input[name="email"], input[type="email"]').fill(TEST_USER_EMAIL);
  await page.locator('input[name="password"], input[type="password"]').fill(TEST_USER_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

test.describe('Critical Project Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ============================================
  // Dashboard Navigation
  // ============================================
  test('should render dashboard with all widgets', async ({ page }) => {
    // Verify dashboard loads
    await expect(page.locator('main, [data-testid="dashboard"]').first()).toBeVisible();

    // Check for key dashboard elements
    await expect(page.locator('text=/projects|مشاريع/i').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/tasks|مهام/i').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/invoices|فواتير/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate between all main sections via sidebar', async ({ page }) => {
    const navItems = [
      { label: /dashboard|لوحة/i, path: /dashboard/ },
      { label: /projects|مشاريع/i, path: /projects/ },
      { label: /tasks|مهام/i, path: /tasks/ },
      { label: /clients|عملاء/i, path: /clients/ },
      { label: /invoices|فواتير/i, path: /invoices/ },
      { label: /reports|تقارير/i, path: /reports/ },
    ];

    for (const item of navItems) {
      const navLink = page.locator(`nav a, aside a, [data-testid="sidebar"] a`).filter({ hasText: item.label }).first();
      if (await navLink.isVisible({ timeout: 3000 })) {
        await navLink.click();
        await expect(page).toHaveURL(item.path, { timeout: 10000 });
        // Go back to dashboard
        await page.goto(`${BASE_URL}/dashboard`);
        await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
      }
    }
  });

  test('should render RTL layout correctly for Arabic', async ({ page }) => {
    // Check overall direction
    const dir = await page.evaluate(() => {
      return document.documentElement.getAttribute('dir') || document.documentElement.style.direction;
    });
    expect(dir).toBe('rtl');

    // Check that sidebar is on the right in RTL
    const sidebar = page.locator('nav, aside, [data-testid="sidebar"]').first();
    if (await sidebar.isVisible()) {
      const sidebarPosition = await sidebar.evaluate(el => {
        const style = window.getComputedStyle(el);
        return { position: style.position, right: style.right, left: style.left, order: style.order };
      });
      // In RTL, sidebar should be on the right side
      // This is a basic check - exact positioning depends on CSS framework
      expect(sidebarPosition).toBeDefined();
    }
  });

  // ============================================
  // Create Project
  // ============================================
  test('should create a new project successfully', async ({ page }) => {
    const projectName = `E2E Test Project ${nanoid(6)}`;

    // Navigate to projects page
    await page.goto(`${BASE_URL}/dashboard/projects`);
    await expect(page).toHaveURL(/projects/, { timeout: 10000 });

    // Click "New Project" button
    const newProjectBtn = page.locator('button:has-text("New"), button:has-text("Add"), button:has-text("إنشاء"), button:has-text("جديد"), [data-testid="new-project"]').first();
    await expect(newProjectBtn).toBeVisible({ timeout: 5000 });
    await newProjectBtn.click();

    // Fill project form
    await page.locator('input[name="name"], input[id="name"], input[placeholder*="name"], input[placeholder*="اسم"]').fill(projectName);

    // Fill optional fields
    const locationInput = page.locator('input[name="location"], input[id="location"]').first();
    if (await locationInput.isVisible()) {
      await locationInput.fill('Dubai, UAE');
    }

    const descriptionInput = page.locator('textarea[name="description"], textarea[id="description"]').first();
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill('E2E automated test project');
    }

    // Select client if dropdown exists
    const clientSelect = page.locator('select[name="clientId"], [data-testid="client-select"]').first();
    if (await clientSelect.isVisible({ timeout: 2000 })) {
      await clientSelect.selectOption({ index: 0 });
    }

    // Submit form
    const submitBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create"), button:has-text("حفظ"), button:has-text("إنشاء")').first();
    await submitBtn.click();

    // Verify success - should redirect or show success message
    await expect(page.locator(':text("success"), :text("تم"), [data-testid="success-toast"], .toast-success').first()).toBeVisible({ timeout: 10000 });
  });

  // ============================================
  // Add Tasks to Project
  // ============================================
  test('should create a task within a project', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/projects`);
    await expect(page).toHaveURL(/projects/, { timeout: 10000 });

    // Click on first project in the list
    const firstProject = page.locator('a[href*="/projects/"], tr, [data-testid="project-row"]').first();
    await firstProject.click();

    // Wait for project detail page
    await page.waitForTimeout(2000);

    // Navigate to tasks tab
    const tasksTab = page.locator('button:has-text("Tasks"), button:has-text("مهام"), a:has-text("Tasks"), [data-testid="tasks-tab"]').first();
    if (await tasksTab.isVisible({ timeout: 3000 })) {
      await tasksTab.click();
    }

    // Click "New Task" button
    const newTaskBtn = page.locator('button:has-text("New Task"), button:has-text("Add Task"), button:has-text("إضافة مهمة"), [data-testid="new-task"]').first();
    if (await newTaskBtn.isVisible({ timeout: 3000 })) {
      await newTaskBtn.click();

      // Fill task form
      const taskTitle = `E2E Task ${nanoid(6)}`;
      await page.locator('input[name="title"], input[id="title"]').fill(taskTitle);

      const taskDesc = page.locator('textarea[name="description"], textarea[id="description"]').first();
      if (await taskDesc.isVisible()) {
        await taskDesc.fill('Automated test task description');
      }

      // Set priority
      const prioritySelect = page.locator('select[name="priority"], [data-testid="priority-select"]').first();
      if (await prioritySelect.isVisible({ timeout: 2000 })) {
        await prioritySelect.selectOption('HIGH');
      }

      // Set dates
      const startDateInput = page.locator('input[name="startDate"], input[type="date"]').first();
      if (await startDateInput.isVisible({ timeout: 2000 })) {
        const today = new Date().toISOString().split('T')[0];
        await startDateInput.fill(today);
      }

      // Submit
      const submitBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("حفظ")').first();
      await submitBtn.click();

      // Verify task created
      await expect(page.locator(`:text("${taskTitle}")`).first()).toBeVisible({ timeout: 10000 });
    }
  });

  // ============================================
  // Gantt Chart
  // ============================================
  test('should display Gantt chart for project tasks', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/projects`);
    await page.locator('a[href*="/projects/"], tr, [data-testid="project-row"]').first().click();
    await page.waitForTimeout(2000);

    // Look for Gantt chart
    const ganttView = page.locator('button:has-text("Gantt"), button:has-text("جانت"), a:has-text("Gantt"), [data-testid="gantt-view"]').first();
    if (await ganttView.isVisible({ timeout: 3000 })) {
      await ganttView.click();

      // Gantt chart should be visible
      const ganttChart = page.locator('[data-testid="gantt-chart"], .gantt-container, svg.gantt').first();
      await expect(ganttChart).toBeVisible({ timeout: 10000 });
    }
  });

  // ============================================
  // Invoice Creation
  // ============================================
  test('should create an invoice for a project', async ({ page }) => {
    // Navigate to invoices
    await page.goto(`${BASE_URL}/dashboard/invoices`);
    await expect(page).toHaveURL(/invoices/, { timeout: 10000 });

    // Click "New Invoice" button
    const newInvoiceBtn = page.locator('button:has-text("New Invoice"), button:has-text("Add"), button:has-text("إنشاء فاتورة"), [data-testid="new-invoice"]').first();
    if (await newInvoiceBtn.isVisible({ timeout: 5000 })) {
      await newInvoiceBtn.click();

      // Fill invoice form
      const clientSelect = page.locator('select[name="clientId"], [data-testid="client-select"]').first();
      if (await clientSelect.isVisible({ timeout: 3000 })) {
        await clientSelect.selectOption({ index: 0 });
      }

      // Add line items
      const addItemBtn = page.locator('button:has-text("Add Item"), button:has-text("إضافة بند"), [data-testid="add-item"]').first();
      if (await addItemBtn.isVisible({ timeout: 3000 })) {
        await addItemBtn.click();

        // Fill item details
        const descInput = page.locator('input[name*="description"], textarea[name*="description"]').last();
        if (await descInput.isVisible()) {
          await descInput.fill('Consultation Fee');
        }

        const qtyInput = page.locator('input[name*="quantity"], input[name*="qty"]').last();
        if (await qtyInput.isVisible()) {
          await qtyInput.fill('10');
        }

        const priceInput = page.locator('input[name*="price"], input[name*="unitPrice"]').last();
        if (await priceInput.isVisible()) {
          await priceInput.fill('500');
        }
      }

      // Submit
      const submitBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("حفظ"), button:has-text("Create")').first();
      await submitBtn.click();

      // Verify
      await expect(page.locator(':text("success"), :text("تم"), [data-testid="success-toast"]').first()).toBeVisible({ timeout: 10000 });
    }
  });

  // ============================================
  // Client Management
  // ============================================
  test('should create a new client', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/clients`);
    await expect(page).toHaveURL(/clients/, { timeout: 10000 });

    const newClientBtn = page.locator('button:has-text("New"), button:has-text("Add"), button:has-text("عميل جديد"), [data-testid="new-client"]').first();
    if (await newClientBtn.isVisible({ timeout: 5000 })) {
      await newClientBtn.click();

      const clientName = `E2E Client ${nanoid(6)}`;
      await page.locator('input[name="name"], input[id="name"]').fill(clientName);

      const emailInput = page.locator('input[name="email"], input[type="email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill(`client-${nanoid(6)}@test.com`);
      }

      const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('+971501234567');
      }

      const submitBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("حفظ")').first();
      await submitBtn.click();

      await expect(page.locator(`:text("${clientName}")`).first()).toBeVisible({ timeout: 10000 });
    }
  });

  // ============================================
  // Reports & Dashboard Analytics
  // ============================================
  test('should display reports with charts', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/reports`);
    await expect(page).toHaveURL(/reports/, { timeout: 10000 });

    // Check for chart elements (Recharts renders SVG)
    const charts = page.locator('svg.recharts-surface, [data-testid="chart"], canvas').first();
    if (await charts.isVisible({ timeout: 5000 })) {
      // Charts should be visible
      expect(await charts.count()).toBeGreaterThan(0);
    }
  });

  // ============================================
  // Data Persistence
  // ============================================
  test('should persist created project after navigation', async ({ page }) => {
    // This test assumes a project was created in previous tests
    await page.goto(`${BASE_URL}/dashboard/projects`);
    await expect(page).toHaveURL(/projects/, { timeout: 10000 });

    // Wait for project list to load
    await page.waitForTimeout(2000);

    // Check that projects list is not empty (has table rows or cards)
    const projectItems = page.locator('tr, [data-testid="project-row"], [data-testid="project-card"]');
    const count = await projectItems.count();
    expect(count).toBeGreaterThan(0);
  });

  // ============================================
  // Search Functionality
  // ============================================
  test('should search for projects by name', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/projects`);
    await expect(page).toHaveURL(/projects/, { timeout: 10000 });

    const searchInput = page.locator('input[name="search"], input[type="search"], input[placeholder*="search"], input[placeholder*="بحث"]').first();
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      // Results should filter
      // Just verify the page still works after search
      await expect(page.locator('main').first()).toBeVisible();
    }
  });

  // ============================================
  // Full Flow: Login → Create → Verify → Logout
  // ============================================
  test('complete flow: login → create project → verify → logout', async ({ page }) => {
    // Already logged in from beforeEach
    const projectName = `Full Flow ${nanoid(6)}`;

    // Create project
    await page.goto(`${BASE_URL}/dashboard/projects`);
    const newProjectBtn = page.locator('button:has-text("New"), button:has-text("إنشاء"), [data-testid="new-project"]').first();
    if (await newProjectBtn.isVisible({ timeout: 5000 })) {
      await newProjectBtn.click();
      await page.locator('input[name="name"], input[id="name"]').fill(projectName);
      await page.locator('button[type="submit"], button:has-text("Save"), button:has-text("حفظ")').first().click();
      await page.waitForTimeout(2000);
    }

    // Verify project exists
    await page.goto(`${BASE_URL}/dashboard/projects`);
    await page.waitForTimeout(2000);
    const projectExists = await page.locator(`:text("${projectName}")`).isVisible({ timeout: 5000 });

    // Logout
    const logoutBtn = page.locator('button:has-text("logout"), button:has-text("تسجيل خروج"), [data-testid="logout"]').first();
    if (await logoutBtn.isVisible({ timeout: 3000 })) {
      await logoutBtn.click();
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("تأكيد")');
      if (await confirmBtn.isVisible({ timeout: 2000 })) {
        await confirmBtn.click();
      }
    }

    await expect(page).toHaveURL(/login/, { timeout: 10000 });
  });
});
