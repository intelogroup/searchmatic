import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co';
const supabaseKey = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // Sign up test user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      throw signUpError;
    }

    console.log('✓ Test user created or already exists');

    // Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });

    if (signInError) {
      throw signInError;
    }

    console.log('✓ Test user signed in successfully');
    console.log('Access Token:', signInData.session?.access_token?.substring(0, 50) + '...');
    
    return signInData.session;

  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

createTestUser();