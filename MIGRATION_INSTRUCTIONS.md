# 🚀 Supabase Database Migration Instructions

## Current Status ✅

**Connection Verified**: ✅ Successfully connected to Supabase database  
**Projects Table**: ✅ Exists with `type` column added  
**Missing Tables**: ❌ conversations, messages, protocols need to be created  

## Required Migration

The following tables need to be created to complete the Searchmatic MVP database setup:

1. **conversations** - AI chat conversations
2. **messages** - Chat messages within conversations  
3. **protocols** - Research protocols with PICO/SPIDER frameworks

## 📋 Step-by-Step Migration Instructions

### Step 1: Access Supabase SQL Editor

1. Open your browser and go to:
   ```
   https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql
   ```

2. You should see the SQL Editor interface

### Step 2: Execute the Migration SQL

1. **Copy** the entire contents of the file: `/root/repo/complete-database-setup.sql`

2. **Paste** the SQL into the Supabase SQL Editor

3. **Click "Run"** to execute the migration

### Step 3: Verify Migration Success

After running the SQL, you should see output like:
```
Database setup completed successfully!
Tables created: conversations, messages, protocols
Indexes created for optimal performance
RLS policies configured for security
Triggers set up for automatic timestamp updates
```

### Step 4: Test the Migration

Run this command to verify everything worked:
```bash
node /root/repo/verify-migration-details.cjs
```

You should see all tables showing as ✅ accessible.

## 🔧 What the Migration Creates

### Tables Created
- **conversations**: AI chat conversations with project linking
- **messages**: Individual chat messages with role tracking
- **protocols**: Research protocols supporting PICO/SPIDER frameworks

### Security Features
- **Row Level Security (RLS)**: Users can only access their own data
- **Proper Permissions**: Authenticated users get appropriate access
- **Foreign Key Constraints**: Data integrity maintained

### Performance Optimizations
- **Indexes**: Created on all frequently queried columns
- **Triggers**: Automatic timestamp updates
- **JSONB Fields**: Efficient storage for AI metadata

### AI Integration Ready
- **Chat Infrastructure**: Complete conversation and message system
- **Protocol AI Support**: AI guidance tracking and metadata
- **OpenAI Integration**: Ready for streaming responses

## 🎯 Expected Results After Migration

Once completed, your database will have:

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `projects` | Main project management | ✅ Already exists with type column |
| `conversations` | AI chat sessions | Project linking, user isolation |
| `messages` | Chat messages | Role-based, metadata support |
| `protocols` | Research protocols | PICO/SPIDER, version control |

## 🚨 Troubleshooting

### If Migration Fails
1. Check that you're logged into the correct Supabase project
2. Ensure you have admin access to the project
3. Try running the SQL in smaller sections

### If Tables Still Don't Appear
1. Refresh the Supabase dashboard
2. Check the "Table Editor" tab to see if tables were created
3. Run the verification script again

### Connection Issues
The anon key `sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS` is working correctly.

## 🎉 Success Confirmation

When migration is complete, you'll be able to:
- ✅ Create and manage research projects
- ✅ Use AI chat functionality
- ✅ Build research protocols with PICO/SPIDER frameworks  
- ✅ Export and manage research data
- ✅ Begin Sprint 1 development immediately

## 📞 Support

If you encounter any issues:
1. Check the Supabase dashboard logs
2. Verify your project permissions
3. Ensure the SQL syntax is exactly as provided

**Database URL**: https://qzvfufadiqmizrozejci.supabase.co  
**Project ID**: qzvfufadiqmizrozejci  
**Migration File**: `/root/repo/complete-database-setup.sql`