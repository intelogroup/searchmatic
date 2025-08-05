#!/usr/bin/env node

/**
 * Live Authentication Logging Verification
 * Opens browser to verify real-time colored logging output
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5174';

async function verifyLiveLogging() {
  console.log('🔍 Opening browser to verify live authentication logging...\n');
  
  const browser = await chromium.launch({ 
    headless: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  
  // Capture console logs with detailed analysis
  const detailedLogs = [];
  
  page.on('console', msg => {
    const logDetails = {
      timestamp: new Date().toISOString(),
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      args: msg.args().length
    };
    
    detailedLogs.push(logDetails);
    
    // Enhanced console output analysis
    if (msg.text().includes('%c')) {
      console.log(`🎨 [COLORED LOG] ${msg.type().toUpperCase()}: ${msg.text().substring(0, 100)}...`);
    } else if (msg.text().includes('Authentication')) {
      console.log(`🔐 [AUTH EVENT] ${msg.text()}`);
    } else if (msg.text().includes('Performance')) {
      console.log(`⚡ [PERFORMANCE] ${msg.text()}`);
    } else if (msg.text().includes('Session ID')) {
      console.log(`🆔 [SESSION] ${msg.text()}`);
    } else if (msg.text().includes('Context:')) {
      console.log(`📋 [CONTEXT] Captured detailed context data`);
    }
  });

  try {
    // Navigate and perform quick authentication test
    console.log('📱 Navigating to application...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    console.log('🔑 Navigating to login page...');
    await page.click('text=Sign In');
    await page.waitForLoadState('networkidle');
    
    console.log('📝 Testing authentication logging...');
    
    // Test invalid login to trigger error logging
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('✅ Authentication test completed\n');
    
    // Analyze captured logs
    console.log('📊 LIVE LOGGING ANALYSIS:');
    console.log(`   Total Logs Captured: ${detailedLogs.length}`);
    
    const coloredLogs = detailedLogs.filter(log => log.text.includes('%c'));
    const authLogs = detailedLogs.filter(log => log.text.toLowerCase().includes('authentication'));
    const performanceLogs = detailedLogs.filter(log => log.text.toLowerCase().includes('performance'));
    const sessionLogs = detailedLogs.filter(log => log.text.toLowerCase().includes('session'));
    const contextLogs = detailedLogs.filter(log => log.text.includes('Context:'));
    
    console.log(`   Colored Logs: ${coloredLogs.length} ✅`);
    console.log(`   Authentication Logs: ${authLogs.length} ✅`);
    console.log(`   Performance Logs: ${performanceLogs.length} ✅`);
    console.log(`   Session Logs: ${sessionLogs.length} ✅`);
    console.log(`   Context Logs: ${contextLogs.length} ✅`);
    
    console.log('\n🎯 VERIFICATION RESULTS:');
    
    if (coloredLogs.length > 0) {
      console.log('   ✅ Enhanced console formatting is active');
    } else {
      console.log('   ⚠️  No colored logs detected');
    }
    
    if (authLogs.length > 0) {
      console.log('   ✅ Authentication event logging is working');
    } else {
      console.log('   ⚠️  No authentication logs captured');
    }
    
    if (performanceLogs.length > 0) {
      console.log('   ✅ Performance monitoring is active');
    } else {
      console.log('   ⚠️  No performance logs detected');
    }
    
    if (sessionLogs.length > 0) {
      console.log('   ✅ Session tracking is working');
    } else {
      console.log('   ⚠️  No session logs captured');
    }
    
    // Overall assessment
    const workingFeatures = [coloredLogs, authLogs, performanceLogs, sessionLogs]
      .filter(arr => arr.length > 0).length;
    
    console.log(`\n🏆 OVERALL ASSESSMENT: ${workingFeatures}/4 core features working`);
    
    if (workingFeatures === 4) {
      console.log('   🌟 EXCELLENT - All enhanced logging features are active');
    } else if (workingFeatures >= 3) {
      console.log('   ✅ GOOD - Most features working correctly');
    } else if (workingFeatures >= 2) {
      console.log('   ⚠️  FAIR - Some features may need attention');
    } else {
      console.log('   ❌ POOR - Logging system may have issues');
    }
    
    console.log('\n📋 TO VIEW LIVE COLORED LOGS:');
    console.log('   1. Open http://localhost:5174 in your browser');
    console.log('   2. Open Developer Tools (F12)');
    console.log('   3. Go to Console tab');
    console.log('   4. Navigate to login page and attempt authentication');
    console.log('   5. Observe the enhanced colored log output');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n🔚 Live logging verification completed');
  }
}

// Run verification
verifyLiveLogging().catch(console.error);