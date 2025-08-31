import { chromium } from 'playwright';

async function takeAuthenticatedScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Mock authentication by setting localStorage
    await page.goto('http://localhost:5174');
    
    // Set mock authentication state
    await page.evaluate(() => {
      // Mock Supabase session
      localStorage.setItem('sb-qzvfufadiqmizrozejci-auth-token', JSON.stringify({
        access_token: 'mock-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          aud: 'authenticated',
          role: 'authenticated'
        }
      }));
    });
    
    // Desktop screenshots
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Dashboard
    await page.goto('http://localhost:5174/dashboard');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'dashboard-desktop.png', fullPage: true });
    console.log('✓ Dashboard desktop screenshot taken');
    
    // Projects page
    await page.goto('http://localhost:5174/projects');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'projects-desktop.png', fullPage: true });
    console.log('✓ Projects desktop screenshot taken');
    
    // New project page
    await page.goto('http://localhost:5174/projects/new');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'new-project-desktop.png', fullPage: true });
    console.log('✓ New project desktop screenshot taken');
    
    // Mobile screenshots
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mobile dashboard
    await page.goto('http://localhost:5174/dashboard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'dashboard-mobile.png', fullPage: true });
    console.log('✓ Dashboard mobile screenshot taken');
    
    // Mobile projects
    await page.goto('http://localhost:5174/projects');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'projects-mobile.png', fullPage: true });
    console.log('✓ Projects mobile screenshot taken');
    
  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeAuthenticatedScreenshots();