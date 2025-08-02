#!/usr/bin/env node

/**
 * Detailed Schema Analysis - Get complete table structures and RLS status
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const ANON_KEY = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function getTableSchema(tableName) {
  console.log(`\n🔍 DETAILED SCHEMA FOR: ${tableName.toUpperCase()}`);
  console.log('='.repeat(50));
  
  try {
    // Get a sample record to understand the structure
    const { data: sampleData, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Error accessing table: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      if (error.code === 'PGRST301') {
        console.log('   ✅ This indicates RLS is working correctly');
      }
      return;
    }
    
    // Get record count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Records: ${count}`);
    
    if (sampleData && sampleData.length > 0) {
      console.log(`📋 Schema (${Object.keys(sampleData[0]).length} columns):`);
      
      const record = sampleData[0];
      Object.entries(record).forEach(([column, value]) => {
        const type = typeof value;
        const isNull = value === null;
        console.log(`   • ${column}: ${isNull ? 'NULL' : type} ${isNull ? '' : `(sample: ${JSON.stringify(value).slice(0, 50)})`}`);
      });
    } else {
      // Try to infer columns from error message or metadata
      console.log(`📋 Schema: Table empty, cannot determine structure`);
      
      // Try inserting invalid data to get column info from error
      try {
        const { error: insertError } = await supabase
          .from(tableName)
          .insert({ invalid_test_column: 'test' });
        
        if (insertError && insertError.message.includes('column')) {
          console.log(`   Hint from error: ${insertError.message}`);
        }
      } catch (e) {
        // Ignore insert test errors
      }
    }
    
    console.log(`✅ Table accessible: YES`);
    
  } catch (error) {
    console.log(`❌ Fatal error: ${error.message}`);
  }
}

async function testRLSPolicies() {
  console.log(`\n🔒 ROW LEVEL SECURITY DETAILED ANALYSIS`);
  console.log('='.repeat(50));
  
  const tables = ['profiles', 'projects', 'articles', 'search_queries', 'conversations', 'messages', 'extraction_templates', 'export_logs'];
  
  for (const table of tables) {
    console.log(`\n🔍 Testing RLS for: ${table}`);
    
    try {
      // Test SELECT without authentication
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST301') {
          console.log(`   ✅ RLS ACTIVE: ${error.message}`);
        } else if (error.code === 'PGRST116') {
          console.log(`   ⚠️  TABLE NOT FOUND: ${error.message}`);
        } else {
          console.log(`   ❌ OTHER ERROR: ${error.code} - ${error.message}`);
        }
      } else {
        // Check if we got data back
        if (data && data.length > 0) {
          console.log(`   ⚠️  RLS MAY BE MISCONFIGURED: Got ${data.length} records without authentication`);
        } else {
          console.log(`   ✅ RLS WORKING: No data returned for anonymous user`);
        }
      }
      
      // Test INSERT without authentication
      try {
        const { error: insertError } = await supabase
          .from(table)
          .insert({ test_field: 'test_value' });
        
        if (insertError) {
          if (insertError.code === 'PGRST301') {
            console.log(`   ✅ INSERT PROTECTED: ${insertError.message}`);
          } else {
            console.log(`   ⚠️  INSERT ERROR: ${insertError.message}`);
          }
        } else {
          console.log(`   ❌ INSERT ALLOWED: This should not happen with proper RLS!`);
        }
      } catch (insertError) {
        console.log(`   ✅ INSERT PROPERLY BLOCKED`);
      }
      
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
    }
  }
}

async function checkMissingExpectedTables() {
  console.log(`\n🔍 CHECKING FOR MISSING EXPECTED TABLES`);
  console.log('='.repeat(50));
  
  const expectedTables = [
    'profiles',      // ✅ User profiles
    'projects',      // ✅ Research projects  
    'protocols',     // ❓ Should exist (may be 'manifestos')
    'articles',      // ✅ Research articles
    'search_queries', // ✅ Database search history
    'conversations', // ❓ AI chat conversations
    'messages',      // ❓ Chat messages
    'extraction_templates', // ✅ Data extraction templates
    'extracted_data', // ✅ Extracted article data
    'export_logs'    // ❓ Export history
  ];
  
  const missing = [];
  const found = [];
  const alternatives = [];
  
  for (const table of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        missing.push(table);
        
        // Check for alternative names
        if (table === 'protocols') {
          try {
            const { error: altError } = await supabase
              .from('manifestos')
              .select('count')
              .limit(1);
            if (!altError) {
              alternatives.push({ expected: table, found: 'manifestos' });
            }
          } catch (e) { /* ignore */ }
        }
        
        if (table === 'conversations') {
          try {
            const { error: altError } = await supabase
              .from('ai_conversations')
              .select('count')
              .limit(1);
            if (!altError) {
              alternatives.push({ expected: table, found: 'ai_conversations' });
            }
          } catch (e) { /* ignore */ }
        }
      } else {
        found.push(table);
      }
    } catch (error) {
      missing.push(table);
    }
  }
  
  console.log(`✅ Found tables (${found.length}):`);
  found.forEach(table => console.log(`   • ${table}`));
  
  if (alternatives.length > 0) {
    console.log(`\n🔄 Alternative names found (${alternatives.length}):`);
    alternatives.forEach(alt => console.log(`   • ${alt.expected} → ${alt.found}`));
  }
  
  if (missing.length > 0) {
    console.log(`\n❌ Missing tables (${missing.length}):`);
    missing.forEach(table => console.log(`   • ${table}`));
  }
}

async function checkDatabaseHealth() {
  console.log(`\n🏥 DATABASE HEALTH CHECK`);
  console.log('='.repeat(50));
  
  const checks = [
    { name: 'Connection', test: async () => {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      return !error || error.code !== 'PGRST301'; // RLS error is OK
    }},
    { name: 'Auth Users Access', test: async () => {
      // Test if we can detect auth system
      try {
        const { data, error } = await supabase.auth.getSession();
        return true; // Auth system responds
      } catch (e) {
        return false;
      }
    }},
    { name: 'Query Performance', test: async () => {
      const start = Date.now();
      await supabase.from('profiles').select('count').limit(1);
      const duration = Date.now() - start;
      return duration < 1000; // Less than 1 second
    }}
  ];
  
  for (const check of checks) {
    try {
      const result = await check.test();
      console.log(`${result ? '✅' : '❌'} ${check.name}`);
    } catch (error) {
      console.log(`❌ ${check.name}: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🔍 DETAILED SUPABASE SCHEMA ANALYSIS');
  console.log('=====================================');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Key: Anonymous (respects RLS)\n`);
  
  // Check database health first
  await checkDatabaseHealth();
  
  // Check for missing expected tables
  await checkMissingExpectedTables();
  
  // Analyze core tables in detail
  const coreTables = ['profiles', 'projects', 'articles', 'manifestos', 'extraction_templates'];
  
  for (const table of coreTables) {
    await getTableSchema(table);
  }
  
  // Test RLS policies
  await testRLSPolicies();
  
  console.log(`\n\n🎯 ANALYSIS COMPLETE`);
  console.log('=====================');
  console.log('Check the output above for detailed schema information,');
  console.log('RLS policy status, and any missing tables or issues.');
}

main().catch(console.error);