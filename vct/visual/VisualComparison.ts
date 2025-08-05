/**
 * VCT Visual Comparison Engine
 * Handles screenshot comparison, baseline management, and visual regression detection
 */

import { VCTAgent } from '../agents/base/VCTAgent';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

interface VisualComparisonResult {
  matches: boolean;
  difference: number;
  diffPixels: number;
  totalPixels: number;
  threshold: number;
  diffImagePath?: string;
}

interface BaselineConfig {
  environment: 'local' | 'staging' | 'prod';
  browser: string;
  viewport: string;
  testName: string;
}

interface VisualTestCase {
  name: string;
  selector?: string;
  viewport: { width: number; height: number };
  fullPage: boolean;
  threshold: number;
  ignoreRegions?: Array<{ x: number; y: number; width: number; height: number }>;
}

export class VisualComparison extends VCTAgent {
  private baselinesDir: string;
  private diffsDir: string;
  private defaultThreshold: number = 0.2; // 0.2% pixel difference threshold

  constructor() {
    super('VisualComparison');
    this.baselinesDir = path.join(process.cwd(), 'artifacts', 'baselines');
    this.diffsDir = path.join(process.cwd(), 'artifacts', 'diffs');
    
    this.ensureDirectories();
  }

  /**
   * Compare screenshot with baseline
   */
  async compareWithBaseline(
    screenshotPath: string,
    config: BaselineConfig,
    threshold?: number
  ): Promise<VisualComparisonResult> {
    return this.measureTime(`compareWithBaseline:${config.testName}`, async () => {
      const actualThreshold = threshold || this.defaultThreshold;
      
      this.log(`Comparing screenshot with baseline`, { 
        testName: config.testName,
        threshold: actualThreshold 
      });

      const baselinePath = this.getBaselinePath(config);
      
      // Check if baseline exists
      if (!await this.fileExists(baselinePath)) {
        this.log(`No baseline found, creating new baseline: ${baselinePath}`);
        await this.createBaseline(screenshotPath, baselinePath);
        
        return {
          matches: true,
          difference: 0,
          diffPixels: 0,
          totalPixels: 0,
          threshold: actualThreshold
        };
      }

      // Perform comparison
      const comparisonResult = await this.performPixelComparison(
        screenshotPath,
        baselinePath,
        actualThreshold,
        config
      );

      this.log(`Visual comparison completed`, {
        testName: config.testName,
        matches: comparisonResult.matches,
        difference: `${comparisonResult.difference.toFixed(2)}%`
      });

      return comparisonResult;
    });
  }

  /**
   * Update baseline with new screenshot
   */
  async updateBaseline(screenshotPath: string, config: BaselineConfig): Promise<void> {
    return this.measureTime(`updateBaseline:${config.testName}`, async () => {
      const baselinePath = this.getBaselinePath(config);
      
      this.log(`Updating baseline: ${config.testName}`);
      
      await this.createBaseline(screenshotPath, baselinePath);
      
      this.log(`Baseline updated successfully: ${baselinePath}`);
    });
  }

  /**
   * Run visual regression test suite
   */
  async runVisualTestSuite(
    testCases: VisualTestCase[],
    captureFunction: (testCase: VisualTestCase) => Promise<string>,
    environment: 'local' | 'staging' | 'prod'
  ): Promise<{
    passed: number;
    failed: number;
    results: Array<{
      testCase: VisualTestCase;
      result: VisualComparisonResult;
      screenshotPath: string;
    }>;
  }> {
    return this.measureTime('runVisualTestSuite', async () => {
      this.log(`Running visual test suite with ${testCases.length} test cases`);

      const results = [];
      let passed = 0;
      let failed = 0;

      for (const testCase of testCases) {
        try {
          // Capture screenshot
          const screenshotPath = await captureFunction(testCase);
          
          // Compare with baseline
          const comparisonResult = await this.compareWithBaseline(
            screenshotPath,
            {
              environment,
              browser: 'chromium', // Default to chromium
              viewport: `${testCase.viewport.width}x${testCase.viewport.height}`,
              testName: testCase.name
            },
            testCase.threshold
          );

          results.push({
            testCase,
            result: comparisonResult,
            screenshotPath
          });

          if (comparisonResult.matches) {
            passed++;
          } else {
            failed++;
          }

        } catch (error) {
          this.logError(`Visual test failed: ${testCase.name}`, error);
          failed++;
          
          results.push({
            testCase,
            result: {
              matches: false,
              difference: 100,
              diffPixels: 0,
              totalPixels: 0,
              threshold: testCase.threshold
            },
            screenshotPath: ''
          });
        }
      }

      this.log(`Visual test suite completed`, { passed, failed, total: testCases.length });

      return { passed, failed, results };
    });
  }

  /**
   * Generate visual diff report
   */
  async generateDiffReport(
    results: Array<{
      testCase: VisualTestCase;
      result: VisualComparisonResult;
      screenshotPath: string;
    }>
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    const failed = results.filter(r => !r.result.matches);
    
    let report = `# Visual Regression Test Report\n\n`;
    report += `**Generated**: ${timestamp}\n`;
    report += `**Total Tests**: ${results.length}\n`;
    report += `**Passed**: ${results.length - failed.length}\n`;
    report += `**Failed**: ${failed.length}\n\n`;

    if (failed.length > 0) {
      report += `## Failed Tests\n\n`;
      
      for (const failedTest of failed) {
        report += `### ${failedTest.testCase.name}\n\n`;
        report += `- **Difference**: ${failedTest.result.difference.toFixed(2)}%\n`;
        report += `- **Threshold**: ${failedTest.result.threshold}%\n`;
        report += `- **Viewport**: ${failedTest.testCase.viewport.width}x${failedTest.testCase.viewport.height}\n`;
        
        if (failedTest.result.diffImagePath) {
          report += `- **Diff Image**: ${failedTest.result.diffImagePath}\n`;
        }
        
        report += `- **Screenshot**: ${failedTest.screenshotPath}\n\n`;
      }
    }

    report += `## Test Cases\n\n`;
    
    for (const result of results) {
      const status = result.result.matches ? '✅' : '❌';
      report += `${status} **${result.testCase.name}** - ${result.result.difference.toFixed(2)}%\n`;
    }

    return report;
  }

  /**
   * Private helper methods
   */
  private async performPixelComparison(
    actualPath: string,
    baselinePath: string,
    threshold: number,
    config: BaselineConfig
  ): Promise<VisualComparisonResult> {
    try {
      // Read images
      const actualBuffer = await fs.readFile(actualPath);
      const baselineBuffer = await fs.readFile(baselinePath);
      
      const actualPng = PNG.sync.read(actualBuffer);
      const baselinePng = PNG.sync.read(baselineBuffer);

      // Check dimensions match
      if (actualPng.width !== baselinePng.width || actualPng.height !== baselinePng.height) {
        this.log(`Image dimensions mismatch`, {
          actual: `${actualPng.width}x${actualPng.height}`,
          baseline: `${baselinePng.width}x${baselinePng.height}`
        });

        return {
          matches: false,
          difference: 100,
          diffPixels: actualPng.width * actualPng.height,
          totalPixels: actualPng.width * actualPng.height,
          threshold
        };
      }

      // Create diff image
      const diff = new PNG({ width: actualPng.width, height: actualPng.height });
      
      const diffPixels = pixelmatch(
        actualPng.data,
        baselinePng.data,
        diff.data,
        actualPng.width,
        actualPng.height,
        { threshold: 0.1 }
      );

      const totalPixels = actualPng.width * actualPng.height;
      const differencePercent = (diffPixels / totalPixels) * 100;
      const matches = differencePercent <= threshold;

      let diffImagePath: string | undefined;
      
      // Save diff image if there are differences
      if (diffPixels > 0) {
        diffImagePath = this.getDiffPath(config);
        await fs.writeFile(diffImagePath, PNG.sync.write(diff));
      }

      return {
        matches,
        difference: differencePercent,
        diffPixels,
        totalPixels,
        threshold,
        diffImagePath
      };

    } catch (error) {
      this.logError('Pixel comparison failed', error);
      throw error;
    }
  }

  private async createBaseline(screenshotPath: string, baselinePath: string): Promise<void> {
    const baselineDir = path.dirname(baselinePath);
    await fs.mkdir(baselineDir, { recursive: true });
    await fs.copyFile(screenshotPath, baselinePath);
  }

  private getBaselinePath(config: BaselineConfig): string {
    const filename = `${config.testName}-${config.browser}-${config.viewport}.png`;
    return path.join(this.baselinesDir, config.environment, filename);
  }

  private getDiffPath(config: BaselineConfig): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${config.testName}-${config.browser}-${config.viewport}-${timestamp}.png`;
    return path.join(this.diffsDir, config.environment, filename);
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async ensureDirectories(): Promise<void> {
    const environments = ['local', 'staging', 'prod'];
    
    for (const env of environments) {
      await fs.mkdir(path.join(this.baselinesDir, env), { recursive: true });
      await fs.mkdir(path.join(this.diffsDir, env), { recursive: true });
    }
  }
}