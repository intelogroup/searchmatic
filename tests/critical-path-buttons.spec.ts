import { test, expect, Page, Locator } from '@playwright/test'

/**
 * Critical Path Button Testing Suite
 * 
 * This test suite validates the most critical interactive elements for production:
 * - Primary navigation buttons
 * - Hero section CTAs
 * - Key pricing buttons
 * - Essential user journey buttons
 */

// Accessibility standards - current app standard
const MIN_TOUCH_TARGET_SIZE = 40
const RECOMMENDED_TOUCH_TARGET_SIZE = 44

// Helper functions
async function measureElementSize(element: Locator): Promise<{ width: number; height: number }> {
  const box = await element.boundingBox()
  return box ? { width: box.width, height: box.height } : { width: 0, height: 0 }
}

async function validateButtonAccessibility(element: Locator, elementName: string): Promise<void> {
  const size = await measureElementSize(element)
  
  // Ensure minimum touch target (fail test if below minimum)
  expect(size.width, `${elementName} width should be at least ${MIN_TOUCH_TARGET_SIZE}px`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
  expect(size.height, `${elementName} height should be at least ${MIN_TOUCH_TARGET_SIZE}px`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
  
  // Warn if below recommended size (log but don't fail)
  if (size.width < RECOMMENDED_TOUCH_TARGET_SIZE || size.height < RECOMMENDED_TOUCH_TARGET_SIZE) {
    console.warn(`⚠️ ${elementName} (${size.width}x${size.height}px) is below WCAG AA recommended size of ${RECOMMENDED_TOUCH_TARGET_SIZE}px`)
  }
}

async function testBasicButtonFunctionality(page: Page, button: Locator, buttonName: string): Promise<void> {
  // Test button visibility
  await expect(button, `${buttonName} should be visible`).toBeVisible()
  
  // Test button is enabled
  await expect(button, `${buttonName} should be enabled`).toBeEnabled()
  
  // Test accessibility
  await validateButtonAccessibility(button, buttonName)
  
  // Test hover state (desktop only)
  const viewport = page.viewportSize()
  if (viewport && viewport.width >= 768) {
    await button.hover()
    await page.waitForTimeout(100)
  }
  
  // Test focus state
  await button.focus()
  await page.waitForTimeout(100)
}

test.describe('Landing Page Critical Buttons', () => {
  test.beforeEach(async ({ page }) => {
    // Enhanced error logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`🔴 Browser Error: ${msg.text()}`)
      }
    })
    
    page.on('pageerror', error => {
      console.error(`🔴 Page Error: ${error.message}`)
    })
    
    await page.goto('/')
    await expect(page).toHaveTitle(/Searchmatic/)
  })

  test('should validate primary navigation buttons', async ({ page }) => {
    console.log('🧪 Testing primary navigation buttons...')
    
    // Test Sign In button
    const signInButton = page.getByRole('button', { name: /sign in/i }).first()
    await testBasicButtonFunctionality(page, signInButton, 'Navigation Sign In')
    
    // Test Get Started button  
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first()
    await testBasicButtonFunctionality(page, getStartedButton, 'Navigation Get Started')
    
    // Test navigation functionality
    console.log('🔗 Testing button navigation...')
    await signInButton.click()
    await expect(page).toHaveURL('/login')
    
    console.log('✅ Navigation buttons working correctly')
  })

  test('should validate hero section call-to-action buttons', async ({ page }) => {
    console.log('🧪 Testing hero section CTAs...')
    
    // Test Start Free Trial button
    const startTrialButton = page.getByRole('button', { name: /start free trial/i }).first()
    await testBasicButtonFunctionality(page, startTrialButton, 'Hero Start Free Trial')
    
    // Test Watch Demo button
    const watchDemoButton = page.getByRole('button', { name: /watch demo/i }).first()
    await testBasicButtonFunctionality(page, watchDemoButton, 'Hero Watch Demo')
    
    // Test functionality
    await startTrialButton.click()
    await expect(page).toHaveURL('/login')
    
    console.log('✅ Hero CTAs working correctly')
  })

  test('should validate pricing tier buttons', async ({ page }) => {
    console.log('🧪 Testing pricing tier buttons...')
    
    // Scroll to pricing section
    await page.locator('#pricing').scrollIntoViewIfNeeded()
    
    // Test key pricing buttons (at least the free tier)
    const pricingButtons = [
      page.getByRole('button', { name: /start free/i }).first(),
      page.getByRole('button', { name: /free trial/i }).first()
    ]
    
    for (const button of pricingButtons) {
      const buttonCount = await button.count()
      if (buttonCount > 0) {
        await testBasicButtonFunctionality(page, button, 'Pricing CTA')
        
        // Test functionality
        await button.click()
        await expect(page).toHaveURL('/login')
        
        // Return to pricing to test next button
        await page.goto('/')
        await page.locator('#pricing').scrollIntoViewIfNeeded()
      }
    }
    
    console.log('✅ Pricing buttons working correctly')
  })

  test('should test critical button performance', async ({ page }) => {
    console.log('🧪 Testing button response times...')
    
    const criticalButtons = [
      page.getByRole('button', { name: /sign in/i }).first(),
      page.getByRole('button', { name: /start free trial/i }).first()
    ]
    
    for (const button of criticalButtons) {
      if (await button.count() > 0) {
        const startTime = Date.now()
        await button.click()
        const responseTime = Date.now() - startTime
        
        // Button should respond within 300ms for good UX
        expect(responseTime, 'Button should respond quickly').toBeLessThan(300)
        
        console.log(`✅ Button responded in ${responseTime}ms`)
        
        // Navigate back
        if (page.url().includes('/login')) {
          await page.goto('/')
        }
      }
    }
  })

  test('should validate button accessibility features', async ({ page }) => {
    console.log('🧪 Testing button accessibility...')
    
    const allButtons = page.getByRole('button')
    const buttonCount = await allButtons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = allButtons.nth(i)
      
      if (await button.isVisible()) {
        // Check accessible name
        const text = await button.textContent()
        const ariaLabel = await button.getAttribute('aria-label')
        const accessibleName = text || ariaLabel
        
        expect(accessibleName?.trim(), `Button ${i + 1} should have accessible name`).toBeTruthy()
        
        // Check keyboard navigation
        await button.focus()
        await expect(button, `Button ${i + 1} should be focusable`).toBeFocused()
        
        // Test Enter key activation
        await page.keyboard.press('Enter')
        await page.waitForTimeout(100)
      }
    }
    
    console.log('✅ Button accessibility validated')
  })

  test('should validate mobile button interactions', async ({ page }) => {
    console.log('🧪 Testing mobile button behavior...')
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    
    const mobileButtons = page.getByRole('button')
    const buttonCount = await mobileButtons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = mobileButtons.nth(i)
      
      if (await button.isVisible()) {
        // Test tap interaction
        await button.tap()
        await page.waitForTimeout(100)
        
        // Validate touch target size for mobile
        await validateButtonAccessibility(button, `Mobile button ${i + 1}`)
      }
    }
    
    console.log('✅ Mobile button interactions validated')
  })
})

test.describe('Critical User Journey Buttons', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`🔴 Browser Error: ${msg.text()}`)
      }
    })
    
    page.on('pageerror', error => {
      console.error(`🔴 Page Error: ${error.message}`)
    })
  })

  test('should test complete signup flow buttons', async ({ page }) => {
    console.log('🧪 Testing complete signup flow...')
    
    // Start from landing page
    await page.goto('/')
    
    // Click main CTA
    const mainCTA = page.getByRole('button', { name: /start free trial|get started/i }).first()
    await testBasicButtonFunctionality(page, mainCTA, 'Main CTA')
    await mainCTA.click()
    
    // Should reach login page
    await expect(page).toHaveURL('/login')
    
    // Test signup mode toggle
    const signupToggle = page.getByText(/don't have an account/i)
    if (await signupToggle.count() > 0) {
      await signupToggle.click()
      await expect(page.getByText(/create/i)).toBeVisible()
    }
    
    console.log('✅ Signup flow buttons working correctly')
  })

  test('should validate error recovery buttons', async ({ page }) => {
    console.log('🧪 Testing error recovery buttons...')
    
    await page.goto('/login')
    
    // Test invalid login to trigger error states
    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)
    const submitButton = page.getByRole('button', { name: /sign in/i })
    
    await emailInput.fill('invalid@test.com')
    await passwordInput.fill('wrongpassword')
    
    await testBasicButtonFunctionality(page, submitButton, 'Login submit button')
    await submitButton.click()
    
    // Wait for error handling
    await page.waitForTimeout(1000)
    
    // Button should remain functional after error
    await expect(submitButton).toBeEnabled()
    
    console.log('✅ Error recovery buttons working correctly')
  })
})