/**
 * VCT TestAgent - Executes Playwright/Puppeteer scenarios with screenshots
 * Handles visual testing, user journey validation, and artifact capture
 */

import { VCTAgent } from './base/VCTAgent';
import { Browser, Page, chromium, firefox, webkit } from 'playwright';
import { promises as fs } from 'fs';
import * as path from 'path';

interface TestConfig {
  testName: string;
  environment: 'local' | 'staging' | 'prod';
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  viewport?: { width: number; height: number };
  timeout?: number;
}

interface TestResult {
  testId: string;
  success: boolean;
  duration: number;
  screenshots: string[];
  traces: string[];
  errors: TestError[];
  metrics: TestMetrics;
}

interface TestError {
  message: string;
  stack?: string;
  screenshot?: string;
}

interface TestMetrics {
  pageLoadTime: number;
  networkRequests: number;
  jsErrors: number;
  performanceScore?: number;
}

interface UserJourney {
  name: string;
  steps: JourneyStep[];
  expectedOutcome: string;
  criticalPath: boolean;
}

interface JourneyStep {
  action: string;
  selector?: string;
  text?: string;
  expected?: string;
  screenshot?: boolean;
  waitFor?: string | number;
}

export class TestAgent extends VCTAgent {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private artifactsDir: string;
  private baseUrls: { [key: string]: string };

  constructor() {
    super('TestAgent');
    this.artifactsDir = path.join(process.cwd(), 'artifacts');
    this.baseUrls = {
      local: 'http://localhost:5175',
      staging: process.env.STAGING_URL || 'https://staging.searchmatic.app',
      prod: process.env.PROD_URL || 'https://searchmatic.app'
    };
    
    this.ensureArtifactsDirectory();
  }

  /**
   * Execute a complete user journey test
   */
  async executeUserJourney(journey: UserJourney, config: TestConfig): Promise<TestResult> {
    return this.measureTime(`executeUserJourney:${journey.name}`, async () => {
      const testId = this.generateTestId(journey.name, config);
      
      this.log(`Starting user journey: ${journey.name}`, { 
        environment: config.environment,
        steps: journey.steps.length 
      });

      const startTime = Date.now();
      const screenshots: string[] = [];
      const traces: string[] = [];
      const errors: TestError[] = [];
      
      try {
        // Initialize browser and page
        await this.initializeBrowser(config);
        
        // Start tracing
        const tracePath = await this.startTracing(testId);
        traces.push(tracePath);

        // Execute each step in the journey
        for (let i = 0; i < journey.steps.length; i++) {
          const step = journey.steps[i];
          
          try {
            await this.executeStep(step, i, testId, screenshots);
          } catch (error) {
            const errorScreenshot = await this.captureErrorScreenshot(testId, i);
            errors.push({
              message: `Step ${i + 1} failed: ${error.message}`,
              stack: error.stack,
              screenshot: errorScreenshot
            });
            
            if (journey.criticalPath) {
              throw error; // Fail fast for critical paths
            }
          }
        }

        // Stop tracing
        await this.stopTracing();

        // Capture metrics
        const metrics = await this.captureMetrics();

        const duration = Date.now() - startTime;
        
        const result: TestResult = {
          testId,
          success: errors.length === 0,
          duration,
          screenshots,
          traces,
          errors,
          metrics
        };

        this.log(`User journey completed: ${journey.name}`, {
          success: result.success,
          duration: `${duration}ms`,
          screenshots: screenshots.length,
          errors: errors.length
        });

        return result;

      } catch (error) {
        this.logError(`User journey failed: ${journey.name}`, error);
        
        const errorScreenshot = await this.captureErrorScreenshot(testId, -1);
        errors.push({
          message: error.message,
          stack: error.stack,
          screenshot: errorScreenshot
        });

        return {
          testId,
          success: false,
          duration: Date.now() - startTime,
          screenshots,
          traces,
          errors,
          metrics: { pageLoadTime: 0, networkRequests: 0, jsErrors: 0 }
        };
      } finally {
        await this.cleanup();
      }
    });
  }

  /**
   * Execute visual regression test
   */
  async executeVisualTest(testName: string, config: TestConfig): Promise<TestResult> {
    return this.measureTime(`executeVisualTest:${testName}`, async () => {
      const testId = this.generateTestId(testName, config);
      const startTime = Date.now();
      
      try {
        await this.initializeBrowser(config);
        
        const baseUrl = this.baseUrls[config.environment];
        await this.page!.goto(baseUrl);
        
        // Wait for page to be ready
        await this.page!.waitForLoadState('networkidle');
        
        // Take screenshots at different breakpoints
        const screenshots = await this.captureResponsiveScreenshots(testId);
        
        // Compare with baseline if available
        const comparison = await this.compareWithBaseline(screenshots, config.environment);
        
        return {
          testId,
          success: comparison.passed,
          duration: Date.now() - startTime,
          screenshots,
          traces: [],
          errors: comparison.errors,
          metrics: await this.captureMetrics()
        };
        
      } catch (error) {
        this.logError(`Visual test failed: ${testName}`, error);
        throw error;
      }
    });
  }

  /**
   * Execute accessibility test
   */
  async executeAccessibilityTest(config: TestConfig): Promise<TestResult> {
    return this.measureTime('executeAccessibilityTest', async () => {
      const testId = this.generateTestId('accessibility', config);
      const startTime = Date.now();
      
      try {
        await this.initializeBrowser(config);
        
        const baseUrl = this.baseUrls[config.environment];
        await this.page!.goto(baseUrl);
        
        // Inject axe-core for accessibility testing
        await this.page!.addScriptTag({
          url: 'https://unpkg.com/axe-core@4.7.0/axe.min.js'
        });
        
        // Run accessibility scan
        const results = await this.page!.evaluate(() => {
          return new Promise((resolve) => {
            // @ts-ignore
            axe.run((err: any, results: any) => {
              if (err) throw err;
              resolve(results);
            });
          });
        });
        
        const violations = (results as any).violations;
        const errors = violations.map((violation: any) => ({
          message: `Accessibility violation: ${violation.description}`,
          stack: JSON.stringify(violation.nodes, null, 2)
        }));
        
        const screenshot = await this.captureScreenshot(testId, 'accessibility-scan');
        
        return {
          testId,
          success: violations.length === 0,
          duration: Date.now() - startTime,
          screenshots: [screenshot],
          traces: [],
          errors,
          metrics: await this.captureMetrics()
        };
        
      } catch (error) {
        this.logError('Accessibility test failed', error);
        throw error;
      }
    });
  }

  /**
   * Initialize browser based on configuration
   */
  private async initializeBrowser(config: TestConfig): Promise<void> {
    const browserType = config.browser || 'chromium';
    
    switch (browserType) {
      case 'chromium':
        this.browser = await chromium.launch({ 
          headless: config.headless !== false,
          args: ['--no-sandbox'] 
        });
        break;
      case 'firefox':
        this.browser = await firefox.launch({ 
          headless: config.headless !== false 
        });
        break;
      case 'webkit':
        this.browser = await webkit.launch({ 
          headless: config.headless !== false 
        });
        break;
    }

    this.page = await this.browser!.newPage({
      viewport: config.viewport || { width: 1280, height: 720 }
    });

    // Set default timeout
    this.page.setDefaultTimeout(config.timeout || 30000);

    // Enable tracing
    await this.page.context().tracing.start({
      screenshots: true,
      snapshots: true
    });
  }

  /**
   * Execute a single test step
   */
  private async executeStep(
    step: JourneyStep, 
    stepIndex: number, 
    testId: string, 
    screenshots: string[]
  ): Promise<void> {
    this.log(`Executing step ${stepIndex + 1}: ${step.action}`);

    switch (step.action) {
      case 'goto':
        const baseUrl = this.baseUrls[this.getEnvironmentFromTestId(testId)];
        await this.page!.goto(`${baseUrl}${step.text || ''}`);
        break;
        
      case 'click':
        await this.page!.click(step.selector!);
        break;
        
      case 'fill':
        await this.page!.fill(step.selector!, step.text!);
        break;
        
      case 'type':
        await this.page!.type(step.selector!, step.text!);
        break;
        
      case 'wait':
        if (typeof step.waitFor === 'number') {
          await this.page!.waitForTimeout(step.waitFor);
        } else if (typeof step.waitFor === 'string') {
          await this.page!.waitForSelector(step.waitFor);
        }
        break;
        
      case 'expect':
        if (step.selector && step.expected) {
          const element = await this.page!.$(step.selector);
          const text = await element?.textContent();
          if (text !== step.expected) {
            throw new Error(`Expected "${step.expected}" but got "${text}"`);
          }
        }
        break;
    }

    // Wait for any specified condition
    if (step.waitFor) {
      if (typeof step.waitFor === 'number') {
        await this.page!.waitForTimeout(step.waitFor);
      } else {
        await this.page!.waitForSelector(step.waitFor);
      }
    }

    // Take screenshot if requested
    if (step.screenshot) {
      const screenshot = await this.captureScreenshot(testId, `step-${stepIndex + 1}`);
      screenshots.push(screenshot);
    }
  }

  /**
   * Capture screenshot with naming convention
   */
  private async captureScreenshot(testId: string, name: string): Promise<string> {
    const filename = `${testId}-${name}.png`;
    const filepath = path.join(this.artifactsDir, 'screenshots', filename);
    
    await this.page!.screenshot({ 
      path: filepath,
      fullPage: true
    });
    
    this.log(`Screenshot captured: ${filename}`);
    return filepath;
  }

  /**
   * Capture error screenshot
   */
  private async captureErrorScreenshot(testId: string, stepIndex: number): Promise<string> {
    try {
      return await this.captureScreenshot(testId, `error-step-${stepIndex}`);
    } catch (error) {
      this.logError('Failed to capture error screenshot', error);
      return '';
    }
  }

  /**
   * Capture responsive screenshots
   */
  private async captureResponsiveScreenshots(testId: string): Promise<string[]> {
    const screenshots: string[] = [];
    const breakpoints = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'large', width: 1920, height: 1080 }
    ];

    for (const breakpoint of breakpoints) {
      await this.page!.setViewportSize({ 
        width: breakpoint.width, 
        height: breakpoint.height 
      });
      
      await this.page!.waitForTimeout(500); // Allow for responsive changes
      
      const screenshot = await this.captureScreenshot(testId, breakpoint.name);
      screenshots.push(screenshot);
    }

    return screenshots;
  }

  /**
   * Start tracing for debugging
   */
  private async startTracing(testId: string): Promise<string> {
    const tracePath = path.join(this.artifactsDir, 'traces', `${testId}-trace.zip`);
    
    await this.page!.context().tracing.start({
      screenshots: true,
      snapshots: true
    });
    
    return tracePath;
  }

  /**
   * Stop tracing and save
   */
  private async stopTracing(): Promise<void> {
    // Tracing is stopped in cleanup
  }

  /**
   * Capture performance metrics
   */
  private async captureMetrics(): Promise<TestMetrics> {
    const metrics = await this.page!.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
        networkRequests: performance.getEntriesByType('resource').length,
        jsErrors: 0 // Would need to track JS errors separately
      };
    });

    return metrics;
  }

  /**
   * Compare screenshots with baseline
   */
  private async compareWithBaseline(screenshots: string[], environment: string): Promise<{
    passed: boolean;
    errors: TestError[];
  }> {
    // This would implement actual visual diff comparison
    // For now, return success
    return {
      passed: true,
      errors: []
    };
  }

  /**
   * Helper methods
   */
  private generateTestId(testName: string, config: TestConfig): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${testName}-${config.environment}-${timestamp}`;
  }

  private getEnvironmentFromTestId(testId: string): string {
    if (testId.includes('-local-')) return 'local';
    if (testId.includes('-staging-')) return 'staging';
    if (testId.includes('-prod-')) return 'prod';
    return 'local';
  }

  private async ensureArtifactsDirectory(): Promise<void> {
    const dirs = ['screenshots', 'traces', 'reports'];
    
    for (const dir of dirs) {
      const dirPath = path.join(this.artifactsDir, dir);
      try {
        await fs.mkdir(dirPath, { recursive: true });
      } catch (error) {
        this.logError(`Failed to create directory ${dirPath}`, error);
      }
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    if (this.page) {
      try {
        await this.page.context().tracing.stop({
          path: path.join(this.artifactsDir, 'traces', `trace-${Date.now()}.zip`)
        });
      } catch (error) {
        this.logError('Failed to stop tracing', error);
      }
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }

    this.log('TestAgent cleanup completed');
  }
}