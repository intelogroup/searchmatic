# Supabase Migration Guide

## Overview

Due to Supabase's security model, the JavaScript client cannot execute raw SQL directly. We need to use a two-step process:

1. Create a secure database function that can execute SQL
2. Call that function via RPC with the service role key

## Step-by-Step Migration Process

### Step 1: Create the Migration Function

First, you need to create a special function in your database that can execute migrations. This function is secured to only work with service role keys.

1. Go to your [Supabase Dashboard SQL Editor](https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql)

2. Copy and paste this SQL:

```sql
-- Create a secure function to run migrations
-- This function can only be called with a service role key
CREATE OR REPLACE FUNCTION run_migration(migration_sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Only allow execution if called with service role
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized: This function requires service role access';
    END IF;
    
    -- Execute the migration SQL
    EXECUTE migration_sql;
    
    -- Return success
    result := json_build_object(
        'success', true,
        'message', 'Migration executed successfully',
        'timestamp', now()
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Return error details
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'detail', SQLSTATE,
            'timestamp', now()
        );
        RETURN result;
END;
$$;

-- Grant execute permission only to service role
REVOKE ALL ON FUNCTION run_migration(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION run_migration(text) TO service_role;
```

3. Click "Run" to create the function

### Step 2: Apply the Migration

Now you can use the Node.js script to apply the migration:

```bash
cd scripts
node apply-migration.js
```

The script will:
- Load the migration file
- Use the service role key to authenticate
- Call the `run_migration` function via RPC
- Report success or any errors

### Alternative: Direct SQL Approach

If you prefer, you can skip the RPC approach and apply the migration directly:

1. Go to your [Supabase Dashboard SQL Editor](https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql)
2. Open `/supabase/migrations/20250801_initial_schema.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click "Run"

### Post-Migration Steps

After the migration succeeds:

#### 1. Create Storage Buckets

In the Supabase Dashboard, go to Storage and create:
- `pdfs` bucket (private)
- `exports` bucket (private)

#### 2. Apply Storage Policies

Run these in the SQL Editor:

```sql
-- PDFs bucket policies
CREATE POLICY "Users can upload PDFs to their projects" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'pdfs' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view PDFs in their projects" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'pdfs' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete PDFs from their projects" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'pdfs' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Exports bucket policies
CREATE POLICY "Users can download their exports" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'exports' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
```

#### 3. Verify Migration

Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- articles
- conversations
- export_logs
- extraction_templates
- messages
- profiles
- projects
- search_queries

## Security Notes

- The service role key (`sbp_99c994d6970e1d4cb36d4cb8caae9e120e499337`) has full database access
- Never expose this key in client-side code
- The `run_migration` function checks that it's being called with service role privileges
- All tables have Row Level Security (RLS) enabled for production safety

## Troubleshooting

### Error: "extension 'pgvector' is not available"
This has been fixed in the migration. We now use `vector` instead of `pgvector`.

### Error: "function run_migration does not exist"
You need to create the migration function first. Follow Step 1.

### Error: "Unauthorized: This function requires service role access"
Make sure you're using the service role key, not the anon key.

## Files Reference

- **Migration SQL**: `/supabase/migrations/20250801_initial_schema.sql`
- **Migration Function**: `/scripts/create-migration-function.sql`
- **Migration Script**: `/scripts/apply-migration.js`
- **This Guide**: `/scripts/MIGRATION_GUIDE.md`