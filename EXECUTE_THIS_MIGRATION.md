# 🚀 EXECUTE THIS DATABASE MIGRATION - CRITICAL FOR PROJECT WORKFLOW

## ⚠️ IMPORTANT: Execute this migration BEFORE continuing development

This migration transforms the Searchmatic database from basic authentication to a full project-centric system with studies management.

---

## 📋 **Step 1: Open Supabase SQL Editor**

1. Go to: **https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql**
2. Click "New Query"
3. Copy and paste the entire SQL script below
4. Click "Run" to execute

---

## 📝 **Step 2: Copy This Entire SQL Script**

```sql
-- Enhanced Searchmatic Database Migration - Project-Centric Workflow
-- This migration fixes critical issues and adds studies management

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
    
    -- Remove the old 'type' column if it exists and is TEXT
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
CREATE INDEX IF NOT EXISTS studies_created_at_idx ON studies(created_at DESC);

-- Create GIN indexes for array columns
CREATE INDEX IF NOT EXISTS studies_keywords_gin_idx ON studies USING GIN(keywords);
CREATE INDEX IF NOT EXISTS studies_ai_tags_gin_idx ON studies USING GIN(ai_tags);

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

-- Update last_activity_at when studies are modified
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
ALTER TABLE studies ENABLE ROW LEVEL SECURITY;

-- 7. CREATE RLS POLICIES FOR STUDIES
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

-- 8. GRANT PERMISSIONS
GRANT ALL ON studies TO authenticated;

-- 9. CREATE HELPER FUNCTIONS
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

-- 10. ADD COMMENTS FOR DOCUMENTATION
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

## ✅ **Step 3: Verify Migration Success**

After running the script, you should see output like:
```
status: Enhanced database migration completed successfully!
projects_status: Projects table enhanced with new columns and proper enums
studies_status: Studies table created with comprehensive schema
security_status: RLS policies applied for data security
performance_status: Performance indexes created
utilities_status: Helper functions and triggers added
```

---

## 🔍 **Step 4: Test the Migration**

Run this verification query in the SQL editor:

```sql
-- Verify migration success
SELECT 
    'projects' as table_name,
    COUNT(*) as columns_count,
    STRING_AGG(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'projects' AND table_schema = 'public'
GROUP BY table_name

UNION ALL

SELECT 
    'studies' as table_name,
    COUNT(*) as columns_count,
    'Table created successfully' as columns
FROM information_schema.tables 
WHERE table_name = 'studies' AND table_schema = 'public';
```

Expected result:
- `projects` table should show many columns including `project_type`, `status`, `progress_percentage`
- `studies` table should show "Table created successfully"

---

## 🎯 **What This Migration Does**

### ✅ **Enhanced Projects Table**
- Adds `project_type` enum (systematic_review, meta_analysis, etc.)
- Adds `status` enum (draft, active, review, completed, archived)
- Adds progress tracking (`progress_percentage`, `current_stage`)
- Adds activity tracking (`last_activity_at`)

### ✅ **New Studies Table**
- Complete schema for managing research articles
- Links to projects via foreign key
- Supports PDF processing, AI analysis, deduplication
- Full search capabilities with indexes

### ✅ **Security & Performance**
- Row Level Security policies for data isolation
- Performance indexes for fast queries
- Automatic timestamp triggers
- Helper functions for statistics

---

## 🚨 **IMPORTANT: Execute This Now**

**This migration must be completed before continuing development!**

The project-centric workflow depends on these database changes. Without this migration:
- ❌ Project creation will fail
- ❌ Studies management won't work  
- ❌ Dashboard will show errors
- ❌ CRUD operations will break

**After migration, you can:**
- ✅ Create real projects with enhanced metadata
- ✅ Manage studies within projects
- ✅ Track progress and activity
- ✅ Implement the complete workflow

---

## 📞 **If You Need Help**

If the migration fails or you see errors:
1. Copy the exact error message
2. Check the Supabase logs in the dashboard
3. Make sure you're running the script as the database owner
4. The migration is **idempotent** - safe to run multiple times

**Next Step After Migration**: I'll connect the React frontend to use this enhanced database schema.