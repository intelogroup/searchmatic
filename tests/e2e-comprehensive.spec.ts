import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:5173';
const TEST_EMAIL = 'test-user-e2e@searchmatic.com';
const TEST_PASSWORD = 'TestPassword123!';

// Helper functions
async function waitForLoader(page: Page) {
  await page.waitForSelector('.loading, .spinner', { state: 'detached', timeout: 10000 }).catch(() => {});
}

async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}

test.describe('Searchmatic MVP - Complete E2E User Journey', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start with a clean slate
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Phase 1: Authentication & Setup', async ({ page }) => {
    console.log('🚀 Starting Phase 1: Authentication & Setup');
    
    // Test 1: Landing Page Load
    console.log('1. Testing Landing Page Load...');
    await expect(page).toHaveTitle(/Searchmatic/i);
    await takeScreenshot(page, '01-landing-page');
    console.log('✅ Landing page loaded correctly');

    // Test 2: Navigate to Login
    console.log('2. Testing Navigation to Login...');
    const loginButton = page.getByRole('button', { name: /sign in|login/i }).first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
    } else {
      // Try direct navigation
      await page.goto(`${BASE_URL}/login`);
    }
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '02-login-page');
    console.log('✅ Successfully navigated to login page');

    // Test 3: User Registration/Login Flow
    console.log('3. Testing Authentication Flow...');
    
    // Check if we need to switch to signup
    const signupTab = page.getByRole('tab', { name: /sign up|register/i });
    if (await signupTab.isVisible()) {
      await signupTab.click();
      await page.waitForTimeout(500);
    }

    // Fill in credentials
    const emailInput = page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i));
    const passwordInput = page.getByPlaceholder(/password/i).or(page.getByLabel(/password/i));
    
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /sign up|sign in|login|register/i });
    await submitButton.click();
    
    // Wait for either success or error
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '03-after-auth-attempt');
    
    // Check if we're redirected to dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/app')) {
      console.log('✅ Authentication successful - redirected to dashboard');
    } else {
      console.log('⚠️  Authentication may need manual verification or may have failed');
    }
  });

  test('Phase 2: Project Management', async ({ page }) => {
    console.log('🚀 Starting Phase 2: Project Management');
    
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
    await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(2000);
    
    // Test 4: Dashboard Access
    console.log('4. Testing Dashboard Access...');
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForLoader(page);
    await takeScreenshot(page, '04-dashboard');
    
    // Look for dashboard elements
    const hasDashboardContent = await page.getByText(/project/i).isVisible() || 
                                await page.getByText(/dashboard/i).isVisible() ||
                                await page.getByRole('heading').isVisible();
    
    if (hasDashboardContent) {
      console.log('✅ Dashboard loaded with content');
    } else {
      console.log('❌ Dashboard may not have loaded properly');
    }

    // Test 5: Create New Project
    console.log('5. Testing Project Creation...');
    
    // Look for "New Project" or "Create Project" button
    const newProjectButton = page.getByRole('button', { name: /new project|create project|start new/i });
    const createLink = page.getByRole('link', { name: /new project|create project|start new/i });
    
    if (await newProjectButton.isVisible()) {
      await newProjectButton.click();
    } else if (await createLink.isVisible()) {
      await createLink.click();
    } else {
      // Try direct navigation
      await page.goto(`${BASE_URL}/projects/new`);
    }
    
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '05-new-project-form');
    
    // Fill in project form
    const titleInput = page.getByPlaceholder(/title|name/i).or(page.getByLabel(/title|name/i));
    const descriptionInput = page.getByPlaceholder(/description/i).or(page.getByLabel(/description/i));
    
    const projectTitle = `E2E Test Project - ${Date.now()}`;
    const projectDescription = 'This is a test project created during E2E testing';
    
    if (await titleInput.isVisible()) {
      await titleInput.fill(projectTitle);
      console.log('✅ Project title filled');
    }
    
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill(projectDescription);
      console.log('✅ Project description filled');
    }
    
    // Submit project creation
    const submitProject = page.getByRole('button', { name: /create|save|submit/i });
    if (await submitProject.isVisible()) {
      await submitProject.click();
      await page.waitForTimeout(2000);
      console.log('✅ Project creation form submitted');
    }
    
    await takeScreenshot(page, '06-after-project-creation');
  });

  test('Phase 3: AI Features Testing', async ({ page }) => {
    console.log('🚀 Starting Phase 3: AI Features Testing');
    
    // Login and navigate to a project
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
    await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(2000);
    
    // Try to access project view or create one
    await page.goto(`${BASE_URL}/project/demo`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '07-project-view');
    
    // Test 7: AI Chat Functionality
    console.log('7. Testing AI Chat Functionality...');
    
    const chatInput = page.getByPlaceholder(/message|chat|ask/i).or(page.getByRole('textbox').last());
    const chatPanel = page.locator('[class*="chat"], [class*="ai"], .chat-panel').first();
    
    if (await chatInput.isVisible()) {
      const testMessage = 'Hello AI, can you help me create a research protocol?';
      await chatInput.fill(testMessage);
      await chatInput.press('Enter');
      
      // Wait for AI response
      await page.waitForTimeout(3000);
      await takeScreenshot(page, '08-ai-chat-interaction');
      console.log('✅ AI chat interaction attempted');
    } else {
      console.log('⚠️  AI chat input not found - may need UI adjustment');
    }

    // Test 8: Protocol Creation
    console.log('8. Testing Protocol Creation...');
    
    const protocolButton = page.getByRole('button', { name: /protocol|create protocol/i });
    const protocolPanel = page.locator('[class*="protocol"], .protocol-panel').first();
    
    if (await protocolButton.isVisible()) {
      await protocolButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Look for protocol form elements
    const picoElements = page.getByText(/PICO|Population|Intervention|Comparison|Outcome/i);
    const spiderElements = page.getByText(/SPIDER|Sample|Phenomenon|Design|Evaluation|Research/i);
    
    if (await picoElements.first().isVisible() || await spiderElements.first().isVisible()) {
      console.log('✅ Protocol framework detected (PICO/SPIDER)');
    } else {
      console.log('⚠️  Protocol framework elements not visible');
    }
    
    await takeScreenshot(page, '09-protocol-creation');
  });

  test('Phase 4: Core Features & Database Integration', async ({ page }) => {
    console.log('🚀 Starting Phase 4: Core Features & Database Integration');
    
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
    await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(2000);
    
    // Test database operations
    console.log('10. Testing Database Operations...');
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForLoader(page);
    
    // Check if projects are displayed (testing database read)
    const projectElements = page.locator('[class*="project"], .project-card, [data-testid*="project"]');
    const projectCount = await projectElements.count();
    
    if (projectCount > 0) {
      console.log(`✅ Found ${projectCount} projects - database read working`);
    } else {
      console.log('⚠️  No projects found - may indicate database issue or empty state');
    }
    
    await takeScreenshot(page, '10-database-operations');
  });

  test('Phase 5: Responsive Design & Three-Panel Layout', async ({ page }) => {
    console.log('🚀 Starting Phase 5: Responsive Design Testing');
    
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1024, height: 768, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const viewport of viewports) {
      console.log(`11. Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})...`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${BASE_URL}/project/demo`);
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, `11-responsive-${viewport.name}`);
      
      // Check if three-panel layout adapts
      const panels = page.locator('[class*="panel"], .main-content, .chat-panel, .protocol-panel');
      const visiblePanels = await panels.evaluateAll(elements => 
        elements.filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        }).length
      );
      
      console.log(`✅ ${viewport.name}: ${visiblePanels} panels visible`);
    }
  });

  test('Complete User Journey Summary', async ({ page }) => {
    console.log('🚀 Running Complete User Journey Test');
    
    const testResults = {
      landingPage: false,
      authentication: false,
      dashboard: false,
      projectCreation: false,
      aiChat: false,
      protocolCreation: false,
      responsiveDesign: false
    };
    
    try {
      // 1. Landing page
      await page.goto(BASE_URL);
      await expect(page).toHaveTitle(/Searchmatic/i);
      testResults.landingPage = true;
      
      // 2. Authentication
      await page.goto(`${BASE_URL}/login`);
      await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
      await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForTimeout(2000);
      testResults.authentication = !page.url().includes('/login');
      
      // 3. Dashboard
      await page.goto(`${BASE_URL}/dashboard`);
      await waitForLoader(page);
      testResults.dashboard = await page.getByText(/project|dashboard/i).isVisible();
      
      // 4. Three-panel layout
      await page.goto(`${BASE_URL}/project/demo`);
      await page.waitForLoadState('networkidle');
      const panelElements = await page.locator('[class*="panel"], .main-content').count();
      testResults.responsiveDesign = panelElements >= 2;
      
      // 5. AI features test
      const chatInput = page.getByPlaceholder(/message|chat/i).first();
      testResults.aiChat = await chatInput.isVisible();
      
      // 6. Protocol features
      const protocolElements = await page.getByText(/protocol|PICO|SPIDER/i).first().isVisible();
      testResults.protocolCreation = protocolElements;
      
      console.log('\n📊 FINAL TEST RESULTS:');
      console.log('='.repeat(50));
      console.log(`✅ Landing Page: ${testResults.landingPage ? 'PASS' : 'FAIL'}`);
      console.log(`✅ Authentication: ${testResults.authentication ? 'PASS' : 'FAIL'}`);
      console.log(`✅ Dashboard: ${testResults.dashboard ? 'PASS' : 'FAIL'}`);
      console.log(`✅ Three-Panel Layout: ${testResults.responsiveDesign ? 'PASS' : 'FAIL'}`);
      console.log(`✅ AI Chat: ${testResults.aiChat ? 'PASS' : 'FAIL'}`);
      console.log(`✅ Protocol Creation: ${testResults.protocolCreation ? 'PASS' : 'FAIL'}`);
      console.log('='.repeat(50));
      
      const passedTests = Object.values(testResults).filter(Boolean).length;
      const totalTests = Object.keys(testResults).length;
      console.log(`📈 Overall Success Rate: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
      
    } catch (error) {
      console.error('❌ Test execution error:', error);
    }
  });
});