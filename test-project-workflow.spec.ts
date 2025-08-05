import { test, expect } from '@playwright/test';

test.describe('Searchmatic Project-Centric Workflow Test', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log(`BROWSER: ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.log(`PAGE ERROR: ${err.message}`));
  });

  test('Complete workflow: Landing → Dashboard → Project Creation', async ({ page }) => {
    console.log('🧪 Starting comprehensive workflow test...');

    // Test 1: Landing Page Load
    console.log('📍 Test 1: Landing Page Load');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of landing page
    await page.screenshot({ 
      path: 'test-results/01-landing-page.png', 
      fullPage: true 
    });
    
    // Verify landing page elements
    const title = await page.textContent('h1');
    console.log(`Landing page title: ${title}`);
    
    // Test 2: Authentication Flow
    console.log('📍 Test 2: Authentication Flow');
    
    // Look for login/auth elements
    const loginButton = page.locator('text=Login');
    const signUpButton = page.locator('text=Sign Up');
    const getStartedButton = page.locator('text=Get Started');
    
    // Try different ways to access auth
    if (await loginButton.isVisible()) {
      await loginButton.click();
    } else if (await signUpButton.isVisible()) {
      await signUpButton.click();
    } else if (await getStartedButton.isVisible()) {
      await getStartedButton.click();
    } else {
      // Check if already authenticated and redirected
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ 
      path: 'test-results/02-auth-page.png', 
      fullPage: true 
    });

    // Test 3: Dashboard Access
    console.log('📍 Test 3: Dashboard Access');
    
    // Try to navigate to dashboard directly
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForTimeout(3000); // Wait for potential redirects or loading
    
    await page.screenshot({ 
      path: 'test-results/03-dashboard-initial.png', 
      fullPage: true 
    });
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Check for dashboard elements or auth redirect
    const isDashboard = currentUrl.includes('/dashboard');
    const isAuth = currentUrl.includes('/login') || currentUrl.includes('/auth');
    
    console.log(`Is Dashboard: ${isDashboard}, Is Auth: ${isAuth}`);

    // Test 4: Dashboard State (Pre-Migration)
    console.log('📍 Test 4: Dashboard State Analysis');
    
    if (isDashboard) {
      // Look for dashboard elements
      const startNewReviewButton = page.locator('text=Start New Review');
      const projectCards = page.locator('[data-testid="project-card"]');
      
      // Check for error messages
      const errorMessages = page.locator('[role="alert"], .error, .text-red');
      const errorCount = await errorMessages.count();
      console.log(`Error messages found: ${errorCount}`);
      
      if (errorCount > 0) {
        for (let i = 0; i < errorCount; i++) {
          const errorText = await errorMessages.nth(i).textContent();
          console.log(`Error ${i + 1}: ${errorText}`);
        }
      }
      
      // Test Start New Review button
      if (await startNewReviewButton.isVisible()) {
        console.log('✅ Start New Review button is visible');
        await startNewReviewButton.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: 'test-results/04-new-project-page.png', 
          fullPage: true 
        });
        
        const newProjectUrl = page.url();
        console.log(`New project URL: ${newProjectUrl}`);
      }
    }

    // Test 5: Project Creation Flow
    console.log('📍 Test 5: Project Creation Flow');
    
    // Try to access project creation directly
    await page.goto('http://localhost:5173/projects/new');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: 'test-results/05-project-creation.png', 
      fullPage: true 
    });
    
    // Look for project creation elements
    const guidedSetupButton = page.locator('text=Start Guided Setup');
    const uploadDocumentsButton = page.locator('text=Upload Documents');
    const projectForm = page.locator('form');
    
    console.log(`Guided Setup Button: ${await guidedSetupButton.isVisible()}`);
    console.log(`Upload Documents Button: ${await uploadDocumentsButton.isVisible()}`);
    console.log(`Project Form: ${await projectForm.isVisible()}`);

    // Test clicking guided setup (expect graceful failure)
    if (await guidedSetupButton.isVisible()) {
      console.log('🧪 Testing Guided Setup click (expecting graceful failure)...');
      await guidedSetupButton.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'test-results/06-guided-setup-result.png', 
        fullPage: true 
      });
    }

    // Test 6: Error State Analysis
    console.log('📍 Test 6: Error State Analysis');
    
    // Check for any error boundaries or crash states
    const errorBoundary = page.locator('[data-testid="error-boundary"]');
    const crashMessage = page.locator('text=Something went wrong');
    
    console.log(`Error Boundary: ${await errorBoundary.isVisible()}`);
    console.log(`Crash Message: ${await crashMessage.isVisible()}`);

    // Test 7: UI Quality Assessment
    console.log('📍 Test 7: UI Quality Assessment');
    
    // Test responsiveness
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.screenshot({ 
      path: 'test-results/07-mobile-view.png', 
      fullPage: true 
    });
    
    await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
    await page.screenshot({ 
      path: 'test-results/08-tablet-view.png', 
      fullPage: true 
    });
    
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await page.screenshot({ 
      path: 'test-results/09-desktop-view.png', 
      fullPage: true 
    });

    console.log('🎉 Workflow test completed! Check test-results/ for screenshots.');
  });

  test('Console Error Analysis', async ({ page }) => {
    console.log('🔍 Starting console error analysis...');
    
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
    
    // Navigate through key pages
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForTimeout(2000);
    
    await page.goto('http://localhost:5173/projects/new');
    await page.waitForTimeout(2000);
    
    console.log(`\n📊 ERROR SUMMARY:`);
    console.log(`Total Errors: ${errors.length}`);
    console.log(`Total Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log(`\n❌ ERRORS:`);
      errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
    }
    
    if (warnings.length > 0) {
      console.log(`\n⚠️ WARNINGS:`);
      warnings.forEach((warning, i) => console.log(`${i + 1}. ${warning}`));
    }
  });

  test('Network Request Analysis', async ({ page }) => {
    console.log('🌐 Starting network request analysis...');
    
    const requests = [];
    const failedRequests = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });
    
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure()?.errorText
      });
      console.log(`❌ FAILED REQUEST: ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    // Navigate through key pages
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForLoadState('networkidle');
    
    await page.goto('http://localhost:5173/projects/new');
    await page.waitForLoadState('networkidle');
    
    console.log(`\n📊 NETWORK SUMMARY:`);
    console.log(`Total Requests: ${requests.length}`);
    console.log(`Failed Requests: ${failedRequests.length}`);
    
    // Group requests by type
    const requestsByType = requests.reduce((acc, req) => {
      acc[req.resourceType] = (acc[req.resourceType] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`\n📈 REQUESTS BY TYPE:`);
    Object.entries(requestsByType).forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });
    
    if (failedRequests.length > 0) {
      console.log(`\n❌ FAILED REQUESTS:`);
      failedRequests.forEach((req, i) => {
        console.log(`${i + 1}. ${req.url} - ${req.failure}`);
      });
    }
  });
});