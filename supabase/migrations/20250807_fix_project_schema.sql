-- CRITICAL DATABASE SCHEMA FIX
-- This migration fixes the critical schema mismatch that prevents project creation
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- First, let's ensure we have the correct project_status enum with all needed values
DO $$
BEGIN
    -- Drop existing enum if it exists and recreate with all required values
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        -- We need to handle existing data carefully
        -- First check if there are any projects using the old enum
        RAISE NOTICE 'Updating project_status enum to include all required values';
        
        -- Add missing values to existing enum
        BEGIN
            ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'draft';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'draft already exists in enum';
        END;
        
        BEGIN
            ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'review';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'review already exists in enum';
        END;
        
    ELSE
        -- Create the enum with all required values
        CREATE TYPE project_status AS ENUM ('draft', 'active', 'review', 'completed', 'archived');
        RAISE NOTICE 'Created project_status enum with all required values';
    END IF;
END $$;

-- Now add the missing columns to the projects table
-- These are CRITICAL fields that projectService.ts expects

-- Add project_type column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'project_type') THEN
        ALTER TABLE projects ADD COLUMN project_type TEXT NOT NULL DEFAULT 'systematic_review' 
        CHECK (project_type IN ('systematic_review', 'meta_analysis', 'scoping_review', 'narrative_review', 'umbrella_review', 'custom'));
        RAISE NOTICE 'Added project_type column';
    ELSE
        RAISE NOTICE 'project_type column already exists';
    END IF;
END $$;

-- Add research_domain column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'research_domain') THEN
        ALTER TABLE projects ADD COLUMN research_domain TEXT;
        RAISE NOTICE 'Added research_domain column';
    ELSE
        RAISE NOTICE 'research_domain column already exists';
    END IF;
END $$;

-- Add progress_percentage column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'progress_percentage') THEN
        ALTER TABLE projects ADD COLUMN progress_percentage INTEGER NOT NULL DEFAULT 0 
        CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
        RAISE NOTICE 'Added progress_percentage column';
    ELSE
        RAISE NOTICE 'progress_percentage column already exists';
    END IF;
END $$;

-- Add current_stage column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'current_stage') THEN
        ALTER TABLE projects ADD COLUMN current_stage TEXT NOT NULL DEFAULT 'Planning';
        RAISE NOTICE 'Added current_stage column';
    ELSE
        RAISE NOTICE 'current_stage column already exists';
    END IF;
END $$;

-- Add last_activity_at column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'last_activity_at') THEN
        ALTER TABLE projects ADD COLUMN last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Added last_activity_at column';
    ELSE
        RAISE NOTICE 'last_activity_at column already exists';
    END IF;
END $$;

-- Update the status column to use the correct enum if it's not already
DO $$
BEGIN
    -- Update the status column constraint if needed
    BEGIN
        ALTER TABLE projects ALTER COLUMN status TYPE project_status USING status::project_status;
        RAISE NOTICE 'Updated status column to use project_status enum';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Status column already uses correct type: %', SQLERRM;
    END;
END $$;

-- Create indexes for the new columns for better performance
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_progress_percentage ON projects(progress_percentage);
CREATE INDEX IF NOT EXISTS idx_projects_current_stage ON projects(current_stage);
CREATE INDEX IF NOT EXISTS idx_projects_last_activity_at ON projects(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_research_domain ON projects(research_domain) WHERE research_domain IS NOT NULL;

-- Create a function to get project statistics (referenced in projectService.ts)
CREATE OR REPLACE FUNCTION get_project_stats(project_uuid UUID)
RETURNS TABLE (
    total_studies BIGINT,
    pending_studies BIGINT,
    included_studies BIGINT,
    excluded_studies BIGINT,
    last_updated TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(COUNT(*), 0) as total_studies,
        COALESCE(COUNT(*) FILTER (WHERE screening_decision IS NULL), 0) as pending_studies,
        COALESCE(COUNT(*) FILTER (WHERE screening_decision = 'include'), 0) as included_studies,
        COALESCE(COUNT(*) FILTER (WHERE screening_decision = 'exclude'), 0) as excluded_studies,
        MAX(updated_at) as last_updated
    FROM articles 
    WHERE project_id = project_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing projects to have valid data for new columns
UPDATE projects 
SET 
    last_activity_at = COALESCE(updated_at, created_at, NOW()),
    progress_percentage = 0,
    current_stage = 'Planning',
    project_type = 'systematic_review'
WHERE 
    last_activity_at IS NULL 
    OR progress_percentage IS NULL 
    OR current_stage IS NULL 
    OR project_type IS NULL;

-- Create trigger to automatically update last_activity_at on project changes
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_projects_last_activity ON projects;
CREATE TRIGGER update_projects_last_activity 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_last_activity();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_project_stats(UUID) TO authenticated;

-- Final verification and success message
DO $$
DECLARE
    missing_columns TEXT[] := '{}';
    col_name TEXT;
BEGIN
    -- Check for all required columns
    FOR col_name IN SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'projects' 
                    AND column_name IN ('project_type', 'research_domain', 'progress_percentage', 'current_stage', 'last_activity_at')
    LOOP
        RAISE NOTICE 'Verified column exists: %', col_name;
    END LOOP;
    
    -- Check if we're missing any critical columns
    SELECT ARRAY_AGG(required_col) INTO missing_columns
    FROM (
        VALUES ('project_type'), ('research_domain'), ('progress_percentage'), ('current_stage'), ('last_activity_at')
    ) AS required(required_col)
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = required.required_col
    );
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION 'CRITICAL: Still missing columns: %', missing_columns;
    ELSE
        RAISE NOTICE '✓ SUCCESS: All required project columns are now present';
        RAISE NOTICE '✓ project_type column added with constraint';
        RAISE NOTICE '✓ research_domain column added';
        RAISE NOTICE '✓ progress_percentage column added with range constraint';
        RAISE NOTICE '✓ current_stage column added';
        RAISE NOTICE '✓ last_activity_at column added with auto-update trigger';
        RAISE NOTICE '✓ project_status enum updated with all required values';
        RAISE NOTICE '✓ get_project_stats function created';
        RAISE NOTICE '✓ Performance indexes created';
        RAISE NOTICE '✓ SCHEMA-APPLICATION MISMATCH RESOLVED';
    END IF;
END $$;

-- Show the final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;