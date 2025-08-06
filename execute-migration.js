#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Supabase connection
const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dmZ1ZmFkaXFtaXpyb3plamNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkzMTQwOSwiZXhwIjoyMDY5NTA3NDA5fQ.ThqBa2lzMrm6zADqVIQzqK7-HvYOpfoVvsh_9qdwxgc';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const migrationSQL = `
-- Create missing enum types
DO $$ 
BEGIN
    -- Check and create project_type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_type') THEN
        CREATE TYPE project_type AS ENUM (
            'systematic_review', 'meta_analysis', 'scoping_review',
            'narrative_review', 'umbrella_review', 'custom'
        );
        RAISE NOTICE 'Created project_type enum';
    ELSE
        RAISE NOTICE 'project_type enum already exists';
    END IF;
    
    -- Check and create project_status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM (
            'draft', 'active', 'review', 'completed', 'archived'
        );
        RAISE NOTICE 'Created project_status enum';
    ELSE
        RAISE NOTICE 'project_status enum already exists';
    END IF;
END $$;

-- Add missing columns to projects table
DO $$ 
BEGIN
    -- Check and add project_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'project_type') THEN
        ALTER TABLE projects ADD COLUMN project_type project_type NOT NULL DEFAULT 'systematic_review';
        RAISE NOTICE 'Added project_type column to projects table';
    ELSE
        RAISE NOTICE 'project_type column already exists in projects table';
    END IF;
    
    -- Check and add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'status') THEN
        ALTER TABLE projects ADD COLUMN status project_status NOT NULL DEFAULT 'draft';
        RAISE NOTICE 'Added status column to projects table';
    ELSE
        RAISE NOTICE 'status column already exists in projects table';
    END IF;
END $$;
`;

async function executeMigration() {
    console.log('🚀 Starting database migration...');
    
    try {
        // First, check current table structure
        console.log('📋 Checking current projects table structure...');
        const { data: currentColumns, error: columnError } = await supabase
            .rpc('query', { sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects' ORDER BY ordinal_position;" });
        
        if (columnError) {
            console.log('⚠️  Could not query table structure directly, proceeding with migration...');
        } else {
            console.log('Current projects table columns:', currentColumns);
        }
        
        // Check current enum types
        console.log('🔍 Checking current enum types...');
        const { data: enumTypes, error: enumError } = await supabase
            .rpc('query', { sql: "SELECT typname FROM pg_type WHERE typname IN ('project_type', 'project_status');" });
        
        if (enumError) {
            console.log('⚠️  Could not query enum types directly, proceeding with migration...');
        } else {
            console.log('Current enum types:', enumTypes);
        }
        
        // Execute the migration
        console.log('⚡ Executing migration SQL...');
        const { data, error } = await supabase.rpc('query', { sql: migrationSQL });
        
        if (error) {
            console.error('❌ Migration failed:', error);
            return false;
        }
        
        console.log('✅ Migration executed successfully!');
        console.log('Migration result:', data);
        
        // Verify the migration worked
        console.log('🔍 Verifying migration results...');
        
        // Test project creation to ensure enums work
        const testProject = {
            title: 'Test Migration Project',
            description: 'Testing that migration worked',
            project_type: 'systematic_review',
            status: 'draft'
        };
        
        const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .insert(testProject)
            .select();
        
        if (projectError) {
            console.error('❌ Project creation test failed:', projectError);
            return false;
        }
        
        console.log('✅ Project creation test successful!');
        console.log('Test project created:', projectData);
        
        // Clean up test project
        if (projectData && projectData[0]) {
            await supabase
                .from('projects')
                .delete()
                .eq('id', projectData[0].id);
            console.log('🧹 Test project cleaned up');
        }
        
        console.log('🎉 Database migration completed successfully!');
        console.log('The Searchmatic app should now be 100% operational.');
        
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
            console.log('✅ All enum types created');
            console.log('✅ All table columns added');
            console.log('✅ Project creation tested and working');
            process.exit(0);
        } else {
            console.log('\n❌ Migration failed - see errors above');
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });