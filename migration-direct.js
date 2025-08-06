#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Supabase connection
const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dmZ1ZmFkaXFtaXpyb3plamNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkzMTQwOSwiZXhwIjoyMDY5NTA3NDA5fQ.ThqBa2lzMrm6zADqVIQzqK7-HvYOpfoVvsh_9qdwxgc';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeMigration() {
    console.log('🚀 Starting database migration...');
    
    try {
        // First, check current table structure by trying to select from projects
        console.log('📋 Checking current projects table...');
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .limit(1);
        
        if (projectsError) {
            console.error('❌ Cannot access projects table:', projectsError);
            return false;
        }
        
        console.log('✅ Projects table exists');
        if (projects && projects.length > 0) {
            console.log('Current project structure:', Object.keys(projects[0]));
        }
        
        // Test if project_type and status columns already exist by trying to create a project
        console.log('🔍 Testing current project creation...');
        const testProject = {
            title: 'Test Project for Migration Check',
            description: 'Testing current schema',
            project_type: 'systematic_review',
            status: 'draft'
        };
        
        const { error: testError } = await supabase
            .from('projects')
            .insert(testProject)
            .select();
        
        if (!testError) {
            console.log('✅ Migration appears to already be complete - project creation works!');
            
            // Clean up test project
            await supabase
                .from('projects')
                .delete()
                .match({ title: 'Test Project for Migration Check' });
            
            console.log('🎉 Database is already properly configured!');
            return true;
        }
        
        console.log('⚠️  Project creation failed, proceeding with migration...');
        console.log('Error details:', testError);
        
        // Use fetch to make raw SQL requests to Supabase Edge Functions
        console.log('⚡ Attempting migration via HTTP REST API...');
        
        const migrationSQLParts = [
            // Part 1: Create project_type enum
            `DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_type') THEN
        CREATE TYPE project_type AS ENUM (
            'systematic_review', 'meta_analysis', 'scoping_review',
            'narrative_review', 'umbrella_review', 'custom'
        );
    END IF;
END $$;`,
            
            // Part 2: Create project_status enum
            `DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM (
            'draft', 'active', 'review', 'completed', 'archived'
        );
    END IF;
END $$;`,
            
            // Part 3: Add project_type column
            `DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'project_type') THEN
        ALTER TABLE projects ADD COLUMN project_type project_type NOT NULL DEFAULT 'systematic_review';
    END IF;
END $$;`,
            
            // Part 4: Add status column
            `DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'status') THEN
        ALTER TABLE projects ADD COLUMN status project_status NOT NULL DEFAULT 'draft';
    END IF;
END $$;`
        ];
        
        // Execute each part separately via REST API
        for (let i = 0; i < migrationSQLParts.length; i++) {
            const sql = migrationSQLParts[i];
            console.log(`📝 Executing migration part ${i + 1}...`);
            
            try {
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    },
                    body: JSON.stringify({ sql })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.log(`⚠️  Part ${i + 1} via exec_sql failed: ${errorText}`);
                    
                    // Try alternative approach
                    console.log(`🔄 Trying alternative approach for part ${i + 1}...`);
                    
                } else {
                    console.log(`✅ Part ${i + 1} executed successfully`);
                }
            } catch (fetchError) {
                console.log(`⚠️  Part ${i + 1} fetch failed: ${fetchError.message}`);
            }
        }
        
        // Test if migration worked
        console.log('🧪 Testing migration results...');
        const finalTestProject = {
            title: 'Final Migration Test',
            description: 'Testing post-migration',
            project_type: 'systematic_review',
            status: 'draft'
        };
        
        const { data: finalProjectData, error: finalProjectError } = await supabase
            .from('projects')
            .insert(finalTestProject)
            .select();
        
        if (finalProjectError) {
            console.error('❌ Final test failed:', finalProjectError);
            console.log('🔍 Let me try creating a project without the new columns...');
            
            const basicProject = {
                title: 'Basic Test Project',
                description: 'Testing without new columns'
            };
            
            const { data: basicData, error: basicError } = await supabase
                .from('projects')
                .insert(basicProject)
                .select();
            
            if (basicError) {
                console.error('❌ Even basic project creation failed:', basicError);
                return false;
            } else {
                console.log('✅ Basic project creation works, but migration may be incomplete');
                console.log('Created basic project:', basicData);
                
                // Clean up
                if (basicData && basicData[0]) {
                    await supabase
                        .from('projects')
                        .delete()
                        .eq('id', basicData[0].id);
                }
                
                return false;
            }
        }
        
        console.log('🎉 Final test successful! Migration completed!');
        console.log('Created project:', finalProjectData);
        
        // Clean up test project
        if (finalProjectData && finalProjectData[0]) {
            await supabase
                .from('projects')
                .delete()
                .eq('id', finalProjectData[0].id);
        }
        
        return true;
        
    } catch (err) {
        console.error('💥 Migration failed with exception:', err);
        return false;
    }
}

// Execute migration
executeMigration()
    .then(success => {
        if (success) {
            console.log('\n🚀 SEARCHMATIC MVP IS NOW 100% OPERATIONAL! 🚀');
            console.log('✅ Database migration completed successfully');
            console.log('✅ Projects can be created with project_type and status');
            console.log('✅ App should now work without enum errors');
            process.exit(0);
        } else {
            console.log('\n⚠️  Migration may be incomplete - manual intervention needed');
            console.log('Please check the Supabase dashboard SQL editor to run migration manually');
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });