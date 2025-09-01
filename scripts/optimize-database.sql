-- Database Performance Optimization Script
-- Run this in Supabase SQL Editor to create optimized indexes and functions

-- =====================================================
-- Performance Indexes
-- =====================================================

-- Articles table indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_project_id_status 
ON articles (project_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_project_id_created_at 
ON articles (project_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_screening_decision 
ON articles (project_id, screening_decision) 
WHERE screening_decision IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_pmid 
ON articles (pmid) 
WHERE pmid IS NOT NULL;

-- Projects table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_id_status 
ON projects (user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_id_updated_at 
ON projects (user_id, updated_at DESC);

-- Search queries table index for history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_queries_project_id_created_at 
ON search_queries (project_id, created_at DESC);

-- Messages table for chat performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_id_created_at 
ON messages (conversation_id, created_at DESC) 
WHERE conversation_id IS NOT NULL;

-- Conversations table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_user_id_updated_at 
ON conversations (user_id, updated_at DESC) 
WHERE user_id IS NOT NULL;

-- =====================================================
-- Optimized RPC Functions
-- =====================================================

-- Function to get article statistics efficiently
CREATE OR REPLACE FUNCTION get_article_stats(project_id UUID)
RETURNS JSON
LANGUAGE SQL
STABLE
AS $$
  SELECT json_build_object(
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'included', COUNT(*) FILTER (WHERE status = 'included'),
    'excluded', COUNT(*) FILTER (WHERE status = 'excluded'),
    'maybe', COUNT(*) FILTER (WHERE status = 'maybe')
  )
  FROM articles 
  WHERE articles.project_id = $1;
$$;

-- Function for efficient project dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(user_id UUID)
RETURNS JSON
LANGUAGE SQL
STABLE
AS $$
  WITH project_stats AS (
    SELECT 
      COUNT(*) as total_projects,
      COUNT(*) FILTER (WHERE status = 'active') as active_projects,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_projects
    FROM projects 
    WHERE projects.user_id = $1
  ),
  article_stats AS (
    SELECT 
      COUNT(a.*) as total_articles,
      COUNT(a.*) FILTER (WHERE a.status = 'included') as included_articles
    FROM articles a
    JOIN projects p ON p.id = a.project_id
    WHERE p.user_id = $1
  )
  SELECT json_build_object(
    'totalProjects', ps.total_projects,
    'activeProjects', ps.active_projects,
    'completedProjects', ps.completed_projects,
    'totalArticles', COALESCE(ars.total_articles, 0),
    'includedArticles', COALESCE(ars.included_articles, 0)
  )
  FROM project_stats ps
  CROSS JOIN article_stats ars;
$$;

-- Function for batch updating articles
CREATE OR REPLACE FUNCTION batch_update_articles(updates JSONB[])
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  update_record JSONB;
BEGIN
  FOREACH update_record IN ARRAY updates
  LOOP
    UPDATE articles
    SET 
      screening_decision = (update_record->>'screening_decision')::text,
      screening_notes = update_record->>'screening_notes',
      status = (update_record->>'status')::text,
      updated_at = NOW()
    WHERE id = (update_record->>'id')::uuid;
  END LOOP;
END;
$$;

-- Function to search articles with full-text search (if needed)
CREATE OR REPLACE FUNCTION search_articles_fulltext(
  project_id UUID,
  search_term TEXT,
  limit_count INT DEFAULT 20,
  offset_count INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  authors TEXT[],
  abstract TEXT,
  pmid TEXT,
  publication_year INT,
  journal TEXT,
  relevance_score REAL
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    a.id,
    a.title,
    a.authors,
    a.abstract,
    a.pmid,
    a.publication_year,
    a.journal,
    ts_rank(
      to_tsvector('english', COALESCE(a.title, '') || ' ' || COALESCE(a.abstract, '')),
      plainto_tsquery('english', search_term)
    ) as relevance_score
  FROM articles a
  WHERE a.project_id = $1
    AND (
      search_term = '' OR
      to_tsvector('english', COALESCE(a.title, '') || ' ' || COALESCE(a.abstract, '')) 
      @@ plainto_tsquery('english', search_term)
    )
  ORDER BY relevance_score DESC, a.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
$$;

-- =====================================================
-- Performance Views
-- =====================================================

-- Materialized view for project statistics (refresh as needed)
CREATE MATERIALIZED VIEW IF NOT EXISTS project_stats_mv AS
SELECT 
  p.id as project_id,
  p.user_id,
  COUNT(a.id) as total_articles,
  COUNT(a.id) FILTER (WHERE a.status = 'pending') as pending_articles,
  COUNT(a.id) FILTER (WHERE a.status = 'included') as included_articles,
  COUNT(a.id) FILTER (WHERE a.status = 'excluded') as excluded_articles,
  COUNT(a.id) FILTER (WHERE a.status = 'maybe') as maybe_articles,
  MAX(a.updated_at) as articles_last_updated,
  p.updated_at as project_updated_at
FROM projects p
LEFT JOIN articles a ON p.id = a.project_id
GROUP BY p.id, p.user_id, p.updated_at;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_stats_mv_project_id 
ON project_stats_mv (project_id);

-- Function to refresh project stats
CREATE OR REPLACE FUNCTION refresh_project_stats()
RETURNS void
LANGUAGE SQL
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY project_stats_mv;
$$;

-- =====================================================
-- Triggers for Cache Invalidation
-- =====================================================

-- Function to update project updated_at when articles change
CREATE OR REPLACE FUNCTION update_project_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE projects 
  SET updated_at = NOW() 
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  -- Also refresh the materialized view row for this project
  -- Note: This is expensive, consider doing this in a background job
  -- REFRESH MATERIALIZED VIEW CONCURRENTLY project_stats_mv;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for articles table
DROP TRIGGER IF EXISTS trigger_update_project_timestamp ON articles;
CREATE TRIGGER trigger_update_project_timestamp
  AFTER INSERT OR UPDATE OR DELETE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_project_timestamp();

-- =====================================================
-- Background Job Setup (Optional)
-- =====================================================

-- Function for periodic maintenance
CREATE OR REPLACE FUNCTION perform_maintenance()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Refresh materialized view
  REFRESH MATERIALIZED VIEW CONCURRENTLY project_stats_mv;
  
  -- Update table statistics
  ANALYZE articles;
  ANALYZE projects;
  ANALYZE search_queries;
  
  -- Log maintenance
  RAISE NOTICE 'Database maintenance completed at %', NOW();
END;
$$;

-- =====================================================
-- RLS Policies (ensure they're optimized)
-- =====================================================

-- Drop and recreate RLS policies with better performance
DROP POLICY IF EXISTS articles_user_policy ON articles;
CREATE POLICY articles_user_policy ON articles
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Create optimized index for RLS policy
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_id_id 
ON projects (user_id, id);

-- =====================================================
-- Configuration Optimizations
-- =====================================================

-- Increase statistics target for better query planning
ALTER TABLE articles ALTER COLUMN status SET STATISTICS 1000;
ALTER TABLE articles ALTER COLUMN project_id SET STATISTICS 1000;
ALTER TABLE projects ALTER COLUMN user_id SET STATISTICS 1000;

-- Comments for documentation
COMMENT ON INDEX idx_articles_project_id_status IS 'Optimizes article filtering by project and status';
COMMENT ON INDEX idx_articles_project_id_created_at IS 'Optimizes article ordering by creation date';
COMMENT ON FUNCTION get_article_stats(UUID) IS 'Efficiently calculates article statistics for a project';
COMMENT ON FUNCTION get_dashboard_stats(UUID) IS 'Provides optimized dashboard statistics for a user';
COMMENT ON MATERIALIZED VIEW project_stats_mv IS 'Cached project statistics for better performance';

-- =====================================================
-- Performance Monitoring Queries
-- =====================================================

-- Query to check index usage
-- SELECT schemaname, tablename, attname, n_distinct, correlation 
-- FROM pg_stats 
-- WHERE schemaname = 'public' AND tablename IN ('articles', 'projects');

-- Query to check slow queries
-- SELECT query, mean_time, calls, total_time 
-- FROM pg_stat_statements 
-- WHERE query LIKE '%articles%' OR query LIKE '%projects%'
-- ORDER BY mean_time DESC;

COMMIT;