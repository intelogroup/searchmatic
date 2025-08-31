import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Timeout configuration */
  timeout: 90000,
  
  /* Reporter configuration */
  reporter: [
    ['html', { outputFolder: './artifacts/playwright-report' }],
    ['line']
  ],
  
  /* Shared settings for all projects */
  use: {
    /* Base URL */
    baseURL: 'http://localhost:5173',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',

    /* Screenshots */
    screenshot: 'only-on-failure',

    /* Action timeout */
    actionTimeout: 10000,
    
    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
});