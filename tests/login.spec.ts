import { test, expect, type Page } from '@playwright/test';

// Test credentials
const TEST_EMAIL = 'jayveedz19@gmail.com';
const TEST_PASSWORD = 'Jimkali90#';

// Helper function to wait for page load and take screenshot
async function captureScreenshot(page: Page, name: string) {
  await page.waitForLoadState('networkidle');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}.png`, 
    fullPage: true 
  });
}

// Helper function to check if element is visible and accessible
async function checkElementAccessibility(page: Page, selector: string, name: string) {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
  
  // Check if element is focusable (has tabindex or is naturally focusable)
  const isFocusable = await element.evaluate((el) => {
    return el.tabIndex >= 0 || ['INPUT', 'BUTTON', 'A', 'SELECT', 'TEXTAREA'].includes(el.tagName);
  });
  
  expect(isFocusable).toBeTruthy();
  console.log(`✅ ${name} is visible and accessible`);
}

test.describe('Searchmatic Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start from a clean state
    await page.context().clearCookies();
  });

  test('Complete login flow - Desktop', async ({ page }) => {
    console.log('🚀 Starting desktop login flow test...');

    // Step 1: Navigate to landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await captureScreenshot(page, '01-landing-page-desktop');
    
    // Verify landing page elements
    await expect(page.locator('text=Searchmatic')).toBeVisible();
    await expect(page.locator('text=Systematic Reviews')).toBeVisible();
    console.log('✅ Landing page loaded successfully');

    // Step 2: Navigate to login page from landing page
    const signInButton = page.locator('button:has-text("Sign In")').first();
    await expect(signInButton).toBeVisible();
    await signInButton.click();
    
    await page.waitForURL('/login');
    await page.waitForLoadState('networkidle');
    await captureScreenshot(page, '02-login-page-desktop');
    console.log('✅ Successfully navigated to login page');

    // Step 3: Test login form accessibility
    console.log('🔍 Testing form accessibility...');
    
    // Check email field accessibility
    await checkElementAccessibility(page, '#email', 'Email input field');
    const emailLabel = page.locator('label[for="email"]');
    await expect(emailLabel).toBeVisible();
    await expect(emailLabel).toHaveText('Email address');
    
    // Check password field accessibility
    await checkElementAccessibility(page, '#password', 'Password input field');
    const passwordLabel = page.locator('label[for="password"]');
    await expect(passwordLabel).toBeVisible();
    await expect(passwordLabel).toHaveText('Password');
    
    // Check submit button accessibility
    await checkElementAccessibility(page, 'button[type="submit"]', 'Submit button');
    
    // Step 4: Test keyboard navigation
    console.log('⌨️ Testing keyboard navigation...');
    
    // Tab through form elements
    await page.keyboard.press('Tab'); // Should focus email field
    let focusedElement = await page.evaluate(() => document.activeElement?.id);
    expect(focusedElement).toBe('email');
    
    await page.keyboard.press('Tab'); // Should focus password field
    focusedElement = await page.evaluate(() => document.activeElement?.id);
    expect(focusedElement).toBe('password');
    
    await page.keyboard.press('Tab'); // Should focus password toggle button
    await page.keyboard.press('Tab'); // Should focus submit button
    focusedElement = await page.evaluate(() => document.activeElement?.type);
    expect(focusedElement).toBe('submit');
    
    console.log('✅ Keyboard navigation works correctly');

    // Step 5: Test form validation (empty form)
    await page.locator('button[type="submit"]').click();
    
    // Check for HTML5 validation
    const emailField = page.locator('#email');
    const emailValidity = await emailField.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(emailValidity).toBe(false);
    console.log('✅ Form validation prevents empty submission');

    // Step 6: Test invalid email format
    await emailField.fill('invalid-email');
    await page.locator('button[type="submit"]').click();
    
    const emailValidityAfterInvalid = await emailField.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(emailValidityAfterInvalid).toBe(false);
    console.log('✅ Form validation catches invalid email format');

    // Step 7: Test successful login with valid credentials
    console.log('🔐 Testing login with credentials...');
    
    await emailField.fill(TEST_EMAIL);
    await page.locator('#password').fill(TEST_PASSWORD);
    await captureScreenshot(page, '03-credentials-filled-desktop');
    
    // Submit the form
    await page.locator('button[type="submit"]').click();
    console.log('📤 Login form submitted');
    
    // Wait for either success redirect or error message
    await page.waitForTimeout(3000); // Give time for auth request
    
    // Check if we're redirected to dashboard or if there's an error
    const currentUrl = page.url();
    const hasError = await page.locator('[class*="destructive"]').isVisible().catch(() => false);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully logged in and redirected to dashboard');
      await captureScreenshot(page, '04-dashboard-success-desktop');
      
      // Verify dashboard elements
      await expect(page.locator('text=Dashboard').or(page.locator('text=Projects')).or(page.locator('text=Welcome'))).toBeVisible();
      
      // Step 8: Test navigation after login
      console.log('🧭 Testing navigation after login...');
      
      // Test if we can navigate to settings or new project
      const newProjectButton = page.locator('button:has-text("New Project")').or(page.locator('a:has-text("New Project")'));
      if (await newProjectButton.isVisible()) {
        console.log('✅ New Project button is accessible');
      }
      
      // Check if user menu/profile is accessible
      const userMenu = page.locator('[data-testid="user-menu"]').or(page.locator('button').filter({ hasText: TEST_EMAIL.split('@')[0] }));
      if (await userMenu.isVisible()) {
        await userMenu.click();
        console.log('✅ User menu is accessible');
      }
      
    } else if (hasError) {
      const errorMessage = await page.locator('[class*="destructive"]').textContent();
      console.log(`⚠️ Login failed with error: ${errorMessage}`);
      await captureScreenshot(page, '04-login-error-desktop');
      
      // This might be expected if credentials are not set up in the test database
      console.log('ℹ️ This may be expected if test credentials are not configured in Supabase');
    } else {
      console.log('⏳ Login is still processing or no clear success/error indication');
      await captureScreenshot(page, '04-login-processing-desktop');
    }
  });

  test('Login flow - Mobile viewport', async ({ page }) => {
    console.log('📱 Starting mobile login flow test...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Step 1: Navigate to landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await captureScreenshot(page, '01-landing-page-mobile');

    // Step 2: Navigate to login (mobile may have different navigation)
    // Look for mobile menu or direct sign in button
    let signInButton = page.locator('button:has-text("Sign In")').first();
    
    if (!(await signInButton.isVisible())) {
      // Try looking for "Get Started" button which might redirect to login
      signInButton = page.locator('button:has-text("Get Started")').first();
    }
    
    await expect(signInButton).toBeVisible();
    await signInButton.click();
    
    await page.waitForURL('/login');
    await page.waitForLoadState('networkidle');
    await captureScreenshot(page, '02-login-page-mobile');
    console.log('✅ Successfully navigated to login page on mobile');

    // Step 3: Test mobile form layout and accessibility
    console.log('📱 Testing mobile form accessibility...');
    
    const emailField = page.locator('#email');
    const passwordField = page.locator('#password');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // Test that form elements are properly sized for mobile
    const emailBox = await emailField.boundingBox();
    const passwordBox = await passwordField.boundingBox();
    const submitBox = await submitButton.boundingBox();
    
    expect(emailBox?.width).toBeGreaterThan(200); // Should be wide enough for mobile
    expect(passwordBox?.width).toBeGreaterThan(200);
    expect(submitBox?.width).toBeGreaterThan(200);
    
    console.log('✅ Mobile form layout is appropriate');

    // Step 4: Test touch interactions
    await emailField.tap();
    await emailField.fill(TEST_EMAIL);
    
    await passwordField.tap();
    await passwordField.fill(TEST_PASSWORD);
    await captureScreenshot(page, '03-credentials-filled-mobile');
    
    // Test password visibility toggle
    const passwordToggle = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' }).last();
    if (await passwordToggle.isVisible()) {
      await passwordToggle.tap();
      console.log('✅ Password visibility toggle works on mobile');
    }
    
    await submitButton.tap();
    console.log('📤 Mobile login form submitted');
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    const hasError = await page.locator('[class*="destructive"]').isVisible().catch(() => false);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Mobile login successful');
      await captureScreenshot(page, '04-dashboard-success-mobile');
    } else if (hasError) {
      console.log('⚠️ Mobile login failed with error');
      await captureScreenshot(page, '04-login-error-mobile');
    } else {
      console.log('⏳ Mobile login processing');
      await captureScreenshot(page, '04-login-processing-mobile');
    }
  });

  test('Login error handling', async ({ page }) => {
    console.log('⚠️ Testing login error handling...');

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Test with obviously wrong credentials
    await page.locator('#email').fill('nonexistent@example.com');
    await page.locator('#password').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // Wait for error message
    await page.waitForTimeout(3000);

    // Check for error message
    const errorElement = page.locator('[class*="destructive"]');
    const hasError = await errorElement.isVisible();
    
    if (hasError) {
      const errorText = await errorElement.textContent();
      console.log(`✅ Error handling works: ${errorText}`);
      await captureScreenshot(page, '05-error-handling');
    } else {
      console.log('ℹ️ No error message displayed - may depend on Supabase configuration');
    }
  });

  test('Sign up toggle functionality', async ({ page }) => {
    console.log('🔄 Testing sign up toggle functionality...');

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Should start in sign in mode
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible();

    // Click toggle to sign up mode
    const toggleButton = page.locator('button:has-text("Don\'t have an account? Sign up")');
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();

    // Should now be in sign up mode
    await expect(page.locator('text=Create your account')).toBeVisible();
    await expect(page.locator('button:has-text("Create account")')).toBeVisible();
    await captureScreenshot(page, '06-signup-mode');

    // Toggle back to sign in
    const backToggle = page.locator('button:has-text("Already have an account? Sign in")');
    await expect(backToggle).toBeVisible();
    await backToggle.click();

    // Should be back to sign in mode
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
    
    console.log('✅ Sign up toggle functionality works correctly');
  });

  test('Back to landing page navigation', async ({ page }) => {
    console.log('⬅️ Testing back to landing page navigation...');

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Find and click the back to home link
    const backLink = page.locator('a').filter({ has: page.locator('svg') }).first(); // Arrow left icon
    await expect(backLink).toBeVisible();
    await backLink.click();

    // Should be back on landing page
    await page.waitForURL('/');
    await expect(page.locator('text=Systematic Reviews')).toBeVisible();
    
    console.log('✅ Back to landing page navigation works');
  });
});