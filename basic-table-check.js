#!/usr/bin/env node

// Basic table check using anon key (no schema access needed)
const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co';
const anonKey = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

async function checkTableExists(tableName) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=count&limit=0`, {
      method: 'HEAD',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Prefer': 'count=exact'
      }
    });
    
    return {
      exists: response.ok,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🔍 Basic Table Existence Check\n');
  console.log('Using anon key for basic table access...\n');
  
  const tables = ['projects', 'conversations', 'messages', 'protocols'];
  const results = {};
  
  for (const table of tables) {
    console.log(`Checking ${table}...`);
    const result = await checkTableExists(table);
    results[table] = result;
    
    if (result.exists) {
      console.log(`✅ ${table} - Table exists and accessible`);
    } else if (result.status === 404) {
      console.log(`❌ ${table} - Table does not exist (404)`);
    } else if (result.status === 401) {
      console.log(`🔒 ${table} - Access denied (401) - RLS policy may block access`);
    } else {
      console.log(`❓ ${table} - Status: ${result.status} (${result.statusText || result.error})`);
    }
  }
  
  console.log('\n📊 Summary:');
  const existingTables = Object.entries(results).filter(([_, result]) => result.exists).map(([table, _]) => table);
  const missingTables = Object.entries(results).filter(([_, result]) => !result.exists && result.status === 404).map(([table, _]) => table);
  const accessDeniedTables = Object.entries(results).filter(([_, result]) => !result.exists && result.status === 401).map(([table, _]) => table);
  
  console.log(`  ✅ Existing and accessible: ${existingTables.join(', ') || 'none'}`);
  console.log(`  ❌ Missing (404): ${missingTables.join(', ') || 'none'}`);
  console.log(`  🔒 Access denied (401): ${accessDeniedTables.join(', ') || 'none'}`);
  
  if (missingTables.length > 0) {
    console.log('\n⚠️  MIGRATION REQUIRED: Some tables are missing');
    console.log('Please run the complete-database-setup.sql migration in Supabase SQL Editor');
  } else if (accessDeniedTables.length > 0) {
    console.log('\n🔒 RLS POLICIES: Some tables exist but are protected by Row Level Security');
    console.log('This is expected behavior for authenticated operations');
  } else {
    console.log('\n🎉 All tables appear to exist!');
  }
}

main().catch(console.error);