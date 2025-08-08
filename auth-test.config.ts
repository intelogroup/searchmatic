import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['test-fixed-app.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 90000,
  
  reporter: [
    ['html', { outputFolder: './auth-test-results/playwright-report' }],
    ['line']
  ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on',
    screenshot: 'always',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Don't start web server - we already have one running
  webServer: undefined,
});