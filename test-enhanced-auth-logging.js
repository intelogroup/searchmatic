#!/usr/bin/env node

/**
 * Comprehensive Authentication Logging System Test
 * Tests all enhanced error logging, privacy protection, and monitoring features
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const BASE_URL = 'http://localhost:5174';
const SCREENSHOT_DIR = './test-screenshots/enhanced-auth';
const TEST_EMAIL = 'testuser@example.com';
const VALID_PASSWORD = 'TestPassword123!';
const INVALID_PASSWORD = 'wrongpassword';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function testEnhancedAuthLogging() {
  console.log('🚀 Starting Enhanced Authentication Logging System Test...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    slowMo: 500 // Slow down for better observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  
  // Setup console logging capture
  const consoleLogs = [];
  const errors = [];
  
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    consoleLogs.push(logEntry);
    
    console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.error(`[PAGE ERROR] ${error.message}`);
  });

  try {
    console.log('📋 Test Plan:');
    console.log('1. Navigate to login page and verify initial logging');
    console.log('2. Test successful signup with comprehensive logging');
    console.log('3. Test failed login with error handling and privacy protection');
    console.log('4. Test successful login with performance monitoring');
    console.log('5. Verify email masking and privacy protection');
    console.log('6. Check session tracking and user context');
    console.log('7. Validate console output formatting and colors\n');

    // Test 1: Navigate to login page
    console.log('🔍 Test 1: Navigation and Initial Logging');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Navigate to login
    await page.click('text=Sign In');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '01-login-page-loaded.png'),
      fullPage: true 
    });
    
    // Test 2: Successful Signup with Logging
    console.log('\n📝 Test 2: Successful Signup with Enhanced Logging');
    
    // Switch to signup mode
    await page.click('text=Don\'t have an account? Sign up');
    await page.waitForTimeout(500);
    
    // Fill signup form
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', VALID_PASSWORD);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '02-signup-form-filled.png'),
      fullPage: true 
    });
    
    // Submit signup and capture logs
    const signupStartTime = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000); // Wait for response
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '03-signup-result.png'),
      fullPage: true 
    });
    
    // Test 3: Failed Login with Error Handling
    console.log('\n❌ Test 3: Failed Login with Comprehensive Error Logging');
    
    // Switch to login mode
    await page.click('text=Already have an account? Sign in');
    await page.waitForTimeout(500);
    
    // Clear and fill with invalid credentials
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', INVALID_PASSWORD);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '04-invalid-login-form.png'),
      fullPage: true 
    });
    
    // Submit invalid login
    const failedLoginStartTime = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000); // Wait for error response
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '05-failed-login-result.png'),
      fullPage: true 
    });
    
    // Test 4: Edge Cases and Privacy Protection
    console.log('\n🔒 Test 4: Privacy Protection and Edge Cases');
    
    // Test empty form submission
    await page.fill('#email', '');
    await page.fill('#password', '');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Test malformed email
    await page.fill('#email', 'invalid-email');
    await page.fill('#password', 'somepassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '06-edge-cases-tested.png'),
      fullPage: true 
    });
    
    // Test 5: Performance Monitoring
    console.log('\n⚡ Test 5: Performance Monitoring Validation');
    
    // Test multiple rapid submissions to trigger performance warnings
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', VALID_PASSWORD);
    
    for (let i = 0; i < 3; i++) {
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '07-performance-test.png'),
      fullPage: true 
    });
    
    // Capture final console state
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, '08-final-console-state.png'),
      fullPage: true 
    });
    
    console.log('\n📊 Analyzing Captured Logs and Console Output...\n');
    
    // Analyze console logs
    const logAnalysis = analyzeConsoleLogs(consoleLogs);
    
    // Generate comprehensive report
    const report = {
      testCompleted: new Date().toISOString(),
      totalConsoleLogs: consoleLogs.length,
      totalErrors: errors.length,
      logAnalysis,
      consoleLogs: consoleLogs.slice(-50), // Last 50 logs
      errors,
      screenshots: [
        '01-login-page-loaded.png',
        '02-signup-form-filled.png', 
        '03-signup-result.png',
        '04-invalid-login-form.png',
        '05-failed-login-result.png',
        '06-edge-cases-tested.png',
        '07-performance-test.png',
        '08-final-console-state.png'
      ]
    };
    
    // Save detailed report
    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'enhanced-auth-logging-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    // Display results
    displayTestResults(logAnalysis, consoleLogs, errors);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ 
      path: path.join(SCREENSHOT_DIR, 'error-state.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

function analyzeConsoleLogs(logs) {
  const analysis = {
    errorLogs: [],
    warningLogs: [],
    infoLogs: [],
    debugLogs: [],
    authenticationLogs: [],
    performanceLogs: [],
    privacyProtectedLogs: [],
    sessionTrackingLogs: []
  };
  
  logs.forEach(log => {
    const text = log.text.toLowerCase();
    
    // Categorize logs
    if (log.type === 'error') {
      analysis.errorLogs.push(log);
    } else if (log.type === 'warning' || text.includes('warn')) {
      analysis.warningLogs.push(log);
    } else if (text.includes('info') || text.includes('authentication')) {
      analysis.infoLogs.push(log);
      
      if (text.includes('authentication') || text.includes('signup') || text.includes('signin')) {
        analysis.authenticationLogs.push(log);
      }
    }
    
    // Check for privacy protection (email masking)
    if (text.includes('***') && text.includes('@')) {
      analysis.privacyProtectedLogs.push(log);
    }
    
    // Check for performance monitoring
    if (text.includes('performance') || text.includes('ms') || text.includes('duration')) {
      analysis.performanceLogs.push(log);
    }
    
    // Check for session tracking
    if (text.includes('session') || text.includes('session_')) {
      analysis.sessionTrackingLogs.push(log);
    }
  });
  
  return analysis;
}

function displayTestResults(analysis, logs, errors) {
  console.log('🎯 ENHANCED AUTHENTICATION LOGGING SYSTEM TEST RESULTS\n');
  
  console.log('📊 LOG ANALYSIS SUMMARY:');
  console.log(`   Total Console Logs: ${logs.length}`);
  console.log(`   Error Logs: ${analysis.errorLogs.length}`);
  console.log(`   Warning Logs: ${analysis.warningLogs.length}`);
  console.log(`   Info Logs: ${analysis.infoLogs.length}`);
  console.log(`   Authentication Logs: ${analysis.authenticationLogs.length}`);
  console.log(`   Performance Logs: ${analysis.performanceLogs.length}`);
  console.log(`   Privacy Protected Logs: ${analysis.privacyProtectedLogs.length}`);
  console.log(`   Session Tracking Logs: ${analysis.sessionTrackingLogs.length}\n`);
  
  console.log('🔒 PRIVACY PROTECTION VERIFICATION:');
  if (analysis.privacyProtectedLogs.length > 0) {
    console.log('   ✅ Email masking is working (found *** in logs)');
    analysis.privacyProtectedLogs.slice(0, 3).forEach(log => {
      console.log(`   📧 ${log.text.substring(0, 100)}...`);
    });
  } else {
    console.log('   ⚠️  No privacy protection detected in logs');
  }
  
  console.log('\n⚡ PERFORMANCE MONITORING:');
  if (analysis.performanceLogs.length > 0) {
    console.log('   ✅ Performance monitoring is active');
    analysis.performanceLogs.slice(0, 3).forEach(log => {
      console.log(`   ⏱️  ${log.text.substring(0, 100)}...`);
    });
  } else {
    console.log('   ⚠️  No performance monitoring detected');
  }
  
  console.log('\n🔑 AUTHENTICATION LOGGING:');
  if (analysis.authenticationLogs.length > 0) {
    console.log('   ✅ Authentication events are being logged');
    analysis.authenticationLogs.slice(0, 5).forEach(log => {
      console.log(`   🔐 ${log.text.substring(0, 120)}...`);
    });
  } else {
    console.log('   ⚠️  No authentication logging detected');
  }
  
  console.log('\n🆔 SESSION TRACKING:');
  if (analysis.sessionTrackingLogs.length > 0) {
    console.log('   ✅ Session tracking is working');
    console.log(`   📝 Found ${analysis.sessionTrackingLogs.length} session-related logs`);
  } else {
    console.log('   ⚠️  No session tracking detected');
  }
  
  console.log('\n❌ ERROR HANDLING:');
  if (errors.length > 0) {
    console.log(`   ⚠️  Found ${errors.length} page errors:`);
    errors.forEach(error => {
      console.log(`   🚨 ${error.message}`);
    });
  } else {
    console.log('   ✅ No page errors detected');
  }
  
  console.log('\n🎨 CONSOLE OUTPUT QUALITY:');
  const hasColoredLogs = logs.some(log => 
    log.text.includes('%c') || 
    log.text.includes('ERROR') || 
    log.text.includes('WARN') || 
    log.text.includes('INFO')
  );
  
  if (hasColoredLogs) {
    console.log('   ✅ Enhanced console formatting detected');
  } else {
    console.log('   ⚠️  Basic console output (enhanced formatting may not be visible in test)');
  }
  
  console.log('\n📸 SCREENSHOTS CAPTURED:');
  console.log('   🖼️  8 comprehensive test screenshots saved');
  console.log(`   📁 Location: ${SCREENSHOT_DIR}/`);
  
  console.log('\n📋 PRODUCTION READINESS ASSESSMENT:');
  const score = calculateProductionReadinessScore(analysis, errors);
  console.log(`   🎯 Overall Score: ${score}/100`);
  
  if (score >= 90) {
    console.log('   ✅ EXCELLENT - Production ready with comprehensive monitoring');
  } else if (score >= 75) {
    console.log('   ⚡ GOOD - Ready with minor improvements needed');
  } else if (score >= 60) {
    console.log('   ⚠️  FAIR - Needs improvements before production');
  } else {
    console.log('   ❌ POOR - Significant issues need to be addressed');
  }
  
  console.log('\n🔍 DETAILED REPORT:');
  console.log(`   📄 Full report saved to: ${SCREENSHOT_DIR}/enhanced-auth-logging-report.json`);
  console.log('   🔗 Open browser console at http://localhost:5174 to see live colored logs\n');
}

function calculateProductionReadinessScore(analysis, errors) {
  let score = 100;
  
  // Deduct points for missing features
  if (analysis.authenticationLogs.length === 0) score -= 25;
  if (analysis.privacyProtectedLogs.length === 0) score -= 20;
  if (analysis.performanceLogs.length === 0) score -= 15;
  if (analysis.sessionTrackingLogs.length === 0) score -= 10;
  if (errors.length > 0) score -= (errors.length * 5);
  
  return Math.max(0, score);
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testEnhancedAuthLogging().catch(console.error);
}

export { testEnhancedAuthLogging };