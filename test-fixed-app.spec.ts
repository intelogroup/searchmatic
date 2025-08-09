import { test } from '@playwright/test'

test.describe('Test Fixed Application', () => {
  
  test('01. Check if App Loads Properly Now', async ({ page }) => {
    console.log('🔍 Testing fixed application...')
    
    // Monitor for any remaining errors
    const consoleErrors = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.log('CONSOLE ERROR:', msg.text())
      }
    })
    
    const pageErrors = []
    page.on('pageerror', error => {
      pageErrors.push(error.message)
      console.log('PAGE ERROR:', error.message)
    })
    
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')
    
    // Wait for potential loading to complete
    await page.waitForTimeout(5000)
    
    // Take screenshot
    await page.screenshot({ 
      path: '/root/repo/docs/assets/screenshots/auth-testing/fixed-landing.png',
      fullPage: true 
    })
    
    // Check if content is now visible
    const bodyText = await page.locator('body').textContent()
    console.log('Body text length:', bodyText?.length)
    console.log('Body text preview:', bodyText?.substring(0, 200))
    
    // Try to find common elements
    const elements = {
      buttons: await page.locator('button').count(),
      links: await page.locator('a').count(),
      inputs: await page.locator('input').count(),
      headings: await page.locator('h1, h2, h3').count()
    }
    
    console.log('Elements found:', elements)
    console.log('Console errors:', consoleErrors.length)
    console.log('Page errors:', pageErrors.length)
    
    // Test login page too
    await page.goto('http://localhost:5173/login')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    await page.screenshot({ 
      path: '/root/repo/docs/assets/screenshots/auth-testing/fixed-login.png',
      fullPage: true 
    })
    
    const loginElements = {
      buttons: await page.locator('button').count(),
      inputs: await page.locator('input').count(),
      emailInputs: await page.locator('input[type="email"]').count(),
      passwordInputs: await page.locator('input[type="password"]').count()
    }
    
    console.log('Login page elements:', loginElements)
  })
})