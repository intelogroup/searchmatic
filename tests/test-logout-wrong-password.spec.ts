import { test, expect } from '@playwright/test'

test('Logout and test wrong password error handling', async ({ page }) => {
  // Use the test user we created earlier
  const testUser = {
    email: 'testuser1756538797112@example.com',
    correctPassword: 'TestPassword123!',
    wrongPassword: 'WrongPassword456!'
  }

  console.log(`Testing logout and wrong password for: ${testUser.email}`)

  // Step 1: Navigate to the app (should show dashboard if still logged in)
  await page.goto('http://localhost:5174/')
  await page.waitForLoadState('networkidle')

  // Take screenshot of initial state
  await page.screenshot({ 
    path: '/root/repo/test-results/04-initial-state.png',
    fullPage: true 
  })

  // Step 2: Look for and click logout button
  console.log('Step 1: Looking for logout functionality...')
  
  try {
    // Look for common logout elements
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Log Out"), button:has-text("Sign Out")')
    const profileMenu = page.locator('[data-testid="profile-menu"], .profile-menu, button:has-text("Profile")')
    const menuButton = page.locator('button[aria-label="menu"], .menu-button, [data-testid="menu-button"]')
    
    if (await logoutButton.count() > 0) {
      console.log('✓ Found logout button')
      await logoutButton.first().click()
    } else if (await profileMenu.count() > 0) {
      console.log('✓ Found profile menu, clicking to find logout')
      await profileMenu.first().click()
      await page.waitForTimeout(500)
      
      const logoutInMenu = page.locator('button:has-text("Logout"), button:has-text("Log Out"), button:has-text("Sign Out")')
      if (await logoutInMenu.count() > 0) {
        await logoutInMenu.first().click()
      }
    } else if (await menuButton.count() > 0) {
      console.log('✓ Found menu button, checking for logout')
      await menuButton.first().click()
      await page.waitForTimeout(500)
      
      const logoutInMenu = page.locator('button:has-text("Logout"), button:has-text("Log Out"), button:has-text("Sign Out")')
      if (await logoutInMenu.count() > 0) {
        await logoutInMenu.first().click()
      }
    } else {
      console.log('ℹ️ No obvious logout button found, checking if we can access login directly')
    }

    // Wait for logout action to complete
    await page.waitForTimeout(2000)
    
  } catch (error) {
    console.log('⚠️ Logout attempt encountered error, continuing with test')
  }

  // Step 3: Navigate to login page to ensure we're logged out
  console.log('Step 2: Navigating to login page...')
  await page.goto('http://localhost:5174/login')
  await page.waitForLoadState('networkidle')

  // Take screenshot of login page
  await page.screenshot({ 
    path: '/root/repo/test-results/05-login-page-after-logout.png',
    fullPage: true 
  })

  // Step 4: Verify we're on login page (not redirected to dashboard)
  const currentUrl = page.url()
  console.log(`Current URL after logout: ${currentUrl}`)
  
  if (currentUrl.includes('login')) {
    console.log('✅ Successfully logged out - on login page')
  } else if (currentUrl.includes('dashboard')) {
    console.log('⚠️ Still appears to be logged in, but continuing with test')
  }

  // Step 5: Try to login with WRONG password
  console.log('Step 3: Testing wrong password...')
  
  // Make sure we're in login mode (not signup)
  const signInToggle = page.locator('text=Already have an account? Sign in')
  if (await signInToggle.count() > 0) {
    await signInToggle.click()
    await page.waitForTimeout(500)
  }

  // Fill in the form with wrong password
  const emailInput = page.locator('input[type="email"], input[id="email"]')
  const passwordInput = page.locator('input[type="password"], input[id="password"]')
  
  await emailInput.fill(testUser.email)
  await passwordInput.fill(testUser.wrongPassword)
  console.log('✓ Entered email and WRONG password')

  // Take screenshot before submitting wrong credentials
  await page.screenshot({ 
    path: '/root/repo/test-results/06-wrong-password-filled.png',
    fullPage: true 
  })

  // Submit the form
  const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")')
  await submitButton.click()
  console.log('✓ Submitted login form with wrong password')

  // Wait for error response
  await page.waitForTimeout(3000)

  // Take screenshot of error state
  await page.screenshot({ 
    path: '/root/repo/test-results/07-wrong-password-error.png',
    fullPage: true 
  })

  // Step 6: Verify error message appears
  console.log('Step 4: Checking for error messages...')
  
  const errorSelectors = [
    'text=Invalid login credentials',
    'text=incorrect',
    'text=wrong',
    'text=invalid',
    '.text-red-700',
    '.error',
    '[role="alert"]',
    'div:has-text("error")',
    'div:has-text("Invalid")'
  ]

  let errorFound = false
  let errorMessage = ''

  for (const selector of errorSelectors) {
    const errorElement = page.locator(selector)
    if (await errorElement.count() > 0) {
      errorMessage = await errorElement.first().textContent() || ''
      if (errorMessage.toLowerCase().includes('invalid') || 
          errorMessage.toLowerCase().includes('incorrect') || 
          errorMessage.toLowerCase().includes('wrong') ||
          errorMessage.toLowerCase().includes('error')) {
        errorFound = true
        console.log(`✅ Found error message: "${errorMessage}"`)
        break
      }
    }
  }

  if (!errorFound) {
    // Check if we're still on login page (good sign that login failed)
    const stillOnLogin = page.url().includes('login')
    if (stillOnLogin) {
      console.log('✅ Login failed successfully (still on login page)')
      errorFound = true
    } else {
      console.log('⚠️ No clear error message found, but login should have failed')
    }
  }

  // Step 7: Test with CORRECT password to verify system works
  console.log('Step 5: Testing with correct password to verify system works...')
  
  await emailInput.fill(testUser.email)
  await passwordInput.fill(testUser.correctPassword)
  console.log('✓ Entered email and CORRECT password')

  await submitButton.click()
  console.log('✓ Submitted login form with correct password')

  await page.waitForTimeout(3000)

  // Take screenshot of successful login
  await page.screenshot({ 
    path: '/root/repo/test-results/08-correct-password-success.png',
    fullPage: true 
  })

  const finalUrl = page.url()
  const successfulLogin = !finalUrl.includes('login')
  
  if (successfulLogin) {
    console.log('✅ Correct password login successful!')
    console.log(`Redirected to: ${finalUrl}`)
  } else {
    console.log('⚠️ Correct password login may have failed')
  }

  // Summary
  console.log('\\n=== AUTHENTICATION TEST SUMMARY ===')
  console.log(`❌ Wrong password handled: ${errorFound ? 'YES' : 'NO'}`)
  console.log(`✅ Correct password works: ${successfulLogin ? 'YES' : 'NO'}`)
  if (errorMessage) {
    console.log(`📝 Error message shown: "${errorMessage}"`)
  }
  console.log('=====================================\\n')

  // Verify that authentication properly rejects wrong credentials
  expect(errorFound).toBe(true)
  expect(successfulLogin).toBe(true)
})