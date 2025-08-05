import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testDetailedAuthFlow() {
  console.log('🚀 Starting Detailed Searchmatic Authentication Test');
  
  const screenshotsDir = path.join(__dirname, 'auth-detailed-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Track all network requests and console logs
  const requests = [];
  const responses = [];
  const consoleMessages = [];
  const errors = [];
  
  page.on('request', request => {
    if (request.url().includes('supabase') || request.url().includes('auth')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('supabase') || response.url().includes('auth')) {
      responses.push({
        url: response.url(),
        status: response.status(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });
  
  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  try {
    console.log('\n🌐 Step 1: Navigate to app and check initial state');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '01-landing-page.png') });
    
    console.log('\n🔑 Step 2: Navigate to authentication');
    await page.click('text=Sign In');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '02-login-page.png') });
    
    console.log('\n📝 Step 3: Try to create new account');
    // Check if there's a "Sign up" option
    const signUpLink = page.locator('text=Sign up');
    if (await signUpLink.count() > 0) {
      console.log('Found sign up link, clicking...');
      await signUpLink.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotsDir, '03-signup-mode.png') });
    }
    
    // Fill in the signup form
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      console.log('Filling signup form...');
      await emailInput.fill('testuser123@example.com');
      await passwordInput.fill('TestPassword123!');
      await page.screenshot({ path: path.join(screenshotsDir, '04-signup-filled.png') });
      
      // Submit the form
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign up"), button:has-text("Create account")').first();
      if (await submitButton.count() > 0) {
        console.log('Submitting signup form...');
        await submitButton.click();
        
        // Wait for response
        await page.waitForTimeout(5000);
        await page.screenshot({ path: path.join(screenshotsDir, '05-after-signup.png') });
        
        // Check for any error messages
        const errorElements = await page.locator('[class*="error"], [role="alert"], .text-red-500, .text-destructive').allTextContents();
        if (errorElements.length > 0) {
          console.log('❌ Signup errors:', errorElements);
        }
        
        // Check if we got redirected or need to confirm email
        const currentUrl = page.url();
        console.log(`URL after signup: ${currentUrl}`);
        
        // Look for success messages or confirmation requirements
        const pageText = await page.locator('body').textContent();
        if (pageText.includes('confirm') || pageText.includes('email') || pageText.includes('verification')) {
          console.log('✅ Signup appears successful - email confirmation required');
        } else if (pageText.includes('Dashboard') || pageText.includes('Welcome')) {
          console.log('✅ Signup successful - user logged in');
        }
      }
    }
    
    console.log('\n🔄 Step 4: Try to login with existing test credentials');
    // Navigate back to login if needed
    if (!page.url().includes('/login')) {
      await page.goto('http://localhost:5173/login');
      await page.waitForTimeout(1000);
    }
    
    // Make sure we're in login mode (not signup)
    const signInLink = page.locator('text=Sign in');
    if (await signInLink.count() > 0) {
      await signInLink.click();
      await page.waitForTimeout(1000);
    }
    
    // Fill login form
    const loginEmailInput = page.locator('input[type="email"]').first();
    const loginPasswordInput = page.locator('input[type="password"]').first();
    
    if (await loginEmailInput.count() > 0 && await loginPasswordInput.count() > 0) {
      console.log('Filling login form...');
      await loginEmailInput.clear();
      await loginEmailInput.fill('testuser123@example.com');
      await loginPasswordInput.clear();
      await loginPasswordInput.fill('TestPassword123!');
      await page.screenshot({ path: path.join(screenshotsDir, '06-login-filled.png') });
      
      // Submit login
      const loginButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first();
      if (await loginButton.count() > 0) {
        console.log('Submitting login...');
        await loginButton.click();
        
        // Wait for response
        await page.waitForTimeout(5000);
        await page.screenshot({ path: path.join(screenshotsDir, '07-after-login.png') });
        
        // Check final state
        const finalUrl = page.url();
        const finalPageText = await page.locator('body').textContent();
        
        console.log(`Final URL: ${finalUrl}`);
        console.log(`Page contains dashboard elements: ${finalPageText.includes('Dashboard') || finalPageText.includes('Projects')}`);
        
        // Check for login errors
        const loginErrors = await page.locator('[class*="error"], [role="alert"], .text-red-500, .text-destructive').allTextContents();
        if (loginErrors.length > 0) {
          console.log('❌ Login errors:', loginErrors);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error-state.png') });
  }
  
  console.log('\n📊 Network Analysis:');
  console.log(`Total auth requests: ${requests.length}`);
  console.log(`Total auth responses: ${responses.length}`);
  
  if (requests.length > 0) {
    console.log('\n🌐 Auth Requests:');
    requests.forEach((req, i) => {
      console.log(`${i + 1}. ${req.method} ${req.url}`);
    });
  }
  
  if (responses.length > 0) {
    console.log('\n📡 Auth Responses:');
    responses.forEach((res, i) => {
      console.log(`${i + 1}. ${res.status} ${res.url}`);
    });
  }
  
  console.log(`\n📝 Console messages: ${consoleMessages.length}`);
  console.log(`❌ Page errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Error Details:');
    errors.forEach((error, i) => {
      console.log(`${i + 1}. ${error.message}`);
    });
  }
  
  await browser.close();
  console.log(`\n📸 Screenshots saved to: ${screenshotsDir}`);
}

testDetailedAuthFlow().catch(console.error);