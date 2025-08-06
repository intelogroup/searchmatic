#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sbp_99c994d6970e1d4cb8caae9e120e499337';

console.log('🚀 STEP-BY-STEP DATABASE MIGRATION');
console.log('=================================');

// Create admin Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql, stepName) {
  console.log(`\n🔄 Executing: ${stepName}`);
  
  try {
    // Use the Supabase REST API to execute raw SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ sql })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success:', stepName);
      return { success: true, result };
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
      return { success: false, error };
    }
  } catch (error) {
    console.log('❌ Exception:', error.message);
    return { success: false, error: error.message };
  }
}

async function applyMigration() {
  const steps = [
    {
      name: 'Create Enum Types',
      file: 'migration-step1-enums.sql'
    },
    {
      name: 'Enhance Projects Table',
      file: 'migration-step2-projects.sql'
    },
    {
      name: 'Create Studies Table',
      file: 'migration-step3-studies.sql'
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const step of steps) {
    try {
      const sqlPath = join(process.cwd(), step.file);
      const sql = readFileSync(sqlPath, 'utf8');
      
      const result = await executeSQL(sql, step.name);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        
        // Check if it's a non-critical error
        if (result.error && (
          result.error.includes('already exists') ||
          result.error.includes('does not exist')
        )) {
          console.log('⚠️  Non-critical error, continuing...');
        } else {
          console.log('🚨 Critical error encountered');
        }
      }
      
      // Delay between steps
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log('❌ Failed to read step file:', step.file, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 MIGRATION SUMMARY');
  console.log('====================');
  console.log('✅ Successful steps:', successCount);
  console.log('❌ Failed steps:', errorCount);
  console.log('📋 Total steps:', steps.length);

  // Verify the results
  await verifyMigration();
}

async function verifyMigration() {
  console.log('\n🔍 VERIFYING MIGRATION RESULTS');
  console.log('===============================');
  
  try {
    // Test if we can create a project with the new enum types
    const testProjectData = {
      title: 'Migration Test Project',
      description: 'Testing enum types',
      project_type: 'systematic_review',
      status: 'draft',
      user_id: '00000000-0000-0000-0000-000000000000' // Dummy UUID for testing
    };

    console.log('🧪 Testing project creation with enum types...');
    
    const { data, error } = await supabase
      .from('projects')
      .insert(testProjectData)
      .select();

    if (error) {
      console.log('❌ Project creation test failed:', error.message);
      
      if (error.message.includes('invalid input value for enum')) {
        console.log('⚠️  Enum types may not be properly created');
      }
    } else {
      console.log('✅ Project creation test successful');
      console.log('📋 Created project:', data[0]?.title);
      
      // Clean up test data
      if (data && data[0]) {
        await supabase.from('projects').delete().eq('id', data[0].id);
        console.log('🧹 Test data cleaned up');
      }
    }

    // Check table structure
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['projects', 'studies']);

    console.log('📋 Tables found:', tables?.map(t => t.table_name) || []);

    // Check if studies table exists
    const studiesExists = tables?.some(t => t.table_name === 'studies');
    console.log('📚 Studies table:', studiesExists ? '✅ EXISTS' : '❌ NOT FOUND');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Execute the migration
await applyMigration();

console.log('\n✨ Migration process completed!');