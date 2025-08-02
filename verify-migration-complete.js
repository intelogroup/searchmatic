#!/usr/bin/env node

// Post-migration verification script
const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co';
const anonKey = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

async function verifyTableExists(tableName) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=count&limit=0`, {
      method: 'HEAD',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Prefer': 'count=exact'
      }
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Post-Migration Verification\n');
  console.log('Checking all required tables...\n');
  
  const requiredTables = [
    'projects',
    'conversations', 
    'messages',
    'protocols'
  ];
  
  const results = {};
  let allTablesExist = true;
  
  for (const table of requiredTables) {
    const exists = await verifyTableExists(table);
    results[table] = exists;
    
    if (exists) {
      console.log(`✅ ${table} - Ready`);
    } else {
      console.log(`❌ ${table} - Missing or inaccessible`);
      allTablesExist = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allTablesExist) {
    console.log('🎉 SUCCESS: All required tables are ready!');
    console.log('\n✅ Your Searchmatic MVP database is now complete');
    console.log('✅ You can run: npm run dev');
    console.log('✅ Ready for AI chat and protocol features');
  } else {
    console.log('⚠️  INCOMPLETE: Some tables are still missing');
    console.log('\n📋 Next steps:');
    console.log('1. Run complete-database-setup.sql in Supabase SQL Editor');
    console.log('2. Re-run this verification script');
  }
  
  console.log('\n📊 Table Status:');
  Object.entries(results).forEach(([table, exists]) => {
    console.log(`  ${table}: ${exists ? '✅' : '❌'}`);
  });
}

main().catch(console.error);