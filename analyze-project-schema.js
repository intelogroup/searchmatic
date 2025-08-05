#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co'
const anonKey = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS'

const supabase = createClient(supabaseUrl, anonKey)

console.log('🔍 ANALYZING PROJECT SCHEMA DETAILS')
console.log('===================================\n')

async function analyzeProjectSchema() {
  console.log('📋 Understanding projects table structure...\n')
  
  // From the error, we know there's a project_type enum
  // Let's try different enum values to understand what's valid
  
  const potentialTypes = [
    'meta_analysis',
    'systematic_review', 
    'scoping_review',
    'narrative_review',
    'literature_review',
    'rapid_review',
    'umbrella_review',
    'systematic_map',
    'critical_review',
    'state_of_art',
    'meta_synthesis'
  ]
  
  console.log('🧪 Testing potential project_type enum values...')
  
  // First, let's sign up a test user to bypass RLS
  const testEmail = `test_${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  
  console.log(`🔐 Creating test user: ${testEmail}`)
  
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword
  })
  
  if (signUpError) {
    console.log(`❌ Signup error: ${signUpError.message}`)
    return
  }
  
  console.log('✅ Test user created, now testing project creation...\n')
  
  for (const type of potentialTypes) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: `Test Project - ${type}`,
          type: type,
          description: 'Test description'
        })
        .select()
      
      if (error) {
        if (error.message.includes('invalid input value for enum')) {
          console.log(`   ❌ ${type}: Invalid enum value`)
        } else {
          console.log(`   ⚠️  ${type}: ${error.message}`)
        }
      } else {
        console.log(`   ✅ ${type}: Valid enum value`)
        console.log(`      📊 Record structure: ${Object.keys(data[0]).join(', ')}`)
        
        // Clean up immediately
        await supabase
          .from('projects')
          .delete()
          .eq('id', data[0].id)
        
        break // Found a valid type, no need to test more
      }
    } catch (err) {
      console.log(`   ❌ ${type}: ${err.message}`)
    }
  }
  
  // Try to understand more about the table structure
  console.log('\n🔍 Testing additional field requirements...')
  
  // Test with minimal required fields once we know a valid type
  const testCases = [
    {
      name: 'minimal with description',
      data: { title: 'Test', description: 'Test desc' }
    },
    {
      name: 'with status',
      data: { title: 'Test', description: 'Test desc', status: 'active' }
    },
    {
      name: 'with created_at',
      data: { title: 'Test', description: 'Test desc', created_at: new Date().toISOString() }
    }
  ]
  
  for (const testCase of testCases) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(testCase.data)
        .select()
      
      if (error) {
        console.log(`   ❌ ${testCase.name}: ${error.message}`)
      } else {
        console.log(`   ✅ ${testCase.name}: Success`)
        console.log(`      📊 Full record: ${JSON.stringify(data[0], null, 2)}`)
        
        // Clean up
        await supabase
          .from('projects')
          .delete()
          .eq('id', data[0].id)
        
        break // Found working combination
      }
    } catch (err) {
      console.log(`   ❌ ${testCase.name}: ${err.message}`)
    }
  }
  
  // Check other tables too
  console.log('\n📋 Checking other table structures...')
  
  const tables = ['profiles', 'conversations', 'messages', 'protocols']
  
  for (const table of tables) {
    console.log(`\n🔍 ${table} table:`)
    
    try {
      // Try a minimal insert to understand structure
      let testData = {}
      
      switch (table) {
        case 'profiles':
          testData = { 
            full_name: 'Test User',
            email: testEmail
          }
          break
        case 'conversations':
          testData = {
            title: 'Test Conversation'
          }
          break
        case 'messages':
          testData = {
            content: 'Test message',
            role: 'user'
          }
          break
        case 'protocols':
          testData = {
            title: 'Test Protocol',
            content: 'Test protocol content'
          }
          break
      }
      
      const { data, error } = await supabase
        .from(table)
        .insert(testData)
        .select()
      
      if (error) {
        console.log(`   ⚠️  Error: ${error.message}`)
      } else {
        console.log(`   ✅ Success`)
        console.log(`   📊 Fields: ${Object.keys(data[0]).join(', ')}`)
        
        // Clean up
        await supabase
          .from(table)
          .delete()
          .eq('id', data[0].id)
      }
      
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`)
    }
  }
  
  // Clean up test user
  console.log('\n🧹 Cleaning up test user...')
  const { error: signOutError } = await supabase.auth.signOut()
  if (signOutError) {
    console.log(`   ⚠️  Signout error: ${signOutError.message}`)
  } else {
    console.log('   ✅ Signed out successfully')
  }
}

analyzeProjectSchema()
  .then(() => {
    console.log('\n✅ Project schema analysis complete')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })