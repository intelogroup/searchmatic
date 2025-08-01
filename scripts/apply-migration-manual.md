# Manual Migration Application Guide

Since direct CLI access is not available, please follow these steps to apply the database migration:

## Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci
2. Navigate to the SQL Editor
3. Open the file `/supabase/migrations/20250801_initial_schema.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click "Run" to execute the migration

## Option 2: Using pgAdmin or Another PostgreSQL Client

1. Connect to your database using these credentials:
   - Host: `aws-0-eu-central-1.pooler.supabase.com`
   - Port: `6543`
   - Database: `postgres`
   - User: `postgres.qzvfufadiqmizrozejci`
   - Password: Your Supabase database password

2. Execute the migration script from `/supabase/migrations/20250801_initial_schema.sql`

## Post-Migration Steps

After applying the migration, you'll need to:

### 1. Create Storage Buckets
In the Supabase Dashboard, go to Storage and create two buckets:
- `pdfs` - for PDF file uploads
- `exports` - for export files

### 2. Apply Storage Policies
Run these SQL commands in the SQL Editor:

```sql
-- PDFs bucket policies
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', false);

CREATE POLICY "Users can upload PDFs to their projects" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view PDFs in their projects" ON storage.objects
    FOR SELECT USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete PDFs from their projects" ON storage.objects
    FOR DELETE USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Exports bucket policies
INSERT INTO storage.buckets (id, name, public) VALUES ('exports', 'exports', false);

CREATE POLICY "Users can download their exports" ON storage.objects
    FOR SELECT USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Verify Migration
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

### 4. Test RLS Policies
Verify that Row Level Security is enabled:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`.