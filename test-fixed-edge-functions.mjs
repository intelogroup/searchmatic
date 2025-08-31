#!/usr/bin/env node

import { readFileSync } from 'fs';

// Read generated tokens
const tokens = JSON.parse(readFileSync('generated-tokens.json', 'utf8'));

const baseUrl = 'https://qzvfufadiqmizrozejci.supabase.co/functions/v1';

// Test data for each function
const testCases = [
  {
    name: 'test-simple',
    endpoint: '/test-simple',
    payload: { name: 'Terry', test: true },
    requiresAuth: false
  },
  {
    name: 'hello-world',
    endpoint: '/hello-world',
    payload: { message: 'Test from Terry' },
    requiresAuth: false // Can work without auth but shows user info if provided
  },
  {
    name: 'protocol-guidance',
    endpoint: '/protocol-guidance',
    payload: {
      type: 'framework',
      researchQuestion: 'What is the effectiveness of mindfulness interventions for anxiety disorders?',
      focusArea: 'pico',
      reviewType: 'systematic_review'
    },
    requiresAuth: true
  },
  {
    name: 'chat-completion',
    endpoint: '/chat-completion',
    payload: {
      conversationId: 'test-conversation-id',
      messages: [
        { role: 'user', content: 'Hello, test message' }
      ],
      options: { model: 'gpt-3.5-turbo', temperature: 0.7 }
    },
    requiresAuth: true
  },
  {
    name: 'analyze-literature',
    endpoint: '/analyze-literature',
    payload: {
      articleText: 'This is a test research article about mindfulness and anxiety. The study found significant improvements in anxiety levels after mindfulness training.',
      analysisType: 'summary',
      projectId: 'test-project-id'
    },
    requiresAuth: true
  }
];

async function testFunction(testCase) {
  const url = baseUrl + testCase.endpoint;
  console.log(`\n🧪 Testing ${testCase.name}...`);
  console.log(`   URL: ${url}`);
  
  // Test without authentication first
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase.payload),
    });

    console.log(`   📍 No Auth: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ SUCCESS: ${JSON.stringify(data).substring(0, 100)}...`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ FAILED: ${errorText.substring(0, 100)}...`);
    }
  } catch (error) {
    console.log(`   🚫 ERROR: ${error.message}`);
  }

  // Test with anon token if function requires auth
  if (testCase.requiresAuth) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.anon_token}`,
        },
        body: JSON.stringify(testCase.payload),
      });

      console.log(`   📍 Anon Token: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS: ${JSON.stringify(data).substring(0, 100)}...`);
        return true;
      } else {
        const errorText = await response.text();
        console.log(`   ❌ FAILED: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   🚫 ERROR: ${error.message}`);
    }

    // Test with service token
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.service_token}`,
        },
        body: JSON.stringify(testCase.payload),
      });

      console.log(`   📍 Service Token: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS: ${JSON.stringify(data).substring(0, 100)}...`);
        return true;
      } else {
        const errorText = await response.text();
        console.log(`   ❌ FAILED: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   🚫 ERROR: ${error.message}`);
    }
  }

  return false;
}

async function main() {
  console.log('🚀 Testing Fixed Edge Functions');
  console.log('===============================');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🔗 Base URL: ${baseUrl}`);
  console.log(`🔑 Using tokens from: generated-tokens.json`);

  let successCount = 0;
  const results = [];

  for (const testCase of testCases) {
    const success = await testFunction(testCase);
    results.push({ name: testCase.name, success, requiresAuth: testCase.requiresAuth });
    if (success) successCount++;
  }

  console.log('\n📊 Summary');
  console.log('===========');
  console.log(`✅ Successful: ${successCount}/${testCases.length}`);
  console.log(`❌ Failed: ${testCases.length - successCount}/${testCases.length}`);

  console.log('\n📋 Results by Function:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const auth = result.requiresAuth ? '🔒 Auth Required' : '🔓 Public';
    console.log(`   ${status} ${result.name} (${auth})`);
  });

  console.log('\n💡 Next Steps:');
  if (successCount < testCases.length) {
    console.log('   - Functions requiring auth need actual user JWT tokens (not anon/service)');
    console.log('   - Consider implementing test user creation for authenticated testing');
    console.log('   - Check if functions should accept service role tokens for admin operations');
  } else {
    console.log('   - All functions working! Ready for frontend integration');
  }
}

main().catch(console.error);