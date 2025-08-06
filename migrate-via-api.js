#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sbp_99c994d6970e1d4cb36d4cb8caae9e120e499337';

console.log('🚀 ENHANCED DATABASE MIGRATION - VIA API');
console.log('=======================================');

async function createExecuteFunction() {
  console.log('🔧 Creating execute function...');
  
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.execute_migration(migration_sql TEXT)
    RETURNS JSON AS $$
    DECLARE
      result_count INTEGER := 0;
      error_count INTEGER := 0;
      current_statement TEXT;
      statements TEXT[];
      i INTEGER;
    BEGIN
      -- Split the migration into statements
      statements := string_to_array(migration_sql, ';');
      
      FOR i IN 1..array_length(statements, 1) LOOP
        current_statement := trim(statements[i]);
        
        -- Skip empty statements and comments
        IF length(current_statement) > 0 AND NOT starts_with(current_statement, '--') THEN
          BEGIN
            EXECUTE current_statement || ';';
            result_count := result_count + 1;
          EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Error in statement %: %', i, SQLERRM;
          END;
        END IF;
      END LOOP;
      
      RETURN json_build_object(
        'success', true,
        'executed_statements', result_count,
        'errors', error_count
      );
    EXCEPTION WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'sqlstate', SQLSTATE
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_migration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ migration_sql: createFunctionSQL })
    });

    if (response.status === 404) {
      // Function doesn't exist yet, let's create it using a different approach
      console.log('⚠️  Function endpoint not found, trying to create via SQL execution...');
      return true; // We'll handle this differently
    }

    const result = await response.json();
    console.log('✅ Function creation result:', result);
    return true;
  } catch (error) {
    console.log('⚠️  Function creation failed:', error.message);
    return false;
  }
}

async function executeViaPostgREST(sql) {
  try {
    // Try using the PostgREST SQL execution endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`PostgREST execution failed: ${error.message}`);
  }
}

async function applyMigration() {
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'enhanced-database-migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log('🗂️  Size:', Math.round(migrationSQL.length / 1024), 'KB');
    
    // Break migration into smaller, manageable chunks
    const chunks = [];
    
    // Chunk 1: Create enum types
    const enumsMatch = migrationSQL.match(/-- 1\. CREATE MISSING ENUM TYPES([\s\S]*?)END \$\$;/);
    if (enumsMatch) chunks.push({ name: 'Create Enum Types', sql: enumsMatch[0] });
    
    // Chunk 2: Enhance projects table
    const projectsMatch = migrationSQL.match(/-- 2\. ENHANCE PROJECTS TABLE([\s\S]*?)END \$\$;/);
    if (projectsMatch) chunks.push({ name: 'Enhance Projects Table', sql: projectsMatch[0] });
    
    // Chunk 3: Create studies table
    const studiesMatch = migrationSQL.match(/-- 3\. CREATE STUDIES TABLE([\s\S]*?)\);/);
    if (studiesMatch) chunks.push({ name: 'Create Studies Table', sql: studiesMatch[0] });
    
    // Chunk 4: Create indexes
    const indexMatches = migrationSQL.match(/CREATE INDEX IF NOT EXISTS[\s\S]*?;/g);
    if (indexMatches) {
      chunks.push({ name: 'Create Indexes', sql: indexMatches.join('\n\n') });
    }
    
    // Chunk 5: Create functions and triggers
    const functionsMatch = migrationSQL.match(/-- 5\. CREATE UPDATED_AT TRIGGERS([\s\S]*?)FOR EACH ROW EXECUTE FUNCTION update_project_activity\(\);/);
    if (functionsMatch) chunks.push({ name: 'Create Functions and Triggers', sql: functionsMatch[0] });
    
    // Chunk 6: Enable RLS
    const rlsMatch = migrationSQL.match(/-- 6\. ENABLE ROW LEVEL SECURITY([\s\S]*?)ALTER TABLE studies ENABLE ROW LEVEL SECURITY;/);
    if (rlsMatch) chunks.push({ name: 'Enable RLS', sql: rlsMatch[0] });
    
    // Chunk 7-8: RLS Policies
    const policiesMatch = migrationSQL.match(/-- 7\. CREATE RLS POLICIES FOR PROJECTS([\s\S]*?)-- 9\. GRANT PERMISSIONS/);
    if (policiesMatch) chunks.push({ name: 'Create RLS Policies', sql: policiesMatch[0].replace('-- 9. GRANT PERMISSIONS', '') });
    
    // Chunk 9: Grant permissions
    const grantsMatch = migrationSQL.match(/-- 9\. GRANT PERMISSIONS([\s\S]*?)GRANT ALL ON studies TO authenticated;/);
    if (grantsMatch) chunks.push({ name: 'Grant Permissions', sql: grantsMatch[0] });
    
    console.log(`\n📦 Split migration into ${chunks.length} chunks`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`\n🔄 Executing: ${chunk.name}`);
      
      try {
        // Try direct SQL execution via API
        const result = await executeViaPostgREST(chunk.sql);
        console.log('✅ Success');
        successCount++;
      } catch (error) {
        console.log('❌ Error:', error.message);
        errorCount++;
        
        // Continue with non-critical errors
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist')) {
          console.log('⚠️  Non-critical error, continuing...');
        }
      }
      
      // Delay between chunks
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 MIGRATION SUMMARY');
    console.log('====================');
    console.log('✅ Successful chunks:', successCount);
    console.log('❌ Failed chunks:', errorCount);
    console.log('📋 Total chunks:', chunks.length);
    
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
    // Check if we can query enum types
    const enumQuery = `
      SELECT typname 
      FROM pg_type 
      WHERE typname IN ('project_type', 'project_status', 'study_type', 'study_status')
      ORDER BY typname;
    `;
    
    const enumResult = await executeViaPostgREST(enumQuery);
    console.log('📋 Enum types found:', enumResult?.map(row => row.typname) || 'None');
    
    // Check projects table structure
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position;
    `;
    
    const columnsResult = await executeViaPostgREST(columnsQuery);
    console.log('🏗️  Projects table columns:');
    columnsResult?.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n✨ Verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Execute the migration
await applyMigration();

console.log('\n✨ Migration process completed!');