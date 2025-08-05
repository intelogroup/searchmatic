-- Enhanced Searchmatic Database Migration - Project-Centric Workflow
-- This migration fixes critical issues and adds studies management
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql

-- 1. CREATE MISSING ENUM TYPES
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

-- 2. ENHANCE PROJECTS TABLE
-- Add missing columns to projects table
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

-- 3. CREATE STUDIES TABLE
CREATE TABLE IF NOT EXISTS studies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Information
    title TEXT NOT NULL,
    authors TEXT,
    publication_year INTEGER,
    journal TEXT,
    doi TEXT,
    pmid TEXT,
    isbn TEXT,
    url TEXT,
    
    -- Study Classification
    study_type study_type NOT NULL DEFAULT 'article',
    status study_status NOT NULL DEFAULT 'pending',
    
    -- Content
    abstract TEXT,
    keywords TEXT[],
    full_text TEXT,
    citation TEXT,
    
    -- Processing
    pdf_url TEXT,
    pdf_processed BOOLEAN DEFAULT FALSE,
    extraction_data JSONB DEFAULT '{}',
    screening_notes TEXT,
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 10),
    
    -- Deduplication
    similarity_hash TEXT,
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of UUID REFERENCES studies(id),
    
    -- AI Processing
    ai_summary TEXT,
    ai_tags TEXT[],
    ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 4. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS projects_project_type_idx ON projects(project_type);
CREATE INDEX IF NOT EXISTS projects_last_activity_idx ON projects(last_activity_at DESC);

CREATE INDEX IF NOT EXISTS studies_project_id_idx ON studies(project_id);
CREATE INDEX IF NOT EXISTS studies_user_id_idx ON studies(user_id);
CREATE INDEX IF NOT EXISTS studies_status_idx ON studies(status);
CREATE INDEX IF NOT EXISTS studies_study_type_idx ON studies(study_type);
CREATE INDEX IF NOT EXISTS studies_publication_year_idx ON studies(publication_year);
CREATE INDEX IF NOT EXISTS studies_doi_idx ON studies(doi) WHERE doi IS NOT NULL;
CREATE INDEX IF NOT EXISTS studies_pmid_idx ON studies(pmid) WHERE pmid IS NOT NULL;
CREATE INDEX IF NOT EXISTS studies_similarity_hash_idx ON studies(similarity_hash) WHERE similarity_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS studies_created_at_idx ON studies(created_at DESC);

-- Create GIN indexes for array columns
CREATE INDEX IF NOT EXISTS studies_keywords_gin_idx ON studies USING GIN(keywords);
CREATE INDEX IF NOT EXISTS studies_ai_tags_gin_idx ON studies USING GIN(ai_tags);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS studies_fts_idx ON studies USING GIN(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(abstract, '') || ' ' || COALESCE(full_text, '')));

-- 5. CREATE UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for studies
DROP TRIGGER IF EXISTS update_studies_updated_at ON studies;
CREATE TRIGGER update_studies_updated_at 
    BEFORE UPDATE ON studies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update last_activity_at when projects are modified
CREATE OR REPLACE FUNCTION update_project_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects SET last_activity_at = NOW() WHERE id = NEW.project_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_project_activity_on_study_change ON studies;
CREATE TRIGGER update_project_activity_on_study_change
    AFTER INSERT OR UPDATE OR DELETE ON studies
    FOR EACH ROW EXECUTE FUNCTION update_project_activity();

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE studies ENABLE ROW LEVEL SECURITY;

-- 7. CREATE RLS POLICIES FOR PROJECTS
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- 8. CREATE RLS POLICIES FOR STUDIES
DROP POLICY IF EXISTS "Users can view studies in their projects" ON studies;
CREATE POLICY "Users can view studies in their projects" ON studies
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert studies in their projects" ON studies;
CREATE POLICY "Users can insert studies in their projects" ON studies
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        ) AND auth.uid() = user_id
    );

DROP POLICY IF EXISTS "Users can update studies in their projects" ON studies;
CREATE POLICY "Users can update studies in their projects" ON studies
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete studies in their projects" ON studies;
CREATE POLICY "Users can delete studies in their projects" ON studies
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- 9. GRANT PERMISSIONS
GRANT ALL ON projects TO authenticated;
GRANT ALL ON studies TO authenticated;

-- 10. ADD SAMPLE DATA FOR TESTING (optional - will only insert if no data exists)
DO $$
DECLARE
    sample_user_id UUID;
    sample_project_id UUID;
BEGIN
    -- Get the first authenticated user for testing (if any)
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    IF sample_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM projects LIMIT 1) THEN
        -- Insert sample project
        INSERT INTO projects (
            id, user_id, title, description, project_type, status, 
            research_domain, progress_percentage, current_stage
        ) VALUES (
            gen_random_uuid(),
            sample_user_id,
            'COVID-19 Treatment Efficacy',
            'Systematic review of COVID-19 therapeutic interventions and their effectiveness',
            'systematic_review',
            'active',
            'Medicine',
            65,
            'Data Extraction'
        ) RETURNING id INTO sample_project_id;
        
        -- Insert sample studies
        INSERT INTO studies (
            project_id, user_id, title, authors, publication_year, 
            journal, study_type, status, abstract
        ) VALUES 
        (
            sample_project_id,
            sample_user_id,
            'Effectiveness of Remdesivir in COVID-19 Treatment',
            'Smith J, Johnson K, Williams R',
            2023,
            'New England Journal of Medicine',
            'article',
            'included',
            'This study evaluates the effectiveness of Remdesivir in treating COVID-19 patients...'
        ),
        (
            sample_project_id,
            sample_user_id,
            'Systematic Review of COVID-19 Vaccine Efficacy',
            'Brown A, Davis L, Miller S',
            2023,
            'The Lancet',
            'article',
            'screening',
            'A comprehensive systematic review examining the efficacy of various COVID-19 vaccines...'
        );
        
        RAISE NOTICE 'Sample data inserted successfully';
    ELSE
        RAISE NOTICE 'No authenticated users found or data already exists - skipping sample data';
    END IF;
END $$;

-- 11. CREATE HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION get_project_stats(project_uuid UUID)
RETURNS TABLE(
    total_studies INTEGER,
    pending_studies INTEGER,
    included_studies INTEGER,
    excluded_studies INTEGER,
    last_updated TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_studies,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_studies,
        COUNT(*) FILTER (WHERE status = 'included')::INTEGER as included_studies,
        COUNT(*) FILTER (WHERE status = 'excluded')::INTEGER as excluded_studies,
        MAX(updated_at) as last_updated
    FROM studies 
    WHERE project_id = project_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_project_stats(UUID) TO authenticated;

-- 12. ADD COMMENTS FOR DOCUMENTATION
COMMENT ON TABLE projects IS 'Research projects containing systematic reviews, meta-analyses, etc.';
COMMENT ON TABLE studies IS 'Individual studies/articles within research projects';
COMMENT ON COLUMN projects.project_type IS 'Type of research project (systematic_review, meta_analysis, etc.)';
COMMENT ON COLUMN projects.progress_percentage IS 'Overall project completion percentage (0-100)';
COMMENT ON COLUMN studies.similarity_hash IS 'Hash for deduplication purposes';
COMMENT ON COLUMN studies.ai_confidence_score IS 'AI confidence in study classification (0.0-1.0)';

-- Final success message
SELECT 
    'Enhanced database migration completed successfully!' as status,
    'Projects table enhanced with new columns and proper enums' as projects_status,
    'Studies table created with comprehensive schema' as studies_status,
    'RLS policies applied for data security' as security_status,
    'Performance indexes created' as performance_status,
    'Helper functions and triggers added' as utilities_status;