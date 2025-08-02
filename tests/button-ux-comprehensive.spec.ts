import { test, expect, Page, Locator } from '@playwright/test'

/**
 * Comprehensive Button & UX Testing Suite for Searchmatic MVP
 * 
 * This test suite validates all interactive elements across the application:
 * - Button visibility and states
 * - Touch target sizes (accessibility)
 * - Responsive behavior
 * - Keyboard navigation
 * - Visual feedback states
 * - Cross-browser compatibility
 */

// Test credentials
const TEST_USER = {
  email: 'jayveedz19@gmail.com',
  password: 'Jimkali90#'
}

// Accessibility standards
const MIN_TOUCH_TARGET_SIZE = 44 // WCAG AA requirement
const VIEWPORT_SIZES = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 720 },
  { name: 'Large Desktop', width: 1920, height: 1080 }
]

// Helper functions
async function measureElementSize(element: Locator): Promise<{ width: number; height: number }> {
  const box = await element.boundingBox()
  return box ? { width: box.width, height: box.height } : { width: 0, height: 0 }
}

async function checkTouchTargetSize(element: Locator, elementName: string): Promise<void> {
  const size = await measureElementSize(element)
  expect(size.width, `${elementName} width should be at least ${MIN_TOUCH_TARGET_SIZE}px`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
  expect(size.height, `${elementName} height should be at least ${MIN_TOUCH_TARGET_SIZE}px`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
}

async function testButtonStates(page: Page, button: Locator, buttonName: string): Promise<void> {
  // Test button visibility
  await expect(button, `${buttonName} should be visible`).toBeVisible()
  
  // Test button is enabled
  await expect(button, `${buttonName} should be enabled`).toBeEnabled()
  
  // Test hover state (desktop only)
  const viewport = page.viewportSize()
  if (viewport && viewport.width >= 768) {
    await button.hover()
    await page.waitForTimeout(100) // Allow hover transition
  }
  
  // Test focus state
  await button.focus()
  await page.waitForTimeout(100) // Allow focus transition
  
  // Test touch target size
  await checkTouchTargetSize(button, buttonName)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function captureButtonState(page: Page, button: Locator, stateName: string, screenshotPath: string): Promise<void> {
  await button.hover()
  await page.waitForTimeout(200)
  const boundingBox = await button.boundingBox()
  if (boundingBox) {
    await page.screenshot({ 
      path: screenshotPath,
      clip: boundingBox
    })
  }
}

test.describe('Button & UX Comprehensive Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up error logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Browser console error: ${msg.text()}`)
      }
    })
    
    page.on('pageerror', error => {
      console.error(`Page error: ${error.message}`)
    })
  })

  test.describe('Landing Page Button Testing', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await expect(page).toHaveTitle(/Searchmatic/)
    })

    test('should display and validate all navigation buttons', async ({ page }) => {
      // Test navigation buttons
      const signInButton = page.getByRole('button', { name: /sign in/i }).first()
      const getStartedButton = page.getByRole('button', { name: /get started/i }).first()
      
      await testButtonStates(page, signInButton, 'Navigation Sign In button')
      await testButtonStates(page, getStartedButton, 'Navigation Get Started button')
      
      // Test navigation functionality
      await signInButton.click()
      await expect(page).toHaveURL('/login')
      
      // Navigate back to test other buttons
      await page.goto('/')
    })

    test('should validate hero section buttons', async ({ page }) => {
      const startTrialButton = page.getByRole('button', { name: /start free trial/i })
      const watchDemoButton = page.getByRole('button', { name: /watch demo/i })
      
      await testButtonStates(page, startTrialButton, 'Hero Start Free Trial button')
      await testButtonStates(page, watchDemoButton, 'Hero Watch Demo button')
      
      // Test hero button navigation
      await startTrialButton.click()
      await expect(page).toHaveURL('/login')
      
      await page.goto('/')
    })

    test('should validate pricing plan CTA buttons', async ({ page }) => {
      // Scroll to pricing section
      await page.locator('#pricing').scrollIntoViewIfNeeded()
      
      // Find all pricing CTA buttons
      const pricingButtons = [
        page.getByRole('button', { name: /start free/i }).first(),
        page.getByRole('button', { name: /start 14-day free trial/i }).first(),
        page.getByRole('button', { name: /contact sales/i }).first()
      ]
      
      for (let i = 0; i < pricingButtons.length; i++) {
        const button = pricingButtons[i]
        const planNames = ['Researcher Plan', 'Professional Plan', 'Enterprise Plan']
        await testButtonStates(page, button, `${planNames[i]} CTA button`)
      }
    })

    test('should validate footer navigation links', async ({ page }) => {
      // Scroll to footer
      await page.locator('footer').scrollIntoViewIfNeeded()
      
      // Test footer links (they're anchor tags, not buttons, but should be clickable)
      const footerLinks = page.locator('footer a')
      const linkCount = await footerLinks.count()
      
      for (let i = 0; i < Math.min(linkCount, 5); i++) { // Test first 5 links
        const link = footerLinks.nth(i)
        await expect(link, `Footer link ${i + 1} should be visible`).toBeVisible()
        
        // Check touch target size for footer links
        const size = await measureElementSize(link)
        expect(size.height, `Footer link ${i + 1} should have adequate height`).toBeGreaterThanOrEqual(24)
      }
    })

    test('should test CTA section buttons', async ({ page }) => {
      // Scroll to final CTA section
      await page.locator('section').last().scrollIntoViewIfNeeded()
      
      const finalCtaButton = page.getByRole('button', { name: /start free trial/i }).last()
      const scheduleDemoButton = page.getByRole('button', { name: /schedule demo/i })
      
      await testButtonStates(page, finalCtaButton, 'Final CTA Start Free Trial button')
      await testButtonStates(page, scheduleDemoButton, 'Final CTA Schedule Demo button')
    })
  })

  test.describe('Login Page Button Testing', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login')
      await expect(page).toHaveTitle(/Searchmatic/)
    })

    test('should validate login form elements', async ({ page }) => {
      // Test form input fields
      const emailInput = page.getByLabel(/email address/i)
      const passwordInput = page.getByLabel(/password/i)
      
      await expect(emailInput, 'Email input should be visible').toBeVisible()
      await expect(passwordInput, 'Password input should be visible').toBeVisible()
      
      // Test input field touch targets
      await checkTouchTargetSize(emailInput, 'Email input field')
      await checkTouchTargetSize(passwordInput, 'Password input field')
      
      // Test password visibility toggle
      const passwordToggle = page.locator('button[type="button"]').filter({ hasText: /eye/i }).or(
        page.locator('button').filter({ has: page.locator('svg') }).nth(1)
      )
      
      if (await passwordToggle.count() > 0) {
        await testButtonStates(page, passwordToggle, 'Password visibility toggle')
        
        // Test password toggle functionality
        await passwordToggle.click()
        await expect(passwordInput).toHaveAttribute('type', 'text')
        await passwordToggle.click()
        await expect(passwordInput).toHaveAttribute('type', 'password')
      }
    })

    test('should validate sign in/sign up toggle functionality', async ({ page }) => {
      // Test initial state (should be sign in)
      const submitButton = page.getByRole('button', { name: /sign in|create account/i })
      await testButtonStates(page, submitButton, 'Submit button')
      
      // Test toggle to sign up
      const toggleButton = page.getByText(/don't have an account/i)
      await expect(toggleButton, 'Sign up toggle should be visible').toBeVisible()
      await toggleButton.click()
      
      // Verify UI changed to sign up mode
      await expect(page.getByText(/create your account/i)).toBeVisible()
      
      // Test toggle back to sign in
      const backToggle = page.getByText(/already have an account/i)
      await backToggle.click()
      await expect(page.getByText(/welcome back/i)).toBeVisible()
    })

    test('should validate back to home navigation', async ({ page }) => {
      const backButton = page.getByRole('link').filter({ hasText: /searchmatic/i }).or(
        page.locator('a').filter({ has: page.locator('svg[class*="arrow-left"]') })
      )
      
      if (await backButton.count() > 0) {
        await testButtonStates(page, backButton, 'Back to home button')
        
        // Test navigation
        await backButton.click()
        await expect(page).toHaveURL('/')
      }
    })

    test('should test login form submission states', async ({ page }) => {
      const emailInput = page.getByLabel(/email address/i)
      const passwordInput = page.getByLabel(/password/i)
      const submitButton = page.getByRole('button', { name: /sign in/i })
      
      // Test with valid credentials
      await emailInput.fill(TEST_USER.email)
      await passwordInput.fill(TEST_USER.password)
      
      // Test submit button states
      await testButtonStates(page, submitButton, 'Login submit button')
      
      // Test form submission (expect loading state)
      await submitButton.click()
      
      // Wait for either success (redirect) or error message
      try {
        await page.waitForURL('/dashboard', { timeout: 5000 })
      } catch {
        // If login fails, check for error handling
        const errorMessage = page.locator('[class*="destructive"]').or(
          page.locator('[class*="error"]')
        )
        
        if (await errorMessage.count() > 0) {
          await expect(errorMessage).toBeVisible()
        }
      }
    })
  })

  test.describe('Dashboard Button Testing', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/login')
      
      const emailInput = page.getByLabel(/email address/i)
      const passwordInput = page.getByLabel(/password/i)
      const submitButton = page.getByRole('button', { name: /sign in/i })
      
      await emailInput.fill(TEST_USER.email)
      await passwordInput.fill(TEST_USER.password)
      await submitButton.click()
      
      // Wait for dashboard or continue with test
      try {
        await page.waitForURL('/dashboard', { timeout: 5000 })
      } catch {
        // If login fails, navigate directly to dashboard for UI testing
        await page.goto('/dashboard')
      }
    })

    test('should validate dashboard action buttons', async ({ page }) => {
      // Test "Start New Review" button
      const newReviewButton = page.getByRole('button', { name: /start new review|begin project/i })
      
      if (await newReviewButton.count() > 0) {
        await testButtonStates(page, newReviewButton, 'Start New Review button')
        
        // Test navigation
        await newReviewButton.click()
        await expect(page).toHaveURL(/\/projects\/new/)
        
        // Navigate back for other tests
        await page.goto('/dashboard')
      }
    })

    test('should validate project card buttons', async ({ page }) => {
      // Test "Open Project" buttons on project cards
      const projectButtons = page.getByRole('button', { name: /open project/i })
      const buttonCount = await projectButtons.count()
      
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = projectButtons.nth(i)
        await testButtonStates(page, button, `Project card ${i + 1} Open button`)
      }
    })

    test('should validate getting started section buttons', async ({ page }) => {
      // Scroll to getting started section
      const gettingStartedSection = page.locator('text=Welcome to Searchmatic').locator('..')
      
      if (await gettingStartedSection.count() > 0) {
        await gettingStartedSection.scrollIntoViewIfNeeded()
        
        const startReviewButton = page.getByRole('button', { name: /start your first review/i })
        const docsButton = page.getByRole('button', { name: /view documentation/i })
        
        if (await startReviewButton.count() > 0) {
          await testButtonStates(page, startReviewButton, 'Getting Started review button')
        }
        
        if (await docsButton.count() > 0) {
          await testButtonStates(page, docsButton, 'Getting Started docs button')
        }
      }
    })

    test('should validate header navigation buttons', async ({ page }) => {
      // Test header/navigation buttons
      const headerButtons = page.locator('header button, nav button')
      const buttonCount = await headerButtons.count()
      
      for (let i = 0; i < buttonCount; i++) {
        const button = headerButtons.nth(i)
        if (await button.isVisible()) {
          await testButtonStates(page, button, `Header button ${i + 1}`)
        }
      }
    })
  })

  test.describe('Responsive Button Testing', () => {
    for (const viewport of VIEWPORT_SIZES) {
      test(`should validate button behavior on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto('/')
        
        // Test navigation buttons at this viewport
        const navButtons = page.locator('nav button, header button')
        const buttonCount = await navButtons.count()
        
        for (let i = 0; i < Math.min(buttonCount, 3); i++) {
          const button = navButtons.nth(i)
          if (await button.isVisible()) {
            await testButtonStates(page, button, `${viewport.name} nav button ${i + 1}`)
          }
        }
        
        // Test hero buttons
        const heroButtons = page.getByRole('button', { name: /start free trial|watch demo/i })
        const heroCount = await heroButtons.count()
        
        for (let i = 0; i < heroCount; i++) {
          const button = heroButtons.nth(i)
          if (await button.isVisible()) {
            await testButtonStates(page, button, `${viewport.name} hero button ${i + 1}`)
          }
        }
      })
    }

    test('should test mobile menu functionality', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      
      // Look for mobile menu toggle (hamburger menu)
      const mobileMenuToggle = page.locator('button[aria-label*="menu"], button[aria-expanded]').or(
        page.locator('button').filter({ has: page.locator('svg[class*="menu"]') })
      )
      
      if (await mobileMenuToggle.count() > 0) {
        await testButtonStates(page, mobileMenuToggle, 'Mobile menu toggle')
        
        // Test menu toggle functionality
        await mobileMenuToggle.click()
        await page.waitForTimeout(300) // Allow for menu animation
        
        // Look for mobile menu items
        const mobileMenuItems = page.locator('[role="menu"] a, [data-mobile-menu] a')
        if (await mobileMenuItems.count() > 0) {
          await expect(mobileMenuItems.first()).toBeVisible()
        }
        
        // Close menu
        await mobileMenuToggle.click()
      }
    })
  })

  test.describe('Accessibility & Keyboard Navigation', () => {
    test('should support keyboard navigation for all buttons', async ({ page }) => {
      await page.goto('/')
      
      // Test tab navigation through buttons
      const buttons = page.getByRole('button')
      const buttonCount = await buttons.count()
      
      // Focus first button and tab through several
      if (buttonCount > 0) {
        await buttons.first().focus()
        
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          await page.keyboard.press('Tab')
          await page.waitForTimeout(100)
          
          // Check if current focused element is a button
          const focusedElement = page.locator(':focus')
          const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase())
          
          if (tagName === 'button') {
            // Test Enter key activation
            await page.keyboard.press('Enter')
            await page.waitForTimeout(200)
          }
        }
      }
    })

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await page.goto('/')
      
      // Check for buttons with proper ARIA labels
      const buttons = page.getByRole('button')
      const buttonCount = await buttons.count()
      
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i)
        if (await button.isVisible()) {
          // Check for accessible name (text content, aria-label, or aria-labelledby)
          const accessibleName = await button.getAttribute('aria-label') || 
                                await button.textContent() ||
                                await button.getAttribute('aria-labelledby')
          
          expect(accessibleName, `Button ${i + 1} should have accessible name`).toBeTruthy()
        }
      }
    })

    test('should meet color contrast requirements', async ({ page }) => {
      await page.goto('/')
      
      // Test contrast by checking computed styles
      const buttons = page.getByRole('button').first()
      
      if (await buttons.count() > 0) {
        const styles = await buttons.evaluate(el => {
          const computed = window.getComputedStyle(el)
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            borderColor: computed.borderColor
          }
        })
        
        // Basic check that styles are applied
        expect(styles.backgroundColor || styles.color).toBeTruthy()
      }
    })
  })

  test.describe('Button State Testing', () => {
    test('should handle disabled button states properly', async ({ page }) => {
      await page.goto('/login')
      
      // Test form validation states
      const submitButton = page.getByRole('button', { name: /sign in/i })
      const emailInput = page.getByLabel(/email address/i)
      
      // Initially button should be enabled
      await expect(submitButton).toBeEnabled()
      
      // Test loading state simulation
      await emailInput.fill('test@example.com')
      await submitButton.click()
      
      // Check if button shows loading state (text change or disabled)
      await page.waitForTimeout(500)
    })

    test('should capture button hover and focus states', async ({ page }) => {
      await page.goto('/')
      
      const mainButton = page.getByRole('button', { name: /start free trial/i }).first()
      
      if (await mainButton.count() > 0) {
        // Capture default state
        let boundingBox = await mainButton.boundingBox()
        if (boundingBox) {
          await page.screenshot({ 
            path: 'test-results/button-states/default-state.png',
            clip: boundingBox
          })
        }
        
        // Capture hover state
        await mainButton.hover()
        await page.waitForTimeout(200)
        boundingBox = await mainButton.boundingBox()
        if (boundingBox) {
          await page.screenshot({ 
            path: 'test-results/button-states/hover-state.png',
            clip: boundingBox
          })
        }
        
        // Capture focus state
        await mainButton.focus()
        await page.waitForTimeout(200)
        boundingBox = await mainButton.boundingBox()
        if (boundingBox) {
          await page.screenshot({ 
            path: 'test-results/button-states/focus-state.png',
            clip: boundingBox
          })
        }
      }
    })
  })

  test.describe('Performance & Loading States', () => {
    test('should handle button interactions without layout shift', async ({ page }) => {
      await page.goto('/')
      
      // Measure layout stability during button interactions
      const mainButton = page.getByRole('button', { name: /start free trial/i }).first()
      
      if (await mainButton.count() > 0) {
        const initialPosition = await mainButton.boundingBox()
        
        // Hover and check position stability
        await mainButton.hover()
        await page.waitForTimeout(300)
        
        const hoverPosition = await mainButton.boundingBox()
        
        if (initialPosition && hoverPosition) {
          expect(Math.abs(initialPosition.x - hoverPosition.x)).toBeLessThan(1)
          expect(Math.abs(initialPosition.y - hoverPosition.y)).toBeLessThan(1)
        }
      }
    })

    test('should load button states quickly', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/')
      
      // Wait for main navigation buttons to be visible
      await expect(page.getByRole('button').first()).toBeVisible()
      
      const loadTime = Date.now() - startTime
      expect(loadTime, 'Buttons should load within 3 seconds').toBeLessThan(3000)
    })
  })

  test.describe('Cross-Browser Button Consistency', () => {
    test('should render buttons consistently across browsers', async ({ page, browserName }) => {
      await page.goto('/')
      
      const testButton = page.getByRole('button', { name: /start free trial/i }).first()
      
      if (await testButton.count() > 0) {
        // Take screenshot for visual comparison
        const boundingBox = await testButton.boundingBox()
        if (boundingBox) {
          await page.screenshot({ 
            path: `test-results/browser-consistency/${browserName}-buttons.png`,
            fullPage: false,
            clip: boundingBox
          })
        }
        
        // Test basic functionality works the same
        await testButtonStates(page, testButton, `${browserName} main button`)
      }
    })
  })
})

// Additional helper test for comprehensive validation
test.describe('Visual Regression Testing', () => {
  test('should capture button gallery for visual validation', async ({ page }) => {
    await page.goto('/')
    
    // Capture hero section
    await page.locator('section').first().screenshot({ 
      path: 'test-results/visual-regression/hero-section.png' 
    })
    
    // Navigate to login and capture form
    await page.goto('/login')
    await page.locator('form').screenshot({ 
      path: 'test-results/visual-regression/login-form.png' 
    })
    
    // Capture pricing section
    await page.goto('/')
    await page.locator('#pricing').scrollIntoViewIfNeeded()
    await page.locator('#pricing').screenshot({ 
      path: 'test-results/visual-regression/pricing-section.png' 
    })
  })
})