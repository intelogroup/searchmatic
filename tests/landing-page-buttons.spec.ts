import { test, expect } from '@playwright/test'
import { testButtonStates, checkTouchTargetSize, measureElementSize, setupPageErrorLogging } from './utils/buttonTestUtils'

/**
 * Landing Page Button Testing Suite
 * 
 * This test suite validates all interactive elements on the landing page:
 * - Navigation buttons
 * - Hero section CTAs
 * - Pricing plan buttons
 * - Footer links
 * - Final CTA section
 */

test.describe('Landing Page Button Testing', () => {
  test.beforeEach(async ({ page }) => {
    setupPageErrorLogging(page)
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

  test('should validate all buttons have proper accessibility attributes', async ({ page }) => {
    const allButtons = page.getByRole('button')
    const buttonCount = await allButtons.count()
    
    for (let i = 0; i < buttonCount; i++) {
      const button = allButtons.nth(i)
      
      // Check that button has accessible text
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      
      expect(
        text || ariaLabel,
        `Button ${i + 1} should have either text content or aria-label`
      ).toBeTruthy()
      
      // Check touch target size
      await checkTouchTargetSize(button, `Button ${i + 1}`)
    }
  })

  test('should test button keyboard navigation', async ({ page }) => {
    // Test tab navigation through buttons
    const firstButton = page.getByRole('button').first()
    await firstButton.focus()
    
    // Press Tab to navigate through buttons
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)
      
      // Check if focus is on an interactive element
      const focusedElement = page.locator(':focus')
      const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase())
      const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(tagName)
      
      if (isInteractive) {
        await expect(focusedElement, `Focused element should be visible`).toBeVisible()
      }
    }
  })

  test('should test button click responsiveness', async ({ page }) => {
    const testButtons = [
      page.getByRole('button', { name: /sign in/i }).first(),
      page.getByRole('button', { name: /start free trial/i }).first()
    ]
    
    for (const button of testButtons) {
      const startTime = Date.now()
      await button.click()
      const clickTime = Date.now() - startTime
      
      // Button should respond within reasonable time (500ms)
      expect(clickTime, 'Button should respond quickly to clicks').toBeLessThan(500)
      
      // Navigate back to test next button
      if (page.url().includes('/login')) {
        await page.goto('/')
      }
    }
  })
})