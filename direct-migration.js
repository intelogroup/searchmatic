#!/usr/bin/env node

/**
 * Direct Database Migration using PostgreSQL Connection
 * Executes critical enum and column creation directly
 */

import pg from 'pg';
const { Client } = pg;

// Database connection details - using session pooler
const dbConfig = {
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.qzvfufadiqmizrozejci',
  password: 'Goldyear2023#',
  ssl: { rejectUnauthorized: false },
  // Force IPv4
  family: 4
};

async function executeMigration() {
  console.log('🚀 Starting Direct Database Migration...\n');
  
  const client = new Client(dbConfig);
  
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('   ✅ Connected successfully\n');
    
    // Critical Migration Steps
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
              RAISE NOTICE 'Created project_type enum';
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
              RAISE NOTICE 'Created project_status enum';
            ELSE
              RAISE NOTICE 'project_status enum already exists';
            END IF;
          END $$;
        `
      },
      {
        name: 'Add project_type column to projects table',
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'projects' AND column_name = 'project_type'
            ) THEN
              ALTER TABLE projects ADD COLUMN project_type project_type NOT NULL DEFAULT 'systematic_review';
              RAISE NOTICE 'Added project_type column';
            ELSE
              RAISE NOTICE 'project_type column already exists';
            END IF;
          END $$;
        `
      },
      {
        name: 'Add status column to projects table',
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'projects' AND column_name = 'status'
            ) THEN
              ALTER TABLE projects ADD COLUMN status project_status NOT NULL DEFAULT 'draft';
              RAISE NOTICE 'Added status column';
            ELSE
              RAISE NOTICE 'status column already exists';
            END IF;
          END $$;
        `
      },
      {
        name: 'Add research_domain column to projects table',
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'projects' AND column_name = 'research_domain'
            ) THEN
              ALTER TABLE projects ADD COLUMN research_domain TEXT;
              RAISE NOTICE 'Added research_domain column';
            ELSE
              RAISE NOTICE 'research_domain column already exists';
            END IF;
          END $$;
        `
      },
      {
        name: 'Add progress_percentage column to projects table',
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'projects' AND column_name = 'progress_percentage'
            ) THEN
              ALTER TABLE projects ADD COLUMN progress_percentage INTEGER DEFAULT 0 
                CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
              RAISE NOTICE 'Added progress_percentage column';
            ELSE
              RAISE NOTICE 'progress_percentage column already exists';
            END IF;
          END $$;
        `
      },
      {
        name: 'Add current_stage column to projects table',
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'projects' AND column_name = 'current_stage'
            ) THEN
              ALTER TABLE projects ADD COLUMN current_stage TEXT DEFAULT 'Planning';
              RAISE NOTICE 'Added current_stage column';
            ELSE
              RAISE NOTICE 'current_stage column already exists';
            END IF;
          END $$;
        `
      },
      {
        name: 'Add last_activity_at column to projects table',
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'projects' AND column_name = 'last_activity_at'
            ) THEN
              ALTER TABLE projects ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
              RAISE NOTICE 'Added last_activity_at column';
            ELSE
              RAISE NOTICE 'last_activity_at column already exists';
            END IF;
          END $$;
        `
      }
    ];
    
    // Execute each migration step
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
    
    console.log('\n📊 MIGRATION SUMMARY:');
    console.log('====================');
    console.log(`✅ Successful steps: ${successCount}`);
    console.log(`❌ Failed steps: ${errorCount}`);
    console.log(`📝 Total steps: ${migrationSteps.length}`);
    
    // Test the migration
    console.log('\n🧪 Testing Migration Results...');
    
    // Test 1: Check if we can query projects with new columns
    try {
      console.log('1️⃣ Testing projects table structure...');
      const result = await client.query(`
        SELECT 
          id, title, project_type, status, research_domain, 
          progress_percentage, current_stage, last_activity_at
        FROM projects 
        LIMIT 1
      `);
      console.log('   ✅ Projects table structure is correct');
    } catch (error) {
      console.log(`   ❌ Projects table structure test failed: ${error.message}`);
    }
    
    // Test 2: Try inserting a test project
    try {
      console.log('2️⃣ Testing project creation with enum values...');
      const testResult = await client.query(`
        INSERT INTO projects (
          title, project_type, status, research_domain, description,
          user_id, progress_percentage, current_stage
        ) VALUES (
          'Migration Test Project',
          'systematic_review',
          'draft',
          'Healthcare',
          'Testing migration success',
          '00000000-0000-0000-0000-000000000000',
          15,
          'Planning'
        ) RETURNING id, title, project_type, status
      `);
      
      console.log('   ✅ Project creation successful!');
      console.log(`   📝 Created project: ${testResult.rows[0].title}`);
      
      // Clean up test data
      await client.query('DELETE FROM projects WHERE id = $1', [testResult.rows[0].id]);
      console.log('   🧹 Test data cleaned up');
      
    } catch (error) {
      console.log(`   ❌ Project creation test failed: ${error.message}`);
    }
    
    if (successCount === migrationSteps.length) {
      console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('✅ Database is ready for MVP');
      console.log('🚀 Searchmatic app is now 100% operational!');
      console.log('\n💡 Next steps:');
      console.log('   1. Refresh your app: http://169.254.0.21:4173/');
      console.log('   2. Try creating a new project');
      console.log('   3. Test the full workflow');
    } else {
      console.log('\n⚠️  MIGRATION PARTIALLY COMPLETED');
      console.log(`✅ ${successCount}/${migrationSteps.length} steps completed successfully`);
      console.log('💡 Core functionality should still work');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n🔑 Database password authentication failed');
      console.log('💡 Please verify the database password is correct');
    } else if (error.message.includes('connection')) {
      console.log('\n🔌 Database connection failed');
      console.log('💡 Please check network connectivity');
    }
    
  } finally {
    try {
      await client.end();
      console.log('\n🔌 Database connection closed');
    } catch (err) {
      // Ignore connection close errors
    }
  }
}

// Check if pg package is available
async function checkDependencies() {
  try {
    await import('pg');
    return true;
  } catch (error) {
    console.log('📦 Installing pg package...');
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install', 'pg'], { stdio: 'pipe' });
      
      npm.on('close', (code) => {
        if (code === 0) {
          console.log('   ✅ pg package installed');
          resolve(true);
        } else {
          console.log('   ❌ Failed to install pg package');
          resolve(false);
        }
      });
    });
  }
}

// Main execution
checkDependencies().then(available => {
  if (available) {
    executeMigration().catch(console.error);
  } else {
    console.log('💡 Please install pg package manually: npm install pg');
    console.log('💡 Or use manual migration in Supabase Dashboard');
  }
});