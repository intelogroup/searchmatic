import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co'
const supabaseAnonKey = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('projects').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Connected to Supabase successfully')
    console.log(`📊 Projects table accessible (count: ${data?.length || 'unknown'})`)
    
    // Test if protocols table exists
    console.log('\n🔍 Checking if protocols table exists...')
    const { data: protocolData, error: protocolError } = await supabase
      .from('protocols')
      .select('count', { count: 'exact', head: true })
    
    if (protocolError) {
      if (protocolError.message.includes('relation "protocols" does not exist')) {
        console.log('⚠️  Protocols table does not exist - needs to be created')
        console.log('\n📝 To create the protocols table:')
        console.log('1. Go to: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql')
        console.log('2. Copy and paste the contents of create-protocols-table.sql')
        console.log('3. Click "Run" to execute the migration')
        return false
      } else {
        console.error('❌ Protocols table check failed:', protocolError.message)
        return false
      }
    }
    
    console.log('✅ Protocols table exists and is accessible')
    console.log(`📊 Protocols table accessible (count: ${protocolData?.length || 'unknown'})`)
    
    // Test conversations and messages tables
    console.log('\n🔍 Checking conversations table...')
    const { error: convError } = await supabase
      .from('conversations')
      .select('count', { count: 'exact', head: true })
    
    if (convError) {
      console.log('⚠️  Conversations table issue:', convError.message)
    } else {
      console.log('✅ Conversations table exists')
    }
    
    console.log('\n🔍 Checking messages table...')
    const { error: msgError } = await supabase
      .from('messages')
      .select('count', { count: 'exact', head: true })
    
    if (msgError) {
      console.log('⚠️  Messages table issue:', msgError.message)
    } else {
      console.log('✅ Messages table exists')
    }
    
    return true
    
  } catch (err) {
    console.error('❌ Database test failed:', err.message)
    return false
  }
}

// Test authentication
async function testAuthentication() {
  console.log('\n🔐 Testing authentication...')
  
  try {
    // Try to sign in with test credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'jayveedz19@gmail.com',
      password: 'Jimkali90#'
    })
    
    if (error) {
      console.log('⚠️  Auth test with credentials failed:', error.message)
      console.log('   This is expected if no account exists yet')
    } else {
      console.log('✅ Authentication successful')
      console.log(`👤 User: ${data.user?.email}`)
      
      // Sign out after test
      await supabase.auth.signOut()
      console.log('🚪 Signed out successfully')
    }
  } catch (err) {
    console.log('⚠️  Auth test error:', err.message)
  }
}

async function main() {
  console.log('🚀 Searchmatic MVP - Database Connection Test\n')
  
  const dbStatus = await testDatabaseConnection()
  await testAuthentication()
  
  console.log('\n📋 Summary:')
  if (dbStatus) {
    console.log('✅ Database is ready for testing')
    console.log('🧪 You can now test the AI chat and protocol features')
  } else {
    console.log('⚠️  Database setup incomplete')
    console.log('📝 Please create the protocols table using the SQL script')
  }
  
  console.log('\n🌐 Access the app at: http://localhost:5173/')
  console.log('🔧 Supabase Dashboard: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci')
}

main().catch(console.error)