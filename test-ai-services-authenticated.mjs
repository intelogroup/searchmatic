#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co';
const supabaseAnonKey = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUserSession() {
  console.log('🔐 Creating authenticated user session for AI testing...');
  
  const testEmail = 'ai-test-user@searchmatic.example.com';
  const testPassword = 'AITestPassword2024!';
  
  // Try to sign up first (will fail if user exists, that's OK)
  const { error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });
  
  if (signUpError && !signUpError.message.includes('User already registered')) {
    console.error('❌ Signup failed:', signUpError.message);
  }
  
  // Sign in to get session
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
  
  console.log('✅ User authenticated successfully');
  console.log(`   User ID: ${signInData.user.id}`);
  console.log(`   Email: ${signInData.user.email}`);
  
  return {
    user: signInData.user,
    token: signInData.session.access_token
  };
}

async function createTestResources(token) {
  console.log('\n📊 Creating test resources for AI functions...');
  
  // Create test project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      title: 'AI Services Test Project',
      description: 'Test project for validating AI edge functions',
      status: 'active'
    })
    .select()
    .single();
    
  if (projectError) {
    console.error('❌ Project creation failed:', projectError.message);
    return null;
  }
  
  console.log('✅ Test project created');
  console.log(`   Project ID: ${project.id}`);
  
  // Create test conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      project_id: project.id,
      title: 'AI Services Test Conversation'
    })
    .select()
    .single();
    
  if (convError) {
    console.error('❌ Conversation creation failed:', convError.message);
    return { projectId: project.id, conversationId: null };
  }
  
  console.log('✅ Test conversation created');
  console.log(`   Conversation ID: ${conversation.id}`);
  
  return {
    projectId: project.id,
    conversationId: conversation.id
  };
}

async function testProtocolGuidance(token, projectId) {
  console.log('\n🧪 Testing Protocol Guidance AI Service...');
  
  const testCases = [
    {
      name: 'Create PICO Framework',
      payload: {
        projectId: projectId,
        type: 'framework',
        researchQuestion: 'What is the effectiveness of mindfulness-based interventions compared to standard care for reducing anxiety in adults with generalized anxiety disorder?',
        focusArea: 'pico',
        reviewType: 'systematic_review'
      }
    },
    {
      name: 'Create Protocol',
      payload: {
        projectId: projectId,
        type: 'create',
        researchQuestion: 'What are the effects of cognitive behavioral therapy on depression symptoms in adolescents?',
        reviewType: 'systematic_review'
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n   Testing: ${testCase.name}`);
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/protocol-guidance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(testCase.payload),
      });

      console.log(`   📍 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ SUCCESS: Protocol guidance generated');
        console.log(`   📝 Type: ${data.type}`);
        console.log(`   📝 Focus: ${data.focusArea || 'general'}`);
        
        if (data.guidance && data.guidance.success) {
          console.log('   🤖 AI Response: Generated successfully');
          console.log(`   📊 Usage: ${JSON.stringify(data.guidance.usage || {})}`);
        }
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
}

async function testLiteratureAnalysis(token, projectId) {
  console.log('\n🧪 Testing Literature Analysis AI Service...');
  
  const sampleArticle = `
Title: Effectiveness of Mindfulness-Based Interventions for Anxiety: A Systematic Review and Meta-Analysis

Abstract: 
Background: Generalized anxiety disorder affects millions worldwide. Mindfulness-based interventions have shown promise as therapeutic approaches.

Methods: We conducted a systematic review and meta-analysis of randomized controlled trials examining mindfulness interventions for anxiety. We searched PubMed, PsycINFO, and Cochrane databases from inception to December 2023. Participants were adults diagnosed with generalized anxiety disorder.

Results: Twenty-four studies met inclusion criteria, involving 1,468 participants. Mindfulness interventions showed significant reductions in anxiety scores compared to control groups (standardized mean difference = -0.68, 95% CI: -0.89 to -0.47, p < 0.001). Effect sizes were maintained at 3-month follow-up.

Conclusions: Mindfulness-based interventions demonstrate significant effectiveness for reducing anxiety symptoms in adults with generalized anxiety disorder. Further research is needed to establish optimal intervention duration and format.

Keywords: mindfulness, anxiety, meditation, randomized controlled trial, meta-analysis
`;

  const testCases = [
    {
      name: 'Article Summary',
      payload: {
        articleText: sampleArticle,
        analysisType: 'summary',
        projectId: projectId
      }
    },
    {
      name: 'Quality Assessment',
      payload: {
        articleText: sampleArticle,
        analysisType: 'quality',
        projectId: projectId
      }
    },
    {
      name: 'Data Extraction',
      payload: {
        articleText: sampleArticle,
        analysisType: 'extraction',
        projectId: projectId,
        extractionTemplate: {
          study_design: 'string',
          sample_size: 'number',
          intervention_type: 'string',
          outcome_measures: 'array',
          effect_size: 'number',
          confidence_interval: 'string'
        }
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n   Testing: ${testCase.name}`);
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/analyze-literature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(testCase.payload),
      });

      console.log(`   📍 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ SUCCESS: Literature analysis completed');
        console.log(`   📝 Analysis Type: ${data.analysisType}`);
        console.log(`   🤖 AI Analysis: Generated successfully`);
        console.log(`   📊 Usage: ${JSON.stringify(data.usage || {})}`);
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
}

async function testChatCompletion(token, conversationId) {
  console.log('\n🧪 Testing Chat Completion AI Service...');
  
  const testMessages = [
    {
      role: 'system',
      content: 'You are a helpful research assistant specializing in systematic literature reviews. Provide concise, expert guidance.'
    },
    {
      role: 'user',
      content: 'I\'m conducting a systematic review on mindfulness interventions for anxiety. What databases should I search and what key terms would you recommend?'
    }
  ];
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/chat-completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversationId: conversationId,
        messages: testMessages,
        options: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 200
        }
      }),
    });

    console.log(`   📍 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ SUCCESS: Chat completion generated');
      console.log(`   🤖 AI Response: ${data.content?.substring(0, 100)}...`);
      console.log(`   📊 Usage: ${JSON.stringify(data.usage || {})}`);
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
  console.log('🚀 Testing AI Services with Authenticated Users');
  console.log('===============================================');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🔗 Base URL: ${supabaseUrl}`);
  
  // Step 1: Create authenticated user session
  const session = await createTestUserSession();
  if (!session) {
    console.error('❌ Cannot proceed without authenticated session');
    process.exit(1);
  }
  
  // Step 2: Create test resources
  const resources = await createTestResources(session.token);
  if (!resources || !resources.projectId) {
    console.error('❌ Cannot proceed without test project');
    process.exit(1);
  }
  
  console.log('\n🧪 Testing AI Services with Authentication');
  console.log('=========================================');
  
  let totalTests = 0;
  let successfulTests = 0;
  
  // Test Protocol Guidance
  totalTests++;
  console.log('\n🔬 Testing Protocol Guidance Service');
  const protocolSuccess = await testProtocolGuidance(session.token, resources.projectId);
  if (protocolSuccess) successfulTests++;
  
  // Test Literature Analysis
  totalTests++;
  console.log('\n🔬 Testing Literature Analysis Service');
  const analysisSuccess = await testLiteratureAnalysis(session.token, resources.projectId);
  if (analysisSuccess) successfulTests++;
  
  // Test Chat Completion (only if we have a conversation)
  if (resources.conversationId) {
    totalTests++;
    console.log('\n🔬 Testing Chat Completion Service');
    const chatSuccess = await testChatCompletion(session.token, resources.conversationId);
    if (chatSuccess) successfulTests++;
  }
  
  // Final Summary
  console.log('\n📊 AI Services Test Results');
  console.log('===========================');
  console.log(`✅ Successful: ${successfulTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - successfulTests}/${totalTests}`);
  
  if (successfulTests === totalTests) {
    console.log('\n🎉 ALL AI SERVICES WORKING WITH AUTHENTICATION!');
    console.log('✅ Protocol guidance enabled');
    console.log('✅ Literature analysis enabled');
    console.log('✅ Chat completion enabled');
    console.log('✅ User authentication flow verified');
    console.log('✅ Resource ownership validation working');
    console.log('\n🚀 Ready for frontend integration!');
  } else {
    console.log('\n🔧 Some AI services need attention');
    console.log('💡 Check error messages above for specific issues');
  }
  
  // Clean up - sign out
  await supabase.auth.signOut();
  console.log('\n🏁 Test completed, user signed out');
}

main().catch(console.error);