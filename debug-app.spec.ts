import { test } from '@playwright/test'

test.describe('Debug SearchMatic App', () => {
  
  test('01. Check Landing Page Content', async ({ page }) => {
    console.log('🔍 Debugging: Checking what loads at localhost:5173...')
    
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')
    
    // Take screenshot
    await page.screenshot({ 
      path: '/root/repo/docs/assets/screenshots/auth-testing/debug-01-landing.png',
      fullPage: true 
    })
    
    // Get page content for debugging
    const content = await page.content()
    console.log('Page HTML length:', content.length)
    console.log('Page title:', await page.title())
    
    // Check what's visible
    const bodyText = await page.locator('body').textContent()
    console.log('Body text preview:', bodyText?.substring(0, 500))
    
    // Check for errors
    const errors = await page.locator('.error, [class*="error"], .text-red-500').count()
    console.log('Error elements found:', errors)
    
    if (errors > 0) {
      const errorTexts = await page.locator('.error, [class*="error"], .text-red-500').allTextContents()
      console.log('Error messages:', errorTexts)
    }
  })

  test('02. Check Login Page Direct Access', async ({ page }) => {
    console.log('🔍 Debugging: Directly accessing /login...')
    
    await page.goto('http://localhost:5173/login')
    await page.waitForLoadState('networkidle')
    
    // Take screenshot
    await page.screenshot({ 
      path: '/root/repo/docs/assets/screenshots/auth-testing/debug-02-login.png',
      fullPage: true 
    })
    
    // Get page content
    const content = await page.content()
    console.log('Login page HTML length:', content.length)
    console.log('Login page title:', await page.title())
    
    // Check what form elements exist
    const inputs = await page.locator('input').count()
    const buttons = await page.locator('button').count()
    console.log('Input elements found:', inputs)
    console.log('Button elements found:', buttons)
    
    // List all inputs
    const inputTypes = await page.locator('input').evaluateAll(inputs => 
      inputs.map(input => ({ type: input.type, id: input.id, placeholder: input.placeholder }))
    )
    console.log('Input details:', inputTypes)
    
    // Check for console errors
    const bodyText = await page.locator('body').textContent()
    console.log('Login page body text preview:', bodyText?.substring(0, 500))
  })

  test('03. Check Environment Variables', async ({ page }) => {
    console.log('🔍 Debugging: Checking environment setup...')
    
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')
    
    // Check if environment variables are loaded
    const envCheck = await page.evaluate(() => {
      return {
        supabaseUrl: !!(window as Record<string, unknown>).VITE_SUPABASE_URL || !!import.meta.env.VITE_SUPABASE_URL,
        supabaseKey: !!(window as Record<string, unknown>).VITE_SUPABASE_ANON_KEY || !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        mode: import.meta.env.MODE,
        dev: import.meta.env.DEV
      }
    })
    
    console.log('Environment check:', envCheck)
    
    // Check network requests for any 500/400 errors
    const requests = []
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method()
      })
    })
    
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log('Error response:', response.status(), response.url())
      }
    })
    
    // Wait a bit to capture requests
    await page.waitForTimeout(3000)
    console.log('Total requests made:', requests.length)
  })
})