import fs from 'fs';
import https from 'https';

// Load JWT tokens
const tokenData = JSON.parse(fs.readFileSync('generated-tokens.json', 'utf8'));
const { service_token, supabase_url } = tokenData;

// First, let's create a test conversation and user
async function makeRequest(path, method, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, supabase_url);
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${service_token}`,
        ...headers
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = res.statusCode >= 400 ? data : JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: response
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function testProfessorAIChat() {
  console.log('🤖 Testing Professor AI Chat Functionality');
  console.log('==========================================\n');

  try {
    // Step 1: Create a test conversation
    console.log('📝 Step 1: Creating test conversation...');
    
    // First, let's get a user ID from profiles table
    const profilesResponse = await makeRequest(
      '/rest/v1/profiles?select=id,email&limit=1',
      'GET'
    );

    if (profilesResponse.status !== 200) {
      throw new Error('Failed to get user profile');
    }

    const userId = profilesResponse.body[0]?.id;
    if (!userId) {
      throw new Error('No user found in profiles table');
    }

    console.log(`   Found user: ${userId}`);

    // Create a conversation
    const conversationPayload = {
      user_id: userId,
      title: 'Professor AI Test Chat',
      context: 'Testing the Professor AI functionality'
    };

    const convResponse = await makeRequest(
      '/rest/v1/conversations',
      'POST',
      conversationPayload
    );

    if (convResponse.status !== 201) {
      console.log('   ❌ Failed to create conversation:', convResponse.body);
      throw new Error('Failed to create conversation');
    }

    const conversationId = convResponse.body[0]?.id;
    console.log(`   ✅ Created conversation: ${conversationId}`);

    // Step 2: Test the chat-completion function
    console.log('\n🤖 Step 2: Testing chat-completion function...');

    const chatPayload = {
      conversationId: conversationId,
      messages: [
        {
          role: 'system',
          content: 'You are a Professor AI assistant specializing in systematic literature reviews. Help researchers with their academic work.'
        },
        {
          role: 'user',
          content: 'Hello Professor AI! Can you help me understand what a systematic literature review is?'
        }
      ],
      options: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 500,
        stream: false
      }
    };

    const chatResponse = await makeRequest(
      '/functions/v1/chat-completion',
      'POST',
      chatPayload
    );

    console.log(`   Response Status: ${chatResponse.status}`);

    if (chatResponse.status === 200) {
      console.log('   ✅ Chat function responded successfully!');
      console.log('\n📄 Professor AI Response:');
      console.log('   ' + '─'.repeat(60));
      
      if (typeof chatResponse.body === 'string') {
        console.log('   ' + chatResponse.body.substring(0, 300) + '...');
      } else {
        console.log('   Content:', chatResponse.body.content?.substring(0, 300) + '...');
        if (chatResponse.body.usage) {
          console.log('\n📊 Usage Statistics:');
          console.log(`   Prompt tokens: ${chatResponse.body.usage.prompt_tokens}`);
          console.log(`   Completion tokens: ${chatResponse.body.usage.completion_tokens}`);
          console.log(`   Total tokens: ${chatResponse.body.usage.total_tokens}`);
        }
      }
    } else {
      console.log('   ❌ Chat function failed');
      console.log('   Error:', chatResponse.body);
      
      // Check if it's an auth issue
      if (chatResponse.status === 401) {
        console.log('\n🔍 Debugging: This might be because edge functions require user JWT tokens');
        console.log('   Service tokens may not work for user-context functions');
      }
    }

    // Step 3: Test with different message
    console.log('\n🔄 Step 3: Testing with follow-up question...');

    const followUpPayload = {
      conversationId: conversationId,
      messages: [
        {
          role: 'system',
          content: 'You are a Professor AI assistant specializing in systematic literature reviews.'
        },
        {
          role: 'user',
          content: 'What are the key steps in conducting a PICO analysis?'
        }
      ],
      options: {
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        maxTokens: 300,
        stream: false
      }
    };

    const followUpResponse = await makeRequest(
      '/functions/v1/chat-completion',
      'POST',
      followUpPayload
    );

    console.log(`   Follow-up Response Status: ${followUpResponse.status}`);
    
    if (followUpResponse.status === 200) {
      console.log('   ✅ Follow-up chat successful!');
      console.log('\n📄 Follow-up Response:');
      console.log('   ' + '─'.repeat(60));
      if (typeof followUpResponse.body === 'string') {
        console.log('   ' + followUpResponse.body.substring(0, 200) + '...');
      } else {
        console.log('   Content:', followUpResponse.body.content?.substring(0, 200) + '...');
      }
    } else {
      console.log('   ❌ Follow-up failed:', followUpResponse.body);
    }

    // Step 4: Clean up - delete test conversation
    console.log('\n🧹 Step 4: Cleaning up test data...');
    
    const deleteResponse = await makeRequest(
      `/rest/v1/conversations?id=eq.${conversationId}`,
      'DELETE'
    );

    if (deleteResponse.status === 204) {
      console.log('   ✅ Test conversation cleaned up');
    }

    // Summary
    console.log('\n📊 Test Summary');
    console.log('================');
    console.log('✅ Conversation creation: Working');
    console.log(`${chatResponse.status === 200 ? '✅' : '❌'} Professor AI chat: ${chatResponse.status === 200 ? 'Working' : 'Failed'}`);
    console.log(`${followUpResponse.status === 200 ? '✅' : '❌'} Follow-up chat: ${followUpResponse.status === 200 ? 'Working' : 'Failed'}`);
    
    if (chatResponse.status !== 200) {
      console.log('\n⚠️  Note: Chat functions may require user JWT tokens instead of service tokens');
      console.log('   This is expected behavior for security reasons');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }

  return true;
}

// Run the test
testProfessorAIChat()
  .then(success => {
    console.log(`\n${success ? '✨ Test completed!' : '💥 Test failed!'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });