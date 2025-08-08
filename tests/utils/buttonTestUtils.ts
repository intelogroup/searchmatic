import { expect, Page, Locator } from '@playwright/test'

// Test credentials
export const TEST_USER = {
  email: 'jayveedz19@gmail.com',
  password: 'Jimkali90#'
}

// Accessibility standards
export const MIN_TOUCH_TARGET_SIZE = 44 // WCAG AA requirement

export const VIEWPORT_SIZES = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 720 },
  { name: 'Large Desktop', width: 1920, height: 1080 }
]

// Helper functions
export async function measureElementSize(element: Locator): Promise<{ width: number; height: number }> {
  const box = await element.boundingBox()
  return box ? { width: box.width, height: box.height } : { width: 0, height: 0 }
}

export async function checkTouchTargetSize(element: Locator, elementName: string): Promise<void> {
  const size = await measureElementSize(element)
  expect(size.width, `${elementName} width should be at least ${MIN_TOUCH_TARGET_SIZE}px`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
  expect(size.height, `${elementName} height should be at least ${MIN_TOUCH_TARGET_SIZE}px`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
}

export async function testButtonStates(page: Page, button: Locator, buttonName: string): Promise<void> {
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

export async function captureButtonState(page: Page, button: Locator, stateName: string, screenshotPath: string): Promise<void> {
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

export function setupPageErrorLogging(page: Page): void {
  // Set up error logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Browser console error: ${msg.text()}`)
    }
  })
  
  page.on('pageerror', error => {
    console.error(`Page error: ${error.message}`)
  })
}