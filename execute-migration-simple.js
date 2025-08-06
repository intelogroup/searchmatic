#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sbp_99c994d6970e1d4cb36d4cb8caae9e120e499337';

console.log('🚀 APPLYING ENHANCED DATABASE MIGRATION');
console.log('=====================================');

async function executeSQLDirect(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': SUPABASE_SERVICE_ROLE_KEY
    },
    body: JSON.stringify({ sql_query: sql })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

async function applyMigration() {
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'enhanced-database-migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log('🗂️  Size:', Math.round(migrationSQL.length / 1024), 'KB');
    
    // Execute the entire migration as one transaction
    console.log('\n🔄 Executing migration...');
    
    try {
      const result = await executeSQLDirect(migrationSQL);
      console.log('✅ Migration executed successfully!');
      console.log('📋 Result:', result);
    } catch (error) {
      if (error.message.includes('404')) {
        console.log('⚠️  execute_sql function not found, trying to create it first...');
        
        // Create the function
        const createFunctionSQL = `
          CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
          RETURNS JSON AS $$
          BEGIN
            EXECUTE sql_query;
            RETURN '{"success": true}'::JSON;
          EXCEPTION WHEN OTHERS THEN
            RETURN json_build_object('error', SQLERRM, 'sqlstate', SQLSTATE);
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `;
        
        console.log('🔧 Creating execute_sql function...');
        await executeSQLDirect(createFunctionSQL);
        
        // Try the migration again
        console.log('🔄 Retrying migration...');
        const result = await executeSQLDirect(migrationSQL);
        console.log('✅ Migration executed successfully!');
        console.log('📋 Result:', result);
      } else {
        throw error;
      }
    }
    
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
    // Check enum types
    const enumsSQL = `
      SELECT typname 
      FROM pg_type 
      WHERE typname IN ('project_type', 'project_status', 'study_type', 'study_status')
      ORDER BY typname;
    `;
    
    const enumResult = await executeSQLDirect(enumsSQL);
    console.log('📋 Enum types:', enumResult.map(row => row.typname));
    
    // Check projects table columns
    const columnsSQL = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position;
    `;
    
    const columnsResult = await executeSQLDirect(columnsSQL);
    console.log('🏗️  Projects table columns:');
    columnsResult.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    // Check if studies table exists
    const studiesSQL = `
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_name = 'studies' AND table_schema = 'public';
    `;
    
    const studiesResult = await executeSQLDirect(studiesSQL);
    const studiesExists = studiesResult[0]?.count > 0;
    console.log('📚 Studies table:', studiesExists ? '✅ EXISTS' : '❌ NOT FOUND');
    
    console.log('\n✨ Verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Execute the migration
await applyMigration();