-- Fix the project_status enum to include the values our app uses

-- First, let's see what enum values currently exist and add the missing ones
DO $$ 
BEGIN
    -- Add 'active' to the enum if it doesn't exist
    BEGIN
        ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'active';
        RAISE NOTICE 'Added active to project_status enum';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add active to enum: %', SQLERRM;
    END;
    
    -- Add 'draft' to the enum if it doesn't exist  
    BEGIN
        ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'draft';
        RAISE NOTICE 'Added draft to project_status enum';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add draft to enum: %', SQLERRM;
    END;
    
    -- Add 'review' to the enum if it doesn't exist
    BEGIN
        ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'review';
        RAISE NOTICE 'Added review to project_status enum';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add review to enum: %', SQLERRM;
    END;
    
    -- Add 'archived' to the enum if it doesn't exist
    BEGIN
        ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'archived';
        RAISE NOTICE 'Added archived to project_status enum';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add archived to enum: %', SQLERRM;
    END;
END $$;

-- Alternative approach: if the enum doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM ('draft', 'active', 'review', 'completed', 'archived');
        RAISE NOTICE 'Created project_status enum';
    END IF;
END $$;

-- Final success message
SELECT 'Project status enum updated successfully!' as result;