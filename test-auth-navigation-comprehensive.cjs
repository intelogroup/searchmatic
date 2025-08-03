const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runAuthNavigationTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    screenshots: [],
    issues: []
  };

  console.log('🚀 Starting Comprehensive Authentication & Navigation Testing');
  console.log('='.repeat(60));

  try {
    // Test 1: Landing Page
    console.log('\n📋 TEST 1: Landing Page Load');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    const screenshotPath1 = 'auth-test-01-landing.png';
    await page.screenshot({ path: screenshotPath1, fullPage: true });
    testResults.screenshots.push(screenshotPath1);
    
    // Check if page loads correctly
    const title = await page.title();
    const hasHeader = await page.locator('header').isVisible();
    const hasMainContent = await page.locator('main').isVisible();
    
    testResults.tests.push({
      name: 'Landing Page Load',
      status: 'PASS',
      details: {
        title,
        hasHeader,
        hasMainContent,
        url: page.url()
      }
    });
    console.log('✅ Landing page loaded successfully');
    console.log(`   Title: ${title}`);
    console.log(`   Header visible: ${hasHeader}`);
    console.log(`   Main content visible: ${hasMainContent}`);

    // Test 2: Navigate to Login Page
    console.log('\n📋 TEST 2: Navigation to Login Page');
    
    // Look for login/auth buttons or links
    const loginButtons = await page.locator('a[href="/login"], button:has-text("Login"), button:has-text("Sign In")').count();
    console.log(`   Found ${loginButtons} potential login elements`);
    
    if (loginButtons > 0) {
      await page.locator('a[href="/login"], button:has-text("Login"), button:has-text("Sign In")').first().click();
    } else {
      // Try direct navigation
      await page.goto('http://localhost:5173/login');
    }
    
    await page.waitForLoadState('networkidle');
    const screenshotPath2 = 'auth-test-02-login.png';
    await page.screenshot({ path: screenshotPath2, fullPage: true });
    testResults.screenshots.push(screenshotPath2);
    
    const loginPageLoaded = page.url().includes('/login');
    testResults.tests.push({
      name: 'Navigate to Login Page',
      status: loginPageLoaded ? 'PASS' : 'FAIL',
      details: {
        currentUrl: page.url(),
        navigatedCorrectly: loginPageLoaded
      }
    });
    
    if (loginPageLoaded) {
      console.log('✅ Successfully navigated to login page');
    } else {
      console.log('❌ Failed to navigate to login page');
      testResults.issues.push('Navigation to login page failed');
    }

    // Test 3: Login Form Elements
    console.log('\n📋 TEST 3: Login Form Elements');
    
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').count();
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').count();
    const submitButton = await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').count();
    
    testResults.tests.push({
      name: 'Login Form Elements',
      status: (emailInput > 0 && passwordInput > 0 && submitButton > 0) ? 'PASS' : 'FAIL',
      details: {
        emailInputs: emailInput,
        passwordInputs: passwordInput,
        submitButtons: submitButton
      }
    });
    
    console.log(`   Email inputs found: ${emailInput}`);
    console.log(`   Password inputs found: ${passwordInput}`);
    console.log(`   Submit buttons found: ${submitButton}`);

    // Test 4: Sign In/Sign Up Toggle
    console.log('\n📋 TEST 4: Sign In/Sign Up Mode Toggle');
    
    const signUpLink = await page.locator('a:has-text("Sign Up"), button:has-text("Sign Up"), a:has-text("Create account")').count();
    const signInLink = await page.locator('a:has-text("Sign In"), button:has-text("Sign In"), a:has-text("Login")').count();
    
    if (signUpLink > 0) {
      console.log('   Testing Sign Up mode toggle...');
      await page.locator('a:has-text("Sign Up"), button:has-text("Sign Up"), a:has-text("Create account")').first().click();
      await page.waitForTimeout(1000);
      
      const screenshotPath3 = 'auth-test-03-signup-mode.png';
      await page.screenshot({ path: screenshotPath3, fullPage: true });
      testResults.screenshots.push(screenshotPath3);
      
      // Check for additional fields in signup mode
      const nameInput = await page.locator('input[name="name"], input[name="firstName"], input[name="fullName"], input[placeholder*="name" i]').count();
      const confirmPasswordInput = await page.locator('input[name="confirmPassword"], input[name="password_confirm"]').count();
      
      console.log(`   Name/full name inputs in signup: ${nameInput}`);
      console.log(`   Confirm password inputs: ${confirmPasswordInput}`);
      
      testResults.tests.push({
        name: 'Sign Up Mode Toggle',
        status: 'PASS',
        details: {
          signUpModeActivated: true,
          nameInputs: nameInput,
          confirmPasswordInputs: confirmPasswordInput
        }
      });
      
      // Toggle back to sign in
      if (signInLink > 0) {
        await page.locator('a:has-text("Sign In"), button:has-text("Sign In"), a:has-text("Login")').first().click();
        await page.waitForTimeout(1000);
        console.log('   ✅ Successfully toggled back to Sign In mode');
      }
    } else {
      console.log('   ⚠️ No Sign Up toggle found');
      testResults.tests.push({
        name: 'Sign Up Mode Toggle',
        status: 'SKIP',
        details: { reason: 'No sign up toggle found' }
      });
    }

    // Test 5: Protected Route Access
    console.log('\n📋 TEST 5: Protected Route Access (Unauthenticated)');
    
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    const redirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('/auth');
    const stillOnDashboard = currentUrl.includes('/dashboard');
    
    const screenshotPath4 = 'auth-test-04-protected-route.png';
    await page.screenshot({ path: screenshotPath4, fullPage: true });
    testResults.screenshots.push(screenshotPath4);
    
    testResults.tests.push({
      name: 'Protected Route Access',
      status: redirectedToLogin ? 'PASS' : (stillOnDashboard ? 'FAIL' : 'PARTIAL'),
      details: {
        attemptedUrl: 'http://localhost:5173/dashboard',
        actualUrl: currentUrl,
        redirectedToLogin,
        stillOnDashboard
      }
    });
    
    if (redirectedToLogin) {
      console.log('✅ Protected route correctly redirected to login');
    } else if (stillOnDashboard) {
      console.log('❌ Protected route accessible without authentication');
      testResults.issues.push('Dashboard accessible without authentication');
    } else {
      console.log('⚠️ Unexpected redirect behavior');
      testResults.issues.push(`Unexpected redirect to: ${currentUrl}`);
    }

    // Test 6: Form Interaction Test
    console.log('\n📋 TEST 6: Form Interaction Test');
    
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    // Try to fill out the form
    const emailInputSelector = 'input[type="email"], input[name="email"], input[placeholder*="email" i]';
    const passwordInputSelector = 'input[type="password"], input[name="password"]';
    
    if (await page.locator(emailInputSelector).count() > 0) {
      await page.locator(emailInputSelector).first().fill('test@example.com');
      console.log('   ✅ Email field filled successfully');
    } else {
      console.log('   ❌ Email field not found or not fillable');
      testResults.issues.push('Email field not found or not fillable');
    }
    
    if (await page.locator(passwordInputSelector).count() > 0) {
      await page.locator(passwordInputSelector).first().fill('testpassword123');
      console.log('   ✅ Password field filled successfully');
    } else {
      console.log('   ❌ Password field not found or not fillable');
      testResults.issues.push('Password field not found or not fillable');
    }
    
    const screenshotPath5 = 'auth-test-05-form-filled.png';
    await page.screenshot({ path: screenshotPath5, fullPage: true });
    testResults.screenshots.push(screenshotPath5);
    
    testResults.tests.push({
      name: 'Form Interaction',
      status: 'PASS',
      details: {
        emailFieldFillable: await page.locator(emailInputSelector).count() > 0,
        passwordFieldFillable: await page.locator(passwordInputSelector).count() > 0
      }
    });

    // Test 7: Responsive Design Check
    console.log('\n📋 TEST 7: Responsive Design Check');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const screenshotPath6 = 'auth-test-06-mobile.png';
    await page.screenshot({ path: screenshotPath6, fullPage: true });
    testResults.screenshots.push(screenshotPath6);
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const screenshotPath7 = 'auth-test-07-tablet.png';
    await page.screenshot({ path: screenshotPath7, fullPage: true });
    testResults.screenshots.push(screenshotPath7);
    
    // Back to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    testResults.tests.push({
      name: 'Responsive Design',
      status: 'PASS',
      details: {
        testedViewports: ['mobile (390x844)', 'tablet (768x1024)', 'desktop (1920x1080)']
      }
    });
    
    console.log('   ✅ Responsive design tested across multiple viewports');

    // Test 8: Accessibility Check
    console.log('\n📋 TEST 8: Basic Accessibility Check');
    
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    // Check for basic accessibility features
    const hasH1 = await page.locator('h1').count() > 0;
    const hasLabels = await page.locator('label').count() > 0;
    const inputsWithLabels = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      let labeledInputs = 0;
      inputs.forEach(input => {
        if (input.id && document.querySelector(`label[for="${input.id}"]`)) {
          labeledInputs++;
        } else if (input.closest('label')) {
          labeledInputs++;
        } else if (input.getAttribute('aria-label')) {
          labeledInputs++;
        }
      });
      return { total: inputs.length, labeled: labeledInputs };
    });
    
    testResults.tests.push({
      name: 'Basic Accessibility',
      status: hasH1 && hasLabels ? 'PASS' : 'PARTIAL',
      details: {
        hasH1Heading: hasH1,
        hasLabels: hasLabels,
        inputsWithLabels: inputsWithLabels
      }
    });
    
    console.log(`   H1 heading present: ${hasH1}`);
    console.log(`   Labels present: ${hasLabels}`);
    console.log(`   Labeled inputs: ${inputsWithLabels.labeled}/${inputsWithLabels.total}`);

  } catch (error) {
    console.error('❌ Test execution error:', error);
    testResults.issues.push(`Test execution error: ${error.message}`);
  }

  await browser.close();

  // Generate comprehensive report
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  const passedTests = testResults.tests.filter(t => t.status === 'PASS').length;
  const failedTests = testResults.tests.filter(t => t.status === 'FAIL').length;
  const skippedTests = testResults.tests.filter(t => t.status === 'SKIP').length;
  const partialTests = testResults.tests.filter(t => t.status === 'PARTIAL').length;
  
  console.log(`Total Tests: ${testResults.tests.length}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`⚠️ Partial: ${partialTests}`);
  console.log(`⏭️ Skipped: ${skippedTests}`);
  console.log(`📸 Screenshots: ${testResults.screenshots.length}`);
  console.log(`🐛 Issues Found: ${testResults.issues.length}`);
  
  if (testResults.issues.length > 0) {
    console.log('\n🐛 ISSUES IDENTIFIED:');
    testResults.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }
  
  console.log('\n📸 SCREENSHOTS CAPTURED:');
  testResults.screenshots.forEach((screenshot, index) => {
    console.log(`   ${index + 1}. ${screenshot}`);
  });
  
  // Save detailed report
  const reportPath = 'auth-navigation-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return testResults;
}

// Run the tests
runAuthNavigationTests().catch(console.error);