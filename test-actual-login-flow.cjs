const { chromium } = require('playwright');

async function testActualLoginFlow() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('🧪 Testing Actual Authentication Flow');
  console.log('=' .repeat(50));

  try {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    console.log('\n📋 Step 1: Switch to Sign Up Mode');
    await page.click('text=Sign up');
    await page.waitForTimeout(1000);
    
    // Fill sign up form
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`📧 Using test email: ${testEmail}`);
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    const screenshotPath1 = 'auth-flow-01-signup-filled.png';
    await page.screenshot({ path: screenshotPath1, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath1}`);
    
    console.log('\n📋 Step 2: Attempt Account Creation');
    await page.click('button:has-text("Create account")');
    
    // Wait for either success redirect or error message
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`🌐 Current URL after signup: ${currentUrl}`);
    
    // Check for error messages
    const errorElements = await page.locator('[role="alert"], .error, .text-red-500, .text-destructive').count();
    if (errorElements > 0) {
      const errorText = await page.locator('[role="alert"], .error, .text-red-500, .text-destructive').first().textContent();
      console.log(`❌ Error message found: ${errorText}`);
    }
    
    const screenshotPath2 = 'auth-flow-02-signup-result.png';
    await page.screenshot({ path: screenshotPath2, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath2}`);
    
    // If still on login page, try signing in with existing account
    if (currentUrl.includes('/login')) {
      console.log('\n📋 Step 3: Try Signing In with Test Account');
      
      // Switch to sign in mode
      const signInLink = await page.locator('text=Sign in').count();
      if (signInLink > 0) {
        await page.click('text=Sign in');
        await page.waitForTimeout(1000);
      }
      
      // Try a known test account
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword123');
      
      const screenshotPath3 = 'auth-flow-03-signin-attempt.png';
      await page.screenshot({ path: screenshotPath3, fullPage: true });
      console.log(`📸 Screenshot saved: ${screenshotPath3}`);
      
      await page.click('button:has-text("Sign in")');
      await page.waitForTimeout(3000);
      
      const finalUrl = page.url();
      console.log(`🌐 Final URL after signin: ${finalUrl}`);
      
      const screenshotPath4 = 'auth-flow-04-signin-result.png';
      await page.screenshot({ path: screenshotPath4, fullPage: true });
      console.log(`📸 Screenshot saved: ${screenshotPath4}`);
    }
    
    // Test protected route access
    console.log('\n📋 Step 4: Test Dashboard Access');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const dashboardUrl = page.url();
    console.log(`🌐 Dashboard URL: ${dashboardUrl}`);
    
    const screenshotPath5 = 'auth-flow-05-dashboard-access.png';
    await page.screenshot({ path: screenshotPath5, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath5}`);
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 AUTHENTICATION FLOW TEST SUMMARY');
    console.log('='.repeat(50));
    
    if (dashboardUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS: Successfully authenticated and accessed dashboard');
    } else if (dashboardUrl.includes('/login')) {
      console.log('⚠️ PARTIAL: Authentication required, redirected to login');
    } else {
      console.log(`❓ UNKNOWN: Ended up at ${dashboardUrl}`);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    
    const errorScreenshot = 'auth-flow-error.png';
    await page.screenshot({ path: errorScreenshot, fullPage: true });
    console.log(`📸 Error screenshot saved: ${errorScreenshot}`);
  }

  await browser.close();
}

testActualLoginFlow().catch(console.error);