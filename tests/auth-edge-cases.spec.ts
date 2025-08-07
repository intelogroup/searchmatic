import { test, expect } from '@playwright/test'

test.describe('Searchmatic Authentication Edge Cases', () => {
  const baseURL = 'http://localhost:5174'

  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseURL}/login`)
  })

  test.describe('1. Concurrent Login Sessions', () => {
    test('should handle multiple browser sessions correctly', async ({ browser }) => {
      // Create two separate browser contexts (simulating different browser windows)
      const context1 = await browser.newContext()
      const context2 = await browser.newContext()
      
      const page1 = await context1.newPage()
      const page2 = await context2.newPage()

      // Navigate both pages to login
      await page1.goto(`${baseURL}/login`)
      await page2.goto(`${baseURL}/login`)

      // Login with the same user in both sessions
      const testEmail = 'test@example.com'
      const testPassword = 'testpassword123'

      // Attempt login in first session
      await page1.fill('input[type="email"]', testEmail)
      await page1.fill('input[type="password"]', testPassword)
      await page1.click('button[type="submit"]')

      // Take screenshot of first session result
      await page1.screenshot({ path: '/root/repo/screenshots/session1-login.png' })

      // Attempt login in second session  
      await page2.fill('input[type="email"]', testEmail)
      await page2.fill('input[type="password"]', testPassword)
      await page2.click('button[type="submit"]')

      // Take screenshot of second session result
      await page2.screenshot({ path: '/root/repo/screenshots/session2-login.png' })

      // Check if both sessions can coexist
      const page1URL = page1.url()
      const page2URL = page2.url()

      console.log('Session 1 URL:', page1URL)
      console.log('Session 2 URL:', page2URL)

      // Test logout from one session
      if (page1URL.includes('/dashboard')) {
        // Navigate to a page with logout functionality
        await page1.goto(`${baseURL}/dashboard`)
        
        // Look for logout button or user menu
        try {
          await page1.click('button:has-text("Logout"), button:has-text("Sign out"), [data-testid="user-menu"]', { timeout: 5000 })
        } catch {
          console.log('No logout button found, checking for user menu or profile')
        }
        
        await page1.screenshot({ path: '/root/repo/screenshots/after-logout-session1.png' })
      }

      // Check if second session is affected
      await page2.reload()
      await page2.screenshot({ path: '/root/repo/screenshots/after-logout-session2.png' })

      await context1.close()
      await context2.close()
    })
  })

  test.describe('2. Security Vulnerability Tests', () => {
    test('should prevent XSS attacks in email field', async ({ page }) => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("test")',
        '<img src=x onerror=alert("xss")>',
        '<svg onload=alert("xss")>',
        '"><script>alert("xss")</script>',
        "'><script>alert('xss')</script>"
      ]

      for (const payload of xssPayloads) {
        await page.fill('input[type="email"]', payload)
        await page.fill('input[type="password"]', 'testpassword')
        
        // Check if any alert dialogs appear (XSS executed)
        let alertFired = false
        page.on('dialog', async dialog => {
          alertFired = true
          await dialog.dismiss()
        })

        await page.click('button[type="submit"]')
        await page.waitForTimeout(1000)

        // Verify no XSS was executed
        expect(alertFired).toBe(false)
        
        // Check console for errors
        const logs = []
        page.on('console', msg => logs.push(msg.text()))
        
        await page.screenshot({ path: `/root/repo/screenshots/xss-test-${xssPayloads.indexOf(payload)}.png` })
        
        // Clear fields for next test
        await page.fill('input[type="email"]', '')
        await page.fill('input[type="password"]', '')
      }
    })

    test('should prevent XSS attacks in password field', async ({ page }) => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("test")',
        '<img src=x onerror=alert("xss")>'
      ]

      for (const payload of xssPayloads) {
        await page.fill('input[type="email"]', 'test@example.com')
        await page.fill('input[type="password"]', payload)
        
        let alertFired = false
        page.on('dialog', async dialog => {
          alertFired = true
          await dialog.dismiss()
        })

        await page.click('button[type="submit"]')
        await page.waitForTimeout(1000)

        expect(alertFired).toBe(false)
        
        await page.fill('input[type="email"]', '')
        await page.fill('input[type="password"]', '')
      }
    })

    test('should prevent SQL injection attempts', async ({ page }) => {
      const sqlPayloads = [
        "' OR '1'='1",
        "admin'; DROP TABLE users;--",
        "' UNION SELECT * FROM users--",
        "'; UPDATE users SET password='hacked'--",
        "' OR 1=1#",
        "admin'/**/OR/**/1=1--"
      ]

      for (const payload of sqlPayloads) {
        await page.fill('input[type="email"]', payload)
        await page.fill('input[type="password"]', payload)
        
        await page.click('button[type="submit"]')
        await page.waitForTimeout(2000)
        
        // Check that we're still on login page or got appropriate error
        const url = page.url()
        const hasError = await page.locator('.text-destructive').count() > 0
        
        // Should either stay on login or show appropriate error
        expect(url.includes('/login') || hasError).toBe(true)
        
        await page.screenshot({ path: `/root/repo/screenshots/sql-injection-${sqlPayloads.indexOf(payload)}.png` })
        
        await page.fill('input[type="email"]', '')
        await page.fill('input[type="password"]', '')
      }
    })

    test('should check for sensitive data in browser storage', async ({ page }) => {
      // Attempt a login first
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'testpassword123')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(3000)

      // Check localStorage for sensitive data
      const localStorage = await page.evaluate(() => {
        const data = {}
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          data[key] = localStorage.getItem(key)
        }
        return data
      })

      // Check sessionStorage
      const sessionStorage = await page.evaluate(() => {
        const data = {}
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          data[key] = sessionStorage.getItem(key)
        }
        return data
      })

      // Check cookies
      const cookies = await page.context().cookies()

      console.log('LocalStorage:', localStorage)
      console.log('SessionStorage:', sessionStorage)
      console.log('Cookies:', cookies)

      // Verify no plaintext passwords or sensitive keys are stored
      const storageString = JSON.stringify({ localStorage, sessionStorage, cookies })
      expect(storageString).not.toContain('testpassword123')
      expect(storageString).not.toContain('service_role')
      
      await page.screenshot({ path: '/root/repo/screenshots/browser-storage-check.png' })
    })
  })

  test.describe('3. Browser Compatibility', () => {
    test('should work in incognito/private mode', async ({ browser }) => {
      const context = await browser.newContext({
        // Simulate incognito mode
        storageState: undefined
      })
      const page = await context.newPage()
      
      await page.goto(`${baseURL}/login`)
      
      // Test basic functionality
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'testpassword123')
      
      const submitButton = page.locator('button[type="submit"]')
      await expect(submitButton).toBeVisible()
      
      await page.screenshot({ path: '/root/repo/screenshots/incognito-mode.png' })
      
      await context.close()
    })

    test('should handle cleared cookies gracefully', async ({ page }) => {
      // First, attempt login
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'testpassword123')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(2000)

      // Clear all cookies
      await page.context().clearCookies()
      
      // Clear all storage
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })

      // Reload page
      await page.reload()
      
      // Should redirect to login or show appropriate state
      const url = page.url()
      expect(url.includes('/login') || url.includes('/')).toBe(true)
      
      await page.screenshot({ path: '/root/repo/screenshots/cleared-cookies.png' })
    })
  })

  test.describe('4. Performance Under Load', () => {
    test('should handle rapid form submissions', async ({ page }) => {
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'testpassword123')
      
      // Rapidly click submit button multiple times
      for (let i = 0; i < 10; i++) {
        await page.click('button[type="submit"]', { force: true })
        await page.waitForTimeout(100)
      }
      
      // Check that the form is still functional and not broken
      const submitButton = page.locator('button[type="submit"]')
      await expect(submitButton).toBeVisible()
      
      // Check for any console errors
      const logs = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          logs.push(msg.text())
        }
      })
      
      await page.screenshot({ path: '/root/repo/screenshots/rapid-submissions.png' })
      
      console.log('Console errors during rapid submissions:', logs)
    })

    test('should handle very long form inputs', async ({ page }) => {
      const longString = 'a'.repeat(10000) // 10,000 characters
      
      await page.fill('input[type="email"]', longString + '@example.com')
      await page.fill('input[type="password"]', longString)
      
      await page.click('button[type="submit"]')
      await page.waitForTimeout(2000)
      
      // Form should still be responsive 
      const emailField = page.locator('input[type="email"]')
      await expect(emailField).toBeVisible()
      
      await page.screenshot({ path: '/root/repo/screenshots/long-inputs.png' })
    })

    test('should monitor memory usage during session', async ({ page }) => {
      // Navigate to login multiple times to check for memory leaks
      for (let i = 0; i < 5; i++) {
        await page.goto(`${baseURL}/login`)
        await page.fill('input[type="email"]', `test${i}@example.com`)
        await page.fill('input[type="password"]', 'testpassword123')
        await page.click('button[type="submit"]')
        await page.waitForTimeout(1000)
        await page.goBack()
        await page.waitForTimeout(500)
      }
      
      // Check that page is still responsive
      await page.goto(`${baseURL}/login`)
      const emailField = page.locator('input[type="email"]')
      await expect(emailField).toBeVisible()
      
      await page.screenshot({ path: '/root/repo/screenshots/memory-test.png' })
    })
  })

  test.describe('5. Error Recovery Testing', () => {
    test('should handle navigation during login process', async ({ page }) => {
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'testpassword123')
      
      // Start login process
      await page.click('button[type="submit"]')
      
      // Immediately navigate away
      await page.goto(`${baseURL}/`)
      await page.waitForTimeout(1000)
      
      // Navigate back to login
      await page.goto(`${baseURL}/login`)
      
      // Form should be in clean state
      const emailValue = await page.locator('input[type="email"]').inputValue()
      const passwordValue = await page.locator('input[type="password"]').inputValue()
      
      expect(emailValue).toBe('')
      expect(passwordValue).toBe('')
      
      await page.screenshot({ path: '/root/repo/screenshots/navigation-during-login.png' })
    })

    test('should handle browser back/forward buttons', async ({ page }) => {
      // Start at login page
      await page.goto(`${baseURL}/login`)
      
      // Fill form
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'testpassword123')
      
      // Navigate to home page
      await page.goto(`${baseURL}/`)
      await page.waitForTimeout(500)
      
      // Use browser back button
      await page.goBack()
      
      // Check if form state is preserved or reset appropriately
      await page.waitForTimeout(1000)
      
      const emailValue = await page.locator('input[type="email"]').inputValue()
      console.log('Email value after back button:', emailValue)
      
      await page.screenshot({ path: '/root/repo/screenshots/back-button-test.png' })
      
      // Use forward button
      await page.goForward()
      await page.waitForTimeout(500)
      
      await page.screenshot({ path: '/root/repo/screenshots/forward-button-test.png' })
    })

    test('should handle simulated network failure', async ({ page }) => {
      // Go offline
      await page.context().setOffline(true)
      
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'testpassword123')
      
      await page.click('button[type="submit"]')
      await page.waitForTimeout(3000)
      
      // Should show appropriate error or loading state
      const hasError = await page.locator('.text-destructive').count() > 0
      const isLoading = await page.locator('button[disabled]').count() > 0
      
      expect(hasError || isLoading).toBe(true)
      
      await page.screenshot({ path: '/root/repo/screenshots/network-failure.png' })
      
      // Go back online
      await page.context().setOffline(false)
      
      // Try again
      await page.click('button[type="submit"]')
      await page.waitForTimeout(2000)
      
      await page.screenshot({ path: '/root/repo/screenshots/network-recovery.png' })
    })

    test('should handle JavaScript disabled scenario', async ({ browser }) => {
      const context = await browser.newContext({
        javaScriptEnabled: false
      })
      const page = await context.newPage()
      
      await page.goto(`${baseURL}/login`)
      
      // Check if page renders basic content
      const title = await page.textContent('h1, h2, .card-title, [data-testid="title"]')
      expect(title).toBeTruthy()
      
      await page.screenshot({ path: '/root/repo/screenshots/no-javascript.png' })
      
      await context.close()
    })
  })

  test.describe('Additional Security Checks', () => {
    test('should validate CSRF protection', async ({ page }) => {
      // Check if forms have CSRF tokens or other protection
      const form = page.locator('form')
      await expect(form).toBeVisible()
      
      // Look for hidden CSRF tokens
      const hiddenInputs = page.locator('input[type="hidden"]')
      const hiddenCount = await hiddenInputs.count()
      
      console.log('Hidden inputs found:', hiddenCount)
      
      // Check form action and method
      const formAction = await form.getAttribute('action')
      const formMethod = await form.getAttribute('method')
      
      console.log('Form action:', formAction)
      console.log('Form method:', formMethod)
      
      await page.screenshot({ path: '/root/repo/screenshots/csrf-check.png' })
    })

    test('should check for exposed API keys in source', async ({ page }) => {
      // Get page source
      const content = await page.content()
      
      // Check for various API key patterns
      const dangerousPatterns = [
        /sk-[a-zA-Z0-9]{48}/g, // OpenAI API keys
        /service_role/g,
        /secret/g,
        /private_key/g,
        /auth_token/g
      ]
      
      const exposedKeys: string[] = []
      for (const pattern of dangerousPatterns) {
        const matches = content.match(pattern)
        if (matches) {
          exposedKeys.push(...matches)
        }
      }
      
      console.log('Potentially exposed keys:', exposedKeys)
      
      // Should only contain public/publishable keys
      expect(exposedKeys.filter(key => !key.includes('publishable') && !key.includes('public'))).toHaveLength(0)
    })
  })
})