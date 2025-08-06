
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
