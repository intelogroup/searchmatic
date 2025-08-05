#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co'
const anonKey = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS'

const supabase = createClient(supabaseUrl, anonKey)

console.log('🔍 CHECKING DATABASE ENUM TYPES AND SCHEMA')
console.log('==========================================\n')

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function checkCurrentState() {
  try {
    // First, let's understand what we can access without authentication
    console.log('📡 Testing unauthenticated access...')
    
    const tables = ['profiles', 'projects', 'conversations', 'messages', 'protocols']
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(0)  // Don't fetch data, just test access
        
        if (error) {
          if (error.message.includes('relation') && error.message.includes('does not exist')) {
            console.log(`   ❌ ${table}: Table does not exist`)
          } else if (error.message.includes('JWT')) {
            console.log(`   🔒 ${table}: Table exists, requires authentication (RLS active)`)
          } else {
            console.log(`   ⚠️  ${table}: ${error.message}`)
          }
        } else {
          console.log(`   ✅ ${table}: Table exists and accessible (${count || 0} records)`)
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`)
      }
    }
    
    // Now let's test with a real user to understand the schema better
    console.log('\n🔐 Testing with authenticated user...')
    
    // Try to sign up with a unique email
    const testEmail = `schema_test_${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    console.log(`   Creating test user: ${testEmail}`)
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    })
    
    if (signUpError) {
      console.log(`   ❌ Signup failed: ${signUpError.message}`)
      
      // Try to sign in with an existing user instead
      console.log('   🔄 Trying to sign in with a test user...')
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword'
      })
      
      if (signInError) {
        console.log(`   ❌ Sign in also failed: ${signInError.message}`)
        console.log('   ⚠️  Cannot test authenticated operations')
        return
      } else {
        console.log('   ✅ Signed in successfully')
      }
    } else {
      console.log('   ✅ User created successfully')
      
      // Small delay to ensure user is fully created
      await delay(1000)
    }
    
    // Now test table access with authentication
    console.log('\n🧪 Testing authenticated table access...')
    
    // Test projects table specifically
    console.log('   📋 Testing projects table...')
    
    // First, let's try to understand the enum values by testing different project types
    const projectTypes = [
      'systematic_review',
      'meta_analysis',
      'scoping_review',
      'literature_review',
      'rapid_review',
      'narrative_review',
      'umbrella_review',
      'mixed_methods',
      'qualitative',
      'quantitative'
    ]
    
    let validProjectType = null
    
    for (const type of projectTypes) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            title: `Test Project ${type}`,
            type: type,
            description: 'Test description'
          })
          .select()
        
        if (error) {
          if (error.message.includes('invalid input value for enum')) {
            console.log(`      ❌ ${type}: Not a valid enum value`)
          } else if (error.message.includes('violates not-null constraint')) {
            const match = error.message.match(/column "([^"]+)"/);
            if (match) {
              console.log(`      ⚠️  ${type}: Missing required field: ${match[1]}`)
            } else {
              console.log(`      ⚠️  ${type}: Missing required field`)
            }
          } else {
            console.log(`      ⚠️  ${type}: ${error.message}`)
          }
        } else {
          console.log(`      ✅ ${type}: Valid! Created project with ID: ${data[0].id}`)
          console.log(`      📊 Project structure: ${Object.keys(data[0]).join(', ')}`)
          
          validProjectType = type
          
          // Clean up the test project
          await supabase
            .from('projects')
            .delete()
            .eq('id', data[0].id)
          console.log(`      🧹 Cleaned up test project`)
          
          break // Found a working type, no need to test more
        }
      } catch (err) {
        console.log(`      ❌ ${type}: ${err.message}`)
      }
    }
    
    // If we found a valid project type, test other tables with relationships
    if (validProjectType) {
      console.log(`\n🔗 Testing related tables with valid project type: ${validProjectType}`)
      
      // Create a test project to use for relationships
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          title: 'Test Project for Relations',
          type: validProjectType,
          description: 'Test project for testing relationships'
        })
        .select()
      
      if (projectError) {
        console.log(`   ❌ Could not create test project: ${projectError.message}`)
        return
      }
      
      const testProjectId = projectData[0].id
      console.log(`   ✅ Created test project: ${testProjectId}`)
      
      // Test conversations table
      console.log('   📋 Testing conversations table...')
      try {
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .insert({
            project_id: testProjectId,
            title: 'Test Conversation'
          })
          .select()
        
        if (convError) {
          console.log(`      ❌ Conversations: ${convError.message}`)
        } else {
          console.log(`      ✅ Conversations: Success`)
          console.log(`      📊 Structure: ${Object.keys(convData[0]).join(', ')}`)
          
          // Test messages table
          console.log('   📋 Testing messages table...')
          try {
            const { data: msgData, error: msgError } = await supabase
              .from('messages')
              .insert({
                conversation_id: convData[0].id,
                role: 'user',
                content: 'Test message'
              })
              .select()
            
            if (msgError) {
              console.log(`      ❌ Messages: ${msgError.message}`)
            } else {
              console.log(`      ✅ Messages: Success`)
              console.log(`      📊 Structure: ${Object.keys(msgData[0]).join(', ')}`)
              
              // Clean up message
              await supabase.from('messages').delete().eq('id', msgData[0].id)
            }
          } catch (err) {
            console.log(`      ❌ Messages: ${err.message}`)
          }
          
          // Clean up conversation
          await supabase.from('conversations').delete().eq('id', convData[0].id)
        }
      } catch (err) {
        console.log(`      ❌ Conversations: ${err.message}`)
      }
      
      // Test protocols table
      console.log('   📋 Testing protocols table...')
      try {
        const { data: protData, error: protError } = await supabase
          .from('protocols')
          .insert({
            project_id: testProjectId,
            title: 'Test Protocol',
            research_question: 'What is the test question?',
            framework_type: 'pico'
          })
          .select()
        
        if (protError) {
          console.log(`      ❌ Protocols: ${protError.message}`)
        } else {
          console.log(`      ✅ Protocols: Success`)
          console.log(`      📊 Structure: ${Object.keys(protData[0]).join(', ')}`)
          
          // Clean up protocol
          await supabase.from('protocols').delete().eq('id', protData[0].id)
        }
      } catch (err) {
        console.log(`      ❌ Protocols: ${err.message}`)
      }
      
      // Clean up test project
      await supabase.from('projects').delete().eq('id', testProjectId)
      console.log('   🧹 Cleaned up test project')
    }
    
    // Sign out
    await supabase.auth.signOut()
    console.log('\n🔓 Signed out successfully')
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

checkCurrentState()
  .then(() => {
    console.log('\n✅ Database schema check complete')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })