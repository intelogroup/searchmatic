import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dmZ1ZmFkaXFtaXpyb3plamNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTI2NzYzOCwiZXhwIjoyMDUwODQzNjM4fQ.QmOA89F8kLjWd9X4b4BDbLiAoHXZoTEwHN-e0xp5ZJg'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🚀 Starting database migration...\n')
  
  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('./complete-database-setup.sql', 'utf8')
    console.log('📖 Migration script loaded successfully')
    console.log(`📊 Script size: ${migrationSQL.length} characters\n`)
    
    // Execute the migration using the RPC function approach
    console.log('🔄 Executing migration...')
    
    // Split the migration into smaller chunks if needed
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📋 Found ${statements.length} SQL statements to execute\n`)
    
    let successCount = 0
    let errors = []
    
    // Execute each statement individually for better error handling
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      try {
        // Skip certain types of statements that don't work with RPC
        if (statement.includes('DO $$') || 
            statement.includes('COMMENT ON') || 
            statement.includes('SELECT \'Database setup completed')) {
          console.log(`⏭️  Skipping statement ${i + 1}: ${statement.substring(0, 50)}...`)
          continue
        }
        
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`)
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        })
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1} failed: ${error.message}`)
          errors.push({ statement: i + 1, error: error.message, sql: statement.substring(0, 100) })
        } else {
          successCount++
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (err) {
        console.log(`❌ Statement ${i + 1} exception: ${err.message}`)
        errors.push({ statement: i + 1, error: err.message, sql: statement.substring(0, 100) })
      }
    }
    
    console.log(`\n📊 Migration Summary:`)
    console.log(`✅ Successful statements: ${successCount}`)
    console.log(`❌ Failed statements: ${errors.length}`)
    
    if (errors.length > 0) {
      console.log(`\n🔍 Error Details:`)
      errors.forEach(err => {
        console.log(`   Statement ${err.statement}: ${err.error}`)
        console.log(`   SQL: ${err.sql}...`)
      })
    }
    
    // Verify tables were created
    console.log('\n🔍 Verifying table creation...')
    
    const tables = ['projects', 'conversations', 'messages', 'protocols']
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
          
        if (error) {
          console.log(`❌ Table '${table}': ${error.message}`)
        } else {
          console.log(`✅ Table '${table}': Accessible`)
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Alternative approach if RPC doesn't work
async function fallbackMigration() {
  console.log('\n🔄 Trying alternative migration approach...\n')
  
  try {
    // Create tables one by one with direct queries
    console.log('1. Creating conversations table...')
    const { error: conv_error } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS conversations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          project_id UUID NOT NULL,
          user_id UUID NOT NULL,
          title TEXT NOT NULL DEFAULT 'New Conversation',
          context TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })
    
    if (conv_error) {
      console.log(`❌ Conversations table: ${conv_error.message}`)
    } else {
      console.log('✅ Conversations table created')
    }
    
    console.log('2. Creating messages table...')
    const { error: msg_error } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          conversation_id UUID NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
          content TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })
    
    if (msg_error) {
      console.log(`❌ Messages table: ${msg_error.message}`)
    } else {
      console.log('✅ Messages table created')
    }
    
    console.log('3. Creating protocols table...')
    const { error: prot_error } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS protocols (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          project_id UUID NOT NULL,
          user_id UUID NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          research_question TEXT NOT NULL,
          framework_type TEXT NOT NULL CHECK (framework_type IN ('pico', 'spider', 'other')),
          population TEXT,
          intervention TEXT,
          comparison TEXT,
          outcome TEXT,
          status TEXT NOT NULL DEFAULT 'draft',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })
    
    if (prot_error) {
      console.log(`❌ Protocols table: ${prot_error.message}`)
    } else {
      console.log('✅ Protocols table created')
    }
    
    console.log('\n🔄 Final verification...')
    const tables = ['conversations', 'messages', 'protocols']
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: Working`)
      }
    }
    
  } catch (error) {
    console.error('❌ Fallback migration failed:', error.message)
  }
}

console.log('🏗️  Database Migration Tool')
console.log('============================\n')

// Try main migration first, then fallback if needed
runMigration().then(() => {
  console.log('\n✨ Migration process completed!')
}).catch((error) => {
  console.error('\n💥 Migration process failed:', error.message)
  console.log('\n🔄 Trying fallback approach...')
  return fallbackMigration()
})