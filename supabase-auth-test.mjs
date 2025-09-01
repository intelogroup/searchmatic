import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY');
  console.error('   Please set them in your environment or .env file');
  process.exit(1);
}

// Test user credentials from environment or defaults
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test.user@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!'
};

// JWT Key Information for reference
const JWT_KEYS = {
  current: {
    kid: 'ee8e6058-6e20-48ff-b3df-5229b6f97809',
    x: 'RVEQ9uGlchYQLvzJNvcT1j1pgYjfky0l0IA3m4wuNp4',
    y: 'wNoZzJM81WM8Y5GT6Gj26MnvkhdlmTlEg3X3-Bep_9w',
    alg: 'ES256'
  },
  standby: {
    kid: '92028fb7-7a2d-4314-9f84-ce5ab7293bcb',
    x: 'REGKht3ZRqTrOlWHVsEQIRrTfjbQ0FIL4pckW5m9YDs',
    y: 'fRRBc8h5ykvrw5o4VWo5I4TT0LnAzL3obdw68ciAN-M',
    alg: 'ES256'
  }
};

async function authenticateAndTest() {
  console.log('🚀 Supabase Authentication & Edge Function Test');
  console.log('================================================');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🌐 URL: ${SUPABASE_URL}`);
  console.log(`🔑 Current JWT Key ID: ${JWT_KEYS.current.kid}`);
  console.log(`🔑 Standby JWT Key ID: ${JWT_KEYS.standby.kid}`);
  console.log('');

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Step 1: Try to sign in
    console.log('📝 Step 1: Authenticating user...');
    console.log(`   Email: ${TEST_USER.email}`);
    
    let session;
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('   ⚠️  User not found. Creating new account...');
        
        // Sign up new user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: TEST_USER.email,
          password: TEST_USER.password
        });

        if (signUpError) {
          throw signUpError;
        }

        session = signUpData.session;
        console.log('   ✅ User created successfully!');
      } else {
        throw signInError;
      }
    } else {
      session = signInData.session;
      console.log('   ✅ Signed in successfully!');
    }

    if (!session) {
      throw new Error('No session returned from authentication');
    }

    // Step 2: Display token information
    console.log('\n📋 Step 2: Token Information');
    console.log(`   User ID: ${session.user.id}`);
    console.log(`   Email: ${session.user.email}`);
    console.log(`   Token Type: ${session.token_type}`);
    console.log(`   Expires In: ${session.expires_in} seconds`);
    // Mask the token for security
    const maskedToken = `${session.access_token.slice(0, 6)}...${session.access_token.slice(-6)}`;
    console.log(`   Access Token: ${maskedToken}`);

    // Decode and display JWT claims
    const tokenParts = session.access_token.split('.');
    const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

    console.log('\n🔍 JWT Header:');
    console.log(`   Algorithm: ${header.alg}`);
    console.log(`   Type: ${header.typ}`);
    console.log(`   Key ID: ${header.kid || 'Not specified'}`);

    console.log('\n📄 JWT Claims:');
    console.log(`   Subject (user_id): ${payload.sub}`);
    console.log(`   Email: ${payload.email}`);
    console.log(`   Role: ${payload.role}`);
    console.log(`   Issued At: ${new Date(payload.iat * 1000).toISOString()}`);
    console.log(`   Expires At: ${new Date(payload.exp * 1000).toISOString()}`);

    // Save token for later use
    const tokenData = {
      access_token: session.access_token,
      // Don't persist refresh token for security
      user_id: session.user.id,
      email: session.user.email,
      expires_at: new Date(payload.exp * 1000).toISOString(),
      jwt_header: header,
      jwt_claims: payload
    };

    // Write with secure permissions
    fs.writeFileSync('jwt-token.json', JSON.stringify(tokenData, null, 2), { mode: 0o600 });
    console.log('\n💾 Token saved to jwt-token.json');

    // Step 3: Test edge functions
    console.log('\n🧪 Step 3: Testing Edge Functions with JWT');
    console.log('─'.repeat(45));

    const functionsToTest = ['test-simple', 'hello-world', 'search-articles'];
    
    for (const funcName of functionsToTest) {
      console.log(`\n📡 Testing: ${funcName}`);
      
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/${funcName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            test: true,
            name: 'Terry',
            query: funcName === 'search-articles' ? 'test search' : undefined
          })
        });

        const responseText = await response.text();
        
        if (response.ok) {
          console.log(`   ✅ Success (Status: ${response.status})`);
          try {
            const data = JSON.parse(responseText);
            console.log(`   Response: ${JSON.stringify(data).substring(0, 150)}...`);
          } catch {
            console.log(`   Response: ${responseText.substring(0, 150)}...`);
          }
        } else {
          console.log(`   ❌ Error (Status: ${response.status})`);
          console.log(`   Response: ${responseText.substring(0, 150)}...`);
        }
      } catch (error) {
        console.log(`   💥 Request failed: ${error.message}`);
      }
    }

    console.log('\n✨ Authentication and testing complete!');
    console.log('\n📌 Next Steps:');
    console.log('   1. Use the JWT token in jwt-token.json for API calls');
    console.log('   2. Token expires at:', new Date(payload.exp * 1000).toISOString());
    console.log('   3. Refresh token available for renewal');

    return session.access_token;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

// Run the test
authenticateAndTest()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));