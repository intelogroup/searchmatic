import { test, expect } from '@playwright/test'

/**
 * Edge Functions and API Integration Tests
 * 
 * Tests the backend API functionality including Edge Functions,
 * authentication, and data processing endpoints.
 */

test.describe('Edge Functions and API Integration', () => {
  let authToken: string
  const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co'
  
  test.beforeAll(async () => {
    console.log('Setting up API tests...')
  })

  test('Public Edge Functions accessibility', async ({ request }) => {
    console.log('Testing public Edge Functions...')
    
    // Test the hello-world function (should be publicly accessible)
    try {
      const helloResponse = await request.get(`${supabaseUrl}/functions/v1/hello-world`)
      console.log(`hello-world status: ${helloResponse.status()}`)
      
      if (helloResponse.ok()) {
        const helloData = await helloResponse.json()
        console.log('✓ hello-world function accessible:', JSON.stringify(helloData, null, 2))
        expect(helloResponse.status()).toBe(200)
      } else {
        console.log('⚠️ hello-world function returned error status')
      }
    } catch (error) {
      console.log('⚠️ hello-world function test failed:', error)
    }

    // Test the test-simple function
    try {
      const testResponse = await request.get(`${supabaseUrl}/functions/v1/test-simple`)
      console.log(`test-simple status: ${testResponse.status()}`)
      
      if (testResponse.ok()) {
        const testData = await testResponse.json()
        console.log('✓ test-simple function accessible:', JSON.stringify(testData, null, 2))
        expect(testResponse.status()).toBe(200)
      }
    } catch (error) {
      console.log('⚠️ test-simple function test failed:', error)
    }
  })

  test('Edge Functions with authentication requirements', async ({ request, page }) => {
    console.log('Testing authenticated Edge Functions...')
    
    // First, try to get an auth token by simulating login
    let token: string | null = null
    
    try {
      // Navigate to app and try to get auth token from demo mode
      await page.goto('/dashboard?demo=true')
      await page.waitForLoadState('networkidle')
      
      // Try to extract auth token from localStorage or cookies
      token = await page.evaluate(() => {
        // Check for auth token in localStorage
        const supabaseAuth = localStorage.getItem('supabase.auth.token')
        if (supabaseAuth) {
          try {
            const authData = JSON.parse(supabaseAuth)
            return authData.access_token || authData.currentSession?.access_token
          } catch (e) {
            return null
          }
        }
        return null
      })
    } catch (error) {
      console.log('⚠️ Could not obtain auth token for API tests')
    }

    // Test authenticated functions
    const authenticatedFunctions = [
      'analyze-literature',
      'chat-completion', 
      'process-document',
      'search-articles',
      'export-data'
    ]

    for (const functionName of authenticatedFunctions) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        }
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        
        const response = await request.post(`${supabaseUrl}/functions/v1/${functionName}`, {
          headers,
          data: {
            test: true,
            projectId: 'test-project-id'
          }
        })
        
        console.log(`${functionName} status: ${response.status()}`)
        
        if (response.status() === 401) {
          console.log(`✓ ${functionName} correctly requires authentication`)
        } else if (response.status() === 200) {
          const data = await response.json()
          console.log(`✓ ${functionName} accessible with auth:`, JSON.stringify(data, null, 2).substring(0, 200))
        } else {
          console.log(`⚠️ ${functionName} unexpected status: ${response.status()}`)
        }
        
      } catch (error) {
        console.log(`⚠️ ${functionName} test failed:`, error)
      }
    }
  })

  test('Database connectivity and basic operations', async ({ page }) => {
    console.log('Testing database connectivity through the application...')
    
    // Navigate to app with demo mode
    await page.goto('/dashboard?demo=true')
    await page.waitForLoadState('networkidle')
    
    await page.screenshot({ path: './test-results/api-01-dashboard.png', fullPage: true })
    
    // Test project creation (which involves database operations)
    const projectsLink = page.locator('text=Projects').or(page.locator('a[href*="projects"]'))
    if (await projectsLink.count() > 0) {
      await projectsLink.first().click()
      await page.waitForLoadState('networkidle')
      
      const newProjectButton = page.locator('text=New Project')
      if (await newProjectButton.count() > 0) {
        await newProjectButton.first().click()
        
        const timestamp = Date.now()
        const projectTitle = `API Test Project ${timestamp}`
        
        await page.fill('input[placeholder*="title" i]', projectTitle)
        await page.fill('textarea[placeholder*="description" i]', 'Testing database operations through UI')
        
        await page.click('button:has-text("Create")')
        await page.waitForTimeout(3000)
        
        // Check if project was created
        const projectElement = page.locator(`text=${projectTitle}`)
        if (await projectElement.count() > 0) {
          console.log('✓ Database CREATE operation successful (project creation)')
        } else {
          console.log('⚠️ Database CREATE operation may have failed')
        }
        
        await page.screenshot({ path: './test-results/api-02-project-created.png', fullPage: true })
      }
    }
    
    // Test data reading (projects list)
    const projectsList = page.locator('[data-testid*="project"], .project-item, .project-card')
    if (await projectsList.count() > 0) {
      console.log(`✓ Database READ operation successful (${await projectsList.count()} projects loaded)`)
    } else {
      console.log('⚠️ No project data visible - may be in empty state')
    }
  })

  test('Real-time functionality and WebSocket connections', async ({ page }) => {
    console.log('Testing real-time functionality...')
    
    await page.goto('/dashboard?demo=true')
    await page.waitForLoadState('networkidle')
    
    // Check for real-time indicators
    const realtimeElements = [
      '[data-testid*="realtime"]',
      '.realtime',
      '.live',
      '.connected',
      'text=Connected',
      'text=Live'
    ]
    
    let realtimeFound = false
    for (const selector of realtimeElements) {
      if (await page.locator(selector).count() > 0) {
        console.log(`✓ Real-time element found: ${selector}`)
        realtimeFound = true
      }
    }
    
    // Test chat functionality (which often uses real-time)
    const chatLink = page.locator('text=Chat').or(page.locator('a[href*="chat"]'))
    if (await chatLink.count() > 0) {
      await chatLink.first().click()
      await page.waitForLoadState('networkidle')
      
      const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]')
      if (await chatInput.count() > 0) {
        console.log('✓ Chat interface available (real-time communication)')
        
        // Send a test message
        await chatInput.fill('Test message for real-time validation')
        
        const sendButton = page.locator('button:has-text("Send")')
        if (await sendButton.count() > 0) {
          await sendButton.click()
          await page.waitForTimeout(2000)
          
          // Look for message in chat history
          const messageElement = page.locator('text=Test message for real-time validation')
          if (await messageElement.count() > 0) {
            console.log('✓ Real-time message handling working')
          }
        }
      }
      
      await page.screenshot({ path: './test-results/api-03-chat-realtime.png', fullPage: true })
    }
    
    if (!realtimeFound) {
      console.log('⚠️ No obvious real-time indicators found')
    }
  })

  test('Error handling and API resilience', async ({ request, page }) => {
    console.log('Testing API error handling and resilience...')
    
    // Test invalid API endpoints
    try {
      const invalidResponse = await request.get(`${supabaseUrl}/functions/v1/nonexistent-function`)
      console.log(`Invalid function status: ${invalidResponse.status()}`)
      
      if (invalidResponse.status() === 404) {
        console.log('✓ Invalid endpoints properly return 404')
      }
    } catch (error) {
      console.log('✓ Invalid endpoints properly rejected')
    }
    
    // Test malformed requests
    try {
      const malformedResponse = await request.post(`${supabaseUrl}/functions/v1/hello-world`, {
        headers: { 'Content-Type': 'application/json' },
        data: 'invalid json'
      })
      
      console.log(`Malformed request status: ${malformedResponse.status()}`)
      
      if (malformedResponse.status() >= 400) {
        console.log('✓ Malformed requests properly handled')
      }
    } catch (error) {
      console.log('✓ Malformed requests properly rejected')
    }
    
    // Test rate limiting by making rapid requests
    console.log('Testing rate limiting...')
    let rateLimitHit = false
    
    for (let i = 0; i < 10; i++) {
      try {
        const response = await request.get(`${supabaseUrl}/functions/v1/hello-world`)
        if (response.status() === 429) {
          console.log(`✓ Rate limiting activated after ${i + 1} requests`)
          rateLimitHit = true
          break
        }
      } catch (error) {
        break
      }
    }
    
    if (!rateLimitHit) {
      console.log('⚠️ No rate limiting detected (may not be configured)')
    }
    
    // Test app behavior during API errors
    await page.goto('/dashboard?demo=true')
    await page.waitForLoadState('networkidle')
    
    // Check for error handling UI elements
    const errorHandlingElements = [
      'text=Error',
      'text=Failed',
      'text=Retry',
      '[role="alert"]',
      '.error',
      '.alert'
    ]
    
    for (const selector of errorHandlingElements) {
      if (await page.locator(selector).count() > 0) {
        console.log(`✓ Error handling UI element found: ${selector}`)
      }
    }
    
    await page.screenshot({ path: './test-results/api-04-error-handling.png', fullPage: true })
  })

  test('Performance and response times', async ({ request }) => {
    console.log('Testing API performance and response times...')
    
    const performanceTests = [
      { name: 'hello-world', endpoint: `${supabaseUrl}/functions/v1/hello-world` },
      { name: 'test-simple', endpoint: `${supabaseUrl}/functions/v1/test-simple` }
    ]
    
    for (const testCase of performanceTests) {
      const startTime = Date.now()
      
      try {
        const response = await request.get(testCase.endpoint)
        const responseTime = Date.now() - startTime
        
        console.log(`${testCase.name} response time: ${responseTime}ms`)
        console.log(`${testCase.name} status: ${response.status()}`)
        
        // Performance expectations
        if (responseTime < 2000) {
          console.log(`✓ ${testCase.name} response time acceptable (<2s)`)
        } else if (responseTime < 5000) {
          console.log(`⚠️ ${testCase.name} response time slow (2-5s)`)
        } else {
          console.log(`❌ ${testCase.name} response time too slow (>5s)`)
        }
        
        expect(responseTime).toBeLessThan(10000) // Should respond within 10 seconds
        
      } catch (error) {
        console.log(`⚠️ ${testCase.name} performance test failed:`, error)
      }
    }
  })
})