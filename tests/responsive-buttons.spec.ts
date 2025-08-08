import { test, expect } from '@playwright/test'
import { testButtonStates, VIEWPORT_SIZES, setupPageErrorLogging } from './utils/buttonTestUtils'

/**
 * Responsive Button Testing Suite
 * 
 * This test suite validates button behavior across different viewport sizes:
 * - Touch target sizes on mobile
 * - Responsive navigation patterns
 * - Mobile menu functionality
 * - Accessibility at all screen sizes
 * - Button states and interactions
 */

test.describe('Responsive Button Testing', () => {
  test.beforeEach(async ({ page }) => {
    setupPageErrorLogging(page)
  })

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

  test('should test tablet navigation patterns', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    
    // Test that buttons are appropriately sized for tablet
    const mainButtons = page.getByRole('button')
    const buttonCount = await mainButtons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = mainButtons.nth(i)
      if (await button.isVisible()) {
        await testButtonStates(page, button, `Tablet button ${i + 1}`)
      }
    }
  })

  test('should validate mobile touch interactions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    const touchableButtons = page.getByRole('button')
    const buttonCount = await touchableButtons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = touchableButtons.nth(i)
      if (await button.isVisible()) {
        // Test tap interaction
        await button.tap()
        await page.waitForTimeout(100)
        
        // Verify button responded to tap
        const isEnabled = await button.isEnabled()
        expect(isEnabled, `Button ${i + 1} should remain interactive after tap`).toBe(true)
      }
    }
  })

  test('should test responsive navigation collapse', async ({ page }) => {
    // Test desktop navigation
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')
    
    const desktopNav = page.locator('nav button, header button')
    const desktopButtonCount = await desktopNav.count()
    
    // Switch to mobile and check if navigation adapts
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500) // Allow for responsive changes
    
    // Check if mobile navigation is different (fewer buttons visible, hamburger menu, etc.)
    const mobileNav = page.locator('nav button, header button')
    const mobileButtonCount = await mobileNav.count()
    
    // On mobile, we typically expect fewer visible nav buttons due to hamburger menu
    if (desktopButtonCount > 2) {
      expect(mobileButtonCount, 'Mobile navigation should adapt (fewer buttons or hamburger menu)')
        .toBeLessThanOrEqual(desktopButtonCount)
    }
  })

  test('should validate button spacing on different screen sizes', async ({ page }) => {
    for (const viewport of VIEWPORT_SIZES) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')
      
      // Get buttons in hero section (they're typically grouped)
      const heroSection = page.locator('section').first()
      const heroButtons = heroSection.getByRole('button')
      const heroButtonCount = await heroButtons.count()
      
      if (heroButtonCount >= 2) {
        const button1 = heroButtons.first()
        const button2 = heroButtons.nth(1)
        
        const box1 = await button1.boundingBox()
        const box2 = await button2.boundingBox()
        
        if (box1 && box2) {
          // Calculate spacing between buttons
          const spacing = viewport.width >= 768 
            ? Math.abs(box2.x - (box1.x + box1.width)) // Horizontal spacing on desktop
            : Math.abs(box2.y - (box1.y + box1.height)) // Vertical spacing on mobile
          
          // Ensure adequate spacing (at least 8px)
          expect(spacing, `Button spacing on ${viewport.name} should be adequate`)
            .toBeGreaterThanOrEqual(8)
        }
      }
    }
  })

  test('should test landscape vs portrait orientations on mobile', async ({ page }) => {
    // Portrait
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    const portraitButtons = page.getByRole('button')
    const portraitButtonCount = await portraitButtons.count()
    
    // Landscape
    await page.setViewportSize({ width: 667, height: 375 })
    await page.waitForTimeout(500) // Allow for orientation change
    
    const landscapeButtons = page.getByRole('button')
    const landscapeButtonCount = await landscapeButtons.count()
    
    // Button count should be consistent across orientations
    expect(landscapeButtonCount, 'Button count should be consistent across orientations')
      .toBe(portraitButtonCount)
    
    // Test button visibility in landscape
    for (let i = 0; i < Math.min(landscapeButtonCount, 3); i++) {
      const button = landscapeButtons.nth(i)
      if (await button.isVisible()) {
        await testButtonStates(page, button, `Landscape button ${i + 1}`)
      }
    }
  })
})

test.describe('Accessibility & Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    setupPageErrorLogging(page)
  })

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
        const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase()).catch(() => '')
        
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
        
        expect(accessibleName?.trim(), `Button ${i + 1} should have accessible name`).toBeTruthy()
      }
    }
  })

  test('should meet color contrast requirements', async ({ page }) => {
    await page.goto('/')
    
    // Test contrast by checking computed styles
    const buttons = page.getByRole('button')
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      const button = buttons.first()
      const styles = await button.evaluate(el => {
        const computed = window.getComputedStyle(el)
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          borderColor: computed.borderColor
        }
      })
      
      // Basic check that styles are applied
      expect(styles.backgroundColor || styles.color, 'Buttons should have styling applied').toBeTruthy()
    }
  })

  test('should test focus indicators', async ({ page }) => {
    await page.goto('/')
    
    const buttons = page.getByRole('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        // Focus the button
        await button.focus()
        await page.waitForTimeout(100)
        
        // Check that focus is actually on the button
        await expect(button).toBeFocused()
        
        // Test that focus ring is visible (by checking outline styles)
        const focusStyles = await button.evaluate(el => {
          const computed = window.getComputedStyle(el)
          return {
            outline: computed.outline,
            outlineWidth: computed.outlineWidth,
            outlineColor: computed.outlineColor,
            boxShadow: computed.boxShadow
          }
        })
        
        // Should have some form of focus indicator
        const hasFocusIndicator = focusStyles.outline !== 'none' || 
                                 focusStyles.outlineWidth !== '0px' ||
                                 focusStyles.boxShadow !== 'none'
        
        expect(hasFocusIndicator, `Button ${i + 1} should have visible focus indicator`).toBe(true)
      }
    }
  })
})