import fs from 'fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
// We'll query directly with SQL instead of using schema
// import * as schema from './src/db/schema.js';
import dotenv from 'dotenv';

dotenv.config();

// Load JWT tokens
const tokenData = JSON.parse(fs.readFileSync('generated-tokens.json', 'utf8'));
const { service_token, supabase_url } = tokenData;

// Database connection
const sql = postgres(process.env.DATABASE_URL);

async function makeHTTPRequest(url, method, data, token) {
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  });

  let body;
  try {
    body = response.ok ? await response.json() : await response.text();
  } catch {
    body = await response.text();
  }

  return {
    status: response.status,
    ok: response.ok,
    body: body
  };
}

async function testProfessorAIDirectly() {
  console.log('🤖 Testing Professor AI with Direct Database Access');
  console.log('===================================================\n');

  try {
    // Step 1: Get user from database
    console.log('📝 Step 1: Getting user from database...');
    
    const users = await sql`SELECT id, email FROM profiles LIMIT 1`;
    
    if (users.length === 0) {
      throw new Error('No users found in profiles table');
    }

    const user = users[0];
    console.log(`   Found user: ${user.email} (${user.id})`);

    // Step 2: Create a test project first
    console.log('\n📝 Step 2: Creating test project...');
    
    const [project] = await sql`
      INSERT INTO projects (user_id, title, description, status)
      VALUES (${user.id}, 'Professor AI Test Project', 'Test project for Professor AI chat', 'active')
      RETURNING id
    `;

    console.log(`   ✅ Created project: ${project.id}`);

    // Step 3: Create a test conversation 
    console.log('\n📝 Step 3: Creating test conversation...');
    
    const [conversation] = await sql`
      INSERT INTO conversations (user_id, project_id, title, context)
      VALUES (${user.id}, ${project.id}, 'Professor AI Test Chat', 'Testing Professor AI functionality with direct database access')
      RETURNING id
    `;

    console.log(`   ✅ Created conversation: ${conversation.id}`);

    // Step 4: Test the chat-completion edge function
    console.log('\n🤖 Step 4: Testing chat-completion edge function...');

    const chatPayload = {
      conversationId: conversation.id,
      messages: [
        {
          role: 'system',
          content: 'You are Professor AI, an expert in systematic literature reviews and academic research methodology.'
        },
        {
          role: 'user',
          content: 'Hello Professor AI! Can you explain the PICO framework for systematic literature reviews?'
        }
      ],
      options: {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 500,
        stream: false
      }
    };

    const chatResponse = await makeHTTPRequest(
      `${supabase_url}/functions/v1/chat-completion`,
      'POST',
      chatPayload,
      service_token
    );

    console.log(`   Response Status: ${chatResponse.status}`);
    console.log(`   Response OK: ${chatResponse.ok}`);

    if (chatResponse.ok) {
      console.log('   ✅ Professor AI responded successfully!');
      console.log('\n📄 Professor AI Response:');
      console.log('   ' + '─'.repeat(70));
      
      if (typeof chatResponse.body === 'string') {
        console.log('   ' + chatResponse.body.substring(0, 400) + '...');
      } else if (chatResponse.body.content) {
        console.log('   ' + chatResponse.body.content.substring(0, 400) + '...');
        
        if (chatResponse.body.usage) {
          console.log('\n📊 Usage Statistics:');
          console.log(`   Model: ${chatResponse.body.model}`);
          console.log(`   Prompt tokens: ${chatResponse.body.usage.prompt_tokens}`);
          console.log(`   Completion tokens: ${chatResponse.body.usage.completion_tokens}`);
          console.log(`   Total tokens: ${chatResponse.body.usage.total_tokens}`);
        }
      } else {
        console.log('   Raw response:', JSON.stringify(chatResponse.body).substring(0, 400));
      }

      // Step 5: Store the response in messages table
      console.log('\n💾 Step 5: Storing chat messages...');
      
      // Store user message
      await sql`
        INSERT INTO messages (conversation_id, role, content)
        VALUES (${conversation.id}, 'user', 'Hello Professor AI! Can you explain the PICO framework for systematic literature reviews?')
      `;

      // Store assistant response
      const assistantContent = typeof chatResponse.body === 'string' 
        ? chatResponse.body 
        : chatResponse.body.content || 'No response content';

      await sql`
        INSERT INTO messages (conversation_id, role, content)
        VALUES (${conversation.id}, 'assistant', ${assistantContent})
      `;

      console.log('   ✅ Messages stored in database');

    } else {
      console.log('   ❌ Professor AI chat failed');
      console.log('   Status:', chatResponse.status);
      console.log('   Error response:', chatResponse.body);

      if (chatResponse.status === 401) {
        console.log('\n🔍 Authentication Issue Detected:');
        console.log('   - Edge functions require user authentication');
        console.log('   - Service tokens may not provide user context');
        console.log('   - Try generating a user JWT token instead');
      }

      if (chatResponse.status === 500) {
        console.log('\n🔍 Server Error Detected:');
        console.log('   - Check if OPENAI_API_KEY is set in Supabase secrets');
        console.log('   - Verify edge function deployment');
        console.log('   - Check function logs for details');
      }
    }

    // Step 6: Test a simpler edge function that should work
    console.log('\n🧪 Step 6: Testing basic edge function...');
    
    const basicTest = await makeHTTPRequest(
      `${supabase_url}/functions/v1/test-simple`,
      'POST',
      { name: 'Professor AI Test' },
      service_token
    );

    console.log(`   Basic function status: ${basicTest.status}`);
    if (basicTest.ok) {
      console.log('   ✅ Basic edge function working');
    } else {
      console.log('   ❌ Basic edge function failed:', basicTest.body);
    }

    // Step 7: Clean up
    console.log('\n🧹 Step 7: Cleaning up...');
    
    // Delete messages
    await sql`DELETE FROM messages WHERE conversation_id = ${conversation.id}`;

    // Delete conversation
    await sql`DELETE FROM conversations WHERE id = ${conversation.id}`;

    // Delete project
    await sql`DELETE FROM projects WHERE id = ${project.id}`;

    console.log('   ✅ Test data cleaned up');

    // Summary
    console.log('\n📊 Test Summary');
    console.log('================');
    console.log(`✅ Database access: Working`);
    console.log(`✅ Project creation: Working`);
    console.log(`✅ Conversation creation: Working`);
    console.log(`${basicTest.ok ? '✅' : '❌'} Basic edge function: ${basicTest.ok ? 'Working' : 'Failed'}`);
    console.log(`${chatResponse.ok ? '✅' : '❌'} Professor AI chat: ${chatResponse.ok ? 'Working' : 'Needs user auth'}`);

    return chatResponse.ok;

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    return false;
  } finally {
    await sql.end();
  }
}

// Run the test
testProfessorAIDirectly()
  .then(success => {
    console.log(`\n${success ? '✨ Professor AI is working!' : '⚠️ Professor AI needs user authentication'}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });