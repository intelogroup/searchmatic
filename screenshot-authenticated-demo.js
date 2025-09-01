import { chromium } from 'playwright';

async function takeAuthenticatedScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Set viewport for desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    
    console.log('Taking authenticated dashboard screenshot...');
    await page.goto('http://localhost:5174/dashboard?demo=true');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'authenticated-dashboard-desktop.png', fullPage: true });
    console.log('✓ Authenticated dashboard desktop screenshot taken');
    
    console.log('Taking authenticated projects screenshot...');
    await page.goto('http://localhost:5174/projects?demo=true');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'authenticated-projects-desktop.png', fullPage: true });
    console.log('✓ Authenticated projects desktop screenshot taken');
    
    console.log('Taking new project screenshot...');
    await page.goto('http://localhost:5174/projects/new?demo=true');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'authenticated-new-project-desktop.png', fullPage: true });
    console.log('✓ New project desktop screenshot taken');
    
    console.log('Taking protocols screenshot...');
    await page.goto('http://localhost:5174/protocols?demo=true');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'authenticated-protocols-desktop.png', fullPage: true });
    console.log('✓ Protocols desktop screenshot taken');

    // Try taking a project view screenshot with a mock project ID
    console.log('Taking project view screenshot...');
    await page.goto('http://localhost:5174/projects/123?demo=true');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'authenticated-project-view-desktop.png', fullPage: true });
    console.log('✓ Project view desktop screenshot taken');

    // Mobile screenshots
    console.log('Taking mobile screenshots...');
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:5174/dashboard?demo=true');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'authenticated-dashboard-mobile.png', fullPage: true });
    console.log('✓ Dashboard mobile screenshot taken');
    
    await page.goto('http://localhost:5174/projects?demo=true');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'authenticated-projects-mobile.png', fullPage: true });
    console.log('✓ Projects mobile screenshot taken');

    // Tablet screenshots
    console.log('Taking tablet screenshots...');
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('http://localhost:5174/dashboard?demo=true');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'authenticated-dashboard-tablet.png', fullPage: true });
    console.log('✓ Dashboard tablet screenshot taken');
    
  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeAuthenticatedScreenshots();