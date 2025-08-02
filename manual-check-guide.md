# Manual Database Schema Check Guide

## 🚨 API Key Issue Detected

The service role key appears to be invalid or expired. Here's how to manually check and fix the database schema:

## ✅ Manual Check Steps

### 1. Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci
2. Login with your Supabase account
3. Navigate to **SQL Editor**

### 2. Check Current Tables
Run this query in the SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 3. Check Projects Table Structure
Run this query to check if projects table has the 'type' column:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'projects' AND table_schema = 'public'
ORDER BY ordinal_position;
```

### 4. Run Migration if Needed
If tables are missing or projects table lacks 'type' column, copy and paste the entire content of `complete-database-setup.sql` into the SQL Editor and execute it.

## 🔧 Get Fresh API Keys

### Service Role Key
1. In Supabase Dashboard, go to **Settings** > **API**
2. Copy the **service_role** key (anon key should not change)
3. Update any scripts or configurations with the new key

### Current Working Keys (from .env.local)
- **URL**: https://qzvfufadiqmizrozejci.supabase.co
- **Anon Key**: sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS (this should work for basic operations)

## 🎯 Expected Schema After Migration

The migration should create these tables:
- ✅ **projects** (with 'type' column added)
- ✅ **conversations** (chat conversations)
- ✅ **messages** (individual chat messages)
- ✅ **protocols** (research protocols with PICO/SPIDER frameworks)

## 🔍 Verification Queries

After running the migration, verify with these queries:

```sql
-- Check all tables exist
SELECT 'projects' as table_name, count(*) as row_count FROM projects
UNION ALL
SELECT 'conversations' as table_name, count(*) as row_count FROM conversations  
UNION ALL
SELECT 'messages' as table_name, count(*) as row_count FROM messages
UNION ALL
SELECT 'protocols' as table_name, count(*) as row_count FROM protocols;

-- Verify projects table has type column
INSERT INTO projects (title, description, type) 
VALUES ('Test Project', 'Schema test', 'systematic_review')
RETURNING *;
```

## 🚀 Next Steps After Schema Fix

1. **Update Service Role Key**: Get fresh key from Supabase dashboard
2. **Test Application**: Run `npm run dev` and test login/dashboard
3. **Verify Data Operations**: Create a test project to ensure full functionality

## 📞 If You Need Help

If you encounter any issues:
1. Share the results of the table check query
2. Share any error messages from the SQL Editor
3. Confirm which tables are missing vs. which exist

The schema setup is critical for the MVP functionality, so let's ensure it's 100% correct before proceeding with development.