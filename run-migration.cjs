const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dmZ1ZmFkaXFtaXpyb3plamNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTI2NzYzOCwiZXhwIjoyMDUwODQzNjM4fQ.QmOA89F8kLjWd9X4b4BDbLiAoHXZoTEwHN-e0xp5ZJg';

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSQLStatement(sql) {
  try {
    const { data, error } = await supabase.rpc('exec', { sql });
    
    if (error) {
      console.error('SQL Error:', error.message);
      return false;
    }
    
    console.log('✅ SQL executed successfully');
    return true;
  } catch (err) {
    console.error('Exception:', err.message);
    return false;
  }
}

async function testConnection() {
  console.log('🔄 Testing connection with service role key...');
  
  // Test with a simple query
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('count', { count: 'exact', head: true });
    
    if (error && !error.message.includes('does not exist')) {
      console.error('❌ Connection error:', error);
      return false;
    }
    
    console.log('✅ Connection successful!');
    return true;
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    return false;
  }
}

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');
    
    // First test the connection
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    // Read the migration file
    const migrationPath = path.join(__dirname, 'complete-database-setup.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📁 Migration file loaded successfully');
    console.log(`📊 Migration size: ${migrationSQL.length} characters`);
    
    // Execute the migration by creating individual functions for each major section
    console.log('\n🔧 Executing migration sections...');
    
    // Section 1: Add type column to projects if needed
    console.log('1️⃣ Adding type column to projects table...');
    const addTypeColumn = `
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'projects' AND column_name = 'type') THEN
              ALTER TABLE projects ADD COLUMN type TEXT NOT NULL DEFAULT 'systematic_review';
              RAISE NOTICE 'Added type column to projects table';
          ELSE
              RAISE NOTICE 'Type column already exists in projects table';
          END IF;
      END $$;
    `;
    
    await runSQLStatement(addTypeColumn);
    
    // Section 2: Create conversations table
    console.log('2️⃣ Creating conversations table...');
    const createConversations = `
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT 'New Conversation',
        context TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    await runSQLStatement(createConversations);
    
    // Section 3: Create messages table
    console.log('3️⃣ Creating messages table...');
    const createMessages = `
      CREATE TABLE IF NOT EXISTS messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    await runSQLStatement(createMessages);
    
    // Section 4: Create protocols table
    console.log('4️⃣ Creating protocols table...');
    const createProtocols = `
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
    `;
    
    await runSQLStatement(createProtocols);
    
    // Section 5: Create indexes
    console.log('5️⃣ Creating performance indexes...');
    const createIndexes = `
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
    `;
    
    await runSQLStatement(createIndexes);
    
    // Section 6: Create trigger function and triggers
    console.log('6️⃣ Setting up triggers...');
    const createTriggers = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
      CREATE TRIGGER update_conversations_updated_at 
        BEFORE UPDATE ON conversations 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_protocols_updated_at ON protocols;
      CREATE TRIGGER update_protocols_updated_at 
        BEFORE UPDATE ON protocols 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;
    
    await runSQLStatement(createTriggers);
    
    // Section 7: Enable RLS
    console.log('7️⃣ Enabling Row Level Security...');
    const enableRLS = `
      ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
      ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
    `;
    
    await runSQLStatement(enableRLS);
    
    // Section 8: Create RLS policies
    console.log('8️⃣ Creating RLS policies...');
    
    // Conversations policies
    const conversationPolicies = `
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
    `;
    
    await runSQLStatement(conversationPolicies);
    
    // Messages policies
    const messagePolicies = `
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
    `;
    
    await runSQLStatement(messagePolicies);
    
    // Protocol policies
    const protocolPolicies = `
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
    `;
    
    await runSQLStatement(protocolPolicies);
    
    // Section 9: Grant permissions
    console.log('9️⃣ Granting permissions...');
    const grantPermissions = `
      GRANT ALL ON conversations TO authenticated;
      GRANT ALL ON messages TO authenticated;
      GRANT ALL ON protocols TO authenticated;
    `;
    
    await runSQLStatement(grantPermissions);
    
    // Section 10: Verify everything works
    console.log('🔍 Verifying migration results...');
    
    const tablesToCheck = ['conversations', 'messages', 'protocols'];
    let allTablesExist = true;
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ Table '${tableName}' verification failed:`, error.message);
          allTablesExist = false;
        } else {
          console.log(`✅ Table '${tableName}' exists and is accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${tableName}' verification error:`, err.message);
        allTablesExist = false;
      }
    }
    
    if (allTablesExist) {
      console.log('\n🎉 Database setup completed successfully! All tables, indexes, RLS policies, and triggers are now ready.');
    } else {
      console.log('\n⚠️ Migration completed but some verification checks failed. Please review the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
    process.exit(1);
  }
}

// Run the test
runMigration();