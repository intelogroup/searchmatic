import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

async function testDirectSupabaseAuth() {
  console.log('🔍 Testing Direct Supabase Authentication vs Edge Functions');
  console.log('===========================================================\n');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create/sign in user
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'direct.auth.test@example.com',
      password: 'TestPassword123!'
    });

    if (signInError && signInError.message.includes('Invalid login credentials')) {
      console.log('Creating new test user...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'direct.auth.test@example.com',
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
    console.log(`Token (first 50): ${session.access_token.substring(0, 50)}...`);

    // Test 1: Direct Supabase API call (should work)
    console.log('\n🧪 Test 1: Direct Supabase API call');
    
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);

    if (profileError) {
      console.log('❌ Direct API call failed:', profileError.message);
    } else {
      console.log('✅ Direct Supabase API works');
      console.log(`Found ${profiles.length} profiles`);
    }

    // Test 2: Direct REST API call with token
    console.log('\n🧪 Test 2: Direct REST API call');
    
    const restResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,email&limit=1`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`REST API status: ${restResponse.status}`);
    if (restResponse.ok) {
      const restData = await restResponse.json();
      console.log('✅ Direct REST API works');
      console.log(`Found ${restData.length} profiles via REST`);
    } else {
      const restError = await restResponse.text();
      console.log('❌ Direct REST API failed:', restError);
    }

    // Test 3: Edge function call
    console.log('\n🧪 Test 3: Edge function call');
    
    const edgeResponse = await fetch(`${SUPABASE_URL}/functions/v1/test-simple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'direct auth' })
    });

    console.log(`Edge function status: ${edgeResponse.status}`);
    
    if (edgeResponse.ok) {
      const edgeData = await edgeResponse.text();
      console.log('✅ Edge function works!');
      console.log(`Response: ${edgeData.substring(0, 200)}...`);
    } else {
      const edgeError = await edgeResponse.text();
      console.log('❌ Edge function failed:', edgeError);
      
      // Let's try to understand why
      console.log('\n🔍 Debugging edge function failure:');
      
      // Check if the token has the right issuer
      const tokenParts = session.access_token.split('.');
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString());
      
      console.log(`Token issuer: ${payload.iss}`);
      console.log(`Expected: ${SUPABASE_URL}/auth/v1`);
      console.log(`Match: ${payload.iss === `${SUPABASE_URL}/auth/v1` ? '✅' : '❌'}`);
      
      // Check audience
      console.log(`Token audience: ${payload.aud}`);
      console.log(`Token role: ${payload.role || 'not set'}`);
    }

    // Test 4: Try with the publishable key as auth
    console.log('\n🧪 Test 4: Testing with publishable key as auth');
    
    const pubKeyResponse = await fetch(`${SUPABASE_URL}/functions/v1/test-simple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'publishable key' })
    });

    console.log(`Publishable key test status: ${pubKeyResponse.status}`);
    if (pubKeyResponse.ok) {
      console.log('✅ Publishable key works as auth');
    } else {
      const pubKeyError = await pubKeyResponse.text();
      console.log('❌ Publishable key failed:', pubKeyError);
    }

    // Clean up
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDirectSupabaseAuth();