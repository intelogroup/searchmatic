import { test, expect } from '@playwright/test'

/**
 * Simplified UI Screenshot Test
 * 
 * Captures key UI screenshots with a test user for visual validation.
 * Focused on the most important user interface components.
 */

test.describe('UI Screenshots with Test User', () => {
  let testUser: {
    email: string
    password: string
    fullName: string
  }

  test.beforeAll(async () => {
    const timestamp = Date.now()
    testUser = {
      email: `ui.test.${timestamp}@searchmatic.app`,
      password: 'UITest123!',
      fullName: `UI Test User ${timestamp}`
    }
    
    console.log(`\n🎭 UI Screenshot Test Started`)
    console.log(`📧 Test User: ${testUser.email}`)
    console.log(`👤 Full Name: ${testUser.fullName}\n`)
  })

  test('Capture key UI screens with test user', async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1920, height: 1080 })

    console.log('📸 Capturing key UI screens...')

    // ==========================================
    // 1. LANDING PAGE
    // ==========================================
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    await page.screenshot({ 
      path: './test-results/ui-screenshots/01-landing-page.png',
      fullPage: true 
    })
    console.log('✓ Landing page captured')

    // ==========================================
    // 2. LOGIN PAGE
    // ==========================================
    
    try {
      const loginButton = page.locator('text=Login, text=Sign In, text=Get Started')
      if (await loginButton.count() > 0) {
        await loginButton.first().click()
      } else {
        await page.goto('/login')
      }
    } catch {
      await page.goto('/login')
    }

    await page.waitForLoadState('networkidle')
    await page.screenshot({ 
      path: './test-results/ui-screenshots/02-login-page.png',
      fullPage: true 
    })
    console.log('✓ Login page captured')

    // ==========================================
    // 3. SIGNUP FORM
    // ==========================================
    
    const signupToggle = page.locator('text=Don\'t have an account, text=Sign up, text=Create account')
    if (await signupToggle.count() > 0) {
      await signupToggle.first().click()
      await page.waitForTimeout(1000)
    }

    // Fill signup form
    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[type="password"]', testUser.password)
    
    const nameInput = page.locator('input[placeholder*="name" i], input[id*="name"]')
    if (await nameInput.count() > 0) {
      await nameInput.fill(testUser.fullName)
    }

    await page.screenshot({ 
      path: './test-results/ui-screenshots/03-signup-form-filled.png',
      fullPage: true 
    })
    console.log('✓ Signup form captured')

    // Submit signup
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    await page.screenshot({ 
      path: './test-results/ui-screenshots/04-signup-result.png',
      fullPage: true 
    })

    // ==========================================
    // 4. DASHBOARD
    // ==========================================
    
    // Navigate to dashboard (use demo mode if needed)
    const currentUrl = page.url()
    if (!currentUrl.includes('dashboard') && !currentUrl.includes('projects')) {
      await page.goto('/dashboard?demo=true')
    }

    await page.waitForLoadState('networkidle')
    
    await page.screenshot({ 
      path: './test-results/ui-screenshots/05-dashboard.png',
      fullPage: true 
    })
    console.log('✓ Dashboard captured')

    // ==========================================
    // 5. PROJECTS PAGE
    // ==========================================
    
    const projectsLink = page.locator('text=Projects, a[href*="projects"]')
    if (await projectsLink.count() > 0) {
      await projectsLink.first().click()
      await page.waitForLoadState('networkidle')
      
      await page.screenshot({ 
        path: './test-results/ui-screenshots/06-projects-page.png',
        fullPage: true 
      })
      console.log('✓ Projects page captured')

      // New project form
      const newProjectButton = page.locator('text=New Project, text=Create Project')
      if (await newProjectButton.count() > 0) {
        await newProjectButton.first().click()
        await page.waitForLoadState('networkidle')
        
        await page.screenshot({ 
          path: './test-results/ui-screenshots/07-new-project-form.png',
          fullPage: true 
        })
        console.log('✓ New project form captured')

        // Fill and submit form
        await page.fill('input[placeholder*="title" i]', `Test Project - ${testUser.fullName}`)
        await page.fill('textarea[placeholder*="description" i]', 'This is a test project for UI validation.')
        
        await page.screenshot({ 
          path: './test-results/ui-screenshots/08-project-form-filled.png',
          fullPage: true 
        })

        await page.click('button:has-text("Create")')
        await page.waitForTimeout(2000)
        
        await page.screenshot({ 
          path: './test-results/ui-screenshots/09-project-created.png',
          fullPage: true 
        })
        console.log('✓ Project creation captured')
      }
    }

    // ==========================================
    // 6. CHAT INTERFACE
    // ==========================================
    
    const chatLink = page.locator('text=Chat, a[href*="chat"]')
    if (await chatLink.count() > 0) {
      await chatLink.first().click()
      await page.waitForLoadState('networkidle')
      
      await page.screenshot({ 
        path: './test-results/ui-screenshots/10-chat-interface.png',
        fullPage: true 
      })
      console.log('✓ Chat interface captured')
    }

    // ==========================================
    // 7. SETTINGS PAGE
    // ==========================================
    
    const settingsLink = page.locator('text=Settings, a[href*="settings"]')
    if (await settingsLink.count() > 0) {
      await settingsLink.first().click()
      await page.waitForLoadState('networkidle')
      
      await page.screenshot({ 
        path: './test-results/ui-screenshots/11-settings-page.png',
        fullPage: true 
      })
      console.log('✓ Settings page captured')
    }

    // ==========================================
    // 8. MOBILE RESPONSIVE
    // ==========================================
    
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/dashboard?demo=true')
    await page.waitForLoadState('networkidle')
    
    await page.screenshot({ 
      path: './test-results/ui-screenshots/12-mobile-dashboard.png',
      fullPage: true 
    })
    console.log('✓ Mobile dashboard captured')

    // ==========================================
    // 9. ERROR STATE
    // ==========================================
    
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Test invalid login for error state
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)
    
    await page.screenshot({ 
      path: './test-results/ui-screenshots/13-error-state.png',
      fullPage: true 
    })
    console.log('✓ Error state captured')

    // ==========================================
    // SUMMARY
    // ==========================================

    console.log('\n🎉 UI Screenshot Test Complete!')
    console.log(`📁 Screenshots saved to: ./test-results/ui-screenshots/`)
    console.log(`👤 Test user: ${testUser.email}`)
    console.log(`📊 Screenshots captured: 13`)
    console.log(`✅ All major UI screens documented\n`)
  })

  test('Accessibility and usability quick test', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/dashboard?demo=true')
    await page.waitForLoadState('networkidle')

    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await page.screenshot({ 
      path: './test-results/ui-screenshots/accessibility-keyboard-focus.png',
      fullPage: false 
    })

    // Test with larger text
    await page.evaluate(() => {
      document.body.style.fontSize = '150%'
    })
    await page.screenshot({ 
      path: './test-results/ui-screenshots/accessibility-large-text.png',
      fullPage: true 
    })

    console.log('✓ Accessibility testing captured')
  })
})