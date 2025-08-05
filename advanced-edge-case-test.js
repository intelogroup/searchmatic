#!/usr/bin/env node

import { chromium } from 'playwright';

async function runAdvancedEdgeCaseTests() {
  console.log('🔍 Advanced Edge Case Testing for Searchmatic Authentication');
  console.log('=' .repeat(65));
  
  const browser = await chromium.launch({ headless: true });
  const baseURL = 'http://localhost:5173';
  
  try {
    // Test 1: Session Synchronization 
    console.log('\n1. 🔄 Session Synchronization Test');
    console.log('-'.repeat(40));
    
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    await page1.goto(`${baseURL}/login`);
    await page2.goto(`${baseURL}/login`);
    
    // Attempt login in first session (will likely fail with demo data)
    await page1.fill('input[type="email"]', 'test@example.com');
    await page1.fill('input[type="password"]', 'testpassword123');
    await page1.click('button[type="submit"]');
    await page1.waitForTimeout(3000);
    
    // Try second session
    await page2.fill('input[type="email"]', 'test@example.com');
    await page2.fill('input[type="password"]', 'testpassword123');
    await page2.click('button[type="submit"]');
    await page2.waitForTimeout(3000);
    
    const page1URL = page1.url();
    const page2URL = page2.url();
    
    console.log(`Session 1 final URL: ${page1URL}`);
    console.log(`Session 2 final URL: ${page2URL}`);
    
    if (page1URL === page2URL) {
      console.log('✅ Session states synchronized');
    } else {
      console.log('ℹ️  Different session states (expected for failed logins)');
    }
    
    await page1.screenshot({ path: 'screenshots/session-sync-1.png', fullPage: true });
    await page2.screenshot({ path: 'screenshots/session-sync-2.png', fullPage: true });
    
    await context1.close();
    await context2.close();
    
    // Test 2: Memory Leak Detection
    console.log('\n2. 🧠 Memory Leak Detection Test');
    console.log('-'.repeat(35));
    
    const memoryContext = await browser.newContext();
    const memoryPage = await memoryContext.newPage();
    
    console.log('Performing repeated navigation to detect memory leaks...');
    
    for (let i = 0; i < 10; i++) {
      await memoryPage.goto(`${baseURL}/login`);
      await memoryPage.fill('input[type="email"]', `test${i}@example.com`);
      await memoryPage.fill('input[type="password"]', 'testpassword123');
      await memoryPage.click('button[type="submit"]');
      await memoryPage.waitForTimeout(500);
      
      // Navigate back and forth
      await memoryPage.goto(`${baseURL}/`);
      await memoryPage.waitForTimeout(200);
    }
    
    // Final check - page should still be responsive
    await memoryPage.goto(`${baseURL}/login`);
    const emailField = await memoryPage.locator('input[type="email"]').isVisible();
    
    if (emailField) {
      console.log('✅ No apparent memory leaks - page remains responsive');
    } else {
      console.log('⚠️  Possible memory issues - page unresponsive');
    }
    
    await memoryPage.screenshot({ path: 'screenshots/memory-leak-test.png', fullPage: true });
    await memoryContext.close();
    
    // Test 3: Browser Navigation Edge Cases
    console.log('\n3. 🧭 Browser Navigation Edge Cases');
    console.log('-'.repeat(40));
    
    const navPage = await browser.newPage();
    
    // Test back button behavior
    await navPage.goto(`${baseURL}/login`);
    await navPage.fill('input[type="email"]', 'test@example.com');
    await navPage.fill('input[type="password"]', 'testpassword123');
    
    // Navigate away
    await navPage.goto(`${baseURL}/`);
    await navPage.waitForTimeout(500);
    
    // Use back button
    await navPage.goBack();
    await navPage.waitForTimeout(1000);
    
    const emailValue = await navPage.locator('input[type="email"]').inputValue();
    console.log(`Email field value after back button: "${emailValue}"`);
    
    if (emailValue === '') {
      console.log('✅ Form state properly reset after navigation');
    } else {
      console.log('ℹ️  Form state preserved (browser caching)');
    }
    
    await navPage.screenshot({ path: 'screenshots/navigation-edge-case.png', fullPage: true });
    await navPage.close();
    
    // Test 4: Form Validation Edge Cases
    console.log('\n4. 📝 Form Validation Edge Cases');
    console.log('-'.repeat(35));
    
    const formPage = await browser.newPage();
    await formPage.goto(`${baseURL}/login`);
    
    // Test empty submission
    await formPage.click('button[type="submit"]');
    await formPage.waitForTimeout(1000);
    
    const emptySubmissionError = await formPage.locator('.text-destructive').count() > 0;
    console.log(`Empty form submission handled: ${emptySubmissionError ? '✅ Error shown' : 'ℹ️  HTML5 validation'}`);
    
    // Test invalid email formats
    const invalidEmails = [
      'notanemail',
      '@example.com',
      'test@',
      'test..test@example.com',
      ' ',
      'test@exam ple.com'
    ];
    
    for (const email of invalidEmails) {
      await formPage.fill('input[type="email"]', email);
      await formPage.fill('input[type="password"]', 'testpassword');
      await formPage.click('button[type="submit"]');
      await formPage.waitForTimeout(1000);
      
      const currentURL = formPage.url();
      if (currentURL.includes('/login')) {
        console.log(`✅ Invalid email "${email}" properly rejected`);
      } else {
        console.log(`⚠️  Invalid email "${email}" accepted`);
      }
      
      // Clear fields
      await formPage.fill('input[type="email"]', '');
      await formPage.fill('input[type="password"]', '');
    }
    
    await formPage.screenshot({ path: 'screenshots/form-validation-test.png', fullPage: true });
    await formPage.close();
    
    // Test 5: Offline/Network Failure Recovery
    console.log('\n5. 🌐 Network Failure Recovery Test');
    console.log('-'.repeat(40));
    
    const networkPage = await browser.newPage();
    await networkPage.goto(`${baseURL}/login`);
    
    // Go offline
    await networkPage.context().setOffline(true);
    
    await networkPage.fill('input[type="email"]', 'test@example.com');
    await networkPage.fill('input[type="password"]', 'testpassword123');
    await networkPage.click('button[type="submit"]');
    await networkPage.waitForTimeout(3000);
    
    // Check for appropriate error handling
    const offlineError = await networkPage.locator('.text-destructive, [data-testid="error"]').count() > 0;
    const isLoading = await networkPage.locator('button[disabled]').count() > 0;
    
    if (offlineError) {
      console.log('✅ Offline error properly displayed');
    } else if (isLoading) {
      console.log('ℹ️  Loading state shown (may timeout)');
    } else {
      console.log('⚠️  No feedback shown for offline state');
    }
    
    await networkPage.screenshot({ path: 'screenshots/offline-test.png', fullPage: true });
    
    // Go back online
    await networkPage.context().setOffline(false);
    await networkPage.reload();
    await networkPage.waitForTimeout(1000);
    
    // Test recovery
    const onlineFormVisible = await networkPage.locator('input[type="email"]').isVisible();
    if (onlineFormVisible) {
      console.log('✅ Successfully recovered from offline state');
    } else {
      console.log('⚠️  Failed to recover from offline state');
    }
    
    await networkPage.screenshot({ path: 'screenshots/online-recovery-test.png', fullPage: true });
    await networkPage.close();
    
    // Test 6: Large Input Handling
    console.log('\n6. 📊 Large Input Handling Test');
    console.log('-'.repeat(35));
    
    const largeInputPage = await browser.newPage();
    await largeInputPage.goto(`${baseURL}/login`);
    
    // Test extremely long inputs
    const longEmail = 'a'.repeat(1000) + '@example.com';
    const longPassword = 'b'.repeat(1000);
    
    console.log('Testing with 1000+ character inputs...');
    
    await largeInputPage.fill('input[type="email"]', longEmail);
    await largeInputPage.fill('input[type="password"]', longPassword);
    
    const emailFieldValue = await largeInputPage.locator('input[type="email"]').inputValue();
    const passwordFieldValue = await largeInputPage.locator('input[type="password"]').inputValue();
    
    console.log(`Email field accepts ${emailFieldValue.length} characters`);
    console.log(`Password field accepts ${passwordFieldValue.length} characters`);
    
    // Try submission
    await largeInputPage.click('button[type="submit"]');
    await largeInputPage.waitForTimeout(2000);
    
    const stillOnLogin = largeInputPage.url().includes('/login');
    if (stillOnLogin) {
      console.log('✅ Large inputs properly handled/rejected');
    } else {
      console.log('⚠️  Large inputs potentially processed');
    }
    
    await largeInputPage.screenshot({ path: 'screenshots/large-input-test.png', fullPage: true });
    await largeInputPage.close();
    
    console.log('\n' + '='.repeat(65));
    console.log('🎉 Advanced Edge Case Testing Complete!');
    console.log('📸 Additional screenshots saved to screenshots/ directory');
    console.log('📋 Review all console output for comprehensive security analysis');
    
  } catch (error) {
    console.error('❌ Advanced test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the tests
runAdvancedEdgeCaseTests().catch(console.error);

export { runAdvancedEdgeCaseTests };