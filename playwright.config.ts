import { defineConfig, devices } from '@playwright/test';

/**
 * VCT-Enhanced Playwright Configuration
 * Supports environment-specific testing with VCT framework integration
 * @see https://playwright.dev/docs/test-configuration
 */

// Environment-specific configuration
const ENV = process.env.TEST_ENV || process.env.VCT_ENVIRONMENT || 'local';
const BASE_URLS = {
  local: 'http://localhost:5175',
  staging: process.env.STAGING_URL || 'https://staging.searchmatic.app',
  prod: process.env.PROD_URL || 'https://searchmatic.app'
};

const VCT_CONFIG = {
  // Headless mode: false for local debugging, true for CI/staging/prod
  headless: ENV === 'local' ? false : true,
  
  // Screenshot mode based on environment
  screenshot: ENV === 'local' ? 'only-on-failure' : 'always',
  
  // Video recording
  video: ENV === 'prod' ? 'retain-on-failure' : 'off',
  
  // Trace collection for debugging
  trace: ENV === 'local' ? 'on-first-retry' : 'retain-on-failure'
};

export default defineConfig({
  testDir: './tests',
  
  /* VCT Framework Integration */
  outputDir: `./artifacts/${ENV}/test-results`,
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry configuration based on environment */
  retries: process.env.CI ? 2 : ENV === 'prod' ? 3 : 0,
  
  /* Worker configuration */
  workers: process.env.CI ? 1 : ENV === 'local' ? 2 : 4,
  
  /* Timeout configuration */
  timeout: ENV === 'local' ? 30000 : 60000,
  
  /* Reporter configuration with VCT integration */
  reporter: [
    ['html', { outputFolder: `./artifacts/${ENV}/playwright-report` }],
    ['json', { outputFile: `./artifacts/${ENV}/results.json` }],
    ['line'],
    // Custom VCT reporter for integration with DocAgent
    ['./vct/reporters/VCTReporter.ts']
  ],
  
  /* Global setup and teardown */
  globalSetup: './vct/setup/global-setup.ts',
  globalTeardown: './vct/setup/global-teardown.ts',
  
  /* Shared settings for all projects */
  use: {
    /* Environment-specific base URL */
    baseURL: BASE_URLS[ENV as keyof typeof BASE_URLS],

    /* VCT-enhanced trace collection */
    trace: VCT_CONFIG.trace,

    /* VCT-enhanced screenshots */
    screenshot: VCT_CONFIG.screenshot as any,

    /* Video recording */
    video: VCT_CONFIG.video as any,
    
    /* Headless mode */
    headless: VCT_CONFIG.headless,
    
    /* Action timeout */
    actionTimeout: 10000,
    
    /* Navigation timeout */
    navigationTimeout: 30000,
    
    /* Ignore HTTPS errors in staging/local */
    ignoreHTTPSErrors: ENV !== 'prod',
    
    /* Extra HTTP headers for API testing */
    extraHTTPHeaders: {
      'X-VCT-Environment': ENV,
      'X-VCT-Test-Run': new Date().toISOString()
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5175',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});