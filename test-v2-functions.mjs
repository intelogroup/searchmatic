import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

async function testV2Functions() {
  console.log('🚀 Testing V2 Edge Functions');
  console.log('============================\n');

  try {
    // Test 1: test-simple-v2 without any auth
    console.log('🧪 Test 1: test-simple-v2 (no auth)');
    
    const simpleResponse = await fetch(`${SUPABASE_URL}/functions/v1/test-simple-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'V2 Test' })
    });

    console.log(`   Status: ${simpleResponse.status}`);
    
    if (simpleResponse.ok) {
      const simpleData = await simpleResponse.json();
      console.log('   ✅ SUCCESS! Function works without auth');
      console.log('   Response:', JSON.stringify(simpleData, null, 2));
    } else {
      const simpleError = await simpleResponse.text();
      console.log('   ❌ Failed:', simpleError);
    }

    // Test 2: test-simple-v2 with user auth
    console.log('\n🧪 Test 2: test-simple-v2 (with user auth)');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Create/sign in user
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'v2.test@example.com',
      password: 'TestPassword123!'
    });

    if (signInError && signInError.message.includes('Invalid login credentials')) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'v2.test@example.com',
        password: 'TestPassword123!'
      });
      
      if (signUpError) throw signUpError;
      signInData = signUpData;
    } else if (signInError) {
      throw signInError;
    }

    const session = signInData.session;
    if (!session) throw new Error('No session');

    console.log('   User authenticated');

    const authSimpleResponse = await fetch(`${SUPABASE_URL}/functions/v1/test-simple-v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Authenticated User' })
    });

    console.log(`   Status: ${authSimpleResponse.status}`);
    
    if (authSimpleResponse.ok) {
      const authSimpleData = await authSimpleResponse.json();
      console.log('   ✅ SUCCESS! Function works with auth');
      console.log('   Auth header status:', authSimpleData.auth_header);
    } else {
      const authSimpleError = await authSimpleResponse.text();
      console.log('   ❌ Failed:', authSimpleError);
    }

    // Test 3: chat-completion-v2 without conversationId (should work)
    console.log('\n🧪 Test 3: chat-completion-v2 (no conversation)');
    
    const chatNoConvResponse = await fetch(`${SUPABASE_URL}/functions/v1/chat-completion-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Say "Hello V2" and nothing else' }
        ],
        options: {
          model: 'gpt-3.5-turbo',
          temperature: 0.1,
          maxTokens: 10
        }
      })
    });

    console.log(`   Status: ${chatNoConvResponse.status}`);
    
    if (chatNoConvResponse.ok) {
      const chatNoConvData = await chatNoConvResponse.json();
      console.log('   ✅ SUCCESS! Chat works without auth');
      console.log('   AI Response:', chatNoConvData.content);
    } else {
      const chatNoConvError = await chatNoConvResponse.text();
      console.log('   ❌ Failed:', chatNoConvError);
    }

    // Test 4: chat-completion-v2 with auth and conversationId
    console.log('\n🧪 Test 4: chat-completion-v2 (with auth & conversation)');
    
    // Create a conversation
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .insert({
        user_id: session.user.id,
        title: 'V2 Test Chat'
      })
      .select('id')
      .single();

    if (!convError && convData) {
      const chatAuthResponse = await fetch(`${SUPABASE_URL}/functions/v1/chat-completion-v2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: convData.id,
          messages: [
            { role: 'system', content: 'You are Professor AI, an expert in research.' },
            { role: 'user', content: 'What is PICO in research? Answer in one sentence.' }
          ],
          options: {
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 100
          }
        })
      });

      console.log(`   Status: ${chatAuthResponse.status}`);
      
      if (chatAuthResponse.ok) {
        const chatAuthData = await chatAuthResponse.json();
        console.log('   ✅ SUCCESS! Chat works with auth');
        console.log('   AI Response:', chatAuthData.content);
      } else {
        const chatAuthError = await chatAuthResponse.text();
        console.log('   ❌ Failed:', chatAuthError);
      }

      // Clean up
      await supabase.from('conversations').delete().eq('id', convData.id);
    } else {
      console.log('   ❌ Failed to create conversation:', convError?.message);
    }

    // Test 5: Check CORS with OPTIONS request
    console.log('\n🧪 Test 5: CORS preflight check');
    
    const corsResponse = await fetch(`${SUPABASE_URL}/functions/v1/test-simple-v2`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type'
      }
    });

    console.log(`   Status: ${corsResponse.status}`);
    console.log(`   Access-Control-Allow-Origin: ${corsResponse.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`   Access-Control-Allow-Headers: ${corsResponse.headers.get('Access-Control-Allow-Headers')}`);
    console.log(`   Access-Control-Allow-Methods: ${corsResponse.headers.get('Access-Control-Allow-Methods')}`);
    
    if (corsResponse.status === 200 || corsResponse.status === 204) {
      console.log('   ✅ CORS configured correctly');
    } else {
      console.log('   ❌ CORS issue detected');
    }

    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testV2Functions().then(() => {
  console.log('\n✨ V2 Functions Test Complete!');
});