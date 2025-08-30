import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

async function testEdgeFunctionHeaders() {
  console.log('🔍 Testing Edge Function Header Requirements');
  console.log('============================================\n');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Get authenticated user
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'headers.test@example.com',
      password: 'TestPassword123!'
    });

    if (signInError && signInError.message.includes('Invalid login credentials')) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'headers.test@example.com',
        password: 'TestPassword123!'
      });
      
      if (signUpError) throw signUpError;
      signInData = signUpData;
    } else if (signInError) {
      throw signInError;
    }

    const session = signInData.session;
    if (!session) throw new Error('No session returned');

    console.log('✅ User authenticated');
    const token = session.access_token;

    // Test different header combinations
    const tests = [
      {
        name: 'Only Authorization header',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'Authorization + apikey (publishable)',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'Only apikey (publishable)',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'Authorization + x-client-info',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-client-info': 'test-client',
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'All headers',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
          'x-client-info': 'test-client',
          'Content-Type': 'application/json'
        }
      }
    ];

    for (const test of tests) {
      console.log(`\n🧪 Testing: ${test.name}`);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/test-simple`, {
        method: 'POST',
        headers: test.headers,
        body: JSON.stringify({ test: test.name })
      });

      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        console.log('   ✅ SUCCESS!');
        const data = await response.text();
        console.log(`   Response: ${data.substring(0, 150)}...`);
        break; // Stop on first success
      } else {
        const error = await response.text();
        console.log('   ❌ Failed');
        console.log(`   Error: ${error}`);
      }
    }

    // Special test: Check if no auth headers work (should fail)
    console.log('\n🧪 Testing: No authentication headers');
    const noAuthResponse = await fetch(`${SUPABASE_URL}/functions/v1/test-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'no auth' })
    });

    console.log(`   Status: ${noAuthResponse.status}`);
    if (noAuthResponse.ok) {
      console.log('   ✅ Works without auth (unexpected)');
    } else {
      const noAuthError = await noAuthResponse.text();
      console.log('   ❌ Requires auth (expected)');
      console.log(`   Error: ${noAuthError}`);
    }

    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEdgeFunctionHeaders();