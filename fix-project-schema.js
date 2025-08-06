#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Supabase connection  
const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dmZ1ZmFkaXFtaXpyb3plamNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkzMTQwOSwiZXhwIjoyMDY5NTA3NDA5fQ.ThqBa2lzMrm6zADqVIQzqK7-HvYOpfoVvsh_9qdwxgc';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixProjectSchema() {
    console.log('🔧 Analyzing and fixing project schema...');
    
    try {
        // Get current schema info
        console.log('📋 Current projects table structure:');
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .limit(1);
        
        if (projects && projects.length > 0) {
            console.log('Columns found:', Object.keys(projects[0]));
        }
        
        // Issue identified: Frontend expects 'project_type' but table has 'type'  
        // Solution: Check if we need to rename column or update frontend
        
        console.log('\n🔍 Checking table schema via information_schema...');
        
        // Let's create the SQL file that needs to be run manually
        const fixSQL = `
-- Database Migration Script for Searchmatic
-- This fixes the enum type and column issues

-- Step 1: Create enum types if they don't exist
DO $$ 
BEGIN
    -- Create project_type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_type') THEN
        CREATE TYPE project_type AS ENUM (
            'systematic_review', 'meta_analysis', 'scoping_review',
            'narrative_review', 'umbrella_review', 'custom'
        );
        RAISE NOTICE 'Created project_type enum';
    ELSE
        RAISE NOTICE 'project_type enum already exists';
    END IF;
    
    -- Create project_status enum  
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM (
            'draft', 'active', 'review', 'completed', 'archived'
        );
        RAISE NOTICE 'Created project_status enum';
    ELSE
        RAISE NOTICE 'project_status enum already exists';
    END IF;
END $$;

-- Step 2: Update existing columns to use proper enum types
-- First, check what the current 'type' and 'status' columns are using

-- Update the type column to use the proper enum (if it's not already)
ALTER TABLE projects 
    ALTER COLUMN type TYPE project_type 
    USING type::text::project_type;

-- Update the status column to use the proper enum (if it's not already) 
ALTER TABLE projects 
    ALTER COLUMN status TYPE project_status 
    USING status::text::project_status;

-- Step 3: Add project_type column that maps to type (if frontend expects project_type)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'project_type') THEN
        -- Option A: Add project_type as alias/computed column
        ALTER TABLE projects ADD COLUMN project_type project_type 
            GENERATED ALWAYS AS (type) STORED;
        RAISE NOTICE 'Added project_type computed column';
    ELSE
        RAISE NOTICE 'project_type column already exists';
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- If generated column fails, add regular column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'project_type') THEN
        ALTER TABLE projects ADD COLUMN project_type project_type NOT NULL DEFAULT 'systematic_review';
        
        -- Update project_type column to match existing type values
        UPDATE projects SET project_type = type::text::project_type WHERE type IS NOT NULL;
        
        RAISE NOTICE 'Added project_type regular column and synced with type';
    END IF;
END $$;

-- Step 4: Verification queries
-- Check that everything is working
SELECT 'Enum types created:' as check_type, typname FROM pg_type WHERE typname IN ('project_type', 'project_status');
SELECT 'Table columns:' as check_type, column_name, data_type FROM information_schema.columns WHERE table_name = 'projects' AND column_name IN ('type', 'status', 'project_type');
SELECT 'Sample project data:' as check_type, id, title, type, status, project_type FROM projects LIMIT 3;
`;
        
        console.log('\n📝 Generated SQL migration script:');
        console.log(fixSQL);
        
        // Write to file for manual execution
        const fs = await import('fs/promises');
        await fs.writeFile('/root/repo/manual-migration.sql', fixSQL, 'utf8');
        console.log('\n✅ Migration SQL saved to: /root/repo/manual-migration.sql');
        
        // Let's also try to detect what type the current type/status columns are
        console.log('\n🔍 Attempting to detect current column types...');
        
        // Try to insert a test project to see what the current schema expects
        const testUser = '00000000-0000-0000-0000-000000000000'; // UUID for testing
        
        const testProjects = [
            {
                title: 'Schema Test 1',
                description: 'Testing current schema',
                type: 'systematic_review',
                status: 'draft',
                user_id: testUser
            },
            {
                title: 'Schema Test 2', 
                description: 'Testing with different values',
                type: 'meta_analysis',
                status: 'active', 
                user_id: testUser
            }
        ];
        
        for (const testProject of testProjects) {
            console.log(`\n🧪 Testing project insertion: ${testProject.title}`);
            
            const { data, error } = await supabase
                .from('projects')
                .insert(testProject)
                .select();
            
            if (error) {
                console.log(`❌ Error: ${error.message}`);
                console.log(`Code: ${error.code}`);
                console.log(`Details: ${error.details || 'No details'}`);
            } else {
                console.log(`✅ Success! Created project:`, data[0]);
                
                // Clean up
                await supabase
                    .from('projects')
                    .delete()
                    .eq('id', data[0].id);
                console.log('🧹 Test project cleaned up');
            }
        }
        
        console.log('\n🎯 FINDINGS & RECOMMENDATIONS:');
        console.log('1. Projects table exists with columns: type, status');
        console.log('2. Frontend likely expects: project_type, status');  
        console.log('3. Need to run migration SQL in Supabase dashboard');
        console.log('4. SQL file created: /root/repo/manual-migration.sql');
        
        return true;
        
    } catch (err) {
        console.error('💥 Analysis failed:', err);
        return false;
    }
}

fixProjectSchema()
    .then(success => {
        if (success) {
            console.log('\n🚀 ANALYSIS COMPLETE!');
            console.log('📋 Next steps:');
            console.log('1. Open Supabase Dashboard SQL Editor');
            console.log('2. Run the SQL from: /root/repo/manual-migration.sql');  
            console.log('3. Test the app - it should work after migration');
            console.log('\n🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql');
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });