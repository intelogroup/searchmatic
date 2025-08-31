#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co';
const supabaseAnonKey = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  // Try to sign up a test user
  const testEmail = 'test-edge-functions@example.com';
  const testPassword = 'TestPassword123!';
  
  console.log('🔐 Creating test user account...');
  
  // First try to sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });
  
  if (signUpError && !signUpError.message.includes('User already registered')) {
    console.error('❌ Signup failed:', signUpError.message);
    return null;
  }
  
  // Now sign in to get session
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  
  if (signInError) {
    console.error('❌ Signin failed:', signInError.message);
    return null;
  }
  
  if (!signInData.session) {
    console.error('❌ No session created');
    return null;
  }
  
  console.log('✅ Test user authenticated');
  console.log(`   User ID: ${signInData.user.id}`);
  console.log(`   Email: ${signInData.user.email}`);
  
  return signInData.session.access_token;
}

async function getTestProject() {
  console.log('📊 Getting test project for authenticated tests...');
  
  // Get any existing project (they all belong to users so RLS will filter)
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, title')
    .limit(1);
    
  if (error) {
    console.error('❌ Error fetching projects:', error.message);
    return null;
  }
  
  if (projects && projects.length > 0) {
    console.log('✅ Using existing project');
    console.log(`   Project ID: ${projects[0].id}`);
    console.log(`   Title: ${projects[0].title}`);
    return projects[0].id;
  }
  
  console.log('⚠️  No projects found - using test UUID');
  // Use a test UUID that edge functions can handle gracefully
  return 'test-project-uuid-12345';
}

async function getTestConversation(projectId) {
  console.log('💬 Getting test conversation...');
  
  // Get any existing conversation
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, title')
    .limit(1);
    
  if (error) {
    console.error('❌ Error fetching conversations:', error.message);
  }
  
  if (conversations && conversations.length > 0) {
    console.log('✅ Using existing conversation');
    console.log(`   Conversation ID: ${conversations[0].id}`);
    return conversations[0].id;
  }
  
  console.log('⚠️  No conversations found - using test UUID');
  // Use a test UUID that edge functions can handle gracefully
  return 'test-conversation-uuid-12345';
}

async function testAuthenticatedFunction(endpoint, payload, userToken, functionName) {
  const url = `${supabaseUrl}/functions/v1${endpoint}`;
  console.log(`\n🧪 Testing ${functionName} with authentication...`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify(payload),
    });

    console.log(`   📍 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ SUCCESS: Function executed successfully`);
      console.log(`   📝 Response preview: ${JSON.stringify(data).substring(0, 150)}...`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ FAILED: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`   🚫 ERROR: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔐 Testing Edge Functions with User Authentication');
  console.log('=================================================');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  
  // Step 1: Create and authenticate test user
  const userToken = await createTestUser();
  if (!userToken) {
    console.error('❌ Cannot proceed without user token');
    process.exit(1);
  }
  
  // Step 2: Get test project
  const projectId = await getTestProject();
  if (!projectId) {
    console.error('❌ Cannot proceed without project');
    process.exit(1);
  }
  
  // Step 3: Get test conversation
  const conversationId = await getTestConversation(projectId);
  if (!conversationId) {
    console.error('❌ Cannot proceed without conversation');
    process.exit(1);
  }
  
  console.log('\n🧪 Testing Authenticated Edge Functions');
  console.log('=======================================');
  
  let successCount = 0;
  let totalTests = 0;
  
  // Test Protocol Guidance
  totalTests++;
  const protocolSuccess = await testAuthenticatedFunction(
    '/protocol-guidance',
    {
      projectId: projectId,
      type: 'framework',
      researchQuestion: 'What is the effectiveness of mindfulness interventions for anxiety disorders in adults?',
      focusArea: 'pico',
      reviewType: 'systematic_review'
    },
    userToken,
    'protocol-guidance'
  );
  if (protocolSuccess) successCount++;
  
  // Test Chat Completion
  totalTests++;
  const chatSuccess = await testAuthenticatedFunction(
    '/chat-completion',
    {
      conversationId: conversationId,
      messages: [
        { role: 'system', content: 'You are a helpful research assistant.' },
        { role: 'user', content: 'Hello, can you help me with my systematic review?' }
      ],
      options: { model: 'gpt-3.5-turbo', temperature: 0.7, maxTokens: 100 }
    },
    userToken,
    'chat-completion'
  );
  if (chatSuccess) successCount++;
  
  // Test Literature Analysis
  totalTests++;
  const analysisSuccess = await testAuthenticatedFunction(
    '/analyze-literature',
    {
      articleText: 'This is a research study examining the effectiveness of mindfulness-based interventions for reducing anxiety in adults. The randomized controlled trial included 200 participants who were randomly assigned to either a mindfulness intervention group or a control group. Results showed significant reductions in anxiety scores for the intervention group compared to controls (p < 0.05). The study concluded that mindfulness interventions are effective for anxiety reduction.',
      analysisType: 'summary',
      projectId: projectId
    },
    userToken,
    'analyze-literature'
  );
  if (analysisSuccess) successCount++;
  
  // Final Summary
  console.log('\n📊 Authentication Test Summary');
  console.log('==============================');
  console.log(`✅ Successful: ${successCount}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - successCount}/${totalTests}`);
  
  if (successCount === totalTests) {
    console.log('\n🎉 ALL EDGE FUNCTIONS WORKING!');
    console.log('✅ Platform JWT validation bypassed with --no-verify-jwt');
    console.log('✅ User authentication working correctly');
    console.log('✅ Database integration functional');
    console.log('✅ AI services accessible with proper auth');
    console.log('\n🚀 Ready for frontend integration!');
  } else {
    console.log('\n🔧 Some functions still need debugging');
    console.log('💡 Check error messages above for specific issues');
  }
  
  // Clean up - sign out
  await supabase.auth.signOut();
  console.log('\n🏁 Test completed, user signed out');
}

main().catch(console.error);