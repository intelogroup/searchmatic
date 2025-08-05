/**
 * VCT Custom Playwright Reporter
 * Integrates Playwright test results with VCT DocAgent for canonical documentation
 */

import { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import { DocAgent } from '../agents/DocAgent';
import * as path from 'path';

export default class VCTReporter implements Reporter {
  private docAgent: DocAgent;
  private startTime: number = 0;
  private testResults: Array<{
    test: TestCase;
    result: TestResult;
    suite: Suite;
  }> = [];

  constructor() {
    this.docAgent = new DocAgent();
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.startTime = Date.now();
    console.log(`🎯 VCT Reporter: Starting test run with ${suite.allTests().length} tests`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.testResults.push({
      test,
      result,
      suite: test.parent
    });
  }

  async onEnd(result: FullResult) {
    const duration = Date.now() - this.startTime;
    const environment = process.env.TEST_ENV || process.env.VCT_ENVIRONMENT || 'local';
    
    console.log(`🎯 VCT Reporter: Test run completed in ${duration}ms`);

    // Analyze results
    const passed = this.testResults.filter(r => r.result.status === 'passed');
    const failed = this.testResults.filter(r => r.result.status === 'failed');
    const skipped = this.testResults.filter(r => r.result.status === 'skipped');

    // Generate comprehensive test report
    const testReport = this.generateTestReport({
      passed: passed.length,
      failed: failed.length,
      skipped: skipped.length,
      duration,
      environment
    });

    try {
      // Record successful tests
      if (passed.length > 0) {
        await this.docAgent.recordTestResults({
          success: true,
          testName: `Playwright Test Suite (${environment})`,
          details: `${passed.length} tests passed in ${duration}ms`,
          screenshots: this.collectScreenshots(passed)
        });
      }

      // Record failed tests
      if (failed.length > 0) {
        await this.docAgent.recordTestResults({
          success: false,
          testName: `Playwright Test Suite (${environment})`,
          details: `${failed.length} tests failed, ${passed.length} passed`,
          screenshots: this.collectScreenshots(failed),
          errors: this.collectErrors(failed)
        });

        // Create detailed failure report
        await this.createFailureReport(failed);
      }

      // Update testing documentation
      await this.docAgent.updateSection('testing.md', 'Latest Test Results', testReport);

      console.log(`✅ VCT Reporter: Documentation updated successfully`);

    } catch (error) {
      console.error(`❌ VCT Reporter: Failed to update documentation:`, error);
    }
  }

  /**
   * Generate comprehensive test report
   */
  private generateTestReport(summary: {
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    environment: string;
  }): string {
    const timestamp = new Date().toISOString();
    const totalTests = summary.passed + summary.failed + summary.skipped;
    const successRate = totalTests > 0 ? Math.round((summary.passed / totalTests) * 100) : 0;

    return `
### Test Run Report - ${timestamp}

**Environment**: ${summary.environment}  
**Duration**: ${summary.duration}ms  
**Success Rate**: ${successRate}%

#### Summary
- ✅ **Passed**: ${summary.passed}
- ❌ **Failed**: ${summary.failed}
- ⏭️ **Skipped**: ${summary.skipped}
- 📊 **Total**: ${totalTests}

#### Performance Metrics
- Average test time: ${totalTests > 0 ? Math.round(summary.duration / totalTests) : 0}ms
- Tests per second: ${totalTests > 0 ? Math.round(totalTests / (summary.duration / 1000)) : 0}

#### Environment Details
- Browser: Chromium, Firefox, WebKit
- Viewport: 1280x720 (desktop), 375x667 (mobile)
- Headless: ${process.env.VCT_ENVIRONMENT !== 'local'}
`;
  }

  /**
   * Create detailed failure report
   */
  private async createFailureReport(failedTests: Array<{
    test: TestCase;
    result: TestResult;
    suite: Suite;
  }>): Promise<void> {
    const failureDetails = failedTests.map(({ test, result, suite }) => {
      const error = result.error?.message || 'Unknown error';
      const location = `${suite.location?.file}:${suite.location?.line}`;
      
      return `
### ❌ ${test.title}

**Location**: ${location}  
**Duration**: ${result.duration}ms  
**Error**: ${error}

**Steps that failed**:
${result.steps.map((step, index) => 
  `${index + 1}. ${step.title} (${step.duration}ms)`
).join('\n')}

**Attachments**:
${result.attachments.map(att => `- ${att.name}: ${att.path}`).join('\n')}
`;
    }).join('\n---\n');

    await this.docAgent.appendToDoc('failures.md', failureDetails, 'Test Failures');
  }

  /**
   * Collect screenshot paths from test results
   */
  private collectScreenshots(testResults: Array<{
    result: TestResult;
  }>): string[] {
    const screenshots: string[] = [];
    
    for (const { result } of testResults) {
      for (const attachment of result.attachments) {
        if (attachment.name === 'screenshot' && attachment.path) {
          screenshots.push(attachment.path);
        }
      }
    }
    
    return screenshots;
  }

  /**
   * Collect error messages from failed tests
   */
  private collectErrors(failedTests: Array<{
    result: TestResult;
  }>): string[] {
    return failedTests
      .map(({ result }) => result.error?.message)
      .filter(Boolean) as string[];
  }

  /**
   * Generate visual diff report if available
   */
  private async generateVisualDiffReport(testResults: Array<{
    test: TestCase;
    result: TestResult;
  }>): Promise<void> {
    const visualTests = testResults.filter(({ test }) => 
      test.title.toLowerCase().includes('visual') || 
      test.title.toLowerCase().includes('screenshot')
    );

    if (visualTests.length === 0) return;

    const visualReport = `
### Visual Regression Test Results

**Tests Run**: ${visualTests.length}  
**Timestamp**: ${new Date().toISOString()}

${visualTests.map(({ test, result }) => `
#### ${test.title}
- **Status**: ${result.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}
- **Duration**: ${result.duration}ms
- **Screenshots**: ${result.attachments.filter(a => a.name === 'screenshot').length}
`).join('\n')}
`;

    await this.docAgent.updateSection('uidesign.md', 'Visual Test Results', visualReport);
  }
}