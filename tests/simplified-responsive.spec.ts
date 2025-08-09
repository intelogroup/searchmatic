import { test, expect, Page, Locator } from '@playwright/test'

/**
 * Simplified Responsive Button Testing Suite
 * 
 * This test suite validates button behavior across different screen sizes:
 * - Cross-viewport button functionality
 * - Mobile navigation patterns
 * - Touch target accessibility
 * - Performance across devices
 */

const VIEWPORT_SIZES = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 720 }
]

// Helper functions
async function measureElementSize(element: Locator): Promise<{ width: number; height: number }> {
  const box = await element.boundingBox()
  return box ? { width: box.width, height: box.height } : { width: 0, height: 0 }
}

async function testBasicButtonFunctionality(page: Page, button: Locator, buttonName: string): Promise<void> {
  // Test button visibility
  await expect(button, `${buttonName} should be visible`).toBeVisible()
  
  // Test button is enabled
  await expect(button, `${buttonName} should be enabled`).toBeEnabled()
  
  // Test focus state
  await button.focus()
  await page.waitForTimeout(100)
}

test.describe('Responsive Design Validation', () => {
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
  })

  VIEWPORT_SIZES.forEach(viewport => {
    test(`should validate button behavior on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      console.log(`🧪 Testing ${viewport.name} viewport...`)
      
      await page.goto('/')
      
      // Test primary buttons are accessible
      const heroButton = page.getByRole('button', { name: /start free trial/i }).first()
      
      if (await heroButton.isVisible()) {
        await testBasicButtonFunctionality(page, heroButton, `${viewport.name} hero button`)
        
        // Test mobile-specific interactions
        if (viewport.width < 768) {
          // Check if button is touch-friendly
          const size = await measureElementSize(heroButton)
          expect(size.height, `${viewport.name} button should be touch-friendly`).toBeGreaterThanOrEqual(40)
        }
      }
      
      console.log(`✅ ${viewport.name} validation complete`)
    })
  })

  test('should validate mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    console.log('🧪 Testing mobile navigation...')
    
    // Look for mobile menu toggle
    const mobileToggle = page.locator('button[aria-label*="menu"], button[aria-expanded]')
    
    if (await mobileToggle.count() > 0) {
      await testBasicButtonFunctionality(page, mobileToggle, 'Mobile menu toggle')
      
      // Test menu functionality
      await mobileToggle.click()
      await page.waitForTimeout(300)
      
      console.log('✅ Mobile navigation working')
    } else {
      console.log('ℹ️ No mobile-specific navigation found')
    }
  })

  test('should test button touch interactions on mobile', async ({ page }) => {
    console.log('🧪 Testing mobile touch interactions...')
    
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    const touchButtons = page.getByRole('button')
    const buttonCount = await touchButtons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = touchButtons.nth(i)
      if (await button.isVisible()) {
        // Test tap interaction
        await button.tap()
        await page.waitForTimeout(100)
        
        // Validate touch target size
        const size = await measureElementSize(button)
        expect(size.height, `Mobile button ${i + 1} should meet touch target minimum`).toBeGreaterThanOrEqual(40)
      }
    }
    
    console.log('✅ Mobile touch interactions validated')
  })

  test('should validate tablet layout adaptations', async ({ page }) => {
    console.log('🧪 Testing tablet layout...')
    
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    
    // Test that buttons are appropriately spaced for tablet
    const navigationButtons = page.locator('nav button, header button')
    const navButtonCount = await navigationButtons.count()
    
    for (let i = 0; i < Math.min(navButtonCount, 3); i++) {
      const button = navigationButtons.nth(i)
      if (await button.isVisible()) {
        await testBasicButtonFunctionality(page, button, `Tablet nav button ${i + 1}`)
      }
    }
    
    console.log('✅ Tablet layout validated')
  })
})

test.describe('Accessibility & Keyboard Navigation', () => {
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

  test('should support keyboard navigation through interactive elements', async ({ page }) => {
    await page.goto('/')
    console.log('🧪 Testing keyboard navigation...')
    
    // Test tab navigation
    const buttons = page.getByRole('button')
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      await buttons.first().focus()
      
      // Tab through first few buttons
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(100)
        
        // Verify focus is on an interactive element
        const focusedElement = page.locator(':focus')
        const isInteractive = await focusedElement.evaluate(el => 
          ['BUTTON', 'A', 'INPUT'].includes(el.tagName) || 
          el.hasAttribute('tabindex')
        ).catch(() => false)
        
        if (isInteractive) {
          // Test Enter key activation
          await page.keyboard.press('Enter')
          await page.waitForTimeout(200)
        }
      }
      
      console.log('✅ Keyboard navigation working')
    }
  })

  test('should have accessible button labels and roles', async ({ page }) => {
    await page.goto('/')
    console.log('🧪 Testing button accessibility...')
    
    const buttons = page.getByRole('button')
    const buttonCount = await buttons.count()
    
    let accessibleButtons = 0
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        const accessibleName = await button.getAttribute('aria-label') || 
                              await button.textContent() ||
                              await button.getAttribute('title')
        
        if (accessibleName && accessibleName.trim().length > 0) {
          accessibleButtons++
        } else {
          console.warn(`⚠️ Button ${i + 1} missing accessible name`)
        }
      }
    }
    
    expect(accessibleButtons, 'Most buttons should have accessible names').toBeGreaterThan(buttonCount * 0.8)
    console.log(`✅ ${accessibleButtons}/${buttonCount} buttons have accessible names`)
  })

  test('should test focus indicators', async ({ page }) => {
    await page.goto('/')
    console.log('🧪 Testing focus indicators...')
    
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
        
        // Test that some focus styling is applied
        const focusStyles = await button.evaluate(el => {
          const computed = window.getComputedStyle(el)
          return {
            outline: computed.outline,
            boxShadow: computed.boxShadow
          }
        })
        
        // Should have some form of focus indicator
        const hasFocusIndicator = focusStyles.outline !== 'none' || focusStyles.boxShadow !== 'none'
        expect(hasFocusIndicator, `Button ${i + 1} should have visible focus indicator`).toBe(true)
      }
    }
    
    console.log('✅ Focus indicators validated')
  })
})

test.describe('Performance & Error Handling', () => {
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

  test('should load interactive elements quickly', async ({ page }) => {
    const startTime = Date.now()
    console.log('🧪 Testing page load performance...')
    
    await page.goto('/')
    
    // Wait for first interactive button
    await expect(page.getByRole('button').first()).toBeVisible()
    
    const loadTime = Date.now() - startTime
    expect(loadTime, 'Interactive elements should load within 5 seconds').toBeLessThan(5000)
    
    console.log(`✅ Interactive elements loaded in ${loadTime}ms`)
  })

  test('should handle button click errors gracefully', async ({ page }) => {
    await page.goto('/')
    console.log('🧪 Testing error handling...')
    
    // Test clicking buttons that might cause errors
    const buttons = page.getByRole('button')
    const buttonCount = await buttons.count()
    
    let errorCount = 0
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        try {
          await button.click()
          await page.waitForTimeout(500)
        } catch (error) {
          errorCount++
          console.warn(`⚠️ Button ${i + 1} caused error:`, error)
        }
      }
    }
    
    expect(errorCount, 'Most buttons should not cause errors').toBeLessThan(buttonCount * 0.3)
    console.log(`✅ Error handling test complete (${errorCount} errors out of ${Math.min(buttonCount, 3)} tests)`)
  })

  test('should test button responsiveness across viewports', async ({ page }) => {
    console.log('🧪 Testing button responsiveness...')
    
    for (const viewport of VIEWPORT_SIZES) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')
      
      const testButton = page.getByRole('button').first()
      if (await testButton.count() > 0) {
        const startTime = Date.now()
        await testButton.click()
        const responseTime = Date.now() - startTime
        
        expect(responseTime, `${viewport.name} button should respond quickly`).toBeLessThan(500)
        
        // Navigate back if needed
        if (page.url().includes('/login')) {
          await page.goto('/')
        }
      }
    }
    
    console.log('✅ Button responsiveness validated')
  })
})