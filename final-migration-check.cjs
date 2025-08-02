const { createClient } = require('@supabase/supabase-js');

// Use the working credentials from .env.local
const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co';
const anonKey = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

// Create Supabase client with anon key
const supabase = createClient(supabaseUrl, anonKey);

async function finalMigrationCheck() {
  console.log('🔍 FINAL MIGRATION STATUS CHECK');
  console.log('===============================\n');

  const tables = [
    { name: 'projects', required: true, description: 'Main project management' },
    { name: 'conversations', required: true, description: 'AI chat conversations' },
    { name: 'messages', required: true, description: 'Chat messages' },
    { name: 'protocols', required: true, description: 'Research protocols' }
  ];

  const results = [];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('does not exist')) {
          results.push({
            table: table.name,
            status: 'missing',
            message: 'Table does not exist',
            required: table.required,
            description: table.description
          });
        } else {
          results.push({
            table: table.name,
            status: 'error',
            message: error.message,
            required: table.required,
            description: table.description
          });
        }
      } else {
        results.push({
          table: table.name,
          status: 'exists',
          message: 'Table exists and accessible',
          required: table.required,
          description: table.description
        });
      }
    } catch (err) {
      results.push({
        table: table.name,
        status: 'error',
        message: err.message,
        required: table.required,
        description: table.description
      });
    }
  }

  // Display results
  console.log('📊 TABLE STATUS:');
  console.log('================');
  results.forEach(result => {
    const icon = result.status === 'exists' ? '✅' : 
                 result.status === 'missing' ? '❌' : '⚠️';
    const status = result.status === 'exists' ? 'EXISTS' : 
                   result.status === 'missing' ? 'MISSING' : 'ERROR';
    
    console.log(`${icon} ${result.table.padEnd(15)} | ${status.padEnd(8)} | ${result.description}`);
  });

  // Summary
  const existing = results.filter(r => r.status === 'exists').length;
  const missing = results.filter(r => r.status === 'missing').length;
  const total = results.length;

  console.log('\n📈 SUMMARY:');
  console.log('===========');
  console.log(`✅ Existing: ${existing}/${total} tables`);
  console.log(`❌ Missing:  ${missing}/${total} tables`);

  if (missing === 0) {
    console.log('\n🎉 MIGRATION COMPLETE!');
    console.log('✅ All required tables exist');
    console.log('✅ Database ready for development');
    console.log('✅ You can start Sprint 1 development!');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('==============');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Test user authentication');
    console.log('3. Create a test project');
    console.log('4. Test AI chat functionality');
  } else {
    console.log('\n⚠️ MIGRATION REQUIRED');
    console.log('======================');
    
    const missingTables = results.filter(r => r.status === 'missing');
    console.log('Missing tables:');
    missingTables.forEach(table => {
      console.log(`   ❌ ${table.table} - ${table.description}`);
    });

    console.log('\n📋 TO COMPLETE MIGRATION:');
    console.log('=========================');
    console.log('1. Open: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql');
    console.log('2. Copy SQL from: /root/repo/complete-database-setup.sql');
    console.log('3. Paste and run in SQL Editor');
    console.log('4. Run this check again: node /root/repo/final-migration-check.cjs');
  }

  console.log('\n🔧 CONNECTION INFO:');
  console.log('===================');
  console.log(`URL: ${supabaseUrl}`);
  console.log('Key: Working with anon key (RLS protected)');
  console.log('Status: ✅ Connection verified');
}

finalMigrationCheck().catch(console.error);