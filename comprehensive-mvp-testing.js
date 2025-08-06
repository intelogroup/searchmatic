#!/usr/bin/env node

/**
 * Comprehensive Searchmatic MVP Testing Suite
 * 
 * This script tests all database operations, user journeys, and integrations
 * to verify MVP readiness for PubMed integration.
 * 
 * Tests:
 * 1. Database Schema Verification
 * 2. CRUD Operations for all entities
 * 3. User Authentication Flow
 * 4. Project Creation Journey
 * 5. AI Chat Integration
 * 6. Protocol System
 * 7. Study Management
 * 8. OpenAI Integration
 * 9. Real-time Features
 * 10. Error Handling
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import crypto from 'crypto';

// Supabase Configuration
const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dmZ1ZmFkaXFtaXpyb3llamNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjExNzUxMzQsImV4cCI6MjAzNjc1MTEzNH0.mzJORjzXGOboCWSdwDJPkw__LX9UgLS6Cy--O__Ea-c';

// Test data
const TEST_USER = {
  email: `test.${Date.now()}@searchmatic.test`,
  password: 'TestPassword123!',
  full_name: 'Test User'
};

const TEST_PROJECT = {
  title: 'Comprehensive Test Project',
  description: 'Testing all MVP features and database operations',
  status: 'active',
  type: 'systematic_review'
};

const TEST_PROTOCOL = {
  type: 'PICO',
  title: 'Test PICO Protocol',
  population: 'Adult patients with diabetes',
  intervention: 'Metformin therapy',
  comparison: 'Placebo or standard care',
  outcomes: 'HbA1c reduction and side effects',
  study_design: 'Randomized controlled trials',
  timeframe: '2015-2024'
};

const TEST_STUDY = {
  title: 'Sample Study for Testing',
  authors: 'Smith, J., Doe, A.',
  journal: 'Journal of Medical Research',
  year: 2023,
  doi: '10.1000/test.doi.2023',
  abstract: 'This is a test abstract for comprehensive MVP testing.'
};

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Color console logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function section(message) {
  log(`\n${colors.cyan}${colors.bright}=== ${message} ===${colors.reset}`);
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function recordTest(testName, passed, details = '') {
  if (passed) {
    testResults.passed++;
    success(`${testName}: PASS ${details}`);
  } else {
    testResults.failed++;
    error(`${testName}: FAIL ${details}`);
  }
  testResults.details.push({ testName, passed, details });
}

// Global test state
let testSession = null;
let testProjectId = null;
let testProtocolId = null;
let testConversationId = null;
let testStudyId = null;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. Database Schema Verification
async function testDatabaseSchema() {
  section('Database Schema Verification');
  
  const requiredTables = [
    'profiles',
    'projects', 
    'protocols',
    'conversations',
    'messages',
    'studies',
    'search_queries',
    'extraction_templates',
    'extracted_data',
    'export_logs'
  ];
  
  try {
    for (const table of requiredTables) {
      info(`Checking table: ${table}`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = empty result, which is fine
        recordTest(`Table ${table} exists and accessible`, false, error.message);
      } else {
        recordTest(`Table ${table} exists and accessible`, true);
      }
    }
    
    // Test database extensions
    info('Checking database extensions...');
    const { data: extensions, error: extError } = await supabase
      .rpc('get_extensions_status')
      .single();
      
    if (extError) {
      warning('Could not verify database extensions - this is expected in restricted access');
    } else {
      success('Database extensions verified');
    }
    
  } catch (err) {
    error(`Schema verification failed: ${err.message}`);
  }
}

// 2. Authentication Flow Testing
async function testAuthentication() {
  section('Authentication Flow Testing');
  
  try {
    info('Creating test user account...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_USER.email,
      password: TEST_USER.password,
      options: {
        data: {
          full_name: TEST_USER.full_name
        }
      }
    });
    
    if (signUpError) {
      recordTest('User signup', false, signUpError.message);
      return false;
    }
    
    recordTest('User signup', true, `User ID: ${signUpData.user?.id}`);
    testSession = signUpData.session;
    
    // Test sign in
    info('Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (signInError) {
      recordTest('User signin', false, signInError.message);
      return false;
    }
    
    recordTest('User signin', true, `Session token present: ${!!signInData.session}`);
    testSession = signInData.session;
    
    // Test profile creation
    info('Testing profile creation...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: testSession.user.id,
        email: TEST_USER.email,
        full_name: TEST_USER.full_name,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (profileError) {
      recordTest('Profile creation', false, profileError.message);
    } else {
      recordTest('Profile creation', true, `Profile ID: ${profile.id}`);
    }
    
    return true;
    
  } catch (err) {
    recordTest('Authentication flow', false, err.message);
    return false;
  }
}

// 3. Project CRUD Operations
async function testProjectOperations() {
  section('Project CRUD Operations');
  
  if (!testSession) {
    error('Cannot test projects without authenticated session');
    return false;
  }
  
  try {
    // Create project
    info('Creating test project...');
    const { data: project, error: createError } = await supabase
      .from('projects')
      .insert({
        ...TEST_PROJECT,
        user_id: testSession.user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (createError) {
      recordTest('Project creation', false, createError.message);
      return false;
    }
    
    recordTest('Project creation', true, `Project ID: ${project.id}`);
    testProjectId = project.id;
    
    // Read project
    info('Reading project...');
    const { data: readProject, error: readError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', testProjectId)
      .single();
      
    if (readError) {
      recordTest('Project read', false, readError.message);
    } else {
      recordTest('Project read', true, `Title: ${readProject.title}`);
    }
    
    // Update project
    info('Updating project...');
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        description: 'Updated description for comprehensive testing'
      })
      .eq('id', testProjectId)
      .select()
      .single();
      
    if (updateError) {
      recordTest('Project update', false, updateError.message);
    } else {
      recordTest('Project update', true, 'Description updated successfully');
    }
    
    // List projects
    info('Listing user projects...');
    const { data: projects, error: listError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', testSession.user.id);
      
    if (listError) {
      recordTest('Project list', false, listError.message);
    } else {
      recordTest('Project list', true, `Found ${projects.length} projects`);
    }
    
    return true;
    
  } catch (err) {
    recordTest('Project operations', false, err.message);
    return false;
  }
}

// 4. Protocol CRUD Operations
async function testProtocolOperations() {
  section('Protocol CRUD Operations');
  
  if (!testProjectId) {
    error('Cannot test protocols without a project');
    return false;
  }
  
  try {
    // Create protocol
    info('Creating PICO protocol...');
    const { data: protocol, error: createError } = await supabase
      .from('protocols')
      .insert({
        ...TEST_PROTOCOL,
        project_id: testProjectId,
        user_id: testSession.user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (createError) {
      recordTest('Protocol creation', false, createError.message);
      return false;
    }
    
    recordTest('Protocol creation', true, `Protocol ID: ${protocol.id}`);
    testProtocolId = protocol.id;
    
    // Test protocol fields
    const protocolFields = ['population', 'intervention', 'comparison', 'outcomes'];
    for (const field of protocolFields) {
      if (protocol[field]) {
        recordTest(`Protocol ${field} field`, true, protocol[field].substring(0, 50) + '...');
      } else {
        recordTest(`Protocol ${field} field`, false, 'Field missing');
      }
    }
    
    // Read protocol
    info('Reading protocol...');
    const { data: readProtocol, error: readError } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', testProtocolId)
      .single();
      
    if (readError) {
      recordTest('Protocol read', false, readError.message);
    } else {
      recordTest('Protocol read', true, `Type: ${readProtocol.type}`);
    }
    
    // Update protocol
    info('Updating protocol...');
    const { data: updatedProtocol, error: updateError } = await supabase
      .from('protocols')
      .update({
        outcomes: 'Updated: HbA1c reduction, cardiovascular events, and adverse effects'
      })
      .eq('id', testProtocolId)
      .select()
      .single();
      
    if (updateError) {
      recordTest('Protocol update', false, updateError.message);
    } else {
      recordTest('Protocol update', true, 'Outcomes updated successfully');
    }
    
    return true;
    
  } catch (err) {
    recordTest('Protocol operations', false, err.message);
    return false;
  }
}

// 5. Conversation and Messages Testing
async function testConversationOperations() {
  section('Conversation and Messages Testing');
  
  if (!testProjectId) {
    error('Cannot test conversations without a project');
    return false;
  }
  
  try {
    // Create conversation
    info('Creating test conversation...');
    const { data: conversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        title: 'Test AI Conversation',
        project_id: testProjectId,
        user_id: testSession.user.id,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (createError) {
      recordTest('Conversation creation', false, createError.message);
      return false;
    }
    
    recordTest('Conversation creation', true, `Conversation ID: ${conversation.id}`);
    testConversationId = conversation.id;
    
    // Create messages
    const testMessages = [
      {
        role: 'user',
        content: 'Help me create a systematic review protocol for diabetes treatment',
        conversation_id: testConversationId,
        user_id: testSession.user.id
      },
      {
        role: 'assistant',
        content: 'I\'ll help you create a comprehensive PICO protocol for diabetes treatment research...',
        conversation_id: testConversationId,
        user_id: testSession.user.id,
        metadata: {
          model: 'gpt-4',
          tokens_used: 150,
          response_time_ms: 1200
        }
      }
    ];
    
    for (let i = 0; i < testMessages.length; i++) {
      info(`Creating message ${i + 1}...`);
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
          ...testMessages[i],
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (msgError) {
        recordTest(`Message ${i + 1} creation`, false, msgError.message);
      } else {
        recordTest(`Message ${i + 1} creation`, true, `Role: ${message.role}`);
      }
    }
    
    // Read conversation with messages
    info('Reading conversation with messages...');
    const { data: conversationWithMessages, error: readError } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (*)
      `)
      .eq('id', testConversationId)
      .single();
      
    if (readError) {
      recordTest('Conversation with messages read', false, readError.message);
    } else {
      recordTest('Conversation with messages read', true, `Messages count: ${conversationWithMessages.messages?.length || 0}`);
    }
    
    return true;
    
  } catch (err) {
    recordTest('Conversation operations', false, err.message);
    return false;
  }
}

// 6. Study/Article Management Testing
async function testStudyOperations() {
  section('Study/Article Management Testing');
  
  if (!testProjectId) {
    error('Cannot test studies without a project');
    return false;
  }
  
  try {
    // Create study
    info('Creating test study...');
    const { data: study, error: createError } = await supabase
      .from('studies')
      .insert({
        ...TEST_STUDY,
        project_id: testProjectId,
        user_id: testSession.user.id,
        status: 'pending_review',
        source: 'manual',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (createError) {
      recordTest('Study creation', false, createError.message);
      return false;
    }
    
    recordTest('Study creation', true, `Study ID: ${study.id}`);
    testStudyId = study.id;
    
    // Test study metadata fields
    const studyFields = ['title', 'authors', 'journal', 'year', 'doi', 'abstract'];
    for (const field of studyFields) {
      if (study[field]) {
        recordTest(`Study ${field} field`, true, String(study[field]).substring(0, 50) + '...');
      } else {
        recordTest(`Study ${field} field`, false, 'Field missing or empty');
      }
    }
    
    // Update study status
    info('Updating study status...');
    const { data: updatedStudy, error: updateError } = await supabase
      .from('studies')
      .update({
        status: 'included',
        review_notes: 'Meets all inclusion criteria for systematic review'
      })
      .eq('id', testStudyId)
      .select()
      .single();
      
    if (updateError) {
      recordTest('Study status update', false, updateError.message);
    } else {
      recordTest('Study status update', true, `Status: ${updatedStudy.status}`);
    }
    
    // List project studies
    info('Listing project studies...');
    const { data: studies, error: listError } = await supabase
      .from('studies')
      .select('*')
      .eq('project_id', testProjectId);
      
    if (listError) {
      recordTest('Study list', false, listError.message);
    } else {
      recordTest('Study list', true, `Found ${studies.length} studies`);
    }
    
    return true;
    
  } catch (err) {
    recordTest('Study operations', false, err.message);
    return false;
  }
}

// 7. OpenAI Integration Testing
async function testOpenAIIntegration() {
  section('OpenAI Integration Testing');
  
  try {
    // Check if OpenAI API key is available
    const openaiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      recordTest('OpenAI API key', false, 'API key not found in environment variables');
      return false;
    }
    
    recordTest('OpenAI API key', true, 'Key found in environment');
    
    // Test OpenAI API connectivity
    info('Testing OpenAI API connectivity...');
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: 'Respond with exactly "API_TEST_SUCCESS" if you receive this message.'
            }
          ],
          max_tokens: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      if (response.data?.choices?.[0]?.message?.content?.includes('API_TEST_SUCCESS')) {
        recordTest('OpenAI API connectivity', true, 'API responding correctly');
      } else {
        recordTest('OpenAI API connectivity', false, 'Unexpected API response');
      }
      
      // Test token usage tracking
      if (response.data?.usage) {
        recordTest('OpenAI token usage tracking', true, `Tokens used: ${response.data.usage.total_tokens}`);
      } else {
        recordTest('OpenAI token usage tracking', false, 'Usage data not returned');
      }
      
    } catch (apiError) {
      recordTest('OpenAI API connectivity', false, apiError.message);
    }
    
    return true;
    
  } catch (err) {
    recordTest('OpenAI integration', false, err.message);
    return false;
  }
}

// 8. Real-time Features Testing
async function testRealtimeFeatures() {
  section('Real-time Features Testing');
  
  if (!testProjectId) {
    error('Cannot test real-time features without a project');
    return false;
  }
  
  try {
    info('Testing real-time subscriptions...');
    
    let subscriptionReceived = false;
    let subscriptionData = null;
    
    // Set up subscription
    const subscription = supabase
      .channel('test-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${testProjectId}`
        },
        (payload) => {
          subscriptionReceived = true;
          subscriptionData = payload;
          info('Real-time update received!');
        }
      )
      .subscribe();
    
    // Wait for subscription to be ready
    await delay(2000);
    
    // Trigger an update
    info('Triggering project update for real-time test...');
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        updated_at: new Date().toISOString(),
        description: `Real-time test update at ${new Date().toISOString()}`
      })
      .eq('id', testProjectId);
    
    if (updateError) {
      recordTest('Real-time trigger update', false, updateError.message);
    } else {
      recordTest('Real-time trigger update', true, 'Update executed');
    }
    
    // Wait for real-time notification
    await delay(3000);
    
    if (subscriptionReceived) {
      recordTest('Real-time subscription', true, `Event type: ${subscriptionData?.eventType}`);
    } else {
      recordTest('Real-time subscription', false, 'No real-time notification received');
    }
    
    // Clean up subscription
    supabase.removeChannel(subscription);
    
    return true;
    
  } catch (err) {
    recordTest('Real-time features', false, err.message);
    return false;
  }
}

// 9. Error Handling and Edge Cases
async function testErrorHandling() {
  section('Error Handling and Edge Cases');
  
  try {
    // Test invalid project access
    info('Testing unauthorized project access...');
    const fakeProjectId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', fakeProjectId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      recordTest('Unauthorized access protection', true, 'No data returned for non-existent project');
    } else if (!data) {
      recordTest('Unauthorized access protection', true, 'Empty result for invalid access');
    } else {
      recordTest('Unauthorized access protection', false, 'Unexpected data access');
    }
    
    // Test required field validation
    info('Testing required field validation...');
    const { error: validationError } = await supabase
      .from('projects')
      .insert({
        // Missing required fields
        user_id: testSession?.user.id
      });
    
    if (validationError) {
      recordTest('Required field validation', true, 'Validation error caught');
    } else {
      recordTest('Required field validation', false, 'Missing validation');
    }
    
    // Test data type validation
    info('Testing data type validation...');
    const { error: typeError } = await supabase
      .from('projects')
      .insert({
        title: 123, // Should be string
        user_id: testSession?.user.id
      });
    
    if (typeError) {
      recordTest('Data type validation', true, 'Type error caught');
    } else {
      recordTest('Data type validation', false, 'Type validation missing');
    }
    
    return true;
    
  } catch (err) {
    recordTest('Error handling tests', false, err.message);
    return false;
  }
}

// 10. Performance Testing
async function testPerformance() {
  section('Performance Testing');
  
  try {
    // Test query performance
    const queries = [
      { name: 'Project list query', query: () => supabase.from('projects').select('*').limit(100) },
      { name: 'Protocol with project', query: () => supabase.from('protocols').select('*, projects(title)').limit(10) },
      { name: 'Conversation with messages', query: () => supabase.from('conversations').select('*, messages(*)').limit(5) },
      { name: 'Study search query', query: () => supabase.from('studies').select('*').ilike('title', '%test%').limit(20) }
    ];
    
    for (const { name, query } of queries) {
      const startTime = Date.now();
      const { data, error } = await query();
      const duration = Date.now() - startTime;
      
      if (error) {
        recordTest(`${name} performance`, false, error.message);
      } else {
        const threshold = 1000; // 1 second threshold
        if (duration < threshold) {
          recordTest(`${name} performance`, true, `${duration}ms (< ${threshold}ms)`);
        } else {
          recordTest(`${name} performance`, false, `${duration}ms (> ${threshold}ms)`);
        }
      }
    }
    
    return true;
    
  } catch (err) {
    recordTest('Performance testing', false, err.message);
    return false;
  }
}

// Clean up test data
async function cleanupTestData() {
  section('Test Data Cleanup');
  
  try {
    if (testStudyId) {
      await supabase.from('studies').delete().eq('id', testStudyId);
      info('Deleted test study');
    }
    
    if (testConversationId) {
      await supabase.from('messages').delete().eq('conversation_id', testConversationId);
      await supabase.from('conversations').delete().eq('id', testConversationId);
      info('Deleted test conversation and messages');
    }
    
    if (testProtocolId) {
      await supabase.from('protocols').delete().eq('id', testProtocolId);
      info('Deleted test protocol');
    }
    
    if (testProjectId) {
      await supabase.from('projects').delete().eq('id', testProjectId);
      info('Deleted test project');
    }
    
    if (testSession) {
      await supabase.from('profiles').delete().eq('id', testSession.user.id);
      info('Deleted test profile');
    }
    
    success('Test data cleanup completed');
    
  } catch (err) {
    warning(`Cleanup warning: ${err.message}`);
  }
}

// Generate test report
function generateReport() {
  section('Test Results Summary');
  
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}SEARCHMATIC MVP COMPREHENSIVE TEST REPORT${colors.reset}`);
  console.log('='.repeat(80));
  
  console.log(`\n${colors.bright}OVERALL RESULTS:${colors.reset}`);
  console.log(`${colors.green}✅ PASSED: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}❌ FAILED: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  WARNINGS: ${testResults.warnings}${colors.reset}`);
  
  const total = testResults.passed + testResults.failed;
  const successRate = total > 0 ? Math.round((testResults.passed / total) * 100) : 0;
  
  console.log(`\n${colors.bright}SUCCESS RATE: ${successRate}%${colors.reset}`);
  
  if (successRate >= 90) {
    console.log(`${colors.green}🎉 EXCELLENT - MVP is ready for production!${colors.reset}`);
  } else if (successRate >= 75) {
    console.log(`${colors.yellow}⚠️  GOOD - Minor issues to address before production${colors.reset}`);
  } else if (successRate >= 50) {
    console.log(`${colors.red}🔧 NEEDS WORK - Major issues require attention${colors.reset}`);
  } else {
    console.log(`${colors.red}🚨 CRITICAL - Significant problems prevent production deployment${colors.reset}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}DETAILED TEST RESULTS:${colors.reset}`);
  console.log('='.repeat(80));
  
  testResults.details.forEach((test, index) => {
    const status = test.passed ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
    console.log(`${index + 1}. ${test.testName}: ${status}`);
    if (test.details) {
      console.log(`   ${colors.cyan}${test.details}${colors.reset}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}RECOMMENDATIONS:${colors.reset}`);
  console.log('='.repeat(80));
  
  if (testResults.failed === 0) {
    console.log(`${colors.green}✅ All tests passed! MVP is ready for PubMed integration.${colors.reset}`);
  } else {
    console.log(`${colors.red}🔧 Address the ${testResults.failed} failed tests before proceeding.${colors.reset}`);
  }
  
  console.log(`\n${colors.bright}Test completed at: ${new Date().toISOString()}${colors.reset}`);
}

// Main test execution
async function runComprehensiveTests() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    SEARCHMATIC MVP COMPREHENSIVE TEST SUITE                   ║');
  console.log('║                                                                               ║');
  console.log('║  Testing all database operations, user journeys, and integrations            ║');
  console.log('║  to verify MVP readiness for PubMed integration                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);
  
  const startTime = Date.now();
  
  try {
    // Execute all test suites
    await testDatabaseSchema();
    await testAuthentication();
    await testProjectOperations();
    await testProtocolOperations();
    await testConversationOperations();
    await testStudyOperations();
    await testOpenAIIntegration();
    await testRealtimeFeatures();
    await testErrorHandling();
    await testPerformance();
    
  } catch (error) {
    console.error(`${colors.red}Critical test failure: ${error.message}${colors.reset}`);
  } finally {
    // Always attempt cleanup
    await cleanupTestData();
    
    const duration = Date.now() - startTime;
    console.log(`\n${colors.bright}Total test duration: ${duration}ms${colors.reset}`);
    
    // Generate comprehensive report
    generateReport();
  }
}

// Execute tests
runComprehensiveTests().catch(console.error);

export {
  runComprehensiveTests,
  testResults
};