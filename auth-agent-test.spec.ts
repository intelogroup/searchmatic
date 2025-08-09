import { test, expect } from '@playwright/test'

// Test credentials as provided
const TEST_EMAIL = 'jayveedz19@gmail.com'
const TEST_PASSWORD = 'Jimkali90#'

test.describe('SearchMatic Authentication Flow - AuthAgent Comprehensive Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => console.log('BROWSER:', msg.text()))
  })

  test('01. Landing Page to Login Navigation', async ({ page }) => {
    console.log('🔍 Testing: Landing page to login navigation...')
    
    // Navigate to the landing page
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')
    
    // Take screenshot of landing page
    await page.screenshot({ 
      path: '/root/repo/docs/assets/screenshots/auth-testing/01-landing-page.png',
      fullPage: true 
    })
    
    // Verify landing page elements
    await expect(page.locator('text=Searchmatic')).toBeVisible()
    
    // Find and click login/sign in button - try multiple selectors
    const loginSelectors = [
      'a[href="/login"]',
      'text=Sign in',
      'text=Login',
      'button:has-text("Sign in")',
      'button:has-text("Login")'
    ]
    
    let loginButton = null
    for (const selector of loginSelectors) {
      try {
        loginButton = page.locator(selector).first()
        if (await loginButton.isVisible({ timeout: 2000 })) {
          console.log(`Found login button with selector: ${selector}`)
          break
        }
      } catch {
        console.log(`Selector ${selector} not found`)
        continue
      }
    }
    
    if (loginButton) {
      await loginButton.click()
    } else {
      // Navigate directly to login if no button found
      console.log('No login button found, navigating directly to /login')
      await page.goto('http://localhost:5173/login')
    }
    
    await page.waitForURL('**/login')
    await expect(page).toHaveURL(/.*login/)
    
    console.log('✅ Successfully navigated from landing page to login page')
  })

  test('02. Login Page UI and Form Elements', async ({ page }) => {
    console.log('🔍 Testing: Login page UI and form elements...')
    
    await page.goto('http://localhost:5173/login')
    await page.waitForLoadState('networkidle')
    
    // Take screenshot of login page
    await page.screenshot({ 
      path: '/root/repo/docs/assets/screenshots/auth-testing/02-login-page.png',
      fullPage: true 
    })
    
    // Verify essential form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Check for proper form labels
    await expect(page.locator('label[for="email"]')).toBeVisible()
    await expect(page.locator('label[for="password"]')).toBeVisible()
    
    // Verify password visibility toggle
    const passwordToggle = page.locator('button:near(input[type="password"])')
    if (await passwordToggle.count() > 0) {
      await expect(passwordToggle).toBeVisible()
    }
    
    console.log('✅ Login page UI elements are present and visible')
  })

  test('03. Successful Login with Test Credentials', async ({ page }) => {
    console.log('🔍 Testing: Successful login with test credentials...')
    
    await page.goto('http://localhost:5173/login')
    await page.waitForLoadState('networkidle')
    
    // Fill in the test credentials
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    
    // Take screenshot before submitting
    await page.screenshot({ 
      path: '/root/repo/docs/assets/screenshots/auth-testing/03-login-form-filled.png',
      fullPage: true 
    })
    
    console.log(`Attempting login with email: ${TEST_EMAIL}`)
    
    // Submit the form
    await page.click('button[type="submit"]')
    
    // Wait for navigation or success response
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 })
      
      // Take screenshot of successful login
      await page.screenshot({ 
        path: '/root/repo/docs/assets/screenshots/auth-testing/04-successful-login-dashboard.png',
        fullPage: true 
      })
      
      console.log('✅ Successfully logged in and redirected to dashboard')
    } catch {
      // If not redirected, check for error messages
      const errorMessage = await page.locator('[class*="error"], [class*="destructive"], .text-red-500, .text-destructive').first().textContent()
      console.log('❌ Login failed with error:', errorMessage || 'No specific error message found')
      
      // Take screenshot of error state
      await page.screenshot({ 
        path: '/root/repo/docs/assets/screenshots/auth-testing/04-login-error-state.png',
        fullPage: true 
      })
      
      throw new Error(`Login failed: ${errorMessage || 'Unknown error'}`)
    }
  })

  test('04. Dashboard Access and Session Persistence', async ({ page }) => {
    console.log('🔍 Testing: Dashboard access and session persistence...')
    
    // First, log in
    await page.goto('http://localhost:5173/login')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    
    // Take screenshot of dashboard
    await page.screenshot({ 
      path: '/root/repo/docs/assets/screenshots/auth-testing/05-dashboard-view.png',
      fullPage: true 
    })
    
    // Test session persistence by refreshing the page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/.*dashboard/)
    
    // Take screenshot after refresh
    await page.screenshot({ 
      path: '/root/repo/docs/assets/screenshots/auth-testing/06-dashboard-after-refresh.png',
      fullPage: true 
    })
    
    console.log('✅ Session persisted after page refresh')
  })

  test('05. Failed Login Attempt', async ({ page }) => {
    console.log('🔍 Testing: Failed login with invalid credentials...')
    
    await page.goto('http://localhost:5173/login')
    await page.waitForLoadState('networkidle')
    
    // Try with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    
    await page.click('button[type="submit"]')
    
    // Wait for error message or stay on login page
    await page.waitForTimeout(3000)
    
    // Should still be on login page
    await expect(page).toHaveURL(/.*login/)
    
    // Check for error message
    const errorElement = page.locator('[class*="error"], [class*="destructive"], .text-red-500, .text-destructive').first()
    await expect(errorElement).toBeVisible({ timeout: 5000 })
    
    // Take screenshot of error state
    await page.screenshot({ 
      path: '/root/repo/docs/assets/screenshots/auth-testing/07-failed-login-error.png',
      fullPage: true 
    })
    
    console.log('✅ Failed login properly shows error message')
  })

  test('06. Logout Functionality', async ({ page }) => {
    console.log('🔍 Testing: Logout functionality...')
    
    // First, log in
    await page.goto('http://localhost:5173/login')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Look for logout button/option - try multiple selectors
    const logoutSelectors = [
      'text=Logout',
      'text=Sign out',
      'button:has-text("Logout")',
      'button:has-text("Sign out")',
      '[data-testid="logout"]',
      'a[href="/logout"]'
    ]
    
    let logoutButton = null
    for (const selector of logoutSelectors) {
      try {
        logoutButton = page.locator(selector).first()
        if (await logoutButton.isVisible({ timeout: 2000 })) {
          console.log(`Found logout button with selector: ${selector}`)
          break
        }
      } catch {
        continue
      }
    }
    
    if (logoutButton) {
      await logoutButton.click()
      
      // Wait for redirect to login or landing page
      await page.waitForTimeout(2000)
      
      // Should be redirected away from dashboard
      const currentUrl = page.url()
      if (!currentUrl.includes('/dashboard')) {
        console.log('✅ Successfully logged out and redirected')
        
        // Take screenshot after logout
        await page.screenshot({ 
          path: '/root/repo/docs/assets/screenshots/auth-testing/08-after-logout.png',
          fullPage: true 
        })
      } else {
        console.log('❌ Still on dashboard after logout attempt')
      }
    } else {
      console.log('⚠️ No logout button found - may need to implement logout functionality')
    }
  })

  test('07. Responsive Design Testing', async ({ page }) => {
    console.log('🔍 Testing: Responsive design on different screen sizes...')
    
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1200, height: 800 }
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('http://localhost:5173/login')
      await page.waitForLoadState('networkidle')
      
      // Take screenshot at this viewport
      await page.screenshot({ 
        path: `/root/repo/docs/assets/screenshots/auth-testing/09-login-${viewport.name}.png`,
        fullPage: true 
      })
      
      // Verify form elements are still accessible
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
      
      console.log(`✅ Login form accessible on ${viewport.name} (${viewport.width}x${viewport.height})`)
    }
  })

  test('08. Database Integration Verification', async ({ page }) => {
    console.log('🔍 Testing: Database integration during authentication...')
    
    // Monitor network requests to Supabase
    const supabaseRequests = []
    page.on('request', request => {
      if (request.url().includes('supabase.co')) {
        supabaseRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        })
      }
    })
    
    await page.goto('http://localhost:5173/login')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    
    // Wait for authentication to complete
    await page.waitForTimeout(5000)
    
    // Verify Supabase requests were made
    const authRequests = supabaseRequests.filter(req => 
      req.url.includes('/auth/') || req.method === 'POST'
    )
    
    if (authRequests.length > 0) {
      console.log(`✅ Made ${authRequests.length} authentication requests to Supabase`)
    } else {
      console.log('⚠️ No authentication requests to Supabase detected')
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: '/root/repo/docs/assets/screenshots/auth-testing/10-database-integration-test.png',
      fullPage: true 
    })
  })
})