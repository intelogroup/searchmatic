import { chromium } from 'playwright';

async function takeScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport for desktop
  await page.setViewportSize({ width: 1200, height: 800 });
  
  try {
    // Navigate to the app
    await page.goto('http://localhost:5174');
    
    // Wait a moment for the app to load
    await page.waitForTimeout(2000);
    
    // Take screenshot of login/landing page
    await page.screenshot({ path: 'ui-analysis-login.png', fullPage: true });
    console.log('✓ Login page screenshot taken');
    
    // Try to navigate to dashboard (might need auth)
    await page.goto('http://localhost:5174/dashboard');
    await page.waitForTimeout(2000);
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'ui-analysis-dashboard.png', fullPage: true });
    console.log('✓ Dashboard screenshot taken');
    
    // Navigate to projects page
    await page.goto('http://localhost:5174/projects');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'ui-analysis-projects.png', fullPage: true });
    console.log('✓ Projects page screenshot taken');
    
    // Navigate to new project page
    await page.goto('http://localhost:5174/projects/new');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'ui-analysis-new-project.png', fullPage: true });
    console.log('✓ New project page screenshot taken');
    
    // Take mobile screenshots
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mobile dashboard
    await page.goto('http://localhost:5174/dashboard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'ui-analysis-mobile-dashboard.png', fullPage: true });
    console.log('✓ Mobile dashboard screenshot taken');
    
    // Mobile projects
    await page.goto('http://localhost:5174/projects');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'ui-analysis-mobile-projects.png', fullPage: true });
    console.log('✓ Mobile projects screenshot taken');
    
    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Tablet dashboard
    await page.goto('http://localhost:5174/dashboard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'ui-analysis-tablet-dashboard.png', fullPage: true });
    console.log('✓ Tablet dashboard screenshot taken');
    
  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();