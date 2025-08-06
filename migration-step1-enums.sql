-- Step 1: Create Enum Types
-- Execute this first in Supabase SQL Editor

DO $$ 
BEGIN
    -- Create project_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_type') THEN
        CREATE TYPE project_type AS ENUM (
            'systematic_review',
            'meta_analysis', 
            'scoping_review',
            'narrative_review',
            'umbrella_review',
            'custom'
        );
    END IF;
    
    -- Create project_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM (
            'draft',
            'active', 
            'review',
            'completed',
            'archived'
        );
    END IF;
    
    -- Create study_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'study_type') THEN
        CREATE TYPE study_type AS ENUM (
            'article',
            'thesis',
            'book',
            'conference_paper',
            'report',
            'patent',
            'other'
        );
    END IF;
    
    -- Create study_status enum if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'study_status') THEN
        CREATE TYPE study_status AS ENUM (
            'pending',
            'screening',
            'included',
            'excluded',
            'duplicate',
            'extracted'
        );
    END IF;
END $$;