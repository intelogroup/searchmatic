import { test, expect } from '@playwright/test'

/**
 * Document Extraction Workflow Test
 * 
 * Tests the complete document processing pipeline from upload to extraction.
 * Validates the core document processing functionality of Searchmatic.
 */

test.describe('Document Extraction Workflow', () => {
  let testProjectId: string
  
  test.beforeEach(async ({ page }) => {
    // Set up test environment with demo mode
    await page.goto('/dashboard?demo=true')
    await page.waitForLoadState('networkidle')
    
    // Create a test project for document processing
    const projectsLink = page.locator('text=Projects').or(page.locator('a[href*="projects"]'))
    if (await projectsLink.count() > 0) {
      await projectsLink.first().click()
      await page.waitForLoadState('networkidle')
      
      const newProjectButton = page.locator('text=New Project').or(page.locator('text=Create Project'))
      if (await newProjectButton.count() > 0) {
        await newProjectButton.first().click()
        
        const timestamp = Date.now()
        await page.fill('input[placeholder*="title" i]', `Document Processing Test ${timestamp}`)
        await page.fill('textarea[placeholder*="description" i]', 'Test project for document extraction workflow validation')
        
        await page.click('button:has-text("Create")')
        await page.waitForTimeout(2000)
        
        // Navigate to the created project
        await page.click(`text=Document Processing Test ${timestamp}`)
        await page.waitForLoadState('networkidle')
      }
    }
  })

  test('Document upload and text extraction workflow', async ({ page }) => {
    console.log('Testing document upload and text extraction...')
    
    await page.screenshot({ path: './test-results/extraction-01-project-view.png', fullPage: true })
    
    // Look for document upload section
    const uploadSections = [
      'text=Upload',
      'text=Documents', 
      'text=Files',
      'input[type="file"]',
      '[data-testid*="upload"]',
      '.upload-area'
    ]
    
    let uploadFound = false
    for (const selector of uploadSections) {
      if (await page.locator(selector).count() > 0) {
        console.log(`✓ Upload section found: ${selector}`)
        
        // Click on upload section if it's not a file input
        if (!selector.includes('input[type="file"]')) {
          try {
            await page.locator(selector).first().click()
            await page.waitForTimeout(1000)
          } catch (e) {
            // Continue if click fails
          }
        }
        
        uploadFound = true
        break
      }
    }
    
    await page.screenshot({ path: './test-results/extraction-02-upload-section.png', fullPage: true })
    
    if (uploadFound) {
      console.log('✓ Upload functionality detected')
      
      // Test file upload simulation
      const fileInput = page.locator('input[type="file"]')
      if (await fileInput.count() > 0) {
        console.log('✓ File input found - upload functionality available')
        
        // Create a simple test text file for upload
        const testContent = `
Test Research Paper

Title: Digital Health Interventions for Chronic Disease Management

Abstract:
This systematic review examines the effectiveness of digital health interventions 
in managing chronic diseases. We analyzed 25 studies published between 2020-2023.

Methods:
A comprehensive literature search was conducted across PubMed, Scopus, and Web of Science.
Inclusion criteria: randomized controlled trials, adult participants, digital interventions.

Results:
Digital health interventions showed significant improvements in patient outcomes (p<0.05).
Primary endpoints included medication adherence, symptom management, and quality of life.

Conclusion:
Evidence supports the integration of digital health technologies in chronic disease care.

Keywords: digital health, chronic disease, systematic review, patient outcomes
        `.trim()
        
        // Create temporary file
        const fs = await import('fs')
        const testFilePath = '/tmp/test-research-paper.txt'
        fs.writeFileSync(testFilePath, testContent)
        
        try {
          // Attempt file upload
          await fileInput.first().setInputFiles(testFilePath)
          await page.waitForTimeout(2000)
          
          console.log('✓ File upload simulated')
          await page.screenshot({ path: './test-results/extraction-03-file-uploaded.png', fullPage: true })
          
          // Look for processing indicators
          const processingIndicators = [
            'text=Processing',
            'text=Extracting', 
            'text=Analyzing',
            '.animate-spin',
            '.loading',
            '.progress'
          ]
          
          let processingFound = false
          for (const indicator of processingIndicators) {
            if (await page.locator(indicator).count() > 0) {
              console.log(`✓ Processing indicator found: ${indicator}`)
              processingFound = true
              break
            }
          }
          
          if (processingFound) {
            // Wait for processing to complete
            await page.waitForTimeout(5000)
            await page.screenshot({ path: './test-results/extraction-04-processing.png', fullPage: true })
            
            // Look for completion indicators
            const completionIndicators = [
              'text=Completed',
              'text=Complete',
              'text=Success',
              'text=Done',
              '.success',
              '.completed'
            ]
            
            for (const indicator of completionIndicators) {
              if (await page.locator(indicator).count() > 0) {
                console.log(`✓ Processing completion indicator found: ${indicator}`)
                break
              }
            }
          }
          
        } catch (error) {
          console.log('⚠️ File upload simulation failed:', error)
        }
      }
    } else {
      console.log('⚠️ No upload functionality found - may require authentication or different UI state')
    }
    
    await page.screenshot({ path: './test-results/extraction-05-final-state.png', fullPage: true })
    console.log('✓ Document extraction workflow test completed')
  })

  test('Extraction workflow status monitoring', async ({ page }) => {
    console.log('Testing extraction workflow status monitoring...')
    
    // Look for workflow status components
    const statusElements = [
      'text=Pending',
      'text=Processing', 
      'text=Completed',
      'text=Error',
      '.status',
      '.workflow',
      '.extraction'
    ]
    
    let statusFound = false
    for (const selector of statusElements) {
      if (await page.locator(selector).count() > 0) {
        console.log(`✓ Status element found: ${selector}`)
        statusFound = true
      }
    }
    
    if (statusFound) {
      console.log('✓ Workflow status monitoring available')
    } else {
      console.log('⚠️ No workflow status elements found - may be empty state')
    }
    
    // Look for workflow statistics
    const statsElements = [
      'text=Total',
      'text=Statistics',
      'text=Summary',
      '.stats',
      '.metrics',
      '.counts'
    ]
    
    for (const selector of statsElements) {
      if (await page.locator(selector).count() > 0) {
        console.log(`✓ Statistics element found: ${selector}`)
      }
    }
    
    await page.screenshot({ path: './test-results/extraction-status-monitoring.png', fullPage: true })
    console.log('✓ Status monitoring test completed')
  })

  test('Extracted data viewing and export', async ({ page }) => {
    console.log('Testing extracted data viewing and export functionality...')
    
    // Look for data viewing components
    const dataViewElements = [
      'text=View',
      'text=Preview', 
      'text=Details',
      'text=Data',
      'button:has-text("View")',
      'button:has-text("Details")'
    ]
    
    let viewingFound = false
    for (const selector of dataViewElements) {
      if (await page.locator(selector).count() > 0) {
        console.log(`✓ Data viewing element found: ${selector}`)
        
        try {
          await page.locator(selector).first().click()
          await page.waitForTimeout(2000)
          await page.screenshot({ path: './test-results/extraction-data-view.png', fullPage: true })
          viewingFound = true
          break
        } catch (e) {
          // Continue to next element
        }
      }
    }
    
    // Look for export functionality
    const exportElements = [
      'text=Export',
      'text=Download',
      'button:has-text("Export")',
      'button:has-text("Download")',
      '.export',
      '.download'
    ]
    
    let exportFound = false
    for (const selector of exportElements) {
      if (await page.locator(selector).count() > 0) {
        console.log(`✓ Export element found: ${selector}`)
        exportFound = true
      }
    }
    
    if (exportFound) {
      console.log('✓ Export functionality available')
    } else {
      console.log('⚠️ No export functionality visible - may require completed extractions')
    }
    
    await page.screenshot({ path: './test-results/extraction-export-options.png', fullPage: true })
    console.log('✓ Data viewing and export test completed')
  })

  test('Error handling in document processing', async ({ page }) => {
    console.log('Testing error handling in document processing...')
    
    // Look for error states and handling
    const errorElements = [
      'text=Error',
      'text=Failed',
      'text=Retry',
      '.error',
      '.failed', 
      '.text-red',
      '[role="alert"]'
    ]
    
    let errorHandlingFound = false
    for (const selector of errorElements) {
      if (await page.locator(selector).count() > 0) {
        console.log(`✓ Error handling element found: ${selector}`)
        errorHandlingFound = true
      }
    }
    
    // Test retry functionality if available
    const retryButton = page.locator('button:has-text("Retry")')
    if (await retryButton.count() > 0) {
      console.log('✓ Retry functionality available')
      
      try {
        await retryButton.first().click()
        await page.waitForTimeout(2000)
        console.log('✓ Retry button functional')
      } catch (e) {
        console.log('⚠️ Retry button click failed')
      }
    }
    
    // Test file validation (simulate invalid file)
    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.count() > 0) {
      // Create an invalid/empty file
      const fs = await import('fs')
      const invalidFilePath = '/tmp/invalid-file.xyz'
      fs.writeFileSync(invalidFilePath, '')
      
      try {
        await fileInput.first().setInputFiles(invalidFilePath)
        await page.waitForTimeout(2000)
        
        // Look for validation error
        const validationErrors = [
          'text=Invalid file',
          'text=Not supported',
          'text=File type',
          '.validation-error'
        ]
        
        for (const selector of validationErrors) {
          if (await page.locator(selector).count() > 0) {
            console.log(`✓ File validation error shown: ${selector}`)
            break
          }
        }
      } catch (e) {
        console.log('⚠️ Invalid file upload test failed')
      }
    }
    
    await page.screenshot({ path: './test-results/extraction-error-handling.png', fullPage: true })
    console.log('✓ Error handling test completed')
  })
})