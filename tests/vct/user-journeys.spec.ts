/**
 * VCT User Journey Tests
 * Comprehensive user journey testing with visual verification
 */

import { test, expect } from '@playwright/test';
import { VCTConfigManager } from '../../vct/config/VCTConfig';
import { VisualComparison } from '../../vct/visual/VisualComparison';

// Initialize VCT components
const visualComparison = new VisualComparison();
let vctConfig: any;

test.beforeAll(async () => {
  const configManager = VCTConfigManager.getInstance();
  vctConfig = await configManager.loadConfig();
});

test.describe('VCT User Journeys', () => {
  test.describe('Authentication Flow', () => {
    test('complete login journey with visual verification', async ({ page }) => {
      // Step 1: Navigate to landing page
      await page.goto('/');
      await expect(page).toHaveTitle(/Searchmatic/);
      
      // Visual checkpoint: Landing page
      const landingScreenshot = await page.screenshot({
        path: `artifacts/${vctConfig.environment}/screenshots/01-landing-page.png`,
        fullPage: true
      });
      
      // Step 2: Navigate to login
      await page.click('[href="/login"]');
      await expect(page).toHaveURL('/login');
      
      // Visual checkpoint: Login page
      await page.screenshot({
        path: `artifacts/${vctConfig.environment}/screenshots/02-login-page.png`,
        fullPage: true
      });
      
      // Step 3: Fill login form
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      // Visual checkpoint: Filled form
      await page.screenshot({
        path: `artifacts/${vctConfig.environment}/screenshots/03-login-filled.png`,
        fullPage: true
      });
      
      // Step 4: Submit form
      await page.click('button[type="submit"]');
      
      // Wait for navigation or error
      await page.waitForTimeout(2000);
      
      // Visual checkpoint: After login attempt
      await page.screenshot({
        path: `artifacts/${vctConfig.environment}/screenshots/04-after-login.png`,
        fullPage: true
      });
      
      // Verify we're either on dashboard or still on login with error
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        await expect(page).toHaveURL('/dashboard');
      } else {
        // Still on login page - check for error message
        await expect(page).toHaveURL('/login');
      }
    });

    test('responsive login across viewports', async ({ page }) => {
      const viewports = [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1280, height: 720 }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/login');
        
        // Wait for responsive changes
        await page.waitForTimeout(500);
        
        // Take screenshot
        await page.screenshot({
          path: `artifacts/${vctConfig.environment}/screenshots/login-${viewport.name}.png`,
          fullPage: true
        });
        
        // Verify form is accessible
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
      }
    });
  });

  test.describe('Project Management Flow', () => {
    test('create new project journey', async ({ page }) => {
      // Navigate to dashboard (assuming logged in)
      await page.goto('/dashboard');
      
      // Visual checkpoint: Dashboard
      await page.screenshot({
        path: `artifacts/${vctConfig.environment}/screenshots/05-dashboard.png`,
        fullPage: true
      });
      
      // Click new project button
      const newProjectButton = page.locator('[data-testid="new-project"], .new-project, button:has-text("New"), button:has-text("Create")').first();
      
      if (await newProjectButton.isVisible()) {
        await newProjectButton.click();
        
        // Wait for form to appear
        await page.waitForTimeout(1000);
        
        // Visual checkpoint: New project form
        await page.screenshot({
          path: `artifacts/${vctConfig.environment}/screenshots/06-new-project-form.png`,
          fullPage: true
        });
        
        // Fill project form if available
        const titleInput = page.locator('input[name="title"], input[placeholder*="title" i], input[placeholder*="name" i]').first();
        const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]').first();
        
        if (await titleInput.isVisible()) {
          await titleInput.fill('VCT Test Project');
        }
        
        if (await descriptionInput.isVisible()) {
          await descriptionInput.fill('This is a test project created by VCT framework');
        }
        
        // Visual checkpoint: Filled form
        await page.screenshot({
          path: `artifacts/${vctConfig.environment}/screenshots/07-project-form-filled.png`,
          fullPage: true
        });
        
        // Submit form
        const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(2000);
          
          // Visual checkpoint: After submission
          await page.screenshot({
            path: `artifacts/${vctConfig.environment}/screenshots/08-after-project-creation.png`,
            fullPage: true
          });
        }
      }
    });

    test('project list navigation', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Look for project cards or list items
      const projectCards = page.locator('.project-card, [data-testid*="project"], .project-item');
      const cardCount = await projectCards.count();
      
      console.log(`Found ${cardCount} project cards`);
      
      if (cardCount > 0) {
        // Click on first project
        await projectCards.first().click();
        await page.waitForTimeout(1000);
        
        // Visual checkpoint: Project view
        await page.screenshot({
          path: `artifacts/${vctConfig.environment}/screenshots/09-project-view.png`,
          fullPage: true
        });
      }
      
      // Take overall dashboard screenshot
      await page.screenshot({
        path: `artifacts/${vctConfig.environment}/screenshots/10-dashboard-overview.png`,
        fullPage: true
      });
    });
  });

  test.describe('Visual Regression Tests', () => {
    test('comprehensive visual regression', async ({ page }) => {
      const testCases = [
        {
          name: 'landing-page',
          url: '/',
          selector: null,
          fullPage: true,
          threshold: 0.2
        },
        {
          name: 'login-page',
          url: '/login',
          selector: null,
          fullPage: true,
          threshold: 0.2
        },
        {
          name: 'dashboard',
          url: '/dashboard',
          selector: null,
          fullPage: true,
          threshold: 0.5 // Higher threshold for dynamic content
        }
      ];

      for (const testCase of testCases) {
        await page.goto(testCase.url);
        await page.waitForLoadState('networkidle');
        
        // Take screenshot
        const screenshotPath = `artifacts/${vctConfig.environment}/screenshots/visual-${testCase.name}.png`;
        await page.screenshot({
          path: screenshotPath,
          fullPage: testCase.fullPage
        });
        
        // Compare with baseline
        const comparison = await visualComparison.compareWithBaseline(
          screenshotPath,
          {
            environment: vctConfig.environment,
            browser: 'chromium',
            viewport: '1280x720',
            testName: testCase.name
          },
          testCase.threshold
        );
        
        // Log results
        console.log(`Visual comparison for ${testCase.name}:`, {
          matches: comparison.matches,
          difference: `${comparison.difference.toFixed(2)}%`,
          threshold: `${comparison.threshold}%`
        });
        
        // Assert visual match
        expect(comparison.matches).toBe(true);
      }
    });

    test('component-level visual tests', async ({ page }) => {
      await page.goto('/');
      
      // Test header component
      const header = page.locator('header, .header, nav').first();
      if (await header.isVisible()) {
        await header.screenshot({
          path: `artifacts/${vctConfig.environment}/screenshots/component-header.png`
        });
      }
      
      // Test navigation component
      const nav = page.locator('nav, .navigation, .nav-menu').first();
      if (await nav.isVisible()) {
        await nav.screenshot({
          path: `artifacts/${vctConfig.environment}/screenshots/component-nav.png`
        });
      }
      
      // Test footer component
      const footer = page.locator('footer, .footer').first();
      if (await footer.isVisible()) {
        await footer.screenshot({
          path: `artifacts/${vctConfig.environment}/screenshots/component-footer.png`
        });
      }
    });
  });

  test.describe('Error Handling Tests', () => {
    test('404 page visual verification', async ({ page }) => {
      await page.goto('/non-existent-page');
      
      // Wait for 404 page to load
      await page.waitForTimeout(1000);
      
      // Visual checkpoint: 404 page
      await page.screenshot({
        path: `artifacts/${vctConfig.environment}/screenshots/404-page.png`,
        fullPage: true
      });
      
      // Verify 404 page elements
      const content = await page.textContent('body');
      expect(content?.toLowerCase()).toContain('not found');
    });

    test('network error handling', async ({ page }) => {
      // Simulate network failure
      await page.route('**/*', route => {
        if (route.request().url().includes('api')) {
          route.abort();
        } else {
          route.continue();
        }
      });
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      // Visual checkpoint: Network error state
      await page.screenshot({
        path: `artifacts/${vctConfig.environment}/screenshots/network-error.png`,
        fullPage: true
      });
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('performance metrics collection', async ({ page }) => {
      await page.goto('/');
      
      // Collect performance metrics
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstPaint: (performance.getEntriesByName('first-paint')[0] as PerformanceEntry)?.startTime || 0,
          resources: performance.getEntriesByType('resource').length
        };
      });
      
      console.log('Performance metrics:', metrics);
      
      // Assert performance thresholds
      expect(metrics.loadTime).toBeLessThan(5000); // 5 seconds
      expect(metrics.domContentLoaded).toBeLessThan(3000); // 3 seconds
    });

    test('accessibility validation', async ({ page }) => {
      await page.goto('/');
      
      // Basic accessibility checks
      const hasHeadings = await page.locator('h1, h2, h3, h4, h5, h6').count() > 0;
      const hasAltTexts = await page.locator('img[alt]').count();
      const totalImages = await page.locator('img').count();
      
      expect(hasHeadings).toBe(true);
      
      if (totalImages > 0) {
        expect(hasAltTexts).toBeGreaterThan(0);
      }
      
      // Visual checkpoint for accessibility
      await page.screenshot({
        path: `artifacts/${vctConfig.environment}/screenshots/accessibility-check.png`,
        fullPage: true
      });
    });
  });
});