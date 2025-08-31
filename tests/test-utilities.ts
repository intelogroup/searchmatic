/**
 * Test Utilities for Searchmatic MVP
 * 
 * Shared utilities, helpers, and data generators for testing
 */

import { Page, expect } from '@playwright/test'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// Test configuration
export const TEST_CONFIG = {
  APP_URL: 'http://localhost:5173',
  TIMEOUT: 60000,
  SCREENSHOT_DIR: '/root/repo/test-results',
  DEMO_MODE: true,
}

// Test data generators
export interface TestUser {
  email: string
  password: string
  fullName: string
  timestamp: number
}

export interface TestProject {
  title: string
  description: string
  type: string
  domain: string
  timestamp: number
}

export interface TestProtocol {
  title: string
  researchQuestion: string
  population?: string
  intervention?: string
  comparison?: string
  outcome?: string
  frameworkType: 'pico' | 'spider' | 'other'
}

export const generateTestUser = (): TestUser => {
  const timestamp = Date.now()
  return {
    email: `testuser${timestamp}@searchmatic-test.com`,
    password: 'TestPassword123!',
    fullName: `Test User ${timestamp}`,
    timestamp
  }
}

export const generateTestProject = (): TestProject => {
  const timestamp = Date.now()
  const titles = [
    'Effectiveness of Digital Health Interventions',
    'Machine Learning in Healthcare Diagnosis',
    'Telemedicine Impact on Patient Outcomes',
    'Mobile Health Apps for Chronic Disease Management',
    'AI-Assisted Medical Imaging Analysis'
  ]
  
  return {
    title: `${titles[timestamp % titles.length]} ${timestamp}`,
    description: `This is a comprehensive systematic review examining the research question. Created for testing at ${new Date().toISOString()}`,
    type: 'systematic_review',
    domain: 'Medical Research',
    timestamp
  }
}

export const generateTestProtocol = (frameworkType: 'pico' | 'spider' | 'other' = 'pico'): TestProtocol => {
  if (frameworkType === 'pico') {
    return {
      title: 'PICO Protocol - Digital Health Interventions',
      researchQuestion: 'What is the effectiveness of digital health interventions on clinical outcomes in adult patients with chronic conditions?',
      population: 'Adults aged 18-65 with chronic conditions (diabetes, hypertension, heart disease)',
      intervention: 'Digital health interventions (mobile apps, telemedicine, remote monitoring)',
      comparison: 'Standard care, usual care, or control groups',
      outcome: 'Clinical outcomes (HbA1c, blood pressure, quality of life measures)',
      frameworkType: 'pico'
    }
  } else if (frameworkType === 'spider') {
    return {
      title: 'SPIDER Protocol - Patient Experience Study',
      researchQuestion: 'What are patient experiences and perceptions of digital health technologies?',
      frameworkType: 'spider'
    }
  } else {
    return {
      title: 'General Protocol - Systematic Review',
      researchQuestion: 'What does the literature say about this research area?',
      frameworkType: 'other'
    }
  }
}

// Test file generators
export const generateTestPDF = (): Buffer => {
  // Simple PDF content (base64 decoded)
  const pdfBase64 = `JVBERi0xLjMKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwKL0xlbmd0aCA1MTAK
L0ZpbHRlciAvRmxhdGVEZWNvZGUKPj4Kc3RyZWFtCnjAg2IgCjhAAMYgH
oiBCABGIACggR6IQAAAAI1CAyABAQIDBAUGBwgJCgsMDQ4PEBESExQVFhc
YGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFC
Q0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5
vcHFyc3R1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmp
ucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx
8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz
9PX29/j5+vv8/f7/AAMKZw5kc3RyZWFtCmVuZG9iagoKNSAwIG9iagpbL0lD
Q0Jhc2VkIDMgMCBSXQplbmRvYmoKCjYgMCBvYmoKPDwKL1R5cGUgL0NhdGF
sb2cKL1BhZ2VzIDIgMCBSCi9PQ1Byb3BlcnRpZXMgPDwgL0QgPDwgL09OIFs
gNyAwIFIgXSAvT0ZGIDggMCBSID4+ID4+Ci9PcGVuQWN0aW9uIFsgOSAwIF
IgL0ZpdCBdCj4+CmVuZG9iagoKNyAwIG9iagpbIDQgMCBSIF0KZW5kb2JqC
go4IDAgb2JqCls0IDAgUl0KZW5kb2JqCgo5IDAgb2JqCjw8Ci9UeXBlIC9Q
YWdlCi9QYXJlbnQgMiAwIFIKL0NvbnRlbnRzIDEwIDAgUgovUmVzb3VyY2V
zIDw8IC9Qcm9jU2V0IDExIDAgUiAvRm9udCA8PCA+PiA+Pgo+PgplbmRvYm
oKCjEwIDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCjEgMCAwIDEgM
CA3MCBUTTEKL0Y5IDEyIFRmCigpIFRqCkVUCgplbmRzdHJlYW0KZW5kb2Jq`
  
  return Buffer.from(pdfBase64, 'base64')
}

export const generateTestTextFile = (): string => {
  return `Test Document Content
  
This is a sample research article for testing document extraction functionality.

Abstract:
This study examines the effectiveness of digital health interventions in improving patient outcomes. We conducted a systematic review of 25 studies published between 2020-2023.

Methods:
A comprehensive search was performed across multiple databases including PubMed, Scopus, and Web of Science.

Results:
Digital health interventions showed significant improvements in patient adherence (p<0.05) and clinical outcomes.

Conclusion:
The evidence suggests that digital health interventions are effective for improving patient care outcomes.

Keywords: digital health, telemedicine, patient outcomes, systematic review
`
}

export const createTestFile = (fileName: string, content: Buffer | string): string => {
  const filePath = join('/tmp', fileName)
  writeFileSync(filePath, content)
  return filePath
}

// Page interaction helpers
export class PageHelpers {
  constructor(private page: Page) {}

  async navigateToApp(path: string = '') {
    const url = path ? `${TEST_CONFIG.APP_URL}${path}` : TEST_CONFIG.APP_URL
    await this.page.goto(url)
    await this.page.waitForLoadState('networkidle')
  }

  async navigateWithDemo(path: string = '/dashboard') {
    const url = `${TEST_CONFIG.APP_URL}${path}?demo=true`
    await this.page.goto(url)
    await this.page.waitForLoadState('networkidle')
  }

  async takeScreenshot(name: string, options: { fullPage?: boolean } = { fullPage: true }) {
    const dir = TEST_CONFIG.SCREENSHOT_DIR
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    
    const path = join(dir, `${name}.png`)
    await this.page.screenshot({ path, ...options })
    return path
  }

  async fillFormField(selector: string, value: string, options?: { force?: boolean }) {
    const element = this.page.locator(selector)
    await expect(element).toBeVisible()
    await element.fill(value, options)
  }

  async clickButton(text: string, options?: { timeout?: number }) {
    const button = this.page.locator(`button:has-text("${text}"), input[type="submit"][value="${text}"]`)
    await button.click(options)
  }

  async clickLink(text: string) {
    const link = this.page.locator(`a:has-text("${text}"), [role="link"]:has-text("${text}")`)
    await link.click()
  }

  async waitForText(text: string, timeout: number = 5000) {
    await this.page.waitForSelector(`text=${text}`, { timeout })
  }

  async waitForElement(selector: string, timeout: number = 5000) {
    await this.page.waitForSelector(selector, { timeout })
  }

  async selectOption(selector: string, value: string) {
    await this.page.selectOption(selector, value)
  }

  async uploadFile(selector: string, filePath: string) {
    await this.page.setInputFiles(selector, filePath)
  }

  async handleDialog(accept: boolean = true, promptText?: string) {
    this.page.on('dialog', dialog => {
      if (promptText) {
        dialog.accept(promptText)
      } else if (accept) {
        dialog.accept()
      } else {
        dialog.dismiss()
      }
    })
  }
}

// Authentication helpers
export class AuthHelpers {
  constructor(private page: Page, private helpers: PageHelpers) {}

  async signup(user: TestUser): Promise<boolean> {
    try {
      await this.helpers.navigateToApp('/login')
      
      // Switch to signup mode if needed
      const signupToggle = this.page.locator('text=Don\'t have an account, text=Sign up, text=Create account')
      if (await signupToggle.count() > 0) {
        await signupToggle.first().click()
        await this.page.waitForTimeout(500)
      }

      // Fill signup form
      await this.helpers.fillFormField('input[type="email"]', user.email)
      await this.helpers.fillFormField('input[type="password"]', user.password)
      
      const fullNameInput = this.page.locator('input[placeholder*="name" i], input[id*="name"]')
      if (await fullNameInput.count() > 0) {
        await fullNameInput.fill(user.fullName)
      }

      // Submit form
      await this.helpers.clickButton('Sign Up')
      await this.page.waitForTimeout(3000)

      // Check result
      const currentUrl = this.page.url()
      return currentUrl.includes('dashboard') || 
             currentUrl.includes('projects') || 
             await this.page.locator('text=Check your email').count() > 0

    } catch (error) {
      console.error('Signup failed:', error)
      return false
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      await this.helpers.navigateToApp('/login')
      
      await this.helpers.fillFormField('input[type="email"]', email)
      await this.helpers.fillFormField('input[type="password"]', password)
      
      await this.helpers.clickButton('Sign In')
      await this.page.waitForTimeout(3000)

      const currentUrl = this.page.url()
      return currentUrl.includes('dashboard') || currentUrl.includes('projects')

    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  async logout(): Promise<boolean> {
    try {
      const logoutButton = this.page.locator('text=Logout, text=Sign Out, button:has-text("Logout")')
      if (await logoutButton.count() > 0) {
        await logoutButton.click()
        await this.page.waitForLoadState('networkidle')
        
        // Verify we're back to login page
        return await this.page.locator('text=Login, text=Sign In').count() > 0
      }
      return false
    } catch (error) {
      console.error('Logout failed:', error)
      return false
    }
  }
}

// Project management helpers
export class ProjectHelpers {
  constructor(private page: Page, private helpers: PageHelpers) {}

  async createProject(project: TestProject): Promise<boolean> {
    try {
      await this.helpers.clickLink('Projects')
      await this.page.waitForLoadState('networkidle')
      
      await this.helpers.clickButton('New Project')
      await this.page.waitForLoadState('networkidle')
      
      await this.helpers.fillFormField('input[placeholder*="title" i], input[id*="title"]', project.title)
      await this.helpers.fillFormField('textarea[placeholder*="description" i], textarea[id*="description"]', project.description)
      
      // Select project type if available
      const projectTypeSelector = this.page.locator('select[id*="type"], select[name*="type"]')
      if (await projectTypeSelector.count() > 0) {
        await this.helpers.selectOption('select[id*="type"], select[name*="type"]', project.type)
      }

      await this.helpers.clickButton('Create')
      await this.page.waitForTimeout(2000)
      
      // Verify project was created
      return await this.page.locator(`text=${project.title}`).count() > 0

    } catch (error) {
      console.error('Project creation failed:', error)
      return false
    }
  }

  async selectProject(projectTitle: string): Promise<boolean> {
    try {
      await this.helpers.clickLink('Projects')
      await this.page.waitForLoadState('networkidle')
      
      await this.page.click(`text=${projectTitle}`)
      await this.page.waitForLoadState('networkidle')
      
      return this.page.url().includes('projects/')

    } catch (error) {
      console.error('Project selection failed:', error)
      return false
    }
  }
}

// Protocol helpers
export class ProtocolHelpers {
  constructor(private page: Page, private helpers: PageHelpers) {}

  async createProtocol(protocol: TestProtocol): Promise<boolean> {
    try {
      // Look for Protocol tab or section
      const protocolTab = this.page.locator('text=Protocol, button:has-text("Protocol")')
      if (await protocolTab.count() > 0) {
        await protocolTab.first().click()
        await this.page.waitForTimeout(1000)
      }

      // Create new protocol
      const newProtocolButton = this.page.locator('text=New Protocol, text=Create Protocol, button:has-text("+")')
      if (await newProtocolButton.count() > 0) {
        await newProtocolButton.first().click()
        
        // Fill protocol form
        await this.helpers.fillFormField('input[placeholder*="title" i]', protocol.title)
        await this.helpers.fillFormField('textarea[placeholder*="research question" i], textarea[placeholder*="question" i]', protocol.researchQuestion)
        
        // Select framework if available
        const frameworkSelector = this.page.locator('select[id*="framework"], select[name*="framework"]')
        if (await frameworkSelector.count() > 0) {
          await this.helpers.selectOption('select[id*="framework"], select[name*="framework"]', protocol.frameworkType)
        }

        // Fill PICO fields if framework is PICO
        if (protocol.frameworkType === 'pico') {
          const populationField = this.page.locator('input[placeholder*="population" i], textarea[placeholder*="population" i]')
          if (await populationField.count() > 0 && protocol.population) {
            await populationField.fill(protocol.population)
          }

          const interventionField = this.page.locator('input[placeholder*="intervention" i], textarea[placeholder*="intervention" i]')
          if (await interventionField.count() > 0 && protocol.intervention) {
            await interventionField.fill(protocol.intervention)
          }

          const comparisonField = this.page.locator('input[placeholder*="comparison" i], textarea[placeholder*="comparison" i]')
          if (await comparisonField.count() > 0 && protocol.comparison) {
            await comparisonField.fill(protocol.comparison)
          }

          const outcomeField = this.page.locator('input[placeholder*="outcome" i], textarea[placeholder*="outcome" i]')
          if (await outcomeField.count() > 0 && protocol.outcome) {
            await outcomeField.fill(protocol.outcome)
          }
        }

        // Submit protocol
        await this.helpers.clickButton('Create')
        await this.page.waitForTimeout(2000)
        
        return true
      }
      
      return false

    } catch (error) {
      console.error('Protocol creation failed:', error)
      return false
    }
  }
}

// Document helpers
export class DocumentHelpers {
  constructor(private page: Page, private helpers: PageHelpers) {}

  async uploadDocument(fileName: string, content: Buffer | string, processingType: string = 'text_extraction'): Promise<boolean> {
    try {
      // Look for Upload or Documents section
      const documentsTab = this.page.locator('text=Documents, text=Upload, text=Files')
      if (await documentsTab.count() > 0) {
        await documentsTab.first().click()
        await this.page.waitForTimeout(1000)
      }

      // Create temporary file
      const filePath = createTestFile(fileName, content)
      
      // Find upload input
      const uploadInput = this.page.locator('input[type="file"]')
      if (await uploadInput.count() > 0) {
        await uploadInput.first().setInputFiles(filePath)
        await this.page.waitForTimeout(2000)
        
        // Select processing type if available
        const processingSelector = this.page.locator('select[name*="processing"], select[id*="processing"]')
        if (await processingSelector.count() > 0) {
          await this.helpers.selectOption('select[name*="processing"], select[id*="processing"]', processingType)
        }

        // Submit upload if needed
        const uploadButton = this.page.locator('button:has-text("Upload"), button[type="submit"]')
        if (await uploadButton.count() > 0) {
          await uploadButton.click()
        }

        return true
      }
      
      return false

    } catch (error) {
      console.error('Document upload failed:', error)
      return false
    }
  }

  async waitForProcessingComplete(timeout: number = 30000): Promise<boolean> {
    try {
      // Wait for processing indicators to disappear
      await this.page.waitForFunction(
        () => {
          const processingElements = document.querySelectorAll('text=Processing, text=Extracting, .animate-spin')
          return processingElements.length === 0
        },
        { timeout }
      )
      
      // Check for completion indicators
      const completedIndicator = this.page.locator('text=Completed, text=Success, .text-green')
      return await completedIndicator.count() > 0

    } catch (error) {
      console.error('Processing timeout or failed:', error)
      return false
    }
  }
}

// Export test results
export const saveTestResults = (testName: string, results: any) => {
  const resultsDir = join(TEST_CONFIG.SCREENSHOT_DIR, 'results')
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true })
  }
  
  const resultsFile = join(resultsDir, `${testName}-results.json`)
  writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    testName,
    results
  }, null, 2))
}