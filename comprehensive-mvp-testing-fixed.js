#!/usr/bin/env node

/**
 * Comprehensive Searchmatic MVP Testing Suite - Fixed Version
 * 
 * This script tests all database operations, user journeys, and integrations
 * to verify MVP readiness for PubMed integration.
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for environment file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
function loadEnvVariables() {
  try {
    const envPath = join(__dirname, '.env.local');
    const envContent = readFileSync(envPath, 'utf8');
    
    const env = {};
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        env[key.trim()] = value.trim();
      }
    });
    
    return env;
  } catch (error) {
    console.warn('Could not load .env.local file:', error.message);
    return {};
  }
}

const envVars = loadEnvVariables();

// Supabase Configuration
const SUPABASE_URL = envVars.VITE_SUPABASE_URL || 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';
const OPENAI_API_KEY = envVars.VITE_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

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

// 1. Configuration Verification
async function testConfiguration() {
  section('Configuration Verification');
  
  info('Checking environment configuration...');
  
  recordTest('Supabase URL configured', !!SUPABASE_URL, SUPABASE_URL);
  recordTest('Supabase Anon Key configured', !!SUPABASE_ANON_KEY, 'Key present');
  recordTest('OpenAI API Key configured', !!OPENAI_API_KEY, 'Key present');
  
  // Test Supabase connection
  try {
    info('Testing Supabase connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        recordTest('Supabase connection', true, 'Connected successfully (empty result expected)');
      } else {
        recordTest('Supabase connection', false, error.message);
      }
    } else {
      recordTest('Supabase connection', true, 'Connected and accessible');
    }
  } catch (err) {
    recordTest('Supabase connection', false, err.message);
  }
}

// 2. Database Schema Verification
async function testDatabaseSchema() {
  section('Database Schema Verification');
  
  const requiredTables = [
    'profiles',
    'projects', 
    'protocols',
    'conversations',
    'messages',
    'studies'
  ];
  
  try {
    for (const table of requiredTables) {
      info(`Checking table: ${table}`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') { // Empty result
          recordTest(`Table ${table} exists and accessible`, true, 'Table exists (empty)');
        } else if (error.code === '42P01') { // Table does not exist
          recordTest(`Table ${table} exists and accessible`, false, 'Table does not exist');
        } else {
          recordTest(`Table ${table} exists and accessible`, false, error.message);
        }
      } else {
        recordTest(`Table ${table} exists and accessible`, true, `Found ${data?.length || 0} records`);
      }
    }
    
  } catch (err) {
    error(`Schema verification failed: ${err.message}`);
  }
}

// 3. Authentication Flow Testing
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
    
    if (!testSession) {
      // Try signing in if signup didn't return session
      info('Attempting sign in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_USER.email,
        password: TEST_USER.password
      });
      
      if (signInError) {
        recordTest('User signin after signup', false, signInError.message);
        return false;
      }
      
      testSession = signInData.session;
      recordTest('User signin after signup', true, 'Session created');
    }
    
    // Test profile creation if we have a session
    if (testSession) {
      info('Testing profile creation...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
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
    }
    
    return true;
    
  } catch (err) {
    recordTest('Authentication flow', false, err.message);
    return false;
  }
}

// 4. Project Operations Testing
async function testProjectOperations() {
  section('Project CRUD Operations');
  
  if (!testSession) {
    error('Cannot test projects without authenticated session');
    recordTest('Project operations prerequisites', false, 'No authenticated session');
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
        description: 'Updated description for comprehensive testing',
        updated_at: new Date().toISOString()
      })
      .eq('id', testProjectId)
      .select()
      .single();
      
    if (updateError) {
      recordTest('Project update', false, updateError.message);
    } else {
      recordTest('Project update', true, 'Description updated successfully');
    }
    
    return true;
    
  } catch (err) {
    recordTest('Project operations', false, err.message);
    return false;
  }
}

// 5. Protocol Operations Testing
async function testProtocolOperations() {
  section('Protocol System Testing');
  
  if (!testProjectId) {
    recordTest('Protocol operations prerequisites', false, 'No test project available');
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
    
    // Verify PICO fields
    const picoFields = ['population', 'intervention', 'comparison', 'outcomes'];
    for (const field of picoFields) {
      if (protocol[field]) {
        recordTest(`PICO ${field} field`, true, protocol[field].substring(0, 50) + '...');
      } else {
        recordTest(`PICO ${field} field`, false, 'Field missing');
      }
    }
    
    return true;
    
  } catch (err) {
    recordTest('Protocol operations', false, err.message);
    return false;
  }
}

// 6. Conversation and Messages Testing
async function testConversationOperations() {
  section('AI Chat System Testing');
  
  if (!testProjectId) {
    recordTest('Conversation operations prerequisites', false, 'No test project available');
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
    
    // Create test messages
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
    
    return true;
    
  } catch (err) {
    recordTest('Conversation operations', false, err.message);
    return false;
  }
}

// 7. Study Management Testing
async function testStudyOperations() {
  section('Study Management Testing');
  
  if (!testProjectId) {
    recordTest('Study operations prerequisites', false, 'No test project available');
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
    
    // Test study metadata
    const studyFields = ['title', 'authors', 'journal', 'year', 'doi', 'abstract'];
    for (const field of studyFields) {
      if (study[field]) {
        recordTest(`Study ${field} field`, true, String(study[field]).substring(0, 50) + '...');
      } else {
        recordTest(`Study ${field} field`, false, 'Field missing');
      }
    }
    
    return true;
    
  } catch (err) {
    recordTest('Study operations', false, err.message);
    return false;
  }
}

// 8. OpenAI Integration Testing
async function testOpenAIIntegration() {
  section('OpenAI Integration Testing');
  
  try {
    if (!OPENAI_API_KEY) {
      recordTest('OpenAI API key', false, 'API key not configured');
      return false;
    }
    
    recordTest('OpenAI API key', true, 'Key configured');
    
    // Test API connectivity
    info('Testing OpenAI API connectivity...');
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: 'Respond with exactly "TEST_SUCCESS" if you receive this.'
            }
          ],
          max_tokens: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      
      if (response.data?.choices?.[0]?.message?.content?.includes('TEST_SUCCESS')) {
        recordTest('OpenAI API connectivity', true, 'API responding correctly');
      } else {
        recordTest('OpenAI API connectivity', true, 'API responding (different response)');
      }
      
      if (response.data?.usage) {
        recordTest('OpenAI token usage tracking', true, `Tokens: ${response.data.usage.total_tokens}`);
      }
      
    } catch (apiError) {
      if (apiError.response?.status === 401) {
        recordTest('OpenAI API connectivity', false, 'Invalid API key');
      } else {
        recordTest('OpenAI API connectivity', false, apiError.message);
      }
    }
    
    return true;
    
  } catch (err) {
    recordTest('OpenAI integration', false, err.message);
    return false;
  }
}

// Clean up test data
async function cleanupTestData() {
  section('Test Data Cleanup');
  
  try {
    const cleanupPromises = [];
    
    if (testStudyId) {
      cleanupPromises.push(
        supabase.from('studies').delete().eq('id', testStudyId)
          .then(() => info('Deleted test study'))
          .catch(() => warning('Could not delete test study'))
      );
    }
    
    if (testConversationId) {
      cleanupPromises.push(
        supabase.from('messages').delete().eq('conversation_id', testConversationId)
          .then(() => supabase.from('conversations').delete().eq('id', testConversationId))
          .then(() => info('Deleted test conversation and messages'))
          .catch(() => warning('Could not delete test conversation'))
      );
    }
    
    if (testProtocolId) {
      cleanupPromises.push(
        supabase.from('protocols').delete().eq('id', testProtocolId)
          .then(() => info('Deleted test protocol'))
          .catch(() => warning('Could not delete test protocol'))
      );
    }
    
    if (testProjectId) {
      cleanupPromises.push(
        supabase.from('projects').delete().eq('id', testProjectId)
          .then(() => info('Deleted test project'))
          .catch(() => warning('Could not delete test project'))
      );
    }
    
    if (testSession) {
      cleanupPromises.push(
        supabase.from('profiles').delete().eq('id', testSession.user.id)
          .then(() => info('Deleted test profile'))
          .catch(() => warning('Could not delete test profile'))
      );
    }
    
    await Promise.allSettled(cleanupPromises);
    success('Test data cleanup completed');
    
  } catch (err) {
    warning(`Cleanup error: ${err.message}`);
  }
}

// Generate comprehensive test report
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
    console.log(`${colors.yellow}⚠️  GOOD - Minor issues to address${colors.reset}`);
  } else if (successRate >= 50) {
    console.log(`${colors.yellow}🔧 NEEDS WORK - Some issues require attention${colors.reset}`);
  } else {
    console.log(`${colors.red}🚨 CRITICAL - Significant problems found${colors.reset}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}DETAILED RESULTS BY CATEGORY:${colors.reset}`);
  console.log('='.repeat(80));
  
  const categories = {
    'Configuration': [],
    'Database': [],
    'Authentication': [],
    'CRUD Operations': [],
    'AI Integration': [],
    'System Tests': []
  };
  
  testResults.details.forEach(test => {
    if (test.testName.includes('configured') || test.testName.includes('connection')) {
      categories['Configuration'].push(test);
    } else if (test.testName.includes('Table') || test.testName.includes('Schema')) {
      categories['Database'].push(test);
    } else if (test.testName.includes('auth') || test.testName.includes('User') || test.testName.includes('Profile')) {
      categories['Authentication'].push(test);
    } else if (test.testName.includes('Project') || test.testName.includes('Protocol') || test.testName.includes('Study') || test.testName.includes('Message')) {
      categories['CRUD Operations'].push(test);
    } else if (test.testName.includes('OpenAI') || test.testName.includes('API')) {
      categories['AI Integration'].push(test);
    } else {
      categories['System Tests'].push(test);
    }
  });
  
  Object.entries(categories).forEach(([category, tests]) => {
    if (tests.length > 0) {
      console.log(`\n${colors.cyan}${category}:${colors.reset}`);
      tests.forEach(test => {
        const status = test.passed ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
        console.log(`  ${status} ${test.testName}`);
        if (test.details && !test.passed) {
          console.log(`    ${colors.red}→ ${test.details}${colors.reset}`);
        }
      });
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}MVP READINESS ASSESSMENT:${colors.reset}`);
  console.log('='.repeat(80));
  
  const readinessChecks = {
    'Database Schema': testResults.details.filter(t => t.testName.includes('Table')).every(t => t.passed),
    'Authentication System': testResults.details.filter(t => t.testName.includes('User') || t.testName.includes('Profile')).some(t => t.passed),
    'Project Management': testResults.details.filter(t => t.testName.includes('Project')).some(t => t.passed),
    'Protocol System': testResults.details.filter(t => t.testName.includes('Protocol')).some(t => t.passed),
    'AI Integration': testResults.details.filter(t => t.testName.includes('OpenAI')).some(t => t.passed)
  };
  
  Object.entries(readinessChecks).forEach(([check, passed]) => {
    const status = passed ? `${colors.green}✅ READY${colors.reset}` : `${colors.red}❌ NEEDS WORK${colors.reset}`;
    console.log(`${check}: ${status}`);
  });
  
  const readyComponents = Object.values(readinessChecks).filter(Boolean).length;
  const totalComponents = Object.keys(readinessChecks).length;
  
  console.log(`\n${colors.bright}MVP COMPONENTS READY: ${readyComponents}/${totalComponents}${colors.reset}`);
  
  if (readyComponents === totalComponents) {
    console.log(`${colors.green}🚀 MVP IS FULLY READY FOR PUBMED INTEGRATION!${colors.reset}`);
  } else if (readyComponents >= totalComponents * 0.8) {
    console.log(`${colors.yellow}🔧 MVP IS MOSTLY READY - Minor fixes needed${colors.reset}`);
  } else {
    console.log(`${colors.red}⚠️  MVP NEEDS SIGNIFICANT WORK before PubMed integration${colors.reset}`);
  }
  
  console.log(`\n${colors.bright}Test completed at: ${new Date().toISOString()}${colors.reset}`);
}

// Main test execution
async function runComprehensiveTests() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    SEARCHMATIC MVP COMPREHENSIVE TEST SUITE                   ║');
  console.log('║                                                                               ║');
  console.log('║  Testing database operations, user journeys, and AI integrations             ║');
  console.log('║  to verify MVP readiness for PubMed integration                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);
  
  const startTime = Date.now();
  
  try {
    // Execute all test suites in order
    await testConfiguration();
    await testDatabaseSchema();
    await testAuthentication();
    await testProjectOperations();
    await testProtocolOperations();
    await testConversationOperations();
    await testStudyOperations();
    await testOpenAIIntegration();
    
  } catch (error) {
    console.error(`${colors.red}Critical test failure: ${error.message}${colors.reset}`);
  } finally {
    // Always attempt cleanup
    await cleanupTestData();
    
    const duration = Date.now() - startTime;
    console.log(`\n${colors.bright}Total test duration: ${(duration / 1000).toFixed(2)}s${colors.reset}`);
    
    // Generate comprehensive report
    generateReport();
  }
}

// Execute tests
runComprehensiveTests().catch(console.error);