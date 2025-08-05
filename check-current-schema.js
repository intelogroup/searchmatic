#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co'
const anonKey = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS'

const supabase = createClient(supabaseUrl, anonKey)

console.log('🔍 CHECKING CURRENT DATABASE SCHEMA')
console.log('===================================\n')

async function checkSchema() {
  try {
    console.log('📡 Testing database connection...')
    
    // Test connection and check what tables we can access
    const tables = ['profiles', 'projects', 'conversations', 'messages', 'protocols', 'studies']
    
    for (const table of tables) {
      try {
        console.log(`\n📋 Checking ${table} table...`)
        
        // Try to query the table to see if it exists and what data we can access
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          if (error.message.includes('relation') && error.message.includes('does not exist')) {
            console.log(`   ❌ ${table} table does not exist`)
          } else if (error.message.includes('JWT')) {
            console.log(`   🔒 ${table} table exists but requires authentication`)
          } else {
            console.log(`   ⚠️  ${table} error: ${error.message}`)
          }
        } else {
          console.log(`   ✅ ${table} table exists and accessible`)
          console.log(`   📊 Records visible: ${data ? data.length : 0}`)
          
          if (data && data.length > 0) {
            console.log(`   📝 Sample record keys: ${Object.keys(data[0]).join(', ')}`)
          }
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`)
      }
    }
    
    // Try to get more detailed info about the projects table specifically
    console.log('\n🔍 DETAILED PROJECTS TABLE ANALYSIS')
    console.log('===================================')
    
    try {
      // Try different approaches to understand the projects table structure
      
      // Approach 1: Try to insert a minimal record to see what fields are required
      console.log('\n🧪 Testing projects table requirements...')
      
      const { data: insertData, error: insertError } = await supabase
        .from('projects')
        .insert({
          title: 'Test Project'
        })
        .select()
      
      if (insertError) {
        console.log(`   ⚠️  Insert error reveals schema: ${insertError.message}`)
        
        // Parse the error to understand required fields
        if (insertError.message.includes('null value in column')) {
          const match = insertError.message.match(/null value in column "([^"]+)"/);
          if (match) {
            console.log(`   📝 Required field found: ${match[1]}`)
          }
        }
      } else {
        console.log(`   ✅ Minimal insert succeeded`)
        console.log(`   📊 Created record: ${JSON.stringify(insertData, null, 2)}`)
        
        // Clean up the test record
        if (insertData && insertData.length > 0) {
          await supabase
            .from('projects')
            .delete()
            .eq('id', insertData[0].id)
          console.log(`   🧹 Test record cleaned up`)
        }
      }
      
      // Approach 2: Try different field combinations
      console.log('\n🧪 Testing with type field...')
      
      const { data: insertData2, error: insertError2 } = await supabase
        .from('projects')
        .insert({
          title: 'Test Project 2',
          type: 'systematic_review'
        })
        .select()
      
      if (insertError2) {
        console.log(`   ⚠️  Insert error: ${insertError2.message}`)
      } else {
        console.log(`   ✅ Insert with type succeeded`)
        console.log(`   📊 Record structure: ${Object.keys(insertData2[0]).join(', ')}`)
        
        // Clean up
        if (insertData2 && insertData2.length > 0) {
          await supabase
            .from('projects')
            .delete()
            .eq('id', insertData2[0].id)
          console.log(`   🧹 Test record cleaned up`)
        }
      }
      
    } catch (err) {
      console.log(`   ❌ Projects analysis error: ${err.message}`)
    }
    
    // Check for any existing data
    console.log('\n📊 CHECKING FOR EXISTING DATA')
    console.log('=============================')
    
    for (const table of ['profiles', 'projects', 'conversations', 'messages']) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`   ${table}: Cannot count (${error.message})`)
        } else {
          console.log(`   ${table}: ${count} records`)
        }
      } catch (err) {
        console.log(`   ${table}: Error counting (${err.message})`)
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

checkSchema()
  .then(() => {
    console.log('\n✅ Schema check complete')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })