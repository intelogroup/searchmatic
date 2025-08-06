#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Supabase configuration
const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sbp_99c994d6970e1d4cb36d4cb8caae9e120e499337';

console.log('🚀 Starting Enhanced Database Migration');
console.log('=====================================');

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'enhanced-database-migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded:', migrationPath);
    console.log('🗂️  Migration size:', migrationSQL.length, 'characters');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log('📝 Found', statements.length, 'SQL statements to execute');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      if (statement.trim() === ';') continue;
      
      try {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}:`);
        console.log('  ', statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
        
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: statement
        });
        
        if (error) {
          console.log('❌ Error:', error.message);
          errorCount++;
          
          // Continue with non-critical errors
          if (!error.message.includes('already exists') && 
              !error.message.includes('does not exist') &&
              !error.message.includes('cannot be cast')) {
            console.log('⚠️  This error might be critical, but continuing...');
          }
        } else {
          console.log('✅ Success');
          successCount++;
        }
        
        // Add a small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.log('❌ Exception:', err.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 MIGRATION SUMMARY');
    console.log('====================');
    console.log('✅ Successful statements:', successCount);
    console.log('❌ Failed statements:', errorCount);
    console.log('📋 Total statements:', statements.length);
    
    // Verify the migration results
    await verifyMigration();
    
  } catch (error) {
    console.error('🚨 Migration failed:', error);
    process.exit(1);
  }
}

async function verifyMigration() {
  console.log('\n🔍 VERIFYING MIGRATION RESULTS');
  console.log('===============================');
  
  try {
    // Check if enum types exist
    const enumCheck = await supabase.rpc('execute_sql', {
      sql_query: `
        SELECT typname 
        FROM pg_type 
        WHERE typname IN ('project_type', 'project_status', 'study_type', 'study_status')
        ORDER BY typname;
      `
    });
    
    if (enumCheck.data) {
      console.log('📋 Enum types found:', enumCheck.data.map(row => row.typname));
    }
    
    // Check projects table structure
    const projectsStructure = await supabase.rpc('execute_sql', {
      sql_query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        ORDER BY ordinal_position;
      `
    });
    
    if (projectsStructure.data) {
      console.log('🏗️  Projects table columns:');
      projectsStructure.data.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // Check if studies table exists
    const studiesCheck = await supabase.rpc('execute_sql', {
      sql_query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'studies' AND table_schema = 'public';
      `
    });
    
    if (studiesCheck.data && studiesCheck.data.length > 0) {
      console.log('✅ Studies table exists');
    } else {
      console.log('❌ Studies table not found');
    }
    
    // Check RLS policies
    const rlsCheck = await supabase.rpc('execute_sql', {
      sql_query: `
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE tablename IN ('projects', 'studies') 
        AND schemaname = 'public';
      `
    });
    
    if (rlsCheck.data) {
      console.log('🔐 RLS Status:');
      rlsCheck.data.forEach(table => {
        console.log(`   - ${table.tablename}: ${table.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Create the execute_sql function if it doesn't exist
async function createExecuteSQLFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
    RETURNS JSON AS $$
    DECLARE
      result JSON;
    BEGIN
      EXECUTE sql_query;
      RETURN '{"success": true}'::JSON;
    EXCEPTION WHEN OTHERS THEN
      RETURN json_build_object('error', SQLERRM, 'sqlstate', SQLSTATE);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  try {
    const { error } = await supabase.rpc('execute_sql', { sql_query: createFunctionSQL });
    if (error) {
      console.log('⚠️  Function creation might have failed, trying direct execution...');
    }
  } catch (err) {
    console.log('⚠️  Will try direct SQL execution instead...');
  }
}

// Main execution
console.log('🔧 Preparing execution environment...');
await createExecuteSQLFunction();
await applyMigration();

console.log('\n✨ Migration process completed!');