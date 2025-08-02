#!/usr/bin/env node

/**
 * Real Authentication Flow Test
 * Tests the complete authentication flow with real test user credentials
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test user credentials
const TEST_USER = {
  email: 'jayveedz19@gmail.com',
  password: 'Jimkali90#'
};

async function testAuthFlow() {
  const browser = await chromium.launch({ 
    headless: true, // Headless mode for CLI environment
    slowMo: 500 // Slow down for better reliability
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Starting real authentication flow test...');
    
    // Navigate to landing page
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of landing page
    await page.screenshot({ path: 'auth-test-01-landing.png', fullPage: true });
    console.log('📸 Landing page screenshot captured');
    
    // Find and click the "Get Started" or "Sign In" button
    const getStartedBtn = page.locator('button:has-text("Get Started")').first();
    const signInBtn = page.locator('button:has-text("Sign In")').first();
    
    let buttonFound = false;
    if (await getStartedBtn.isVisible()) {
      await getStartedBtn.click();
      buttonFound = true;
      console.log('✅ Clicked "Get Started" button');
    } else if (await signInBtn.isVisible()) {
      await signInBtn.click();
      buttonFound = true;
      console.log('✅ Clicked "Sign In" button');
    }
    
    if (!buttonFound) {
      // Try alternative navigation methods
      const loginLink = page.locator('a[href="/login"]').first();
      if (await loginLink.isVisible()) {
        await loginLink.click();
        console.log('✅ Clicked login link');
      } else {
        await page.goto('http://localhost:5173/login');
        console.log('✅ Navigated directly to /login');
      }
    }
    
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'auth-test-02-login-page.png', fullPage: true });
    console.log('📸 Login page screenshot captured');
    
    // Fill in the login form
    const emailInput = page.locator('input[type="email"], input[name="email"], #email');
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password');
    
    await emailInput.fill(TEST_USER.email);
    console.log('✅ Email filled');
    
    await passwordInput.fill(TEST_USER.password);
    console.log('✅ Password filled');
    
    await page.screenshot({ path: 'auth-test-03-form-filled.png', fullPage: true });
    console.log('📸 Form filled screenshot captured');
    
    // Submit the form
    const submitBtn = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await submitBtn.click();
    console.log('✅ Login form submitted');
    
    // Wait for authentication and redirect
    try {
      await page.waitForURL(/dashboard|app|home/, { timeout: 15000 });
      console.log('✅ Successfully redirected after login');
    } catch (e) {
      console.log('⏳ No redirect detected, checking current page...');
      await page.waitForTimeout(3000);
    }
    
    await page.screenshot({ path: 'auth-test-04-after-login.png', fullPage: true });
    console.log('📸 After login screenshot captured');
    
    // Check for success indicators
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Look for authenticated state indicators
    const userMenus = [
      'button:has-text("Profile")',
      'button:has-text("Settings")',
      'button:has-text("Logout")',
      'div[role="button"]:has-text("user")',
      '.user-menu',
      '[data-testid="user-menu"]'
    ];
    
    let isLoggedIn = false;
    for (const selector of userMenus) {
      if (await page.locator(selector).isVisible()) {
        isLoggedIn = true;
        console.log(`✅ Found authenticated indicator: ${selector}`);
        break;
      }
    }
    
    // Check for error messages
    const errorSelectors = [
      '[role="alert"]',
      '.error',
      '.alert-error',
      'text=Invalid',
      'text=Error',
      'text=Failed'
    ];
    
    let hasError = false;
    for (const selector of errorSelectors) {
      if (await page.locator(selector).isVisible()) {
        hasError = true;
        const errorText = await page.locator(selector).textContent();
        console.log(`❌ Found error: ${errorText}`);
        break;
      }
    }
    
    // Check for dashboard elements
    const dashboardElements = [
      'h1:has-text("Dashboard")',
      'h1:has-text("Projects")',
      'text=Welcome',
      'button:has-text("New Project")',
      'button:has-text("Create")'
    ];
    
    let isDashboard = false;
    for (const selector of dashboardElements) {
      if (await page.locator(selector).isVisible()) {
        isDashboard = true;
        console.log(`✅ Found dashboard element: ${selector}`);
        break;
      }
    }
    
    // Final assessment
    console.log('\n🔍 Authentication Test Results:');
    console.log(`- Current URL: ${currentUrl}`);
    console.log(`- Authenticated indicators found: ${isLoggedIn}`);
    console.log(`- Dashboard elements found: ${isDashboard}`);
    console.log(`- Error messages found: ${hasError}`);
    
    if (isLoggedIn || isDashboard || currentUrl.includes('dashboard')) {
      console.log('🎉 Authentication test PASSED!');
      return true;
    } else if (hasError) {
      console.log('❌ Authentication test FAILED due to errors');
      return false;
    } else {
      console.log('⚠️ Authentication test INCONCLUSIVE - check screenshots');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'auth-test-error.png', fullPage: true });
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthFlow().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});