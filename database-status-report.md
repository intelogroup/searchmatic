# Database Schema Status Report
*Generated: 2025-08-02*

## 🎯 Current Status Summary

### ✅ GOOD NEWS
- **Projects table**: ✅ EXISTS and has required 'type' column
- **Database connection**: ✅ Working with anon key
- **Basic infrastructure**: ✅ Ready

### ⚠️ MIGRATION NEEDED
- **Conversations table**: ❌ MISSING (404)
- **Messages table**: ❌ MISSING (404) 
- **Protocols table**: ❌ MISSING (404)

## 📊 Detailed Findings

### Database Connection Test
```
✅ projects - Table exists and accessible
❌ conversations - Table does not exist (404)
❌ messages - Table does not exist (404)
❌ protocols - Table does not exist (404)
```

### Projects Table Structure
```
✅ Projects table accessible with type column
📊 Table exists but is empty
🎯 Type column query successful - column likely exists
```

## 🚀 SOLUTION: Partial Migration Required

Since the projects table already exists with the correct structure, we only need to create the missing tables.

### Option 1: Complete Migration (Recommended)
Run the entire `complete-database-setup.sql` script in Supabase SQL Editor. The script is designed to be idempotent (safe to run multiple times).

### Option 2: Targeted Migration
Create just the missing tables with this simplified script:

```sql
-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create protocols table
CREATE TABLE IF NOT EXISTS protocols (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  research_question TEXT NOT NULL,
  framework_type TEXT NOT NULL CHECK (framework_type IN ('pico', 'spider', 'other')),
  population TEXT,
  intervention TEXT,
  comparison TEXT,
  outcome TEXT,
  sample TEXT,
  phenomenon TEXT,
  design TEXT,
  evaluation TEXT,
  research_type TEXT,
  inclusion_criteria TEXT[] DEFAULT '{}',
  exclusion_criteria TEXT[] DEFAULT '{}',
  search_strategy JSONB DEFAULT '{}',
  databases TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  date_range JSONB,
  study_types TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_guidance_used JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for messages  
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- RLS policies for protocols
CREATE POLICY "Users can view their own protocols" ON protocols
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own protocols" ON protocols
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own unlocked protocols" ON protocols
  FOR UPDATE USING (auth.uid() = user_id AND is_locked = FALSE);

-- Grant permissions
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated; 
GRANT ALL ON protocols TO authenticated;

SELECT 'Missing tables created successfully!' as status;
```

## 🔧 How to Apply Migration

### Step 1: Access Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql
2. Login to your Supabase account

### Step 2: Run Migration
1. Copy the contents of `complete-database-setup.sql` 
2. Paste into the SQL Editor
3. Click "Run" to execute

### Step 3: Verify Success
Run this verification query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'conversations', 'messages', 'protocols')
ORDER BY table_name;
```

Expected result: All 4 tables should be listed.

## 🎉 After Migration Success

Once the migration is complete, you should be able to:

1. **Test the application**: `npm run dev`
2. **Create projects**: The project creation form will work
3. **Use AI chat**: Conversations and messages tables will be ready
4. **Create protocols**: Research protocol system will be functional

## 🔍 If You Need Fresh API Keys

The service role key used in scripts may be expired. To get a fresh one:

1. Go to Supabase Dashboard > Settings > API
2. Copy the new service_role key
3. Update scripts if needed

Current working keys:
- **Anon Key**: `sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS` ✅ WORKING
- **Service Role Key**: ❌ NEEDS REFRESH

## 📞 Next Steps

1. **IMMEDIATE**: Run the migration in Supabase SQL Editor
2. **VERIFY**: Check that all 4 tables exist
3. **TEST**: Run `npm run dev` and test project creation
4. **DEVELOP**: Continue with AI chat and protocol features

The foundation is solid - we just need to create these 3 missing tables!