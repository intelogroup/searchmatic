import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAuthenticationFlow() {
  console.log('🚀 Starting Searchmatic Authentication Flow Test');
  
  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'test-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const browser = await chromium.launch({ 
    headless: true // Changed to headless mode for server environment
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Track console messages and errors
  const consoleMessages = [];
  const errors = [];
  
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
    console.log(`📝 Console [${msg.type()}]: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.log(`❌ Page Error: ${error.message}`);
  });

  try {
    console.log('\n📱 Step 1: Navigate to localhost:5173');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotsDir, '01-initial-load.png') });
    
    // Wait for page to load and check what we see
    await page.waitForTimeout(2000);
    
    console.log('\n🔍 Step 2: Analyze current page state');
    const currentUrl = page.url();
    const pageTitle = await page.title();
    console.log(`Current URL: ${currentUrl}`);
    console.log(`Page Title: ${pageTitle}`);
    
    // Try to find common elements
    const hasLoginForm = await page.locator('form').count() > 0;
    const hasLoginButton = await page.locator('button:has-text("Login"), button:has-text("Sign In")').count() > 0;
    const hasSignUpButton = await page.locator('button:has-text("Sign Up"), button:has-text("Create Account")').count() > 0;
    
    console.log(`Has login form: ${hasLoginForm}`);
    console.log(`Has login button: ${hasLoginButton}`);
    console.log(`Has signup button: ${hasSignUpButton}`);
    
    // Check if we're already on login page or need to navigate
    let isOnLoginPage = currentUrl.includes('/login') || hasLoginForm;
    
    if (!isOnLoginPage) {
      console.log('\n🔄 Step 3: Navigate to login page');
      // Try to find login link
      const loginLink = page.locator('a:has-text("Login"), a:has-text("Sign In"), button:has-text("Login"), button:has-text("Sign In")').first();
      
      if (await loginLink.count() > 0) {
        await loginLink.click();
        await page.waitForTimeout(1000);
      } else {
        // Try direct navigation to /login
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
      }
      
      await page.screenshot({ path: path.join(screenshotsDir, '02-navigate-to-login.png') });
    }
    
    console.log('\n📝 Step 4: Try to create test account');
    await page.waitForTimeout(1000);
    
    // Look for signup/register functionality
    const signUpButton = page.locator('button:has-text("Sign Up"), button:has-text("Create Account"), button:has-text("Register")').first();
    const signUpLink = page.locator('a:has-text("Sign Up"), a:has-text("Create Account"), a:has-text("Register")').first();
    
    let signUpElement = null;
    if (await signUpButton.count() > 0) {
      signUpElement = signUpButton;
    } else if (await signUpLink.count() > 0) {
      signUpElement = signUpLink;
    }
    
    if (signUpElement) {
      console.log('Found signup element, clicking...');
      await signUpElement.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotsDir, '03-signup-form.png') });
    }
    
    // Try to fill in signup form
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first();
    
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      console.log('Found email and password inputs, filling them...');
      
      await emailInput.fill('testuser@example.com');
      await passwordInput.fill('TestPassword123!');
      
      await page.screenshot({ path: path.join(screenshotsDir, '04-filled-signup-form.png') });
      
      // Try to submit the form
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign Up"), button:has-text("Create Account"), button:has-text("Register")').first();
      
      if (await submitButton.count() > 0) {
        console.log('Found submit button, clicking...');
        await submitButton.click();
        
        // Wait for response
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(screenshotsDir, '05-after-signup-attempt.png') });
        
        // Check for success or error messages
        const errorMessages = await page.locator('[class*="error"], [role="alert"], .text-red-500, .text-destructive').allTextContents();
        const successMessages = await page.locator('[class*="success"], .text-green-500, .text-success').allTextContents();
        
        if (errorMessages.length > 0) {
          console.log('❌ Signup errors found:', errorMessages);
        }
        if (successMessages.length > 0) {
          console.log('✅ Signup success messages:', successMessages);
        }
      }
    }
    
    console.log('\n🔑 Step 5: Try to login with test credentials');
    
    // Make sure we're on login form
    await page.waitForTimeout(1000);
    
    // Try to find login form elements again
    const loginEmailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const loginPasswordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first();
    
    if (await loginEmailInput.count() > 0 && await loginPasswordInput.count() > 0) {
      console.log('Found login form, filling credentials...');
      
      // Clear and fill
      await loginEmailInput.clear();
      await loginEmailInput.fill('testuser@example.com');
      await loginPasswordInput.clear();
      await loginPasswordInput.fill('TestPassword123!');
      
      await page.screenshot({ path: path.join(screenshotsDir, '06-filled-login-form.png') });
      
      // Try to submit login
      const loginSubmitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
      
      if (await loginSubmitButton.count() > 0) {
        console.log('Found login submit button, clicking...');
        await loginSubmitButton.click();
        
        // Wait for response and potential redirect
        await page.waitForTimeout(5000);
        await page.screenshot({ path: path.join(screenshotsDir, '07-after-login-attempt.png') });
        
        // Check current URL and page state
        const finalUrl = page.url();
        console.log(`Final URL after login attempt: ${finalUrl}`);
        
        // Check for error messages
        const loginErrors = await page.locator('[class*="error"], [role="alert"], .text-red-500, .text-destructive').allTextContents();
        if (loginErrors.length > 0) {
          console.log('❌ Login errors found:', loginErrors);
        }
        
        // Check if we were redirected (successful login)
        if (finalUrl !== currentUrl && !finalUrl.includes('/login')) {
          console.log('✅ Appears to be redirected after login - likely successful!');
        }
      }
    }
    
    console.log('\n📊 Step 6: Final page analysis');
    await page.screenshot({ path: path.join(screenshotsDir, '08-final-state.png') });
    
    // Get final page content
    const finalPageContent = await page.locator('body').textContent();
    console.log('Page contains user indicator:', finalPageContent.includes('Welcome') || finalPageContent.includes('Dashboard') || finalPageContent.includes('Profile'));
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error-state.png') });
  }
  
  console.log('\n📋 Test Summary:');
  console.log(`Total console messages: ${consoleMessages.length}`);
  console.log(`Total page errors: ${errors.length}`);
  
  if (consoleMessages.length > 0) {
    console.log('\n📝 Console Messages:');
    consoleMessages.forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
    });
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Page Errors:');
    errors.forEach((error, i) => {
      console.log(`${i + 1}. ${error.message}`);
    });
  }
  
  console.log(`\n📸 Screenshots saved to: ${screenshotsDir}`);
  
  await browser.close();
}

// Run the test
testAuthenticationFlow().catch(console.error);