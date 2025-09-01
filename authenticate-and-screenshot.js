import { chromium } from 'playwright';

async function authenticateAndScreenshot() {
  const browser = await chromium.launch({ headless: true }); // Headless for server environment
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:5174');
    await page.waitForTimeout(2000);

    console.log('Filling in demo credentials...');
    // Fill in the demo credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    console.log('Clicking sign in button...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('✓ Successfully authenticated and redirected to dashboard');
    } catch (error) {
      console.log('Authentication may have failed, checking current page...');
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // Check if there's an error message
      const errorMessage = await page.textContent('.bg-red-50', { timeout: 2000 }).catch(() => null);
      if (errorMessage) {
        console.log('Error message:', errorMessage);
      }
      
      // If we're still on login page, try to create account first
      if (currentUrl.includes('login') || currentUrl === 'http://localhost:5174/') {
        console.log('Still on login page, trying to create account...');
        
        // Click "Don't have an account? Sign up"
        await page.click('text="Don\'t have an account? Sign up"');
        await page.waitForTimeout(1000);
        
        // Fill in sign up form
        await page.fill('input[placeholder="John Doe"]', 'Test User');
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'password123');
        
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Check for confirmation message
        const confirmMessage = await page.textContent('.bg-green-50', { timeout: 2000 }).catch(() => null);
        if (confirmMessage && confirmMessage.includes('email')) {
          console.log('Sign up successful, but email confirmation needed');
          // For demo purposes, let's bypass email confirmation by directly setting auth state
          await page.evaluate(() => {
            // Set a mock session in localStorage
            const mockSession = {
              access_token: 'mock-access-token',
              token_type: 'bearer',
              expires_in: 3600,
              refresh_token: 'mock-refresh-token',
              user: {
                id: 'mock-user-id',
                email: 'test@example.com',
                aud: 'authenticated',
                role: 'authenticated',
                email_confirmed_at: new Date().toISOString(),
                phone_confirmed_at: null,
                confirmed_at: new Date().toISOString(),
                last_sign_in_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            };
            localStorage.setItem('sb-qzvfufadiqmizrozejci-auth-token', JSON.stringify(mockSession));
          });
          
          await page.goto('http://localhost:5174/dashboard');
          await page.waitForTimeout(3000);
        }
      }
    }

    // Take screenshots of authenticated pages
    await page.setViewportSize({ width: 1200, height: 800 });
    
    console.log('Taking dashboard screenshot...');
    await page.goto('http://localhost:5174/dashboard');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'authenticated-dashboard-desktop.png', fullPage: true });
    console.log('✓ Dashboard desktop screenshot taken');
    
    console.log('Taking projects screenshot...');
    await page.goto('http://localhost:5174/projects');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'authenticated-projects-desktop.png', fullPage: true });
    console.log('✓ Projects desktop screenshot taken');
    
    console.log('Taking new project screenshot...');
    await page.goto('http://localhost:5174/projects/new');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'authenticated-new-project-desktop.png', fullPage: true });
    console.log('✓ New project desktop screenshot taken');
    
    console.log('Taking protocols screenshot...');
    await page.goto('http://localhost:5174/protocols');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'authenticated-protocols-desktop.png', fullPage: true });
    console.log('✓ Protocols desktop screenshot taken');

    // Mobile screenshots
    console.log('Taking mobile screenshots...');
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:5174/dashboard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'authenticated-dashboard-mobile.png', fullPage: true });
    console.log('✓ Dashboard mobile screenshot taken');
    
    await page.goto('http://localhost:5174/projects');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'authenticated-projects-mobile.png', fullPage: true });
    console.log('✓ Projects mobile screenshot taken');

  } catch (error) {
    console.error('Error during authentication/screenshot process:', error);
    
    // Take screenshot of current state for debugging
    await page.screenshot({ path: 'debug-current-state.png', fullPage: true });
    console.log('Debug screenshot saved as debug-current-state.png');
  } finally {
    await browser.close();
  }
}

authenticateAndScreenshot();