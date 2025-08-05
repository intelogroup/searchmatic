#!/usr/bin/env node

import { chromium } from 'playwright';

async function runSecurityTests() {
  console.log('🔍 Starting Searchmatic Security Edge Case Testing');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({ headless: true });
  const baseURL = 'http://localhost:5173';
  
  try {
    // Test 1: XSS Prevention
    console.log('\n1. 🛡️  XSS Prevention Test');
    console.log('-'.repeat(30));
    
    const page1 = await browser.newPage();
    await page1.goto(`${baseURL}/login`);
    
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("test")',
      '<img src=x onerror=alert("xss")>'
    ];
    
    for (const payload of xssPayloads) {
      console.log(`Testing XSS payload: ${payload}`);
      
      await page1.fill('input[type="email"]', payload);
      await page1.fill('input[type="password"]', 'testpassword');
      
      let alertFired = false;
      page1.on('dialog', async dialog => {
        alertFired = true;
        console.log('⚠️  XSS ALERT FIRED - SECURITY VULNERABILITY!');
        await dialog.dismiss();
      });
      
      await page1.click('button[type="submit"]');
      await page1.waitForTimeout(2000);
      
      if (!alertFired) {
        console.log('✅ XSS payload safely handled');
      }
      
      await page1.fill('input[type="email"]', '');
      await page1.fill('input[type="password"]', '');
    }
    
    await page1.screenshot({ path: 'screenshots/xss-prevention-test.png', fullPage: true });
    await page1.close();
    
    // Test 2: SQL Injection Prevention  
    console.log('\n2. 🗄️  SQL Injection Prevention Test');
    console.log('-'.repeat(40));
    
    const page2 = await browser.newPage();
    await page2.goto(`${baseURL}/login`);
    
    const sqlPayloads = [
      "' OR '1'='1",
      "admin'; DROP TABLE users;--",
      "' UNION SELECT * FROM users--"
    ];
    
    for (const payload of sqlPayloads) {
      console.log(`Testing SQL injection: ${payload}`);
      
      await page2.fill('input[type="email"]', payload);
      await page2.fill('input[type="password"]', payload);
      
      await page2.click('button[type="submit"]');
      await page2.waitForTimeout(2000);
      
      const url = page2.url();
      const hasError = await page2.locator('.text-destructive').count() > 0;
      
      if (url.includes('/login') || hasError) {
        console.log('✅ SQL injection properly rejected');
      } else {
        console.log('⚠️  Potential SQL injection vulnerability!');
      }
      
      await page2.fill('input[type="email"]', '');
      await page2.fill('input[type="password"]', '');
    }
    
    await page2.screenshot({ path: 'screenshots/sql-injection-test.png', fullPage: true });
    await page2.close();
    
    // Test 3: Browser Storage Security
    console.log('\n3. 🔐 Browser Storage Security Test');
    console.log('-'.repeat(35));
    
    const page3 = await browser.newPage();
    await page3.goto(`${baseURL}/login`);
    
    await page3.fill('input[type="email"]', 'test@example.com');
    await page3.fill('input[type="password"]', 'secretPassword123');
    await page3.click('button[type="submit"]');
    await page3.waitForTimeout(3000);
    
    const localStorage = await page3.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
      return data;
    });
    
    const cookies = await page3.context().cookies();
    
    console.log('LocalStorage keys:', Object.keys(localStorage));
    console.log('Cookie count:', cookies.length);
    
    const storageString = JSON.stringify({ localStorage, cookies });
    
    if (storageString.includes('secretPassword123')) {
      console.log('⚠️  Password found in browser storage - SECURITY RISK!');
    } else {
      console.log('✅ No plaintext passwords in storage');
    }
    
    if (storageString.includes('service_role')) {
      console.log('⚠️  Service role key exposed - CRITICAL SECURITY RISK!');
    } else {
      console.log('✅ No service role keys exposed');
    }
    
    await page3.screenshot({ path: 'screenshots/storage-security-test.png', fullPage: true });
    await page3.close();
    
    // Test 4: API Key Exposure Check
    console.log('\n4. 🔑 API Key Exposure Test');
    console.log('-'.repeat(30));
    
    const page4 = await browser.newPage();
    await page4.goto(`${baseURL}/login`);
    
    const content = await page4.content();
    
    const dangerousPatterns = [
      { name: 'OpenAI API Key', pattern: /sk-[a-zA-Z0-9]{48}/g },
      { name: 'Service Role', pattern: /service_role/g },
      { name: 'Secret Key', pattern: /secret/g }
    ];
    
    let exposedKeys = [];
    for (const { name, pattern } of dangerousPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`⚠️  Found ${name}: ${matches.length} matches`);
        exposedKeys.push(...matches);
      } else {
        console.log(`✅ No ${name} exposed`);
      }
    }
    
    const safeKeys = exposedKeys.filter(key => key.includes('publishable') || key.includes('public'));
    const dangerousKeys = exposedKeys.filter(key => !key.includes('publishable') && !key.includes('public'));
    
    console.log(`Safe keys found: ${safeKeys.length}`);
    console.log(`Dangerous keys found: ${dangerousKeys.length}`);
    
    if (dangerousKeys.length > 0) {
      console.log('⚠️  DANGEROUS KEYS EXPOSED:', dangerousKeys);
    }
    
    await page4.screenshot({ path: 'screenshots/api-key-exposure-test.png', fullPage: true });
    await page4.close();
    
    // Test 5: Performance Under Load
    console.log('\n5. ⚡ Performance Under Load Test');
    console.log('-'.repeat(35));
    
    const page5 = await browser.newPage();
    await page5.goto(`${baseURL}/login`);
    
    await page5.fill('input[type="email"]', 'test@example.com');
    await page5.fill('input[type="password"]', 'testpassword123');
    
    console.log('Testing rapid form submissions...');
    const startTime = Date.now();
    
    for (let i = 0; i < 10; i++) {
      await page5.click('button[type="submit"]', { force: true });
      await page5.waitForTimeout(100);
    }
    
    const endTime = Date.now();
    console.log(`Completed 10 rapid submissions in ${endTime - startTime}ms`);
    
    const submitButton = page5.locator('button[type="submit"]');
    const isVisible = await submitButton.isVisible();
    
    if (isVisible) {
      console.log('✅ Form remains functional after rapid submissions');
    } else {
      console.log('⚠️  Form became unresponsive');
    }
    
    await page5.screenshot({ path: 'screenshots/performance-test.png', fullPage: true });
    await page5.close();
    
    // Test 6: Concurrent Sessions
    console.log('\n6. 👥 Concurrent Sessions Test');
    console.log('-'.repeat(30));
    
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const session1 = await context1.newPage();
    const session2 = await context2.newPage();
    
    await session1.goto(`${baseURL}/login`);
    await session2.goto(`${baseURL}/login`);
    
    const testEmail = 'concurrent@example.com';
    const testPassword = 'testpassword123';
    
    // Login in both sessions
    await session1.fill('input[type="email"]', testEmail);
    await session1.fill('input[type="password"]', testPassword);
    await session1.click('button[type="submit"]');
    
    await session2.fill('input[type="email"]', testEmail);
    await session2.fill('input[type="password"]', testPassword);
    await session2.click('button[type="submit"]');
    
    await Promise.all([
      session1.waitForTimeout(3000),
      session2.waitForTimeout(3000)
    ]);
    
    const session1URL = session1.url();
    const session2URL = session2.url();
    
    console.log(`Session 1 URL: ${session1URL}`);
    console.log(`Session 2 URL: ${session2URL}`);
    
    if (session1URL === session2URL) {
      console.log('✅ Both sessions handled consistently');
    } else {
      console.log('ℹ️  Sessions have different states');
    }
    
    await session1.screenshot({ path: 'screenshots/concurrent-session1.png', fullPage: true });
    await session2.screenshot({ path: 'screenshots/concurrent-session2.png', fullPage: true });
    
    await context1.close();
    await context2.close();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Security Testing Complete!');
    console.log('📸 Screenshots saved to screenshots/ directory');
    console.log('📋 Review the console output above for detailed results');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run if called directly
runSecurityTests().catch(console.error);

export { runSecurityTests };