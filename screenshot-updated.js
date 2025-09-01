import { chromium } from 'playwright';

async function takeUpdatedScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Desktop login page
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:5174');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'login-improved-desktop.png', fullPage: true });
    console.log('✓ Improved desktop login screenshot taken');
    
    // Mobile login page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5174');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'login-improved-mobile.png', fullPage: true });
    console.log('✓ Improved mobile login screenshot taken');
    
    // Tablet login page
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:5174');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'login-improved-tablet.png', fullPage: true });
    console.log('✓ Improved tablet login screenshot taken');
    
  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeUpdatedScreenshots();