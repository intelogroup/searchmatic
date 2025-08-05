import { chromium } from 'playwright';

async function runAuthEdgeCaseTests() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🚀 Starting comprehensive authentication edge case testing...');
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/01-initial-page.png' });
    console.log('✅ Initial page screenshot captured');
    
    // Navigate to login page directly
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/02-login-page.png' });
    console.log('✅ Login page screenshot captured');
    
    // Test 1: Invalid Email Formats
    console.log('\n🧪 TEST 1: Invalid Email Formats');
    
    // Find email and password inputs using IDs
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      // Test 1a: Missing @ symbol
      console.log('  📧 Testing email without @ symbol...');
      await emailInput.fill('plaintext');
      await passwordInput.fill('testpassword123');
      await submitButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/03-invalid-email-no-at.png' });
      
      // Test 1b: Multiple @ symbols
      console.log('  📧 Testing email with multiple @ symbols...');
      await emailInput.fill('test@@example.com');
      await passwordInput.fill('testpassword123');
      await submitButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/04-invalid-email-double-at.png' });
      
      // Test 1c: Invalid domain
      console.log('  📧 Testing email with invalid domain...');
      await emailInput.fill('test@invalid');
      await passwordInput.fill('testpassword123');
      await submitButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/05-invalid-email-domain.png' });
      
      // Test 1d: Empty email
      console.log('  📧 Testing empty email...');
      await emailInput.fill('');
      await passwordInput.fill('testpassword123');
      await submitButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/06-empty-email.png' });
      
      // Test 1e: Special characters (should be valid)
      console.log('  📧 Testing email with special characters...');
      await emailInput.fill('test+special@domain.com');
      await passwordInput.fill('testpassword123');
      await submitButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/07-special-chars-email.png' });
    } else {
      console.log('❌ Email or password inputs not found');
    }
    
    // Test 2: Password Validation
    console.log('\n🔐 TEST 2: Password Validation');
    
    const validEmail = 'test@example.com';
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      // Test 2a: Empty password
      console.log('  🔑 Testing empty password...');
      await emailInput.fill(validEmail);
      await passwordInput.fill('');
      await submitButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/08-empty-password.png' });
      
      // Test 2b: Very short password
      console.log('  🔑 Testing very short password...');
      await passwordInput.fill('123');
      await submitButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/09-short-password.png' });
      
      // Test 2c: Very long password
      console.log('  🔑 Testing very long password...');
      const longPassword = 'a'.repeat(500);
      await passwordInput.fill(longPassword);
      await submitButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/10-long-password.png' });
      
      // Test 2d: Numbers only
      console.log('  🔑 Testing numbers-only password...');
      await passwordInput.fill('123456789');
      await submitButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/11-numbers-only-password.png' });
      
      // Test 2e: Letters only
      console.log('  🔑 Testing letters-only password...');
      await passwordInput.fill('abcdefghijk');
      await submitButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/12-letters-only-password.png' });
      
      // Test 2f: Special characters only
      console.log('  🔑 Testing special characters only password...');
      await passwordInput.fill('!@#$%^&*()');
      await submitButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/13-special-chars-password.png' });
    }
    
    // Test 3: Duplicate Registration
    console.log('\n👥 TEST 3: Duplicate Registration');
    
    // Try to find and click sign up if available
    try {
      const signUpButton = page.locator('text=Sign Up').first();
      if (await signUpButton.isVisible({ timeout: 3000 })) {
        await signUpButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/14-signup-page.png' });
      }
    } catch (e) {
      console.log('ℹ️ Sign Up button not found, staying on current page');
    }
    
    // Test with existing email
    console.log('  👤 Testing duplicate registration...');
    await emailInput.fill('testuser123@example.com');
    await passwordInput.fill('testpassword123');
    await submitButton.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/15-duplicate-registration.png' });
    
    // Test 4: Wrong Credentials
    console.log('\n❌ TEST 4: Wrong Credentials');
    
    // Navigate back to login if needed
    try {
      const loginButton = page.locator('text=Login').first();
      if (await loginButton.isVisible({ timeout: 3000 })) {
        await loginButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('ℹ️ Login button not found, staying on current page');
    }
    
    // Test 4a: Wrong password
    console.log('  🔐 Testing wrong password...');
    await emailInput.fill('testuser123@example.com');
    await passwordInput.fill('wrongpassword');
    await submitButton.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/16-wrong-password.png' });
    
    // Test 4b: Non-existent email
    console.log('  📧 Testing non-existent email...');
    await emailInput.fill('nonexistent@example.com');
    await passwordInput.fill('anypassword');
    await submitButton.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/17-nonexistent-email.png' });
    
    // Test 5: Protected Route Access
    console.log('\n🛡️ TEST 5: Protected Route Access');
    
    // Try to access dashboard directly without being logged in
    console.log('  🚪 Testing direct dashboard access...');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/18-protected-route-access.png' });
    
    const currentURL = page.url();
    console.log(`  📍 Current URL after dashboard access attempt: ${currentURL}`);
    
    // Test 6: Session Persistence (if we can log in)
    console.log('\n🔄 TEST 6: Session Persistence');
    
    // First, try to log in successfully
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    try {
      const loginButton = page.locator('text=Login').first();
      if (await loginButton.isVisible({ timeout: 3000 })) {
        await loginButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('ℹ️ Login button not found');
    }
    
    console.log('  🔑 Attempting successful login...');
    await emailInput.fill('testuser123@example.com');
    await passwordInput.fill('testpassword123');
    await submitButton.click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/19-successful-login-attempt.png' });
    
    console.log('  🔄 Testing page refresh...');
    await page.reload();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/20-after-refresh.png' });
    
    // Capture any console errors
    const logs = [];
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    console.log('\n📊 SUMMARY');
    console.log('✅ All edge case tests completed');
    console.log('📸 Screenshots saved to test-results/ directory');
    console.log('🔍 Check screenshots for visual validation of error handling');
    
    if (logs.length > 0) {
      console.log('\n📝 CONSOLE LOGS CAPTURED:');
      logs.forEach(log => console.log(`  ${log}`));
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error.message);
    await page.screenshot({ path: 'test-results/error-screenshot.png' });
  } finally {
    await browser.close();
  }
}

runAuthEdgeCaseTests().catch(console.error);