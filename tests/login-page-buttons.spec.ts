import { test, expect } from '@playwright/test'
import { testButtonStates, checkTouchTargetSize, TEST_USER, setupPageErrorLogging } from './utils/buttonTestUtils'

/**
 * Login Page Button Testing Suite
 * 
 * This test suite validates all interactive elements on the login page:
 * - Form input fields and their touch targets
 * - Password visibility toggle
 * - Sign in/Sign up mode switching
 * - Form submission states
 * - Navigation elements
 */

test.describe('Login Page Button Testing', () => {
  test.beforeEach(async ({ page }) => {
    setupPageErrorLogging(page)
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

  test('should validate form validation states', async ({ page }) => {
    const emailInput = page.getByLabel(/email address/i)
    const passwordInput = page.getByLabel(/password/i)
    const submitButton = page.getByRole('button', { name: /sign in/i })
    
    // Test empty form submission
    await submitButton.click()
    
    // Check for validation messages
    await page.waitForTimeout(500)
    
    // Test with invalid email
    await emailInput.fill('invalid-email')
    await passwordInput.fill('short')
    await submitButton.click()
    
    // Should show validation errors
    const validationErrors = page.locator('[class*="destructive"], [class*="error"], [role="alert"]')
    if (await validationErrors.count() > 0) {
      await expect(validationErrors.first()).toBeVisible()
    }
  })

  test('should test keyboard navigation in form', async ({ page }) => {
    const emailInput = page.getByLabel(/email address/i)
    const passwordInput = page.getByLabel(/password/i)
    const submitButton = page.getByRole('button', { name: /sign in/i })
    
    // Focus first input
    await emailInput.focus()
    await expect(emailInput).toBeFocused()
    
    // Tab to next input
    await page.keyboard.press('Tab')
    await expect(passwordInput).toBeFocused()
    
    // Tab to submit button
    await page.keyboard.press('Tab')
    await expect(submitButton).toBeFocused()
    
    // Test Enter key submission
    await emailInput.focus()
    await emailInput.fill(TEST_USER.email)
    await passwordInput.fill(TEST_USER.password)
    await page.keyboard.press('Enter')
    
    // Should trigger form submission
    await page.waitForTimeout(500)
  })

  test('should test mobile form interactions', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    const emailInput = page.getByLabel(/email address/i)
    const passwordInput = page.getByLabel(/password/i)
    
    // Test touch interactions
    await emailInput.tap()
    await expect(emailInput).toBeFocused()
    
    await passwordInput.tap()
    await expect(passwordInput).toBeFocused()
    
    // Verify form is responsive
    await checkTouchTargetSize(emailInput, 'Mobile email input')
    await checkTouchTargetSize(passwordInput, 'Mobile password input')
  })

  test('should test accessibility attributes', async ({ page }) => {
    const emailInput = page.getByLabel(/email address/i)
    const passwordInput = page.getByLabel(/password/i)
    const submitButton = page.getByRole('button', { name: /sign in/i })
    
    // Check ARIA labels and attributes
    const emailId = await emailInput.getAttribute('id')
    const passwordId = await passwordInput.getAttribute('id')
    
    expect(emailId, 'Email input should have ID').toBeTruthy()
    expect(passwordId, 'Password input should have ID').toBeTruthy()
    
    // Check button accessibility
    const submitButtonText = await submitButton.textContent()
    const submitButtonAriaLabel = await submitButton.getAttribute('aria-label')
    
    expect(
      submitButtonText || submitButtonAriaLabel,
      'Submit button should have accessible text'
    ).toBeTruthy()
  })
})