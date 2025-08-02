import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  // Test desktop version
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  console.log('📱 Testing Landing Page...');
  await page.goto('http://localhost:5174/');
  await page.waitForSelector('body', { timeout: 10000 });
  await page.screenshot({ path: 'landing-page-desktop.png', fullPage: true });
  console.log('✅ Landing page screenshot captured');

  console.log('🔐 Testing Login Page...');
  await page.goto('http://localhost:5174/login');
  await page.waitForSelector('body', { timeout: 10000 });
  await page.screenshot({ path: 'login-page-desktop.png', fullPage: true });
  console.log('✅ Login page screenshot captured');

  // Test sign-up toggle
  console.log('🔄 Testing Sign-up toggle...');
  const signUpButton = await page.locator('text="Sign up"').first();
  if (await signUpButton.isVisible()) {
    await signUpButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'signup-form-desktop.png', fullPage: true });
    console.log('✅ Sign-up form screenshot captured');
  }

  // Test back to sign-in
  const signInButton = await page.locator('text="Sign in"').first();
  if (await signInButton.isVisible()) {
    await signInButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'signin-form-desktop.png', fullPage: true });
    console.log('✅ Sign-in form screenshot captured');
  }

  // Test mobile responsive design
  console.log('📱 Testing Mobile Responsive Design...');
  await page.setViewportSize({ width: 375, height: 667 });
  
  await page.goto('http://localhost:5174/');
  await page.waitForSelector('body', { timeout: 10000 });
  await page.screenshot({ path: 'landing-page-mobile.png', fullPage: true });
  console.log('✅ Mobile landing page screenshot captured');

  await page.goto('http://localhost:5174/login');
  await page.waitForSelector('body', { timeout: 10000 });
  await page.screenshot({ path: 'login-page-mobile.png', fullPage: true });
  console.log('✅ Mobile login page screenshot captured');

  // Test tablet responsive design
  console.log('📱 Testing Tablet Responsive Design...');
  await page.setViewportSize({ width: 768, height: 1024 });
  
  await page.goto('http://localhost:5174/');
  await page.waitForSelector('body', { timeout: 10000 });
  await page.screenshot({ path: 'landing-page-tablet.png', fullPage: true });
  console.log('✅ Tablet landing page screenshot captured');

  await page.goto('http://localhost:5174/login');
  await page.waitForSelector('body', { timeout: 10000 });
  await page.screenshot({ path: 'login-page-tablet.png', fullPage: true });
  console.log('✅ Tablet login page screenshot captured');

  // Try login with test credentials
  console.log('🧪 Testing Login Flow...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5174/login');
  await page.waitForSelector('body', { timeout: 10000 });

  // Fill login form if present
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  
  if (await emailInput.isVisible() && await passwordInput.isVisible()) {
    await emailInput.fill('jayveedz19@gmail.com');
    await passwordInput.fill('Jimkali90#');
    await page.screenshot({ path: 'login-form-filled.png', fullPage: true });
    console.log('✅ Login form filled screenshot captured');
    
    // Try to submit (but don't actually submit to avoid side effects)
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      console.log('✅ Submit button found and ready');
    }
  }

  await browser.close();
  console.log('🎉 All screenshots captured successfully!');
})();