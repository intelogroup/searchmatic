import { test, expect } from '@playwright/test'

test.describe('Security-Focused Authentication Tests', () => {
  const baseURL = 'http://localhost:5174'

  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseURL}/login`)
    await page.waitForLoadState('networkidle')
  })

  test('should prevent XSS in email field', async ({ page }) => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("test")',
      '<img src=x onerror=alert("xss")>'
    ]

    for (const payload of xssPayloads) {
      await page.fill('input[type="email"]', payload)
      await page.fill('input[type="password"]', 'testpassword')
      
      let alertFired = false
      page.on('dialog', async dialog => {
        alertFired = true
        await dialog.dismiss()
      })

      await page.click('button[type="submit"]')
      await page.waitForTimeout(2000)

      expect(alertFired).toBe(false)
      
      await page.screenshot({ path: `screenshots/xss-email-${xssPayloads.indexOf(payload)}.png` })
      
      await page.fill('input[type="email"]', '')
      await page.fill('input[type="password"]', '')
    }
  })

  test('should prevent SQL injection attempts', async ({ page }) => {
    const sqlPayloads = [
      "' OR '1'='1",
      "admin'; DROP TABLE users;--",
      "' UNION SELECT * FROM users--"
    ]

    for (const payload of sqlPayloads) {
      await page.fill('input[type="email"]', payload)
      await page.fill('input[type="password"]', payload)
      
      await page.click('button[type="submit"]')
      await page.waitForTimeout(2000)
      
      const url = page.url()
      const hasError = await page.locator('.text-destructive').count() > 0
      
      expect(url.includes('/login') || hasError).toBe(true)
      
      await page.screenshot({ path: `screenshots/sql-injection-${sqlPayloads.indexOf(payload)}.png` })
      
      await page.fill('input[type="email"]', '')
      await page.fill('input[type="password"]', '')
    }
  })

  test('should check browser storage security', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)

    const localStorage = await page.evaluate(() => {
      const data = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        data[key] = localStorage.getItem(key)
      }
      return data
    })

    const cookies = await page.context().cookies()

    console.log('LocalStorage:', localStorage)
    console.log('Cookies:', cookies)

    const storageString = JSON.stringify({ localStorage, cookies })
    expect(storageString).not.toContain('testpassword123')
    expect(storageString).not.toContain('service_role')
    
    await page.screenshot({ path: 'screenshots/browser-storage-check.png' })
  })

  test('should check for exposed API keys', async ({ page }) => {
    const content = await page.content()
    
    const dangerousPatterns = [
      /sk-[a-zA-Z0-9]{48}/g,
      /service_role/g,
      /secret/g
    ]
    
    let exposedKeys = []
    for (const pattern of dangerousPatterns) {
      const matches = content.match(pattern)
      if (matches) {
        exposedKeys.push(...matches)
      }
    }
    
    console.log('Potentially exposed keys:', exposedKeys)
    
    expect(exposedKeys.filter(key => !key.includes('publishable'))).toHaveLength(0)
    
    await page.screenshot({ path: 'screenshots/api-key-check.png' })
  })

  test('should handle rapid form submissions', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    
    for (let i = 0; i < 5; i++) {
      await page.click('button[type="submit"]', { force: true })
      await page.waitForTimeout(200)
    }
    
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
    
    await page.screenshot({ path: 'screenshots/rapid-submissions.png' })
  })

  test('should handle network failure gracefully', async ({ page }) => {
    await page.context().setOffline(true)
    
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    const hasError = await page.locator('.text-destructive').count() > 0
    const isLoading = await page.locator('button[disabled]').count() > 0
    
    expect(hasError || isLoading).toBe(true)
    
    await page.screenshot({ path: 'screenshots/network-failure.png' })
    
    await page.context().setOffline(false)
  })
})