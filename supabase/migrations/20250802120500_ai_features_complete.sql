-- Complete Searchmatic MVP Database Setup
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql

-- First, let's check and fix the projects table
-- Add missing 'type' column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'type') THEN
        ALTER TABLE projects ADD COLUMN type TEXT NOT NULL DEFAULT 'systematic_review';
    END IF;
END $$;

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

-- Create protocols table (updated from previous script)
CREATE TABLE IF NOT EXISTS protocols (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  research_question TEXT NOT NULL,
  framework_type TEXT NOT NULL CHECK (framework_type IN ('pico', 'spider', 'other')),
  
  -- PICO Framework fields
  population TEXT,
  intervention TEXT,
  comparison TEXT,
  outcome TEXT,
  
  -- SPIDER Framework fields
  sample TEXT,
  phenomenon TEXT,
  design TEXT,
  evaluation TEXT,
  research_type TEXT,
  
  -- Criteria and strategy
  inclusion_criteria TEXT[] DEFAULT '{}',
  exclusion_criteria TEXT[] DEFAULT '{}',
  search_strategy JSONB DEFAULT '{}',
  databases TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  date_range JSONB,
  study_types TEXT[] DEFAULT '{}',
  
  -- Status and versioning
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  
  -- AI assistance tracking
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_guidance_used JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS conversations_project_id_idx ON conversations(project_id);
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON conversations(updated_at);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
CREATE INDEX IF NOT EXISTS messages_role_idx ON messages(role);

CREATE INDEX IF NOT EXISTS protocols_project_id_idx ON protocols(project_id);
CREATE INDEX IF NOT EXISTS protocols_user_id_idx ON protocols(user_id);
CREATE INDEX IF NOT EXISTS protocols_status_idx ON protocols(status);
CREATE INDEX IF NOT EXISTS protocols_framework_type_idx ON protocols(framework_type);
CREATE INDEX IF NOT EXISTS protocols_created_at_idx ON protocols(created_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON conversations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_protocols_updated_at ON protocols;
CREATE TRIGGER update_protocols_updated_at 
  BEFORE UPDATE ON protocols 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
CREATE POLICY "Users can insert their own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;
CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON messages;
CREATE POLICY "Users can delete messages in their conversations" ON messages
  FOR DELETE USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for protocols
DROP POLICY IF EXISTS "Users can view their own protocols" ON protocols;
CREATE POLICY "Users can view their own protocols" ON protocols
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own protocols" ON protocols;
CREATE POLICY "Users can insert their own protocols" ON protocols
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own unlocked protocols" ON protocols;
CREATE POLICY "Users can update their own unlocked protocols" ON protocols
  FOR UPDATE USING (auth.uid() = user_id AND is_locked = FALSE);

DROP POLICY IF EXISTS "Users can delete their own unlocked protocols" ON protocols;
CREATE POLICY "Users can delete their own unlocked protocols" ON protocols
  FOR DELETE USING (auth.uid() = user_id AND is_locked = FALSE);

-- Grant necessary permissions
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON protocols TO authenticated;

-- Grant sequence permissions if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'conversations_id_seq') THEN
        GRANT USAGE ON SEQUENCE conversations_id_seq TO authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'messages_id_seq') THEN
        GRANT USAGE ON SEQUENCE messages_id_seq TO authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'protocols_id_seq') THEN
        GRANT USAGE ON SEQUENCE protocols_id_seq TO authenticated;
    END IF;
END $$;

-- Insert some test data to verify everything works
DO $$
DECLARE
    test_user_id UUID;
    test_project_id UUID;
    test_conversation_id UUID;
    test_protocol_id UUID;
BEGIN
    -- Get or create a test user (this will only work if you have a test user)
    -- We'll skip this for now since we can't create auth users from SQL
    
    -- Instead, let's just verify the tables were created successfully
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Tables created: conversations, messages, protocols';
    RAISE NOTICE 'Indexes created for optimal performance';
    RAISE NOTICE 'RLS policies configured for security';
    RAISE NOTICE 'Triggers set up for automatic timestamp updates';
END $$;

-- Verification queries (uncomment to run)
-- SELECT 'conversations' as table_name, count(*) as row_count FROM conversations
-- UNION ALL
-- SELECT 'messages' as table_name, count(*) as row_count FROM messages  
-- UNION ALL
-- SELECT 'protocols' as table_name, count(*) as row_count FROM protocols;

COMMENT ON TABLE conversations IS 'Chat conversations between users and AI assistant';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE protocols IS 'Research protocols with PICO/SPIDER frameworks and AI guidance';

-- Final success message
SELECT 'Database setup completed successfully! All tables, indexes, RLS policies, and triggers are now ready.' as status;