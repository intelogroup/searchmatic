import { chromium } from 'playwright';

async function checkSessionHandling() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🔍 Testing session handling and protected routes...');
  
  try {
    // Test 1: Direct dashboard access without login
    console.log('\n1. Testing direct dashboard access (unauthenticated)...');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForTimeout(3000);
    
    const currentURL = page.url();
    console.log(`Current URL: ${currentURL}`);
    
    // Check if we're still on dashboard or redirected to login
    if (currentURL.includes('/dashboard')) {
      console.log('❌ SECURITY ISSUE: Dashboard accessible without authentication!');
      
      // Check what the page actually shows
      const pageTitle = await page.title();
      const hasLoginForm = await page.locator('#email').isVisible().catch(() => false);
      const hasSignOutButton = await page.locator('text=Sign Out').isVisible().catch(() => false);
      
      console.log(`Page title: ${pageTitle}`);
      console.log(`Has login form: ${hasLoginForm}`);
      console.log(`Has sign out button: ${hasSignOutButton}`);
      
    } else if (currentURL.includes('/login')) {
      console.log('✅ GOOD: Redirected to login page as expected');
    } else {
      console.log(`⚠️ UNEXPECTED: Redirected to: ${currentURL}`);
    }
    
    await page.screenshot({ path: 'test-results/session-check-dashboard-direct.png' });
    
    // Test 2: Check localStorage and sessionStorage
    console.log('\n2. Checking browser storage...');
    const localStorage = await page.evaluate(() => JSON.stringify(localStorage));
    const sessionStorage = await page.evaluate(() => JSON.stringify(sessionStorage));
    
    console.log('LocalStorage:', localStorage);
    console.log('SessionStorage:', sessionStorage);
    
    // Test 3: Check Supabase session directly
    console.log('\n3. Checking Supabase session state...');
    const supabaseSession = await page.evaluate(async () => {
      // This will only work if we're on a page that has loaded the supabase client
      try {
        if (window.supabase) {
          const { data } = await window.supabase.auth.getSession();
          return data.session ? 'authenticated' : 'not authenticated';
        }
        return 'supabase not available';
      } catch (e) {
        return `error: ${e.message}`;
      }
    });
    
    console.log('Supabase session:', supabaseSession);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'test-results/session-check-error.png' });
  } finally {
    await browser.close();
  }
}

checkSessionHandling().catch(console.error);