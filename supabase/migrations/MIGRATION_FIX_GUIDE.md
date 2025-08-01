# Supabase Migration Fix Guide

## Issue Resolved
The original migration had compatibility issues with Supabase's vector extension implementation.

## Key Changes Made:

### 1. Extension Names
- Changed `pgvector` to `vector` (Supabase's naming)
- Added `SCHEMA extensions` to all extension creation statements
- Added `SET search_path TO public, extensions;` at the beginning

### 2. Vector Column Type
- Changed `vector(1536)` to `extensions.vector(1536)`
- This ensures the vector type is found in the extensions schema

### 3. Vector Index
- Changed from `USING ivfflat` to `USING hnsw` (Supabase's preferred indexing)
- Updated operator class to `extensions.vector_cosine_ops`

## Fixed Migration Files

1. **Original (updated)**: `/supabase/migrations/20250801_initial_schema.sql`
2. **Clean version with comments**: `/supabase/migrations/20250801_initial_schema_fixed.sql`

## To Apply the Migration:

1. Go to Supabase Dashboard SQL Editor
2. Copy the contents of either migration file (they're functionally identical)
3. Paste and run in the SQL Editor

## Verification Query:
After running the migration, verify success with:

```sql
-- Check extensions
SELECT extname, extnamespace::regnamespace 
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'vector', 'pg_trgm');

-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check vector column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'articles' AND column_name = 'embedding';
```

## Post-Migration Steps:

1. Create storage buckets in Supabase Dashboard:
   - `pdfs` bucket
   - `exports` bucket

2. Apply storage policies (see comments at end of migration file)

3. Test the vector search function:
```sql
-- Test the match_articles function exists
SELECT proname 
FROM pg_proc 
WHERE proname = 'match_articles';
```

The migration should now run successfully in Supabase!