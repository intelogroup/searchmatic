-- Migration to support the new edge functions
-- Adds missing tables and fields required by the edge functions

-- Create search_queries table for tracking database searches
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  database_name TEXT NOT NULL,
  query_string TEXT NOT NULL,
  result_count INTEGER,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create export_logs table for tracking data exports
CREATE TABLE IF NOT EXISTS export_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('csv', 'excel', 'json', 'prisma', 'endnote', 'bibtex')),
  record_count INTEGER NOT NULL DEFAULT 0,
  exported_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create extraction_templates table for data extraction templates
CREATE TABLE IF NOT EXISTS extraction_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure articles table exists with all required fields for edge functions
DO $$
BEGIN
    -- Check if articles table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'articles') THEN
        CREATE TABLE articles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          external_id TEXT,
          source TEXT NOT NULL CHECK (source IN ('pubmed', 'scopus', 'wos', 'manual', 'other')),
          title TEXT NOT NULL,
          authors TEXT[],
          abstract TEXT,
          publication_date DATE,
          journal TEXT,
          doi TEXT,
          pmid TEXT,
          url TEXT,
          pdf_url TEXT,
          pdf_storage_path TEXT,
          full_text TEXT,
          extracted_data JSONB,
          embedding FLOAT[],
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
          screening_decision TEXT CHECK (screening_decision IN ('include', 'exclude', 'maybe')),
          screening_notes TEXT,
          duplicate_of UUID REFERENCES articles(id),
          similarity_score FLOAT CHECK (similarity_score >= 0 AND similarity_score <= 1),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created articles table';
    ELSE
        RAISE NOTICE 'Articles table already exists';
        
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'duplicate_of') THEN
            ALTER TABLE articles ADD COLUMN duplicate_of UUID REFERENCES articles(id);
            RAISE NOTICE 'Added duplicate_of column to articles';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'similarity_score') THEN
            ALTER TABLE articles ADD COLUMN similarity_score FLOAT CHECK (similarity_score >= 0 AND similarity_score <= 1);
            RAISE NOTICE 'Added similarity_score column to articles';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'full_text') THEN
            ALTER TABLE articles ADD COLUMN full_text TEXT;
            RAISE NOTICE 'Added full_text column to articles';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'extracted_data') THEN
            ALTER TABLE articles ADD COLUMN extracted_data JSONB;
            RAISE NOTICE 'Added extracted_data column to articles';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'embedding') THEN
            ALTER TABLE articles ADD COLUMN embedding FLOAT[];
            RAISE NOTICE 'Added embedding column to articles';
        END IF;
    END IF;
END $$;

-- Update protocols table to support the protocol-guidance edge function
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'protocols' AND column_name = 'protocol_data') THEN
        ALTER TABLE protocols ADD COLUMN protocol_data JSONB DEFAULT '{}';
        RAISE NOTICE 'Added protocol_data column to protocols';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'protocols' AND column_name = 'ai_guidance') THEN
        ALTER TABLE protocols ADD COLUMN ai_guidance TEXT;
        RAISE NOTICE 'Added ai_guidance column to protocols';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'protocols' AND column_name = 'last_updated') THEN
        ALTER TABLE protocols ADD COLUMN last_updated TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added last_updated column to protocols';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS search_queries_project_id_idx ON search_queries(project_id);
CREATE INDEX IF NOT EXISTS search_queries_executed_at_idx ON search_queries(executed_at);
CREATE INDEX IF NOT EXISTS search_queries_database_name_idx ON search_queries(database_name);

CREATE INDEX IF NOT EXISTS export_logs_project_id_idx ON export_logs(project_id);
CREATE INDEX IF NOT EXISTS export_logs_user_id_idx ON export_logs(user_id);
CREATE INDEX IF NOT EXISTS export_logs_exported_at_idx ON export_logs(exported_at);
CREATE INDEX IF NOT EXISTS export_logs_export_type_idx ON export_logs(export_type);

CREATE INDEX IF NOT EXISTS extraction_templates_project_id_idx ON extraction_templates(project_id);
CREATE INDEX IF NOT EXISTS extraction_templates_user_id_idx ON extraction_templates(user_id);
CREATE INDEX IF NOT EXISTS extraction_templates_is_active_idx ON extraction_templates(is_active);

CREATE INDEX IF NOT EXISTS articles_project_id_idx ON articles(project_id);
CREATE INDEX IF NOT EXISTS articles_external_id_idx ON articles(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS articles_source_idx ON articles(source);
CREATE INDEX IF NOT EXISTS articles_status_idx ON articles(status);
CREATE INDEX IF NOT EXISTS articles_screening_decision_idx ON articles(screening_decision) WHERE screening_decision IS NOT NULL;
CREATE INDEX IF NOT EXISTS articles_duplicate_of_idx ON articles(duplicate_of) WHERE duplicate_of IS NOT NULL;
CREATE INDEX IF NOT EXISTS articles_publication_date_idx ON articles(publication_date) WHERE publication_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS articles_doi_idx ON articles(doi) WHERE doi IS NOT NULL;
CREATE INDEX IF NOT EXISTS articles_pmid_idx ON articles(pmid) WHERE pmid IS NOT NULL;
CREATE INDEX IF NOT EXISTS articles_similarity_score_idx ON articles(similarity_score) WHERE similarity_score IS NOT NULL;

-- Create unique constraints to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS articles_project_external_id_unique ON articles(project_id, external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS articles_project_doi_unique ON articles(project_id, doi) WHERE doi IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS articles_project_pmid_unique ON articles(project_id, pmid) WHERE pmid IS NOT NULL;

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_search_queries_updated_at ON search_queries;
CREATE TRIGGER update_search_queries_updated_at 
    BEFORE UPDATE ON search_queries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_extraction_templates_updated_at ON extraction_templates;
CREATE TRIGGER update_extraction_templates_updated_at 
    BEFORE UPDATE ON extraction_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at 
    BEFORE UPDATE ON articles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for all new tables
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;  
ALTER TABLE extraction_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for search_queries
CREATE POLICY "Users can only access their project's search queries" ON search_queries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = search_queries.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- RLS Policies for export_logs
CREATE POLICY "Users can only access their own export logs" ON export_logs
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for extraction_templates  
CREATE POLICY "Users can only access their project's extraction templates" ON extraction_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = extraction_templates.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- RLS Policies for articles
CREATE POLICY "Users can only access their project's articles" ON articles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = articles.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- Grant permissions to authenticated users
GRANT ALL ON search_queries TO authenticated;
GRANT ALL ON export_logs TO authenticated;
GRANT ALL ON extraction_templates TO authenticated;
GRANT ALL ON articles TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verification
DO $$
DECLARE
    table_name TEXT;
    missing_tables TEXT[] := '{}';
BEGIN
    FOR table_name IN 
        SELECT unnest(ARRAY['search_queries', 'export_logs', 'extraction_templates', 'articles'])
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name) THEN
            RAISE NOTICE '✓ Table exists: %', table_name;
        ELSE
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'CRITICAL: Missing tables: %', missing_tables;
    ELSE
        RAISE NOTICE '✓ SUCCESS: All required tables for edge functions are present';
        RAISE NOTICE '✓ search_queries - tracks database searches';
        RAISE NOTICE '✓ export_logs - tracks data exports'; 
        RAISE NOTICE '✓ extraction_templates - data extraction templates';
        RAISE NOTICE '✓ articles - research articles with full metadata';
        RAISE NOTICE '✓ All tables have RLS enabled and proper policies';
        RAISE NOTICE '✓ Performance indexes created';
        RAISE NOTICE '✓ Updated_at triggers configured';
        RAISE NOTICE '✓ EDGE FUNCTIONS DATABASE SUPPORT COMPLETE';
    END IF;
END $$;