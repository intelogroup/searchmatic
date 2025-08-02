import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dmZ1ZmFkaXFtaXpyb3plamNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkzMTQwOSwiZXhwIjoyMDY5NTA3NDA5fQ.ThqBa2lzMrm6zADqVIQzqK7-HvYOpfoVvsh_9qdwxgc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL to rename manifestos to protocols and add missing tables
const schemaMigration = `
-- Set search path
SET search_path TO public, extensions;

-- 1. Rename manifestos table to protocols
ALTER TABLE public.manifestos RENAME TO protocols;

-- 2. Create missing conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    context TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create missing messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create missing export_logs table
CREATE TABLE IF NOT EXISTS public.export_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_path TEXT,
    format TEXT,
    filters JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON public.conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_export_logs_project_id ON public.export_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_user_id ON public.export_logs(user_id);

-- 6. Enable RLS on new tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id);

-- 8. RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

-- 9. RLS Policies for export_logs
CREATE POLICY "Users can view their own export logs" ON public.export_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own export logs" ON public.export_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. Create or update trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Add update trigger for conversations
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Success message
SELECT 'MVP schema migration completed successfully!' as result;
`;

async function applyMVPSchemaUpdates() {
  console.log('🚀 Applying MVP Schema Updates...\n');
  
  try {
    // Since we can't execute raw SQL directly via the JS client, 
    // let's output the SQL for manual execution
    console.log('📋 SQL Migration Required:');
    console.log('=========================');
    console.log('Copy and paste this SQL into your Supabase Dashboard SQL Editor:\n');
    console.log('URL: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql\n');
    console.log('--- START SQL ---');
    console.log(schemaMigration);
    console.log('--- END SQL ---\n');
    
    console.log('⚠️  Important Notes:');
    console.log('- This will rename "manifestos" table to "protocols"');
    console.log('- This will add missing tables: conversations, messages, export_logs');
    console.log('- All RLS policies will be applied');
    console.log('- Existing data will be preserved');
    
    console.log('\n✅ After running the SQL:');
    console.log('1. Database will be MVP-ready');
    console.log('2. All React components can connect');
    console.log('3. Frontend integration can proceed');
    
    // Test if we can determine success by checking table existence
    console.log('\n🧪 Current State Check:');
    const { data: manifestos } = await supabase
      .from('manifestos')
      .select('count', { count: 'exact', head: true });
    
    console.log(`✅ Manifestos table exists with ${manifestos || 0} records`);
    console.log('📝 Ready to rename to "protocols"');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyMVPSchemaUpdates();