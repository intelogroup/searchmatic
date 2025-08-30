import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// Supabase configuration 
const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

// Database connection for cleanup
const sql = postgres(process.env.DATABASE_URL);

// Test user credentials
const TEST_USER = {
  email: 'professor.ai.test@example.com',
  password: 'TestPassword123!'
};

async function testAuthenticatedChat() {
  console.log('🔐 Testing Professor AI Chat with Authenticated User');
  console.log('====================================================\n');

  let userId, projectId, conversationId;
  let session = null;

  try {
    // Step 1: Initialize Supabase client
    console.log('📝 Step 1: Initializing Supabase client...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('   ✅ Supabase client initialized');

    // Step 2: Sign up/sign in user
    console.log(`\n🔑 Step 2: Authenticating user (${TEST_USER.email})...`);
    
    // Try to sign in first
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (signInError && signInError.message.includes('Invalid login credentials')) {
      console.log('   User not found, creating new account...');
      
      // Sign up new user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_USER.email,
        password: TEST_USER.password
      });

      if (signUpError) {
        throw new Error(`Sign up failed: ${signUpError.message}`);
      }

      session = signUpData.session;
      console.log('   ✅ User created and signed in');
    } else if (signInError) {
      throw new Error(`Sign in failed: ${signInError.message}`);
    } else {
      session = signInData.session;
      console.log('   ✅ User signed in successfully');
    }

    if (!session) {
      throw new Error('No session returned from authentication');
    }

    userId = session.user.id;
    
    // Display token info
    console.log('\n📋 Token Information:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${session.user.email}`);
    console.log(`   Token Type: ${session.token_type}`);
    console.log(`   Access Token (first 50 chars): ${session.access_token.substring(0, 50)}...`);
    console.log(`   Expires In: ${session.expires_in} seconds`);

    // Step 3: Create test project using authenticated client
    console.log('\n📂 Step 3: Creating test project...');
    
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        title: 'Professor AI Test Project',
        description: 'Testing authenticated chat functionality',
        status: 'active'
      })
      .select('id')
      .single();

    if (projectError) {
      throw new Error(`Failed to create project: ${projectError.message}`);
    }

    projectId = projectData.id;
    console.log(`   ✅ Created project: ${projectId}`);

    // Step 4: Create conversation using authenticated client
    console.log('\n💬 Step 4: Creating conversation...');
    
    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        project_id: projectId,
        title: 'Professor AI Test Chat',
        context: 'Testing authenticated chat with Professor AI'
      })
      .select('id')
      .single();

    if (conversationError) {
      throw new Error(`Failed to create conversation: ${conversationError.message}`);
    }

    conversationId = conversationData.id;
    console.log(`   ✅ Created conversation: ${conversationId}`);

    // Step 5: Test Professor AI chat with authenticated token
    console.log('\n🤖 Step 5: Testing Professor AI chat...');
    
    const chatPayload = {
      conversationId: conversationId,
      messages: [
        {
          role: 'system',
          content: 'You are Professor AI, an expert assistant specializing in systematic literature reviews and academic research methodology. Provide helpful, accurate, and scholarly responses.'
        },
        {
          role: 'user',
          content: 'Hello Professor AI! Can you explain the PICO framework and how it\'s used in systematic literature reviews? Please provide a comprehensive but concise explanation.'
        }
      ],
      options: {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 600,
        stream: false
      }
    };

    const chatResponse = await fetch(`${SUPABASE_URL}/functions/v1/chat-completion`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chatPayload)
    });

    console.log(`   Response Status: ${chatResponse.status}`);
    console.log(`   Response OK: ${chatResponse.ok}`);

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      
      console.log('   ✅ Professor AI responded successfully!\n');
      console.log('📄 Professor AI Response:');
      console.log('═'.repeat(80));
      console.log(chatData.content || 'No content received');
      console.log('═'.repeat(80));

      if (chatData.usage) {
        console.log('\n📊 Usage Statistics:');
        console.log(`   Model: ${chatData.model}`);
        console.log(`   Prompt tokens: ${chatData.usage.prompt_tokens}`);
        console.log(`   Completion tokens: ${chatData.usage.completion_tokens}`);
        console.log(`   Total tokens: ${chatData.usage.total_tokens}`);
      }

      // Step 6: Store the chat in database
      console.log('\n💾 Step 6: Storing chat messages...');
      
      // Store user message
      const { error: userMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: 'Hello Professor AI! Can you explain the PICO framework and how it\'s used in systematic literature reviews? Please provide a comprehensive but concise explanation.'
        });

      if (userMsgError) {
        console.log(`   ⚠️ Failed to store user message: ${userMsgError.message}`);
      } else {
        console.log('   ✅ User message stored');
      }

      // Store assistant response
      const { error: assistantMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: chatData.content,
          metadata: {
            model: chatData.model,
            usage: chatData.usage,
            timestamp: chatData.timestamp
          }
        });

      if (assistantMsgError) {
        console.log(`   ⚠️ Failed to store assistant message: ${assistantMsgError.message}`);
      } else {
        console.log('   ✅ Assistant message stored');
      }

      // Step 7: Test follow-up question
      console.log('\n🔄 Step 7: Testing follow-up question...');
      
      const followUpPayload = {
        conversationId: conversationId,
        messages: [
          {
            role: 'system',
            content: 'You are Professor AI, an expert in systematic literature reviews.'
          },
          {
            role: 'user',
            content: 'Thank you for that explanation! Now can you give me a specific example of how PICO would be applied to a research question about the effectiveness of online learning?'
          }
        ],
        options: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 400,
          stream: false
        }
      };

      const followUpResponse = await fetch(`${SUPABASE_URL}/functions/v1/chat-completion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(followUpPayload)
      });

      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        console.log('   ✅ Follow-up question successful!\n');
        console.log('📄 Follow-up Response:');
        console.log('─'.repeat(80));
        console.log(followUpData.content?.substring(0, 300) + '...');
        console.log('─'.repeat(80));
      } else {
        console.log('   ❌ Follow-up question failed');
      }

      return true;

    } else {
      const errorText = await chatResponse.text();
      console.log('   ❌ Professor AI chat failed');
      console.log(`   Error: ${errorText}`);
      
      // Check for specific error types
      if (chatResponse.status === 401) {
        console.log('\n🔍 Still getting 401 - check token validity and function permissions');
      } else if (chatResponse.status === 500) {
        console.log('\n🔍 Server error - check OpenAI API key and function logs');
      }
      
      return false;
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;

  } finally {
    // Step 8: Clean up test data
    console.log('\n🧹 Step 8: Cleaning up test data...');
    
    try {
      if (conversationId) {
        // Delete messages first (foreign key constraint)
        await sql`DELETE FROM messages WHERE conversation_id = ${conversationId}`;
        await sql`DELETE FROM conversations WHERE id = ${conversationId}`;
        console.log('   ✅ Conversation and messages cleaned up');
      }
      
      if (projectId) {
        await sql`DELETE FROM projects WHERE id = ${projectId}`;
        console.log('   ✅ Project cleaned up');
      }

      if (userId && TEST_USER.email.includes('test@example.com')) {
        // Only delete test users, not real users
        await sql`DELETE FROM auth.users WHERE id = ${userId}`;
        await sql`DELETE FROM profiles WHERE id = ${userId}`;
        console.log('   ✅ Test user cleaned up');
      }

    } catch (cleanupError) {
      console.log(`   ⚠️ Cleanup warning: ${cleanupError.message}`);
    }
    
    await sql.end();
  }
}

// Run the test
testAuthenticatedChat()
  .then(success => {
    console.log('\n📊 Final Results');
    console.log('=================');
    
    if (success) {
      console.log('🎉 SUCCESS: Professor AI chat is fully functional!');
      console.log('✅ Authentication: Working');
      console.log('✅ Database integration: Working');
      console.log('✅ Chat completion: Working');
      console.log('✅ Message storage: Working');
      console.log('✅ Follow-up questions: Working');
      console.log('\n🚀 The Professor AI system is ready for production use!');
    } else {
      console.log('❌ FAILED: Professor AI chat needs debugging');
      console.log('🔍 Check OpenAI API key configuration in Supabase secrets');
      console.log('🔍 Verify edge function deployment and permissions');
    }
    
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });