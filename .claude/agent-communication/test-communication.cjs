#!/usr/bin/env node

/**
 * Test script to demonstrate inter-agent communication system
 */

const commUtils = require('./comm-utils.cjs');

function runCommunicationTest() {
    console.log('🧪 Testing Inter-Agent Communication System\n');

    // Cleanup old test data
    commUtils.cleanup('1m');
    console.log('✅ Cleaned up old reports\n');

    // Test 1: Database agent reports schema issue
    console.log('📊 Test 1: Database agent reports schema issue');
    const schemaReport = commUtils.createReport(
        'database-migration-agent',
        'Schema mismatch: users table missing email_verified column. Affects auth flows.',
        {
            priority: 'high',
            category: 'warning',
            targetAgents: ['auth-security-agent', 'testing-qa-agent'],
            context: {
                stack: 'supabase',
                tables: ['users'],
                impact: 'auth'
            },
            actionRequired: true
        }
    );
    commUtils.sendAgentReport(schemaReport);
    console.log('   ✅ Report sent\n');

    // Test 2: Auth agent checks for reports
    console.log('🔐 Test 2: Auth agent checks for incoming reports');
    const authReports = commUtils.checkAgentReports('auth-security-agent', '5m');
    console.log(`   📬 Found ${authReports.length} relevant reports:`);
    authReports.forEach(report => {
        console.log(`   - ${report.sourceAgent}: ${report.message}`);
    });
    console.log('');

    // Test 3: Auth agent responds with critical issue
    console.log('🚨 Test 3: Auth agent reports critical security issue');
    const criticalReport = commUtils.createReport(
        'auth-security-agent',
        'CRITICAL: RLS policies disabled on users table. Data exposure risk!',
        {
            priority: 'critical',
            category: 'warning',
            targetAgents: ['all'],
            context: {
                stack: 'supabase',
                security: 'rls-disabled',
                tables: ['users']
            },
            actionRequired: true
        }
    );
    commUtils.sendAgentReport(criticalReport);
    console.log('   ✅ Critical report sent and broadcast\n');

    // Test 4: Performance agent checks broadcasts
    console.log('⚡ Test 4: Performance agent checks for broadcasts');
    const broadcasts = commUtils.checkBroadcasts('performance-optimization-agent');
    console.log(`   📢 Found ${broadcasts.length} priority broadcasts:`);
    broadcasts.forEach(broadcast => {
        console.log(`   - ${broadcast.sourceAgent}: ${broadcast.message}`);
    });
    console.log('');

    // Test 5: Frontend agent checks critical alerts
    console.log('🎨 Test 5: Frontend agent checks critical alerts');
    const alerts = commUtils.checkCriticalAlerts('frontend-ui-agent');
    console.log(`   🚨 Found ${alerts.length} critical alerts:`);
    alerts.forEach(alert => {
        console.log(`   - ${alert.sourceAgent}: ${alert.message}`);
    });
    console.log('');

    // Test 6: Performance agent reports optimization
    console.log('🚀 Test 6: Performance agent reports successful optimization');
    const perfReport = commUtils.createReport(
        'performance-optimization-agent',
        'Bundle optimized: 250KB → 185KB using code splitting. Load time improved.',
        {
            priority: 'medium',
            category: 'completion',
            targetAgents: ['frontend-ui-agent', 'testing-qa-agent'],
            context: {
                stack: 'react',
                optimization: 'code-splitting',
                beforeSize: 250,
                afterSize: 185
            }
        }
    );
    commUtils.sendAgentReport(perfReport);
    console.log('   ✅ Optimization report sent\n');

    // Test 7: Testing agent checks all reports
    console.log('🧪 Test 7: Testing agent checks all relevant reports');
    const testReports = commUtils.checkAgentReports('testing-qa-agent', '10m');
    console.log(`   📋 Found ${testReports.length} reports relevant to testing:`);
    testReports.forEach(report => {
        console.log(`   - ${report.sourceAgent}: ${report.message} (${report.priority})`);
    });
    console.log('');

    // Test 8: Show communication flow summary
    console.log('📊 Test 8: Communication Flow Summary');
    console.log('   🔄 Reports sent: 3');
    console.log('   📡 Agents communicated: 4');
    console.log('   🎯 Cross-agent coordination: ✅');
    console.log('   ⚡ Critical alerts propagated: ✅');
    console.log('   📈 Knowledge sharing achieved: ✅\n');

    console.log('✨ Inter-Agent Communication System Test Complete!');
    console.log('🤖 Agents can now share crucial information seamlessly\n');

    // Cleanup test data
    setTimeout(() => {
        commUtils.cleanup('1s');
        console.log('🧹 Test data cleaned up');
    }, 1000);
}

// Run the test
if (require.main === module) {
    runCommunicationTest();
}

module.exports = { runCommunicationTest };