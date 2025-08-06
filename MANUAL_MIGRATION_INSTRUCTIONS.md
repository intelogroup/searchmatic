# 🚀 MANUAL DATABASE MIGRATION INSTRUCTIONS

## 📋 Overview
The Searchmatic database needs enum types and table enhancements to be fully functional. Since programmatic execution is limited, please execute these SQL commands manually through the Supabase Dashboard.

## 🔗 Access Links
- **SQL Editor**: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql
- **Table Editor**: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/editor
- **Dashboard**: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci

## 📝 STEP-BY-STEP INSTRUCTIONS

### Step 1: Create Enum Types (REQUIRED)
Copy and paste this SQL into the Supabase SQL Editor and click "Run":

```sql
-- Step 1: Create Enum Types
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

-- Verify enum creation
SELECT typname as enum_name FROM pg_type WHERE typname IN ('project_type', 'project_status', 'study_type', 'study_status') ORDER BY typname;
```

**Expected Result**: Should show 4 enum types created.

---

### Step 2: Enhance Projects Table (REQUIRED)
Copy and paste this SQL and click "Run":

```sql
-- Step 2: Enhance Projects Table
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
    
    -- Remove the old 'type' column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'projects' AND column_name = 'type' AND data_type = 'text') THEN
        -- Drop the old column
        ALTER TABLE projects DROP COLUMN type;
    END IF;
END $$;

-- Verify projects table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;
```

**Expected Result**: Should show the enhanced projects table with new columns.

---

### Step 3: Create Studies Table (REQUIRED)
Copy and paste this SQL and click "Run":

```sql
-- Step 3: Create Studies Table
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

-- Verify studies table creation
SELECT table_name FROM information_schema.tables WHERE table_name = 'studies' AND table_schema = 'public';
```

**Expected Result**: Should show the studies table was created.

---

### Step 4: Create Indexes (RECOMMENDED)
Copy and paste this SQL and click "Run":

```sql
-- Step 4: Create Performance Indexes
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
```

---

### Step 5: Enable RLS for Studies Table (REQUIRED)
Copy and paste this SQL and click "Run":

```sql
-- Step 5: Enable Row Level Security for Studies
ALTER TABLE studies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for studies
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

-- Grant permissions
GRANT ALL ON studies TO authenticated;
```

---

## ✅ FINAL VERIFICATION

After completing all steps, run this verification query:

```sql
-- Final Verification Query
SELECT 
    'Enum Types' as category,
    array_agg(typname ORDER BY typname) as items
FROM pg_type 
WHERE typname IN ('project_type', 'project_status', 'study_type', 'study_status')

UNION ALL

SELECT 
    'Tables' as category,
    array_agg(table_name ORDER BY table_name) as items
FROM information_schema.tables 
WHERE table_name IN ('projects', 'studies') 
AND table_schema = 'public'

UNION ALL

SELECT 
    'Projects Columns' as category,
    array_agg(column_name ORDER BY ordinal_position) as items
FROM information_schema.columns 
WHERE table_name = 'projects'
AND column_name IN ('project_type', 'status', 'research_domain', 'team_size', 'progress_percentage', 'current_stage', 'last_activity_at');
```

**Expected Results:**
- Enum Types: Should show 4 enum types
- Tables: Should show 'projects' and 'studies'
- Projects Columns: Should show all 7 new columns

---

## 🎯 SUCCESS CRITERIA

The migration is successful when:

1. ✅ **Enum Types Created**: 4 enum types exist
2. ✅ **Projects Table Enhanced**: 7 new columns added
3. ✅ **Studies Table Created**: New table with all columns
4. ✅ **Indexes Created**: Performance indexes in place
5. ✅ **RLS Enabled**: Security policies applied

---

## 🐛 TROUBLESHOOTING

### If Step 1 Fails:
- Ensure you're in the SQL Editor, not the Table Editor
- Check that you have admin permissions
- Try running each enum creation separately

### If Step 2 Fails:
- Ensure Step 1 completed successfully first
- Check if columns already exist in the Table Editor

### If Step 3 Fails:
- Ensure Steps 1 and 2 completed first
- Check that enum types exist before creating the studies table

### If Verification Fails:
- Re-run the failing steps
- Check the Supabase Dashboard for error messages
- Ensure all SQL blocks executed completely

---

## 📞 NEXT STEPS AFTER MIGRATION

Once the migration is complete:

1. **Test the Application**: 
   ```bash
   npm run dev
   ```

2. **Verify Project Creation**:
   - Navigate to `/dashboard`
   - Click "Start New Review"
   - Create a test project

3. **Check Database Connection**:
   ```bash
   node comprehensive-database-check.js
   ```

4. **Run Tests**:
   ```bash
   npm run test
   ```

The migration should resolve the "invalid input value for enum" error and enable full MVP functionality.

---

**🎉 Once you complete these steps, the Searchmatic MVP will be 100% operational!**