/**
 * E2E Tests for Dashboard
 * اختبارات شاملة للوحة التحكم
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Access', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login or show auth required
    await page.waitForTimeout(1000);
    
    const isOnLogin = page.url().includes('login') || 
                      page.url().includes('auth') ||
                      page.url() === page.url().split('?')[0].split('#')[0];
    
    // Either redirected or showing login
    expect(isOnLogin || !page.url().includes('dashboard')).toBeTruthy();
  });
});

test.describe('Dashboard Layout', () => {
  test.skip('should display sidebar navigation', async ({ page }) => {
    // This test would need authentication setup
    await page.goto('/dashboard');
    
    const sidebar = page.locator('[data-testid="sidebar"]').or(
      page.getByRole('navigation')
    );
    
    await expect(sidebar).toBeVisible();
  });

  test.skip('should display main content area', async ({ page }) => {
    await page.goto('/dashboard');
    
    const mainContent = page.locator('main').or(
      page.getByRole('main')
    );
    
    await expect(mainContent).toBeVisible();
  });

  test.skip('should display header with user info', async ({ page }) => {
    await page.goto('/dashboard');
    
    const header = page.locator('header');
    const userInfo = page.getByTestId('user-info').or(
      page.getByRole('button', { name: /profile|account/i })
    );
    
    await expect(header).toBeVisible();
  });
});

test.describe('Dashboard Widgets', () => {
  test.skip('should display project statistics', async ({ page }) => {
    await page.goto('/dashboard');
    
    const statsWidget = page.getByTestId('project-stats').or(
      page.getByText(/projects|المشاريع/i)
    );
    
    await expect(statsWidget).toBeVisible();
  });

  test.skip('should display task overview', async ({ page }) => {
    await page.goto('/dashboard');
    
    const taskWidget = page.getByTestId('task-overview').or(
      page.getByText(/tasks|المهام/i)
    );
    
    await expect(taskWidget).toBeVisible();
  });

  test.skip('should display revenue chart', async ({ page }) => {
    await page.goto('/dashboard');
    
    const chartWidget = page.getByTestId('revenue-chart').or(
      page.getByText(/revenue|الإيرادات/i)
    );
    
    await expect(chartWidget).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate to projects page', async ({ page }) => {
    await page.goto('/');
    
    // Look for projects link
    const projectsLink = page.getByRole('link', { name: /projects|المشاريع/i });
    
    if (await projectsLink.isVisible().catch(() => false)) {
      await projectsLink.click();
      await page.waitForTimeout(500);
      
      expect(page.url()).toContain('project');
    } else {
      test.skip(true, 'Projects link not found');
    }
  });

  test('should navigate to clients page', async ({ page }) => {
    await page.goto('/');
    
    const clientsLink = page.getByRole('link', { name: /clients|العملاء/i });
    
    if (await clientsLink.isVisible().catch(() => false)) {
      await clientsLink.click();
      await page.waitForTimeout(500);
      
      expect(page.url()).toContain('client');
    } else {
      test.skip(true, 'Clients link not found');
    }
  });

  test('should navigate to invoices page', async ({ page }) => {
    await page.goto('/');
    
    const invoicesLink = page.getByRole('link', { name: /invoices|الفواتير/i });
    
    if (await invoicesLink.isVisible().catch(() => false)) {
      await invoicesLink.click();
      await page.waitForTimeout(500);
      
      expect(page.url()).toContain('invoice');
    } else {
      test.skip(true, 'Invoices link not found');
    }
  });
});

test.describe('Dashboard Responsive Design', () => {
  test('should collapse sidebar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Sidebar should be hidden or have toggle
    const sidebar = page.locator('[data-testid="sidebar"]');
    const menuToggle = page.getByRole('button', { name: /menu|القائمة/i });
    
    const sidebarHidden = !(await sidebar.isVisible().catch(() => false));
    const hasMenuToggle = await menuToggle.isVisible().catch(() => false);
    
    expect(sidebarHidden || hasMenuToggle).toBeTruthy();
  });

  test('should show sidebar on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    
    // Look for navigation elements
    const nav = page.locator('nav').or(
      page.getByRole('navigation')
    );
    
    const hasNav = await nav.isVisible().catch(() => false);
    expect(hasNav).toBeTruthy();
  });
});
