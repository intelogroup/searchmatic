-- Step 2: Enhance Projects Table
-- Execute this after Step 1

DO $$ 
BEGIN
    -- Add project_type column using the enum
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'project_type') THEN
        ALTER TABLE projects ADD COLUMN project_type project_type NOT NULL DEFAULT 'systematic_review';
    END IF;
    
    -- Add status column using enum
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'status') THEN
        ALTER TABLE projects ADD COLUMN status project_status NOT NULL DEFAULT 'draft';
    END IF;
    
    -- Add research domain
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'research_domain') THEN
        ALTER TABLE projects ADD COLUMN research_domain TEXT;
    END IF;
    
    -- Add team members count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'team_size') THEN
        ALTER TABLE projects ADD COLUMN team_size INTEGER DEFAULT 1;
    END IF;
    
    -- Add progress tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'progress_percentage') THEN
        ALTER TABLE projects ADD COLUMN progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
    END IF;
    
    -- Add current stage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'current_stage') THEN
        ALTER TABLE projects ADD COLUMN current_stage TEXT DEFAULT 'Planning';
    END IF;
    
    -- Add last activity timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'last_activity_at') THEN
        ALTER TABLE projects ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Remove the old 'type' column if it exists (it was TEXT, now we use project_type enum)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'projects' AND column_name = 'type' AND data_type = 'text') THEN
        -- Copy data from 'type' to 'project_type' if needed
        UPDATE projects SET project_type = 
            CASE 
                WHEN type = 'systematic_review' THEN 'systematic_review'::project_type
                WHEN type = 'meta_analysis' THEN 'meta_analysis'::project_type
                WHEN type = 'scoping_review' THEN 'scoping_review'::project_type
                ELSE 'systematic_review'::project_type
            END
        WHERE type IS NOT NULL;
        
        -- Drop the old column
        ALTER TABLE projects DROP COLUMN type;
    END IF;
END $$;