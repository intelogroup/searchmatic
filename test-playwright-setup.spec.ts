import { test, expect } from '@playwright/test'

test('verify Playwright setup', async ({ page }) => {
  // Test that we can navigate to the dev server
  await page.goto('http://localhost:5173')
  
  // Check that the page loads
  await expect(page).toHaveTitle(/Searchmatic/)
  
  console.log('✅ Playwright setup working correctly!')
})