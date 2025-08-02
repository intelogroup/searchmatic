import { chromium } from 'playwright';

async function captureDocumentationScreenshots() {
  console.log('🎯 Starting documentation screenshot capture...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Landing page
    console.log('📸 Capturing landing page...');
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'landing-page-current.png', 
      fullPage: true 
    });

    // 2. Login page
    console.log('📸 Capturing login page...');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'login-page-current.png', 
      fullPage: true 
    });

    // 3. Login form with credentials filled
    console.log('📸 Capturing login form with credentials...');
    await page.fill('#email', 'jayveedz19@gmail.com');
    await page.fill('#password', 'Jimkali90#');
    await page.screenshot({ 
      path: 'login-form-filled-current.png', 
      fullPage: true 
    });

    // 4. Try login and capture result
    console.log('📸 Attempting login...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('dashboard')) {
      console.log('✅ Login successful - capturing dashboard');
      await page.screenshot({ 
        path: 'dashboard-after-login-current.png', 
        fullPage: true 
      });
    } else {
      console.log('📸 Capturing login result page');
      await page.screenshot({ 
        path: 'login-result-current.png', 
        fullPage: true 
      });
    }

    // 5. Mobile viewport test
    console.log('📱 Testing mobile viewport...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'mobile-landing-current.png', 
      fullPage: true 
    });

    console.log('✅ Documentation screenshots completed!');
    
  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

captureDocumentationScreenshots();