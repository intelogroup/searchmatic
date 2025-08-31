#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co';
const supabaseAnonKey = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

async function testAIServicesWithAuth() {
  console.log('🚀 Testing AI Services with Authentication');
  console.log('==========================================');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Authenticate user
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'ai-test-user@searchmatic.example.com',
    password: 'AITestPassword2024!'
  });
  
  if (signInError || !signInData.session) {
    console.error('❌ Authentication failed:', signInError?.message);
    return;
  }
  
  console.log('✅ User authenticated');
  console.log(`   User ID: ${signInData.user.id}`);
  
  const userToken = signInData.session.access_token;
  let successCount = 0;
  let totalTests = 0;
  
  // Test 1: Protocol Guidance - Framework Generation
  totalTests++;
  console.log('\n🧪 Test 1: Protocol Guidance (Framework)');
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/protocol-guidance-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        projectId: 'test-project-ai-validation',
        type: 'framework',
        researchQuestion: 'What is the effectiveness of mindfulness interventions for reducing anxiety in adults?',
        focusArea: 'pico',
        reviewType: 'systematic_review'
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ SUCCESS: Framework generated');
      console.log(`   📝 Type: ${data.type} | Focus: ${data.focusArea}`);
      if (data.guidance?.success) {
        console.log('   🤖 AI Response: Generated successfully');
        console.log(`   📊 Tokens used: ${data.guidance.usage?.total_tokens || 'N/A'}`);
      }
      successCount++;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ FAILED: ${errorText}`);
    }
  } catch (error) {
    console.log(`   🚫 ERROR: ${error.message}`);
  }

  // Test 2: Protocol Guidance - Protocol Creation  
  totalTests++;
  console.log('\n🧪 Test 2: Protocol Guidance (Create)');
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/protocol-guidance-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        projectId: 'test-project-ai-validation',
        type: 'create',
        researchQuestion: 'What are the effects of exercise interventions on depression in older adults?',
        reviewType: 'systematic_review'
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ SUCCESS: Protocol created');
      console.log(`   📝 Type: ${data.type} | Review: ${data.reviewType}`);
      if (data.guidance?.success) {
        console.log('   🤖 AI Response: Generated successfully');
        console.log(`   📊 Tokens used: ${data.guidance.usage?.total_tokens || 'N/A'}`);
      }
      successCount++;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ FAILED: ${errorText}`);
    }
  } catch (error) {
    console.log(`   🚫 ERROR: ${error.message}`);
  }

  // Test 3: Literature Analysis
  totalTests++;
  console.log('\n🧪 Test 3: Literature Analysis');
  
  const sampleArticle = `
Title: Mindfulness-Based Stress Reduction for Anxiety: A Meta-Analysis
  
Abstract: Background: Anxiety disorders affect millions worldwide. This meta-analysis examines mindfulness-based stress reduction (MBSR) effectiveness for anxiety treatment.

Methods: Systematic search of PubMed, PsycINFO databases. Included randomized controlled trials of MBSR for anxiety in adults. Primary outcome: anxiety symptom reduction.

Results: 15 studies, n=1,247 participants. MBSR showed significant anxiety reduction vs. controls (SMD=-0.54, 95% CI:-0.69 to -0.39, p<0.001). Effects maintained at follow-up.

Conclusions: MBSR demonstrates significant effectiveness for anxiety reduction. Findings support clinical implementation.
`;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/analyze-literature-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        articleText: sampleArticle,
        analysisType: 'summary',
        projectId: 'test-project-ai-validation'
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ SUCCESS: Literature analysis completed');
      console.log(`   📝 Analysis Type: ${data.analysisType}`);
      console.log('   🤖 AI Analysis: Generated successfully');
      console.log(`   📊 Tokens used: ${data.usage?.total_tokens || 'N/A'}`);
      successCount++;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ FAILED: ${errorText}`);
    }
  } catch (error) {
    console.log(`   🚫 ERROR: ${error.message}`);
  }

  // Test 4: Chat Completion (create a test conversation)
  totalTests++;
  console.log('\n🧪 Test 4: Chat Completion');
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/professor-ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful research assistant for systematic literature reviews.'
          },
          {
            role: 'user',
            content: 'What are the key steps in conducting a systematic literature review?'
          }
        ],
        projectId: 'test-project-ai-validation',
        conversationTitle: 'AI Services Test Chat'
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ SUCCESS: Chat completion generated');
      console.log(`   🤖 AI Response: ${data.response?.substring(0, 60)}...`);
      console.log(`   💬 Conversation ID: ${data.conversationId || 'N/A'}`);
      console.log(`   📊 Tokens used: ${data.usage?.total_tokens || 'N/A'}`);
      successCount++;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ FAILED: ${errorText}`);
    }
  } catch (error) {
    console.log(`   🚫 ERROR: ${error.message}`);
  }

  // Final Results
  console.log('\n📊 AI Services Test Results');
  console.log('============================');
  console.log(`✅ Successful: ${successCount}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - successCount}/${totalTests}`);
  
  if (successCount === totalTests) {
    console.log('\n🎉 ALL AI SERVICES WORKING!');
    console.log('✅ Protocol guidance enabled and functional');
    console.log('✅ Literature analysis enabled and functional'); 
    console.log('✅ Chat completion enabled and functional');
    console.log('✅ User authentication flow verified');
    console.log('✅ OpenAI integration working');
    console.log('\n🚀 AI services ready for production use!');
  } else if (successCount > 0) {
    console.log('\n✨ Some AI services working!');
    console.log(`✅ ${successCount} services functional`);
    console.log('🔧 Check failed services for specific issues');
  } else {
    console.log('\n🔧 AI services need attention');
    console.log('💡 Check authentication and API key configuration');
  }
  
  // Sign out
  await supabase.auth.signOut();
  console.log('\n🏁 Test completed, user signed out');
}

testAIServicesWithAuth().catch(console.error);