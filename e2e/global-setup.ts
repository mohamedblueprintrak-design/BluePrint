/**
 * Playwright Global Setup
 * إعداد Playwright الشامل
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Verify the server is running
    await page.goto(baseURL || 'http://localhost:3000');
    console.log('✅ Server is running and accessible');
    
    // Optional: Seed test data
    // await seedTestData(page);
    
  } catch (error) {
    console.error('❌ Server is not running. Please start the dev server first.');
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
