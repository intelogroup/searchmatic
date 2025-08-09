import { test } from '@playwright/test'

test.describe('Check Console Errors and Environment', () => {
  
  test('01. Capture Console Errors and Network Issues', async ({ page }) => {
    console.log('🔍 Checking for console errors and network issues...')
    
    // Capture console messages
    const consoleMessages = []
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      })
      console.log(`CONSOLE [${msg.type().toUpperCase()}]:`, msg.text())
    })
    
    // Capture network errors
    const networkErrors = []
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push({
          status: response.status(),
          url: response.url(),
          statusText: response.statusText()
        })
        console.log(`NETWORK ERROR [${response.status()}]:`, response.url())
      }
    })
    
    // Capture page errors
    const pageErrors = []
    page.on('pageerror', error => {
      pageErrors.push(error.message)
      console.log('PAGE ERROR:', error.message)
    })
    
    await page.goto('http://localhost:5173/')
    await page.waitForTimeout(10000) // Wait longer to see what happens
    
    // Take screenshot after waiting
    await page.screenshot({ 
      path: '/root/repo/docs/assets/screenshots/auth-testing/debug-with-errors.png',
      fullPage: true 
    })
    
    console.log('--- SUMMARY ---')
    console.log('Console messages:', consoleMessages.length)
    console.log('Network errors:', networkErrors.length)
    console.log('Page errors:', pageErrors.length)
    
    // Try to navigate to login
    await page.goto('http://localhost:5173/login')
    await page.waitForTimeout(5000)
    
    await page.screenshot({ 
      path: '/root/repo/docs/assets/screenshots/auth-testing/debug-login-with-errors.png',
      fullPage: true 
    })
    
    // Log final counts
    console.log('Final console messages:', consoleMessages.length)
    console.log('Final network errors:', networkErrors.length)
    console.log('Final page errors:', pageErrors.length)
  })
})