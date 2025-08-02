import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  console.log('🔐 Testing Sign-up toggle functionality...');
  await page.goto('http://localhost:5174/login');
  await page.waitForSelector('body', { timeout: 10000 });

  // Take initial screenshot
  await page.screenshot({ path: 'auth-initial.png', fullPage: true });
  console.log('✅ Initial auth page captured');

  // Look for sign-up link/button
  console.log('🔍 Looking for sign-up toggle...');
  
  // Try different selectors for sign-up
  const signUpSelectors = [
    'text="Sign up"',
    'text="Create account"', 
    'text="Register"',
    '[href*="signup"]',
    '[href*="register"]',
    'button:has-text("Sign up")',
    'a:has-text("Sign up")'
  ];

  let signUpFound = false;
  for (const selector of signUpSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        console.log(`✅ Found sign-up element with selector: ${selector}`);
        await element.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'auth-after-signup-click.png', fullPage: true });
        console.log('✅ Clicked sign-up, screenshot captured');
        signUpFound = true;
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }

  if (!signUpFound) {
    console.log('⚠️ No sign-up toggle found - checking if form is already in sign-up mode');
    
    // Check for sign-up specific elements
    const hasConfirmPassword = await page.locator('input[type="password"]').count() > 1;
    const hasTermsCheckbox = await page.locator('input[type="checkbox"]').isVisible().catch(() => false);
    
    console.log(`Password fields count: ${await page.locator('input[type="password"]').count()}`);
    console.log(`Has terms checkbox: ${hasTermsCheckbox}`);
  }

  // Check for sign-in toggle
  console.log('🔍 Looking for sign-in toggle...');
  const signInSelectors = [
    'text="Sign in"',
    'text="Log in"',
    'text="Login"',
    '[href*="signin"]',
    '[href*="login"]',
    'button:has-text("Sign in")',
    'a:has-text("Sign in")'
  ];

  for (const selector of signInSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        console.log(`✅ Found sign-in element with selector: ${selector}`);
        await element.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'auth-after-signin-click.png', fullPage: true });
        console.log('✅ Clicked sign-in, screenshot captured');
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }

  // Analyze the page structure
  console.log('🔍 Analyzing page structure...');
  const pageTitle = await page.locator('h1, h2').first().textContent().catch(() => 'No title found');
  const inputCount = await page.locator('input').count();
  const buttonCount = await page.locator('button').count();
  const linkCount = await page.locator('a').count();

  console.log(`Page title: ${pageTitle}`);
  console.log(`Input fields: ${inputCount}`);
  console.log(`Buttons: ${buttonCount}`);
  console.log(`Links: ${linkCount}`);

  await browser.close();
  console.log('🎉 Sign-up toggle testing completed!');
})();