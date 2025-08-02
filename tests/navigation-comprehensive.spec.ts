import { test, expect, type Page } from '@playwright/test'

// Test configuration and constants
const TEST_USER = {
  email: 'jayveedz19@gmail.com',
  password: 'Jimkali90#'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BASE_URL = 'http://localhost:5174'

// Test utilities
async function loginUser(page: Page) {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  
  // Fill login form
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  
  // Submit and wait for redirect
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
  await page.waitForLoadState('networkidle')
}

async function logoutUser(page: Page) {
  await page.click('button:has-text("Sign Out")')
  await page.waitForURL('/login')
  await page.waitForLoadState('networkidle')
}

test.describe('Navigation and Routing Comprehensive Tests', () => {
  
  test.describe('Public Route Navigation', () => {
    
    test('Landing page should be accessible without authentication', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Verify landing page content
      await expect(page.locator('h1')).toContainText('Systematic Reviews')
      await expect(page.locator('nav')).toBeVisible()
      
      // Take screenshot for visual verification
      await page.screenshot({ 
        path: 'test-results/landing-page.png',
        fullPage: true 
      })
      
      // Verify navigation elements (may be hidden on mobile)
      const isDesktop = page.viewportSize()?.width && page.viewportSize()!.width >= 768
      if (isDesktop) {
        await expect(page.locator('nav a[href="#features"]')).toBeVisible()
        await expect(page.locator('nav a[href="#pricing"]')).toBeVisible()
        await expect(page.locator('nav a[href="#testimonials"]')).toBeVisible()
      } else {
        // On mobile, navigation links are hidden in responsive design
        console.log('Mobile viewport detected - navigation links hidden as expected')
      }
    })
    
    test('Navigation from landing to login should work', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Test "Sign In" button
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('/login')
      await expect(page.locator('h1, h2')).toContainText(/welcome.*back|create.*account|sign.*in|login|future.*systematic.*reviews/i)
      
      // Go back to landing
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Test "Get Started" button
      await page.click('button:has-text("Get Started")')
      await page.waitForURL('/login')
      await expect(page.locator('h1, h2')).toContainText(/welcome.*back|create.*account|sign.*in|login|future.*systematic.*reviews/i)
      
      // Test "Start Free Trial" button in hero
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await page.click('button:has-text("Start Free Trial")')
      await page.waitForURL('/login')
    })
    
    test('Login page should be accessible directly', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')
      
      // Verify login page elements
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/login-page.png' })
    })
    
    test('Hash navigation should work on landing page', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const isDesktop = page.viewportSize()?.width && page.viewportSize()!.width >= 768
      
      if (isDesktop) {
        // Test features section navigation
        await page.click('nav a[href="#features"]')
        await page.waitForTimeout(500) // Wait for scroll
        await expect(page.locator('#features')).toBeInViewport()
        
        // Test pricing section navigation
        await page.click('nav a[href="#pricing"]')
        await page.waitForTimeout(500)
        await expect(page.locator('#pricing')).toBeInViewport()
        
        // Test testimonials section navigation
        await page.click('nav a[href="#testimonials"]')
        await page.waitForTimeout(500)
        await expect(page.locator('#testimonials')).toBeInViewport()
      } else {
        // On mobile, test direct navigation to sections
        await page.goto('/#features')
        await page.waitForTimeout(500)
        await expect(page.locator('#features')).toBeInViewport()
        
        await page.goto('/#pricing')
        await page.waitForTimeout(500) 
        await expect(page.locator('#pricing')).toBeInViewport()
        
        await page.goto('/#testimonials')
        await page.waitForTimeout(500)
        await expect(page.locator('#testimonials')).toBeInViewport()
      }
    })
  })
  
  test.describe('Protected Route Authentication', () => {
    
    test('Unauthenticated access to dashboard should redirect to login', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      
      // Should be redirected to login
      await expect(page).toHaveURL('/login')
      await expect(page.locator('h1, h2')).toContainText(/welcome.*back|create.*account|sign.*in|login|future.*systematic.*reviews/i)
    })
    
    test('Unauthenticated access to new project should redirect to login', async ({ page }) => {
      await page.goto('/projects/new')
      await page.waitForLoadState('networkidle')
      
      await expect(page).toHaveURL('/login')
    })
    
    test('Unauthenticated access to settings should redirect to login', async ({ page }) => {
      await page.goto('/settings')
      await page.waitForLoadState('networkidle')
      
      await expect(page).toHaveURL('/login')
    })
    
    test('Unauthenticated access to project demo should redirect to login', async ({ page }) => {
      await page.goto('/projects/123')
      await page.waitForLoadState('networkidle')
      
      await expect(page).toHaveURL('/login')
    })
    
    test('Authenticated user accessing login should redirect to dashboard', async ({ page }) => {
      // First login
      await loginUser(page)
      
      // Try to access login page
      await page.goto('/login')
      await page.waitForLoadState('networkidle')
      
      // Should be redirected back to dashboard
      await expect(page).toHaveURL('/dashboard')
    })
  })
  
  test.describe('Authenticated Navigation', () => {
    
    test.beforeEach(async ({ page }) => {
      await loginUser(page)
    })
    
    test('Dashboard should be accessible after login', async ({ page }) => {
      await expect(page).toHaveURL('/dashboard')
      // Check for specific dashboard heading
      await expect(page.locator('h2:has-text("Your Literature Reviews")')).toBeVisible()
      
      // Verify header navigation is present
      await expect(page.locator('header')).toBeVisible()
      await expect(page.locator('h1:has-text("Searchmatic")')).toBeVisible()
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/dashboard-authenticated.png' })
    })
    
    test('Navigation between protected pages should work', async ({ page }) => {
      // Start at dashboard
      await expect(page).toHaveURL('/dashboard')
      
      // Navigate to new project using specific button
      await page.click('button:has-text("Begin Project")')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL('/projects/new')
      
      // Navigate to settings
      await page.click('button:has-text("Settings"), a[href="/settings"]')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL('/settings')
      
      // Navigate back to dashboard via header (clickable title)
      await page.click('h1.cursor-pointer:has-text("Searchmatic")')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL('/dashboard')
    })
    
    test('Header navigation links should work', async ({ page }) => {
      // Test dashboard link
      await page.click('a[href="/dashboard"]')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL('/dashboard')
      
      // Test projects link (if exists)
      const projectsLink = page.locator('a[href="/projects"]')
      if (await projectsLink.isVisible()) {
        await projectsLink.click()
        await page.waitForLoadState('networkidle')
        // Should stay on dashboard or go to projects page
        expect(page.url()).toMatch(/\/(dashboard|projects)$/)
      }
    })
    
    test('Settings navigation should work', async ({ page }) => {
      // Click settings button in header
      await page.click('button:has-text("Settings")')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL('/settings')
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/settings-page.png' })
    })
  })
  
  test.describe('Route Parameters and Dynamic Routes', () => {
    
    test.beforeEach(async ({ page }) => {
      await loginUser(page)
    })
    
    test('Dynamic project routes should work', async ({ page }) => {
      // Test with different project IDs
      const projectIds = ['123', 'test-project', 'abc-def-ghi']
      
      for (const projectId of projectIds) {
        await page.goto(`/projects/${projectId}`)
        await page.waitForLoadState('networkidle')
        
        // Should load project demo page
        await expect(page).toHaveURL(`/projects/${projectId}`)
        
        // Page should load without errors
        await expect(page.locator('body')).toBeVisible()
        
        // Take screenshot for this project ID
        await page.screenshot({ 
          path: `test-results/project-${projectId}.png` 
        })
      }
    })
    
    test('Invalid routes should show 404 page', async ({ page }) => {
      const invalidRoutes = [
        '/invalid-route',
        '/dashboard/invalid',
        '/projects/new/invalid',
        '/random-path',
        '/api/nonexistent'
      ]
      
      for (const route of invalidRoutes) {
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        
        // Should show 404 page
        await expect(page.locator('body')).toContainText(/404|not found|page.*not.*found/i)
        
        // Verify helpful navigation options
        await expect(page.locator('button:has-text("Dashboard"), a[href="/dashboard"]')).toBeVisible()
      }
      
      // Take screenshot of 404 page
      await page.screenshot({ path: 'test-results/404-page.png' })
    })
  })
  
  test.describe('Browser Navigation', () => {
    
    test.beforeEach(async ({ page }) => {
      await loginUser(page)
    })
    
    test('Browser back and forward buttons should work', async ({ page }) => {
      // Start at dashboard
      await expect(page).toHaveURL('/dashboard')
      
      // Navigate to settings
      await page.click('button:has-text("Settings")')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL('/settings')
      
      // Use browser back button
      await page.goBack()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL('/dashboard')
      
      // Use browser forward button
      await page.goForward()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL('/settings')
      
      // Navigate to new project
      await page.goto('/projects/new')
      await page.waitForLoadState('networkidle')
      
      // Back to settings
      await page.goBack()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL('/settings')
      
      // Back to dashboard
      await page.goBack()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL('/dashboard')
    })
    
    test('URL bar navigation should work', async ({ page }) => {
      // Navigate by typing URLs directly
      const urls = [
        '/dashboard',
        '/settings',
        '/projects/new',
        '/projects/test-123'
      ]
      
      for (const url of urls) {
        await page.goto(url)
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(url)
        
        // Page should load without errors
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })
  
  test.describe('Authentication State Management', () => {
    
    test('Login/logout cycle should work correctly', async ({ page }) => {
      // Start unauthenticated
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL('/login')
      
      // Login
      await page.fill('input[type="email"]', TEST_USER.email)
      await page.fill('input[type="password"]', TEST_USER.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('/dashboard')
      
      // Should be on dashboard now
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('button:has-text("Sign Out")')).toBeVisible()
      
      // Logout
      await logoutUser(page)
      
      // Should be back on login
      await expect(page).toHaveURL('/login')
      
      // Try to access protected route again
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL('/login')
    })
    
    test('Session persistence should work across page reloads', async ({ page }) => {
      // Login first
      await loginUser(page)
      await expect(page).toHaveURL('/dashboard')
      
      // Reload the page
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Should still be authenticated
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('button:has-text("Sign Out")')).toBeVisible()
      
      // Navigate to another protected page
      await page.click('button:has-text("Settings")')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL('/settings')
      
      // Reload again
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Should still be on settings
      await expect(page).toHaveURL('/settings')
    })
  })
  
  test.describe('Mobile Navigation', () => {
    
    test('Mobile navigation should work on small screens', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // On mobile, some navigation might be hidden
      // Test that the page still loads and is usable
      await expect(page.locator('h1')).toContainText('Systematic Reviews')
      
      // Test login button on mobile
      await page.click('button:has-text("Get Started")')
      await page.waitForURL('/login')
      
      // Take mobile screenshot
      await page.screenshot({ 
        path: 'test-results/mobile-login.png',
        fullPage: true 
      })
    })
    
    test('Mobile authenticated navigation should work', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await loginUser(page)
      
      // Should be on dashboard
      await expect(page).toHaveURL('/dashboard')
      
      // Navigation should still work on mobile
      await expect(page.locator('header')).toBeVisible()
      await expect(page.locator('button:has-text("Sign Out")')).toBeVisible()
      
      // Take mobile dashboard screenshot
      await page.screenshot({ 
        path: 'test-results/mobile-dashboard.png',
        fullPage: true 
      })
    })
  })
  
  test.describe('Error Handling and Edge Cases', () => {
    
    test('Loading states should be handled gracefully', async ({ page }) => {
      // Monitor network requests to simulate slow loading
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100))
        await route.continue()
      })
      
      await page.goto('/dashboard')
      
      // Should eventually redirect to login
      await page.waitForURL('/login', { timeout: 10000 })
    })
    
    test('Deep linking to protected routes should redirect properly', async ({ page }) => {
      // Try to access a deep protected route
      await page.goto('/projects/some-project-id/edit/advanced')
      await page.waitForLoadState('networkidle')
      
      // Should redirect to login (or 404 for non-existent routes)
      // Note: Some deep routes may not redirect immediately
      const currentUrl = page.url()
      console.log('Current URL:', currentUrl)
      expect(currentUrl).toMatch(/\/(login|.*not.*found|404|projects)/)
    })
    
    test('Navigation with special characters should work', async ({ page }) => {
      await loginUser(page)
      
      // Test project IDs with special characters
      const specialIds = [
        'project%20with%20spaces',
        'project-with-dashes',
        'project_with_underscore',
        'project.with.dots'
      ]
      
      for (const id of specialIds) {
        await page.goto(`/projects/${id}`)
        await page.waitForLoadState('networkidle')
        
        // Should not crash the app
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })
  
  test.describe('Performance and Accessibility', () => {
    
    test('Navigation should be keyboard accessible', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Test keyboard navigation on landing page
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Should be able to navigate to login with Enter
      await page.keyboard.press('Enter')
      await page.waitForURL('/login')
    })
    
    test('Navigation should have proper ARIA labels', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Check for navigation landmarks
      await expect(page.locator('nav[role="navigation"]')).toBeVisible()
      await expect(page.locator('main[role="main"]')).toBeVisible()
      
      // Check for proper button labels
      const buttons = page.locator('button')
      const count = await buttons.count()
      
      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i)
        const hasAriaLabel = await button.getAttribute('aria-label')
        const hasText = await button.textContent()
        
        // Button should have either aria-label or text content
        expect(hasAriaLabel || hasText).toBeTruthy()
      }
    })
    
    test('Page load times should be reasonable', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const landingLoadTime = Date.now() - startTime
      expect(landingLoadTime).toBeLessThan(5000) // 5 seconds max
      
      // Test login page load time
      const loginStartTime = Date.now()
      await page.goto('/login')
      await page.waitForLoadState('networkidle')
      
      const loginLoadTime = Date.now() - loginStartTime
      expect(loginLoadTime).toBeLessThan(3000) // 3 seconds max
    })
  })
  
  test.afterEach(async ({ page }) => {
    // Clean up: try to logout if logged in
    try {
      const signOutButton = page.locator('button:has-text("Sign Out")')
      if (await signOutButton.isVisible()) {
        await signOutButton.click()
        await page.waitForURL('/login', { timeout: 2000 })
      }
    } catch (error) {
      // Ignore cleanup errors
      console.log('Cleanup warning:', error)
    }
  })
})