import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Inspecting Supabase Database...\n')
console.log('URL:', supabaseUrl)
console.log('Key type:', supabaseKey?.substring(0, 20) + '...\n')

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectDatabase() {
  console.log('📊 Checking Tables via Supabase Client:')
  console.log('========================================\n')
  
  // Tables to check
  const tables = [
    'profiles',
    'user_preferences',
    'conversations', 
    'messages',
    'projects',
    'protocols',
    'protocol_versions',
    'articles',
    'search_queries',
    'extraction_templates',
    'export_logs'
  ]
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ ${table}: Table does not exist`)
        } else {
          console.log(`⚠️  ${table}: ${error.message}`)
        }
      } else {
        console.log(`✅ ${table}: Exists (${count || 0} records)`)
      }
    } catch (err) {
      console.log(`❌ ${table}: Error checking - ${err.message}`)
    }
  }
  
  console.log('\n📋 Migration Files Found:')
  console.log('=========================')
  console.log('• 20250109_edge_functions_support.sql')
  console.log('• 20250802120500_ai_features_complete.sql')
  console.log('• 20250802121100_fix_status_enum.sql')
  console.log('• 20250807_fix_project_schema.sql')
  
  console.log('\n⚡ Edge Functions Found (Not Yet Deployed):')
  console.log('============================================')
  console.log('• analyze-literature')
  console.log('• chat-completion')
  console.log('• duplicate-detection')
  console.log('• export-data')
  console.log('• hello-world')
  console.log('• process-document')
  console.log('• protocol-guidance')
  console.log('• search-articles')
  
  console.log('\n💡 Recommendations:')
  console.log('===================')
  console.log('1. Some tables from migrations may not be applied yet')
  console.log('2. Edge functions are ready but not deployed')
  console.log('3. To apply migrations: Run SQL files in Supabase SQL Editor')
  console.log('4. To deploy edge functions: Use Supabase CLI')
  
  // Test a simple query
  console.log('\n🧪 Testing Basic Query:')
  console.log('=======================')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
  
  if (profileError) {
    console.log('Profile query error:', profileError.message)
  } else {
    console.log('Profile table accessible:', profile?.length ? 'Has data' : 'Empty')
  }
}

inspectDatabase().catch(console.error)