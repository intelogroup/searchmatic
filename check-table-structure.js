import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co'
const supabaseAnonKey = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTableStructure() {
  console.log('🔍 Checking actual database table structures...\n')
  
  try {
    // Sign in first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'jayveedz19@gmail.com',
      password: 'Jimkali90#'
    })
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message)
      return
    }
    
    console.log('✅ Authenticated successfully\n')
    
    // Check projects table structure
    console.log('📋 Checking projects table...')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1)
    
    if (projectsError) {
      console.error('❌ Projects table error:', projectsError.message)
    } else {
      console.log('✅ Projects table accessible')
      if (projects && projects.length > 0) {
        console.log('📊 Sample project structure:')
        console.log(JSON.stringify(projects[0], null, 2))
      } else {
        console.log('📊 No existing projects found')
      }
    }
    
    // Check conversations table structure
    console.log('\n💬 Checking conversations table...')
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1)
    
    if (conversationsError) {
      console.error('❌ Conversations table error:', conversationsError.message)
    } else {
      console.log('✅ Conversations table accessible')
      if (conversations && conversations.length > 0) {
        console.log('📊 Sample conversation structure:')
        console.log(JSON.stringify(conversations[0], null, 2))
      } else {
        console.log('📊 No existing conversations found')
      }
    }
    
    // Check messages table structure
    console.log('\n📝 Checking messages table...')
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(1)
    
    if (messagesError) {
      console.error('❌ Messages table error:', messagesError.message)
    } else {
      console.log('✅ Messages table accessible')
      if (messages && messages.length > 0) {
        console.log('📊 Sample message structure:')
        console.log(JSON.stringify(messages[0], null, 2))
      } else {
        console.log('📊 No existing messages found')
      }
    }
    
    // Check protocols table structure
    console.log('\n📋 Checking protocols table...')
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select('*')
      .limit(1)
    
    if (protocolsError) {
      console.error('❌ Protocols table error:', protocolsError.message)
    } else {
      console.log('✅ Protocols table accessible')
      if (protocols && protocols.length > 0) {
        console.log('📊 Sample protocol structure:')
        console.log(JSON.stringify(protocols[0], null, 2))
      } else {
        console.log('📊 No existing protocols found')
      }
    }
    
    // Try to create a minimal test project to see what's required
    console.log('\n🧪 Testing minimal project creation...')
    const testProject = {
      title: 'Minimal Test Project',
      user_id: authData.user.id
    }
    
    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert([testProject])
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Minimal project creation failed:', createError.message)
      console.log('💡 This tells us what fields are required')
    } else {
      console.log('✅ Minimal project created successfully!')
      console.log('📊 Created project structure:')
      console.log(JSON.stringify(newProject, null, 2))
      
      // Clean up
      await supabase.from('projects').delete().eq('id', newProject.id)
      console.log('🧹 Test project cleaned up')
    }
    
    await supabase.auth.signOut()
    console.log('\n🚪 Signed out successfully')
    
  } catch (error) {
    console.error('❌ Structure check failed:', error.message)
  }
}

checkTableStructure()