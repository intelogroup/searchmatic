import { chromium } from 'playwright';

async function testWorkflow() {
  console.log('🧪 Starting Searchmatic Workflow Test...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console messages and errors
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

  try {
    // Test 1: Landing Page
    console.log('\n📍 Test 1: Landing Page Load');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    const title = await page.title();
    console.log(`✅ Page title: ${title}`);
    
    await page.screenshot({ path: 'test-results/01-landing-page.png', fullPage: true });
    
    // Check for basic elements
    const heading = await page.textContent('h1').catch(() => 'No h1 found');
    console.log(`✅ Main heading: ${heading}`);
    
    // Test 2: Dashboard Navigation
    console.log('\n📍 Test 2: Dashboard Navigation');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
    
    const dashboardUrl = page.url();
    console.log(`✅ Dashboard URL: ${dashboardUrl}`);
    
    await page.screenshot({ path: 'test-results/02-dashboard.png', fullPage: true });
    
    // Check if redirected to auth
    if (dashboardUrl.includes('/login') || dashboardUrl.includes('/auth')) {
      console.log('ℹ️ Redirected to authentication (expected behavior)');
    } else if (dashboardUrl.includes('/dashboard')) {
      console.log('✅ Dashboard loaded successfully');
      
      // Look for dashboard elements
      const startNewReview = await page.locator('text=Start New Review').isVisible().catch(() => false);
      console.log(`✅ Start New Review button visible: ${startNewReview}`);
    }
    
    // Test 3: Project Creation Page
    console.log('\n📍 Test 3: Project Creation Page');
    await page.goto('http://localhost:5173/projects/new', { waitUntil: 'networkidle' });
    
    const projectUrl = page.url();
    console.log(`✅ Project creation URL: ${projectUrl}`);
    
    await page.screenshot({ path: 'test-results/03-project-creation.png', fullPage: true });
    
    // Check for project creation elements
    const guidedSetup = await page.locator('text=Start Guided Setup').isVisible().catch(() => false);
    const uploadDocs = await page.locator('text=Upload Documents').isVisible().catch(() => false);
    
    console.log(`✅ Guided Setup button visible: ${guidedSetup}`);
    console.log(`✅ Upload Documents button visible: ${uploadDocs}`);
    
    // Test 4: Error Handling
    console.log('\n📍 Test 4: Error Handling Test');
    
    if (guidedSetup) {
      console.log('🧪 Testing Guided Setup click (expecting graceful failure)...');
      await page.click('text=Start Guided Setup');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/04-guided-setup-click.png', fullPage: true });
      
      // Check for error messages or loading states
      const errorAlert = await page.locator('[role="alert"]').isVisible().catch(() => false);
      const loadingSpinner = await page.locator('.animate-spin').isVisible().catch(() => false);
      
      console.log(`✅ Error alert shown: ${errorAlert}`);
      console.log(`✅ Loading spinner shown: ${loadingSpinner}`);
    }
    
    // Test 5: Responsive Design
    console.log('\n📍 Test 5: Responsive Design');
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'test-results/05-mobile-view.png', fullPage: true });
    console.log('✅ Mobile screenshot captured');
    
    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'test-results/06-tablet-view.png', fullPage: true });
    console.log('✅ Tablet screenshot captured');
    
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'test-results/07-desktop-view.png', fullPage: true });
    console.log('✅ Desktop screenshot captured');
    
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log(`Total Console Errors: ${errors.length}`);
    console.log(`Total Console Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️ WARNINGS FOUND:');
      warnings.forEach((warning, i) => console.log(`${i + 1}. ${warning}`));
    }
    
    console.log('\n🎉 Workflow test completed successfully!');
    console.log('📸 Screenshots saved in test-results/ directory');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testWorkflow();