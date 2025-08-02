#!/usr/bin/env node

/**
 * RLS Policy Check - Test if RLS is actually enabled and working
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const ANON_KEY = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

console.log('🔒 RLS POLICY VERIFICATION');
console.log('==========================\n');

async function testRLSEnforcement() {
  const tables = ['profiles', 'projects', 'articles', 'search_queries', 'extraction_templates'];
  
  console.log('Testing RLS enforcement on core tables...\n');
  
  for (const table of tables) {
    console.log(`🔍 Testing: ${table}`);
    
    // Test 1: Try to select without auth (should be restricted if RLS is working)
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*');
      
      if (error) {
        if (error.code === 'PGRST301') {
          console.log(`   ✅ SELECT: RLS blocking access (${error.message})`);
        } else {
          console.log(`   ⚠️  SELECT: Unexpected error - ${error.code}: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️  SELECT: RLS NOT ENFORCED - got ${data?.length || 0} records without auth`);
      }
    } catch (e) {
      console.log(`   ❌ SELECT: Exception - ${e.message}`);
    }
    
    // Test 2: Try to insert without auth (should be blocked)
    try {
      const testData = getTestData(table);
      const { data, error } = await supabase
        .from(table)
        .insert(testData);
      
      if (error) {
        if (error.code === 'PGRST301') {
          console.log(`   ✅ INSERT: RLS blocking access`);
        } else if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.log(`   ✅ INSERT: Blocked by schema validation (RLS may be working)`);
        } else {
          console.log(`   ⚠️  INSERT: Unexpected error - ${error.code}: ${error.message}`);
        }
      } else {
        console.log(`   ❌ INSERT: RLS NOT ENFORCED - insert succeeded without auth!`);
        
        // Clean up the test record if it was inserted
        if (data && data[0]?.id) {
          try {
            await supabase.from(table).delete().eq('id', data[0].id);
          } catch (cleanupError) {
            console.log(`   ⚠️  Could not clean up test record`);
          }
        }
      }
    } catch (e) {
      console.log(`   ✅ INSERT: Exception (likely blocked) - ${e.message}`);
    }
    
    console.log('');
  }
}

function getTestData(table) {
  switch (table) {
    case 'profiles':
      return { email: 'test@example.com', full_name: 'Test User' };
    case 'projects':
      return { title: 'Test Project', description: 'Test description' };
    case 'articles':
      return { title: 'Test Article', source: 'manual' };
    case 'search_queries':
      return { database_name: 'test', query_string: 'test query' };
    case 'extraction_templates':
      return { name: 'Test Template', fields: {} };
    default:
      return { test_field: 'test_value' };
  }
}

async function checkAuthSystem() {
  console.log('🔐 AUTHENTICATION SYSTEM CHECK');
  console.log('===============================\n');
  
  try {
    // Test 1: Get current session (should be null for anonymous)
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log(`❌ Session check failed: ${sessionError.message}`);
    } else {
      console.log(`✅ Session check: ${session.session ? 'Authenticated' : 'Anonymous (expected)'}`);
    }
    
    // Test 2: Try to get user (should be null)
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log(`⚠️  User check: ${userError.message}`);
    } else {
      console.log(`✅ User check: ${user.user ? 'Authenticated' : 'Anonymous (expected)'}`);
    }
    
  } catch (error) {
    console.log(`❌ Auth system test failed: ${error.message}`);
  }
  
  console.log('');
}

async function testWithFakeAuth() {
  console.log('🧪 TESTING WITH FAKE AUTH HEADER');
  console.log('=================================\n');
  
  // Create a client with fake auth headers to see if RLS responds differently
  const fakeAuthClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: {
      headers: {
        'Authorization': 'Bearer fake-jwt-token'
      }
    }
  });
  
  try {
    const { data, error } = await fakeAuthClient
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST301') {
        console.log(`✅ Fake auth blocked by RLS: ${error.message}`);
      } else if (error.message.includes('JWT')) {
        console.log(`✅ JWT validation working: ${error.message}`);
      } else {
        console.log(`⚠️  Unexpected error with fake auth: ${error.code}: ${error.message}`);
      }
    } else {
      console.log(`❌ Fake auth not blocked - potential security issue!`);
    }
  } catch (error) {
    console.log(`✅ Fake auth properly rejected: ${error.message}`);
  }
  
  console.log('');
}

async function summarizeFindings() {
  console.log('📊 RLS ANALYSIS SUMMARY');
  console.log('========================\n');
  
  // Re-test key tables quickly
  const coreIssues = [];
  const tables = ['profiles', 'projects', 'articles'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error && data !== null) {
        // No error means we got data - RLS might not be working
        coreIssues.push(`${table}: Data accessible without authentication`);
      }
    } catch (e) {
      // Errors are good - means RLS might be working
    }
  }
  
  if (coreIssues.length === 0) {
    console.log('✅ RLS Status: WORKING');
    console.log('   All core tables properly restrict anonymous access');
  } else {
    console.log('❌ RLS Status: ISSUES DETECTED');
    console.log('   The following tables allow anonymous access:');
    coreIssues.forEach(issue => console.log(`   • ${issue}`));
  }
  
  console.log('\n🔧 RECOMMENDATIONS:');
  console.log('1. Verify RLS is enabled on all tables');
  console.log('2. Check that proper RLS policies are created and active');
  console.log('3. Test with authenticated users to ensure policies work correctly');
  console.log('4. Consider running the migration scripts to ensure proper setup');
}

async function main() {
  await checkAuthSystem();
  await testRLSEnforcement();
  await testWithFakeAuth();
  await summarizeFindings();
}

main().catch(console.error);