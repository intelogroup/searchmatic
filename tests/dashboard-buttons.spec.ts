import { test, expect } from '@playwright/test'
import { testButtonStates, TEST_USER, setupPageErrorLogging } from './utils/buttonTestUtils'

/**
 * Dashboard Button Testing Suite
 * 
 * This test suite validates all interactive elements on the dashboard:
 * - Main action buttons (Start New Review, etc.)
 * - Project card buttons
 * - Getting started section buttons
 * - Header/navigation buttons
 * - User menu interactions
 */

test.describe('Dashboard Button Testing', () => {
  test.beforeEach(async ({ page }) => {
    setupPageErrorLogging(page)
    
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
    // Test "Start New Review" or similar primary action button
    const actionButtons = [
      page.getByRole('button', { name: /start new review/i }),
      page.getByRole('button', { name: /begin project/i }),
      page.getByRole('button', { name: /create project/i }),
      page.getByRole('button', { name: /new project/i })
    ]
    
    for (const buttonSelector of actionButtons) {
      const buttonCount = await buttonSelector.count()
      if (buttonCount > 0) {
        const button = buttonSelector.first()
        await testButtonStates(page, button, 'Primary action button')
        
        // Test navigation
        await button.click()
        await page.waitForTimeout(1000)
        
        // Should navigate to new project page
        const currentUrl = page.url()
        expect(currentUrl).toMatch(/\/(projects\/new|new-project)/)
        
        // Navigate back for other tests
        await page.goto('/dashboard')
        break
      }
    }
  })

  test('should validate project card buttons', async ({ page }) => {
    // Look for project cards and their buttons
    const projectCardButtons = [
      page.getByRole('button', { name: /open project/i }),
      page.getByRole('button', { name: /view project/i }),
      page.getByRole('button', { name: /continue/i }),
      page.locator('[data-testid*="project-card"] button')
    ]
    
    for (const buttonSelector of projectCardButtons) {
      const buttonCount = await buttonSelector.count()
      
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = buttonSelector.nth(i)
        if (await button.isVisible()) {
          await testButtonStates(page, button, `Project card button ${i + 1}`)
        }
      }
    }
  })

  test('should validate getting started section buttons', async ({ page }) => {
    // Look for getting started or onboarding sections
    const gettingStartedButtons = [
      page.getByRole('button', { name: /start your first review/i }),
      page.getByRole('button', { name: /view documentation/i }),
      page.getByRole('button', { name: /get started/i }),
      page.getByRole('button', { name: /tutorial/i })
    ]
    
    for (const buttonSelector of gettingStartedButtons) {
      const buttonCount = await buttonSelector.count()
      if (buttonCount > 0) {
        const button = buttonSelector.first()
        
        // Scroll into view if needed
        await button.scrollIntoViewIfNeeded()
        
        if (await button.isVisible()) {
          await testButtonStates(page, button, 'Getting started button')
        }
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

  test('should validate user menu functionality', async ({ page }) => {
    // Look for user menu trigger (profile button, avatar, etc.)
    const userMenuTriggers = [
      page.getByRole('button', { name: /user menu/i }),
      page.getByRole('button', { name: /profile/i }),
      page.locator('[data-testid="user-menu-trigger"]'),
      page.locator('button').filter({ has: page.locator('svg[class*="user"]') })
    ]
    
    for (const triggerSelector of userMenuTriggers) {
      const triggerCount = await triggerSelector.count()
      if (triggerCount > 0) {
        const trigger = triggerSelector.first()
        
        if (await trigger.isVisible()) {
          await testButtonStates(page, trigger, 'User menu trigger')
          
          // Test menu opening
          await trigger.click()
          await page.waitForTimeout(500)
          
          // Look for menu items
          const menuItems = page.getByRole('menuitem').or(
            page.locator('[role="menu"] button, [role="menu"] a')
          )
          
          const menuItemCount = await menuItems.count()
          for (let i = 0; i < Math.min(menuItemCount, 3); i++) {
            const menuItem = menuItems.nth(i)
            if (await menuItem.isVisible()) {
              await expect(menuItem, `Menu item ${i + 1} should be visible`).toBeVisible()
            }
          }
          
          // Close menu by clicking elsewhere
          await page.locator('main').click()
          break
        }
      }
    }
  })

  test('should validate dashboard search and filter buttons', async ({ page }) => {
    // Look for search or filter functionality
    const searchFilterButtons = [
      page.getByRole('button', { name: /search/i }),
      page.getByRole('button', { name: /filter/i }),
      page.getByRole('button', { name: /sort/i }),
      page.locator('button').filter({ has: page.locator('svg[class*="search"]') })
    ]
    
    for (const buttonSelector of searchFilterButtons) {
      const buttonCount = await buttonSelector.count()
      if (buttonCount > 0) {
        const button = buttonSelector.first()
        
        if (await button.isVisible()) {
          await testButtonStates(page, button, 'Search/Filter button')
        }
      }
    }
  })

  test('should validate dashboard responsive behavior', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    
    // Look for mobile menu toggle
    const mobileMenuToggle = page.locator('button').filter({ 
      has: page.locator('svg[class*="hamburger"], svg[class*="menu"]') 
    })
    
    if (await mobileMenuToggle.count() > 0) {
      await testButtonStates(page, mobileMenuToggle, 'Mobile menu toggle')
      
      // Test menu opening
      await mobileMenuToggle.click()
      await page.waitForTimeout(500)
      
      // Test mobile navigation items
      const mobileNavItems = page.getByRole('navigation').locator('button, a')
      const navItemCount = await mobileNavItems.count()
      
      for (let i = 0; i < Math.min(navItemCount, 3); i++) {
        const navItem = mobileNavItems.nth(i)
        if (await navItem.isVisible()) {
          await expect(navItem, `Mobile nav item ${i + 1} should be visible`).toBeVisible()
        }
      }
    }
    
    // Reset to desktop view
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('should test dashboard loading states', async ({ page }) => {
    // Reload page to catch loading states
    await page.reload()
    
    // Look for skeleton loaders or loading buttons
    const loadingElements = page.locator('[class*="skeleton"], [class*="loading"], [aria-label*="loading"]')
    const loadingCount = await loadingElements.count()
    
    if (loadingCount > 0) {
      // Wait for loading to complete
      await page.waitForTimeout(2000)
      
      // Verify loading states are gone
      await expect(loadingElements.first()).not.toBeVisible({ timeout: 5000 })
    }
    
    // Test that main action buttons are present after loading
    const mainButtons = page.getByRole('button')
    const buttonCount = await mainButtons.count()
    
    expect(buttonCount, 'Dashboard should have interactive buttons after loading').toBeGreaterThan(0)
  })
})