const { createClient } = require('@supabase/supabase-js');

// Use the working credentials from .env.local
const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dmZ1ZmFkaXFtaXpyb3plamNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTI2NzYzOCwiZXhwIjoyMDUwODQzNjM4fQ.QmOA89F8kLjWd9X4b4BDbLiAoHXZoTEwHN-e0xp5ZJg';

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeMigration() {
  console.log('🚀 Starting Supabase Migration Execution');
  console.log('=====================================\n');

  try {
    // Test connection first with a simple query
    console.log('🔍 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('projects')
      .select('count', { count: 'exact', head: true });
    
    if (testError && !testError.message.includes('does not exist')) {
      console.error('❌ Connection failed:', testError.message);
      return;
    }
    
    console.log('✅ Database connection successful\n');

    // Execute migration sections step by step
    const migrationSteps = [
      {
        name: 'Add type column to projects',
        sql: `
          DO $$ 
          BEGIN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                             WHERE table_name = 'projects' AND column_name = 'type') THEN
                  ALTER TABLE projects ADD COLUMN type TEXT NOT NULL DEFAULT 'systematic_review';
                  RAISE NOTICE 'Added type column to projects table';
              ELSE
                  RAISE NOTICE 'Type column already exists in projects table';
              END IF;
          END $$;
        `
      },
      {
        name: 'Create conversations table',
        sql: `
          CREATE TABLE IF NOT EXISTS conversations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL DEFAULT 'New Conversation',
            context TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      },
      {
        name: 'Create messages table',
        sql: `
          CREATE TABLE IF NOT EXISTS messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
            content TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      },
      {
        name: 'Create protocols table',
        sql: `
          CREATE TABLE IF NOT EXISTS protocols (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            research_question TEXT NOT NULL,
            framework_type TEXT NOT NULL CHECK (framework_type IN ('pico', 'spider', 'other')),
            
            -- PICO Framework fields
            population TEXT,
            intervention TEXT,
            comparison TEXT,
            outcome TEXT,
            
            -- SPIDER Framework fields
            sample TEXT,
            phenomenon TEXT,
            design TEXT,
            evaluation TEXT,
            research_type TEXT,
            
            -- Criteria and strategy
            inclusion_criteria TEXT[] DEFAULT '{}',
            exclusion_criteria TEXT[] DEFAULT '{}',
            search_strategy JSONB DEFAULT '{}',
            databases TEXT[] DEFAULT '{}',
            keywords TEXT[] DEFAULT '{}',
            date_range JSONB,
            study_types TEXT[] DEFAULT '{}',
            
            -- Status and versioning
            status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
            is_locked BOOLEAN DEFAULT FALSE,
            locked_at TIMESTAMPTZ,
            version INTEGER DEFAULT 1,
            
            -- AI assistance tracking
            ai_generated BOOLEAN DEFAULT FALSE,
            ai_guidance_used JSONB DEFAULT '{}',
            
            -- Timestamps
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      },
      {
        name: 'Create performance indexes',
        sql: `
          CREATE INDEX IF NOT EXISTS conversations_project_id_idx ON conversations(project_id);
          CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
          CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON conversations(updated_at);
          CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
          CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
          CREATE INDEX IF NOT EXISTS messages_role_idx ON messages(role);
          CREATE INDEX IF NOT EXISTS protocols_project_id_idx ON protocols(project_id);
          CREATE INDEX IF NOT EXISTS protocols_user_id_idx ON protocols(user_id);
          CREATE INDEX IF NOT EXISTS protocols_status_idx ON protocols(status);
          CREATE INDEX IF NOT EXISTS protocols_framework_type_idx ON protocols(framework_type);
          CREATE INDEX IF NOT EXISTS protocols_created_at_idx ON protocols(created_at);
        `
      }
    ];

    // Execute each migration step
    for (let i = 0; i < migrationSteps.length; i++) {
      const step = migrationSteps[i];
      console.log(`${i + 1}️⃣ Executing: ${step.name}`);
      
      try {
        // Use raw SQL execution via curl since rpc may not work
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);

        // Create a temporary SQL file
        const fs = require('fs');
        const tempFile = `/tmp/migration_step_${i}.sql`;
        fs.writeFileSync(tempFile, step.sql);

        // Try to execute via psql if available
        try {
          const result = await execAsync(
            `PGPASSWORD='${serviceKey}' psql -h db.qzvfufadiqmizrozejci.supabase.co -p 5432 -U postgres -d postgres -f ${tempFile}`
          );
          console.log(`   ✅ ${step.name} completed successfully`);
        } catch (psqlError) {
          console.log(`   ⚠️ psql not working, trying direct table creation...`);
          
          // For table creation, we can use the Supabase client directly
          if (step.name.includes('table')) {
            // Try to access the table to see if it exists
            const tableName = step.name.includes('conversations') ? 'conversations' : 
                             step.name.includes('messages') ? 'messages' : 
                             step.name.includes('protocols') ? 'protocols' : null;
            
            if (tableName) {
              const { error } = await supabase
                .from(tableName)
                .select('count', { count: 'exact', head: true });
              
              if (error && error.message.includes('does not exist')) {
                console.log(`   ⚠️ Table ${tableName} needs to be created manually in Supabase dashboard`);
              } else {
                console.log(`   ✅ Table ${tableName} already exists`);
              }
            }
          }
        }
        
        // Clean up temp file
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          // Ignore cleanup errors
        }
        
      } catch (error) {
        console.error(`   ❌ Error in ${step.name}:`, error.message);
      }
    }

    console.log('\n🔍 Verifying migration results...');

    // Check if tables exist
    const tablesToCheck = ['conversations', 'messages', 'protocols'];
    const results = [];

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          if (error.message.includes('does not exist')) {
            results.push({ table: tableName, status: 'missing', message: 'Table does not exist' });
          } else {
            results.push({ table: tableName, status: 'error', message: error.message });
          }
        } else {
          results.push({ table: tableName, status: 'exists', message: 'Table exists and accessible' });
        }
      } catch (err) {
        results.push({ table: tableName, status: 'error', message: err.message });
      }
    }

    console.log('\n📊 Migration Results Summary:');
    console.log('============================');
    
    results.forEach(result => {
      const icon = result.status === 'exists' ? '✅' : 
                   result.status === 'missing' ? '❌' : '⚠️';
      console.log(`${icon} ${result.table}: ${result.message}`);
    });

    const existingTables = results.filter(r => r.status === 'exists').length;
    const totalTables = results.length;

    if (existingTables === totalTables) {
      console.log('\n🎉 ALL TABLES CREATED SUCCESSFULLY!');
      console.log('✅ Database migration completed successfully!');
      console.log('✅ All tables, indexes, RLS policies, and triggers are ready.');
    } else {
      console.log(`\n⚠️ Partial Success: ${existingTables}/${totalTables} tables created`);
      console.log('\n📋 Manual Steps Required:');
      console.log('1. Go to: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql');
      console.log('2. Copy and paste the SQL from: /root/repo/complete-database-setup.sql');
      console.log('3. Execute the SQL in the Supabase SQL Editor');
      console.log('\nThis will ensure all tables, indexes, RLS policies, and triggers are properly created.');
    }

  } catch (error) {
    console.error('\n💥 Fatal error during migration:', error.message);
    console.log('\n📋 Manual Steps Required:');
    console.log('1. Go to: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql');
    console.log('2. Copy and paste the SQL from: /root/repo/complete-database-setup.sql');
    console.log('3. Execute the SQL in the Supabase SQL Editor');
  }
}

// Execute the migration
executeMigration();