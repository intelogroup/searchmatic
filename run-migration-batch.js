#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sbp_99c994d6970e1d4cb36d4cb8caae9e120e499337';

console.log('🚀 ENHANCED DATABASE MIGRATION - BATCH EXECUTION');
console.log('===============================================');

// Create admin Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLStatement(sql) {
  try {
    // Use the SQL query execution through the REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      return { success: true, data: await response.text() };
    } else {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Let's try using SQL directly through the REST endpoint
async function executeDirectSQL(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sql',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Accept': 'application/json'
      },
      body: sql
    });

    const result = await response.json();
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function applyMigration() {
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'enhanced-database-migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log('🗂️  Size:', Math.round(migrationSQL.length / 1024), 'KB');
    
    // Split into major blocks for better error handling
    const migrationBlocks = [
      // Block 1: Create enum types
      migrationSQL.match(/-- 1\. CREATE MISSING ENUM TYPES[\s\S]*?END \$\$;/)?.[0],
      
      // Block 2: Enhance projects table
      migrationSQL.match(/-- 2\. ENHANCE PROJECTS TABLE[\s\S]*?END \$\$;/)?.[0],
      
      // Block 3: Create studies table
      migrationSQL.match(/-- 3\. CREATE STUDIES TABLE[\s\S]*?\);/)?.[0],
      
      // Block 4: Create indexes
      migrationSQL.match(/-- 4\. CREATE INDEXES FOR PERFORMANCE[\s\S]*?CREATE INDEX.*?;/g)?.join('\n'),
      
      // Block 5: Create triggers
      migrationSQL.match(/-- 5\. CREATE UPDATED_AT TRIGGERS[\s\S]*?FOR EACH ROW EXECUTE FUNCTION update_project_activity\(\);/)?.[0],
      
      // Block 6: Enable RLS
      migrationSQL.match(/-- 6\. ENABLE ROW LEVEL SECURITY[\s\S]*?ALTER TABLE studies ENABLE ROW LEVEL SECURITY;/)?.[0],
      
      // Block 7: Create RLS policies for projects
      migrationSQL.match(/-- 7\. CREATE RLS POLICIES FOR PROJECTS[\s\S]*?FOR DELETE USING \(auth\.uid\(\) = user_id\);/)?.[0],
      
      // Block 8: Create RLS policies for studies
      migrationSQL.match(/-- 8\. CREATE RLS POLICIES FOR STUDIES[\s\S]*?FOR DELETE USING[\s\S]*?\);/)?.[0],
      
      // Block 9: Grant permissions
      migrationSQL.match(/-- 9\. GRANT PERMISSIONS[\s\S]*?GRANT ALL ON studies TO authenticated;/)?.[0],
      
    ].filter(Boolean);
    
    console.log(`\n📦 Split migration into ${migrationBlocks.length} blocks`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < migrationBlocks.length; i++) {
      const block = migrationBlocks[i];
      const blockName = block.match(/-- (\d+\. [^\n]*)/)?.[1] || `Block ${i + 1}`;
      
      console.log(`\n🔄 Executing: ${blockName}`);
      
      try {
        const result = await executeDirectSQL(block);
        
        if (result.success) {
          console.log('✅ Success');
          successCount++;
        } else {
          console.log('❌ Error:', result.data || result.error);
          errorCount++;
          
          // Continue with non-critical errors
          if (result.data && (
            result.data.includes?.('already exists') ||
            result.data.includes?.('does not exist')
          )) {
            console.log('⚠️  Non-critical error, continuing...');
          }
        }
      } catch (error) {
        console.log('❌ Exception:', error.message);
        errorCount++;
      }
      
      // Small delay between blocks
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n📊 MIGRATION SUMMARY');
    console.log('====================');
    console.log('✅ Successful blocks:', successCount);
    console.log('❌ Failed blocks:', errorCount);
    console.log('📋 Total blocks:', migrationBlocks.length);
    
    // Verify the results
    await verifyMigration();
    
  } catch (error) {
    console.error('🚨 Migration failed:', error.message);
    process.exit(1);
  }
}

async function verifyMigration() {
  console.log('\n🔍 VERIFYING MIGRATION RESULTS');
  console.log('===============================');
  
  try {
    // Test creating a project to see if enums work
    const testProject = {
      title: 'Test Migration Project',
      description: 'Testing if enum types work',
      project_type: 'systematic_review',
      status: 'draft',
      user_id: '00000000-0000-0000-0000-000000000000' // dummy UUID
    };
    
    const { data, error } = await supabase.from('projects').insert(testProject).select();
    
    if (error) {
      console.log('❌ Project creation test failed:', error.message);
    } else {
      console.log('✅ Project creation test successful');
      
      // Clean up test data
      if (data && data[0]) {
        await supabase.from('projects').delete().eq('id', data[0].id);
        console.log('🧹 Test data cleaned up');
      }
    }
    
    // Check table existence
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['projects', 'studies']);
    
    console.log('📋 Tables found:', tables?.map(t => t.table_name) || []);
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Execute the migration
await applyMigration();

console.log('\n✨ Migration process completed!');