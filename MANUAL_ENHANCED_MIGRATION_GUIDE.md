# Enhanced Database Migration - Manual Execution Guide

## 🚨 CRITICAL: Database Migration Required

The Searchmatic database needs to be enhanced to support the project-centric workflow with studies management. This migration adds essential columns to the projects table and creates the studies table with full functionality.

## Current Database State Analysis ✅

- ✅ **Projects table**: Exists but missing enhanced columns
- ❌ **Studies table**: Does NOT exist (needs to be created)
- ❌ **Enum types**: Missing (project_type, project_status, study_type, study_status)
- ❌ **Enhanced RLS policies**: Not configured for new schema

## 📋 What This Migration Will Do

### 1. Create Missing Enum Types
- `project_type`: systematic_review, meta_analysis, scoping_review, etc.
- `project_status`: draft, active, review, completed, archived
- `study_type`: article, thesis, book, conference_paper, etc.
- `study_status`: pending, screening, included, excluded, duplicate, extracted

### 2. Enhance Projects Table
**New columns to be added:**
- `project_type` (enum): Type of research project
- `status` (enum): Current project status  
- `research_domain` (text): Research field/domain
- `team_size` (integer): Number of team members
- `progress_percentage` (integer): Completion percentage (0-100)
- `current_stage` (text): Current workflow stage
- `last_activity_at` (timestamp): Last activity time

### 3. Create Studies Table
Complete table for managing individual studies/articles within projects:
- **Basic Info**: title, authors, publication_year, journal, DOI, PMID, etc.
- **Classification**: study_type, status, abstract, keywords
- **Processing**: PDF handling, extraction data, screening notes
- **AI Features**: AI summary, tags, confidence scores
- **Deduplication**: similarity hashing, duplicate detection

### 4. Performance & Security
- **Indexes**: Optimized for common queries
- **RLS Policies**: Secure access control
- **Triggers**: Automatic timestamp updates
- **Foreign Keys**: Proper relationships

## 🔧 Manual Execution Steps

### Step 1: Access Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql
2. Click "New Query" or use an existing editor

### Step 2: Execute the Migration Script
**Copy and paste the following SQL script** (see next section)

### Step 3: Verify Migration Success
Run the verification script provided at the end

---

## 📝 MIGRATION SQL SCRIPT

**Copy and paste this entire script into the Supabase SQL Editor:**

```sql
-- ========================================
-- ENHANCED SEARCHMATIC DATABASE MIGRATION
-- Project-Centric Workflow Implementation
-- ========================================

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
        RAISE NOTICE 'Created project_type enum';
    ELSE
        RAISE NOTICE 'project_type enum already exists';
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
        RAISE NOTICE 'Created project_status enum';
    ELSE
        RAISE NOTICE 'project_status enum already exists';
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
        RAISE NOTICE 'Created study_type enum';
    ELSE
        RAISE NOTICE 'study_type enum already exists';
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
        RAISE NOTICE 'Created study_status enum';
    ELSE
        RAISE NOTICE 'study_status enum already exists';
    END IF;
END $$;

-- 2. ENHANCE PROJECTS TABLE
DO $$ 
BEGIN
    -- Add project_type column using the enum
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'project_type') THEN
        ALTER TABLE projects ADD COLUMN project_type project_type NOT NULL DEFAULT 'systematic_review';
        RAISE NOTICE 'Added project_type column to projects table';
    ELSE
        RAISE NOTICE 'project_type column already exists in projects table';
    END IF;
    
    -- Add status column using enum
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'status') THEN
        ALTER TABLE projects ADD COLUMN status project_status NOT NULL DEFAULT 'draft';
        RAISE NOTICE 'Added status column to projects table';
    ELSE
        RAISE NOTICE 'status column already exists in projects table';
    END IF;
    
    -- Add research domain
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'research_domain') THEN
        ALTER TABLE projects ADD COLUMN research_domain TEXT;
        RAISE NOTICE 'Added research_domain column to projects table';
    ELSE
        RAISE NOTICE 'research_domain column already exists in projects table';
    END IF;
    
    -- Add team members count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'team_size') THEN
        ALTER TABLE projects ADD COLUMN team_size INTEGER DEFAULT 1;
        RAISE NOTICE 'Added team_size column to projects table';
    ELSE
        RAISE NOTICE 'team_size column already exists in projects table';
    END IF;
    
    -- Add progress tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'progress_percentage') THEN
        ALTER TABLE projects ADD COLUMN progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
        RAISE NOTICE 'Added progress_percentage column to projects table';
    ELSE
        RAISE NOTICE 'progress_percentage column already exists in projects table';
    END IF;
    
    -- Add current stage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'current_stage') THEN
        ALTER TABLE projects ADD COLUMN current_stage TEXT DEFAULT 'Planning';
        RAISE NOTICE 'Added current_stage column to projects table';
    ELSE
        RAISE NOTICE 'current_stage column already exists in projects table';
    END IF;
    
    -- Add last activity timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'last_activity_at') THEN
        ALTER TABLE projects ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added last_activity_at column to projects table';
    ELSE
        RAISE NOTICE 'last_activity_at column already exists in projects table';
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
        RAISE NOTICE 'Migrated data from old type column to project_type and dropped old column';
    ELSE
        RAISE NOTICE 'Old type column does not exist, no migration needed';
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

-- Check if studies table was created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'studies') THEN
        RAISE NOTICE 'Studies table created successfully';
    ELSE
        RAISE NOTICE 'WARNING: Studies table was not created';
    END IF;
END $$;

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
    IF TG_OP = 'DELETE' THEN
        UPDATE projects SET last_activity_at = NOW() WHERE id = OLD.project_id;
        RETURN OLD;
    ELSE
        UPDATE projects SET last_activity_at = NOW() WHERE id = NEW.project_id;
        RETURN NEW;
    END IF;
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

-- 10. CREATE HELPER FUNCTIONS
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

-- 11. ADD COMMENTS FOR DOCUMENTATION
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
```

---

## ✅ Migration Verification Script

**After running the migration, execute this verification script:**

```sql
-- VERIFICATION SCRIPT
-- Run this after the migration to confirm everything worked

-- Check enum types were created
SELECT 
    'Enum Types Check' as check_type,
    COUNT(*) as found_count
FROM pg_type 
WHERE typname IN ('project_type', 'project_status', 'study_type', 'study_status');

-- Check projects table columns
SELECT 
    'Projects Table Columns' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
    AND column_name IN ('project_type', 'status', 'research_domain', 'team_size', 'progress_percentage', 'current_stage', 'last_activity_at')
ORDER BY column_name;

-- Check studies table exists and has correct structure
SELECT 
    'Studies Table Check' as check_type,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'studies';

-- Check indexes were created
SELECT 
    'Indexes Check' as check_type,
    COUNT(*) as index_count
FROM pg_indexes 
WHERE tablename IN ('projects', 'studies');

-- Check RLS policies
SELECT 
    'RLS Policies Check' as check_type,
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename IN ('projects', 'studies')
ORDER BY tablename, policyname;

-- Final verification message
SELECT 
    '✅ MIGRATION VERIFICATION COMPLETE' as status,
    'If you see data above for each check, the migration was successful!' as message;
```

---

## 🚀 Post-Migration Testing

**Test project creation with new schema:**

```sql
-- Test creating a project with new schema (replace USER_ID with actual user ID)
-- Get your user ID first:
SELECT id, email FROM auth.users LIMIT 1;

-- Then create a test project (replace the UUID below):
INSERT INTO projects (
    user_id,
    title, 
    description,
    project_type,
    status,
    research_domain,
    progress_percentage,
    current_stage
) VALUES (
    'YOUR_USER_ID_HERE',  -- Replace with actual user ID
    'Enhanced Migration Test',
    'Testing the enhanced project-centric workflow',
    'systematic_review',
    'draft',
    'Healthcare',
    10,
    'Protocol Development'
) RETURNING *;

-- Test creating a study in the project:
INSERT INTO studies (
    project_id,
    user_id, 
    title,
    authors,
    study_type,
    status,
    abstract
) VALUES (
    'PROJECT_ID_FROM_ABOVE',  -- Replace with project ID from above
    'YOUR_USER_ID_HERE',     -- Replace with actual user ID
    'Test Study for Enhanced Schema',
    'Smith, J. et al.',
    'article',
    'pending',
    'This is a test study to verify the enhanced database schema is working correctly.'
) RETURNING *;
```

---

## 🎉 Success Criteria

After migration, you should have:

1. ✅ **Enhanced Projects Table** with all new columns
2. ✅ **Complete Studies Table** for study management  
3. ✅ **Enum Types** for consistent data validation
4. ✅ **Performance Indexes** for fast queries
5. ✅ **RLS Policies** for secure data access
6. ✅ **Triggers** for automatic timestamp updates
7. ✅ **Helper Functions** for project statistics

## 📞 Support

If you encounter any issues:

1. **Check the verification script results** - all checks should return data
2. **Review any error messages** in the SQL editor  
3. **Ensure you're logged in** to Supabase with proper permissions
4. **Try running sections individually** if the full script fails

The migration is designed to be **safe and idempotent** - you can run it multiple times without causing issues.

---

**🔗 Quick Links:**
- [Supabase SQL Editor](https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql)
- [Database Tables View](https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/editor)
- [Project Documentation](./CLAUDE.md)