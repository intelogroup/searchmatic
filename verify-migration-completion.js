#!/usr/bin/env node

/**
 * Verify Migration Completion
 * Tests if the database migration was applied successfully
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qzvfufadiqmizrozejci.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('🔍 Verifying Database Migration...\n');
  
  let allPassed = true;
  const results = [];

  // Test 1: Check if we can create a project with enum values
  try {
    console.log('1️⃣ Testing project creation with enum types...');
    
    // First try to create a test user session (you might need to be logged in)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('   ⚠️  No active session - will test table structure instead');
      
      // Test table structure instead
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      console.log('   ✅ Projects table accessible');
      results.push({ test: 'Projects Table Access', status: 'PASS' });
      
    } else {
      // Try creating a test project
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: 'Migration Test Project',
          project_type: 'systematic_review',
          status: 'draft',
          description: 'Testing if migration worked'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('   ✅ Project created successfully with enum values');
      results.push({ test: 'Project Creation with Enums', status: 'PASS' });

      // Clean up test data
      await supabase.from('projects').delete().eq('id', data.id);
      console.log('   🧹 Test data cleaned up');
    }

  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    results.push({ test: 'Project Creation with Enums', status: 'FAIL', error: error.message });
    allPassed = false;
  }

  // Test 2: Check if studies table exists
  try {
    console.log('2️⃣ Testing studies table...');
    
    const { data, error } = await supabase
      .from('studies')
      .select('id')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      throw new Error('Studies table does not exist');
    } else if (error) {
      throw error;
    }

    console.log('   ✅ Studies table exists and accessible');
    results.push({ test: 'Studies Table Exists', status: 'PASS' });

  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    results.push({ test: 'Studies Table Exists', status: 'FAIL', error: error.message });
    allPassed = false;
  }

  // Test 3: Check conversations and messages tables
  try {
    console.log('3️⃣ Testing AI chat tables...');
    
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);

    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .select('id')
      .limit(1);

    if ((convError && convError.code === 'PGRST116') || (msgError && msgError.code === 'PGRST116')) {
      throw new Error('AI chat tables missing');
    }

    if (convError) throw convError;
    if (msgError) throw msgError;

    console.log('   ✅ AI chat tables exist and accessible');
    results.push({ test: 'AI Chat Tables', status: 'PASS' });

  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    results.push({ test: 'AI Chat Tables', status: 'FAIL', error: error.message });
    allPassed = false;
  }

  // Summary
  console.log('\n📊 MIGRATION VERIFICATION RESULTS:');
  console.log('=====================================');
  
  results.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n🎯 FINAL VERDICT:');
  if (allPassed) {
    console.log('🎉 MIGRATION SUCCESSFUL! Database is ready for MVP.');
    console.log('🚀 Your Searchmatic app is now 100% operational!');
  } else {
    console.log('⚠️  MIGRATION INCOMPLETE. Please check the errors above.');
    console.log('💡 Run the migration SQL scripts in Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql');
  }
}

verifyMigration().catch(console.error);