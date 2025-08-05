import { chromium } from 'playwright';

async function testAuthAndDashboard() {
  console.log('🔐 Testing Authentication and Dashboard Flow...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console messages and errors
  const errors = [];
  const warnings = [];
  
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      errors.push(text);
      console.log(`❌ CONSOLE ERROR: ${text}`);
    } else if (type === 'warning') {
      warnings.push(text);
      console.log(`⚠️ CONSOLE WARNING: ${text}`);
    }
  });
  
  page.on('pageerror', err => {
    errors.push(err.message);
    console.log(`💥 PAGE ERROR: ${err.message}`);
  });

  try {
    // Go to the app
    console.log('\n📍 Step 1: Loading Application');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Try to access dashboard directly (should redirect to auth)
    console.log('\n📍 Step 2: Accessing Dashboard (Should Redirect to Auth)');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('✅ Correctly redirected to login page');
      
      // Take screenshot of login page
      await page.screenshot({ path: 'test-results/08-login-redirect.png', fullPage: true });
      
      // Check for email and password fields
      const emailField = page.locator('input[type="email"], input[name="email"]');
      const passwordField = page.locator('input[type="password"], input[name="password"]');
      const signInButton = page.locator('button:has-text("Sign in"), button:has-text("Sign In")');
      
      console.log(`Email field visible: ${await emailField.isVisible().catch(() => false)}`);
      console.log(`Password field visible: ${await passwordField.isVisible().catch(() => false)}`);
      console.log(`Sign in button visible: ${await signInButton.isVisible().catch(() => false)}`);
      
    } else {
      console.log('ℹ️ Not redirected to login - checking current page state');
      await page.screenshot({ path: 'test-results/08-unexpected-page.png', fullPage: true });
    }
    
    // Test direct access to other protected routes
    console.log('\n📍 Step 3: Testing Protected Route Access');
    
    const protectedRoutes = ['/projects/new', '/projects/123'];
    
    for (const route of protectedRoutes) {
      await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle' });
      const routeUrl = page.url();
      console.log(`Route ${route} → ${routeUrl}`);
      
      if (routeUrl.includes('/login')) {
        console.log(`✅ ${route} correctly protected`);
      } else {
        console.log(`⚠️ ${route} not protected or different behavior`);
      }
    }
    
    // Summary
    console.log('\n📊 AUTHENTICATION TEST SUMMARY:');
    console.log(`Total Console Errors: ${errors.length}`);
    console.log(`Total Console Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
    }
    
    console.log('\n🎉 Authentication flow test completed!');
    
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testAuthAndDashboard();