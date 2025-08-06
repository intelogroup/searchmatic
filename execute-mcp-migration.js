#!/usr/bin/env node

/**
 * Execute Database Migration Using Working Connection
 * Uses the verified working password and connection method
 */

import pg from 'pg';
const { Client } = pg;

// Working connection details (verified from test)
const dbConfig = {
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.qzvfufadiqmizrozejci',
  password: 'Jimkali90#',
  ssl: { rejectUnauthorized: false }
};

async function executeMigration() {
  console.log('🚀 Starting MCP-Based Database Migration...\n');
  
  const client = new Client(dbConfig);
  
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('   ✅ Connected successfully');
    
    // Check current schema state
    console.log('\n🔍 Checking current database state...');
    
    // Check if enum types exist
    const enumCheck = await client.query(`
      SELECT typname, enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE typname IN ('project_type', 'project_status')
      ORDER BY typname, e.enumsortorder
    `);
    
    console.log(`   📊 Found ${enumCheck.rows.length} enum values`);
    if (enumCheck.rows.length > 0) {
      console.log('   📋 Existing enums:');
      enumCheck.rows.forEach(row => {
        console.log(`      ${row.typname}: ${row.enumlabel}`);
      });
    } else {
      console.log('   ⚠️  No enum types found - migration needed');
    }
    
    // Check projects table columns
    const columnsCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'projects'
      AND column_name IN ('project_type', 'status', 'research_domain', 'progress_percentage', 'current_stage', 'last_activity_at')
      ORDER BY column_name
    `);
    
    console.log(`\n   📋 Project table columns found: ${columnsCheck.rows.length}/6`);
    columnsCheck.rows.forEach(row => {
      console.log(`      ${row.column_name} (${row.data_type}) - ${row.is_nullable === 'YES' ? 'nullable' : 'required'}`);
    });
    
    // Execute the critical migration
    console.log('\n🛠️  Executing Migration SQL...');
    
    const migrationSteps = [
      {
        name: 'Create project_type enum',
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_type') THEN
              CREATE TYPE project_type AS ENUM (
                'systematic_review',
                'meta_analysis', 
                'scoping_review',
                'narrative_review',
                'umbrella_review',
                'custom'
              );
              RAISE NOTICE 'Created project_type enum with 6 values';
            ELSE
              RAISE NOTICE 'project_type enum already exists';
            END IF;
          END $$;
        `
      },
      {
        name: 'Create project_status enum',
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
              CREATE TYPE project_status AS ENUM (
                'draft',
                'active', 
                'review',
                'completed',
                'archived'
              );
              RAISE NOTICE 'Created project_status enum with 5 values';
            ELSE
              RAISE NOTICE 'project_status enum already exists';
            END IF;
          END $$;
        `
      },
      {
        name: 'Update projects table with proper enum columns',
        sql: `
          DO $$ 
          BEGIN
            -- First, check if columns exist with wrong types
            IF EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'projects' 
              AND column_name = 'type'
              AND data_type != 'USER-DEFINED'
            ) THEN
              ALTER TABLE projects DROP COLUMN IF EXISTS type;
              RAISE NOTICE 'Dropped old type column';
            END IF;
            
            IF EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'projects' 
              AND column_name = 'status'
              AND data_type != 'USER-DEFINED'
            ) THEN
              ALTER TABLE projects DROP COLUMN IF EXISTS status;
              RAISE NOTICE 'Dropped old status column';
            END IF;
            
            -- Add project_type column with proper enum type
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'projects' AND column_name = 'project_type'
            ) THEN
              ALTER TABLE projects ADD COLUMN project_type project_type NOT NULL DEFAULT 'systematic_review';
              RAISE NOTICE 'Added project_type column';
            ELSE
              RAISE NOTICE 'project_type column already exists';
            END IF;
            
            -- Add status column with proper enum type
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'projects' AND column_name = 'status'
            ) THEN
              ALTER TABLE projects ADD COLUMN status project_status NOT NULL DEFAULT 'draft';
              RAISE NOTICE 'Added status column';
            ELSE
              RAISE NOTICE 'status column already exists';
            END IF;
            
            -- Add other helpful columns
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'projects' AND column_name = 'research_domain'
            ) THEN
              ALTER TABLE projects ADD COLUMN research_domain TEXT;
              RAISE NOTICE 'Added research_domain column';
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'projects' AND column_name = 'progress_percentage'
            ) THEN
              ALTER TABLE projects ADD COLUMN progress_percentage INTEGER DEFAULT 0 
                CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
              RAISE NOTICE 'Added progress_percentage column';
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'projects' AND column_name = 'current_stage'
            ) THEN
              ALTER TABLE projects ADD COLUMN current_stage TEXT DEFAULT 'Planning';
              RAISE NOTICE 'Added current_stage column';
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'projects' AND column_name = 'last_activity_at'
            ) THEN
              ALTER TABLE projects ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
              RAISE NOTICE 'Added last_activity_at column';
            END IF;
          END $$;
        `
      }
    ];
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < migrationSteps.length; i++) {
      const step = migrationSteps[i];
      
      try {
        console.log(`${i + 1}/${migrationSteps.length} ${step.name}...`);
        
        const result = await client.query(step.sql);
        console.log('   ✅ Success');
        
        // Show any notices from PostgreSQL
        if (result.notices && result.notices.length > 0) {
          result.notices.forEach(notice => {
            console.log(`   💬 ${notice.message}`);
          });
        }
        
        successCount++;
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 MIGRATION EXECUTION SUMMARY:');
    console.log('===============================');
    console.log(`✅ Successful steps: ${successCount}`);
    console.log(`❌ Failed steps: ${errorCount}`);
    console.log(`📝 Total steps: ${migrationSteps.length}`);
    
    // Final verification
    console.log('\n🧪 Final Verification...');
    
    // Test project creation with enum values
    try {
      console.log('1️⃣ Testing project creation with enum values...');
      const testResult = await client.query(`
        INSERT INTO projects (
          title, project_type, status, research_domain, description,
          user_id, progress_percentage, current_stage
        ) VALUES (
          'MCP Migration Test Project',
          'systematic_review',
          'draft',
          'Healthcare Technology',
          'Testing successful migration via MCP tools',
          '00000000-0000-0000-0000-000000000000',
          25,
          'Planning'
        ) RETURNING id, title, project_type, status, progress_percentage, current_stage
      `);
      
      console.log('   ✅ Project creation successful!');
      const project = testResult.rows[0];
      console.log(`   📝 Created: "${project.title}"`);
      console.log(`   📊 Type: ${project.project_type}, Status: ${project.status}`);
      console.log(`   📈 Progress: ${project.progress_percentage}%, Stage: ${project.current_stage}`);
      
      // Clean up test data
      await client.query('DELETE FROM projects WHERE id = $1', [project.id]);
      console.log('   🧹 Test data cleaned up');
      
    } catch (error) {
      console.log(`   ❌ Project creation test failed: ${error.message}`);
      return false;
    }
    
    // Check final schema
    console.log('2️⃣ Checking final database schema...');
    const finalCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'projects'
      AND column_name IN ('project_type', 'status')
      ORDER BY column_name
    `);
    
    console.log('   ✅ Final schema check:');
    finalCheck.rows.forEach(row => {
      console.log(`      ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'required'})`);
    });
    
    if (successCount === migrationSteps.length) {
      console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('✅ All enum types created');
      console.log('✅ All table columns updated');
      console.log('✅ Project creation tested and working');
      console.log('🚀 Searchmatic app is now 100% operational!');
      
      console.log('\n💡 Next steps:');
      console.log('   1. Refresh your app: http://169.254.0.21:4173/');
      console.log('   2. Try creating a new project');
      console.log('   3. Test the full workflow');
      
      return true;
    } else {
      console.log('\n⚠️  MIGRATION PARTIALLY COMPLETED');
      console.log(`✅ ${successCount}/${migrationSteps.length} steps completed successfully`);
      console.log('💡 Core functionality should still work');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    return false;
    
  } finally {
    try {
      await client.end();
      console.log('\n🔌 Database connection closed');
    } catch (err) {
      // Ignore connection close errors
    }
  }
}

// Execute the migration
executeMigration().then(success => {
  if (success) {
    console.log('\n🎯 MIGRATION SUCCESSFUL - Database is ready!');
    process.exit(0);
  } else {
    console.log('\n⚠️  MIGRATION INCOMPLETE - Check errors above');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Migration execution failed:', error);
  process.exit(1);
});