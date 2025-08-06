-- SEARCHMATIC DATABASE MIGRATION
-- This adds missing enum values and creates the project_type column
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: Add missing values to existing project_type enum
ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'systematic_review';
ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'meta_analysis';
ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'scoping_review';
ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'narrative_review';
ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'umbrella_review';
ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'custom';

-- Step 2: Add missing values to existing project_status enum  
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'review';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'archived';

-- Step 3: Add project_type column (frontend expects this instead of 'type')
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type project_type NOT NULL DEFAULT 'systematic_review';

-- Step 4: Sync project_type with existing type values where possible
-- Map 'guided' to 'systematic_review' (closest match)
UPDATE projects 
SET project_type = 'systematic_review' 
WHERE type = 'guided' AND project_type = 'systematic_review';

-- Step 5: Verification - Check everything works
SELECT 'SUCCESS: Enum values added' as status;

-- Check enum values
SELECT 'project_type enum values:' as info, enumlabel as value 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'project_type')
ORDER BY enumsortorder;

SELECT 'project_status enum values:' as info, enumlabel as value 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'project_status')
ORDER BY enumsortorder;

-- Check table structure
SELECT 'projects table columns:' as info, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('type', 'status', 'project_type')
ORDER BY column_name;

-- Check sample data
SELECT 'sample projects:' as info, id, title, type, status, project_type 
FROM projects 
LIMIT 3;