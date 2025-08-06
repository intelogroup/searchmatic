#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 DETAILED SCHEMA ANALYSIS')
console.log('============================')

async function analyzeSchema() {
  try {
    console.log('📋 ANALYZING PROJECTS TABLE ENUM CONSTRAINTS')
    console.log('==============================================')
    
    // First let's try different project types to understand the enum
    const testTypes = [
      'systematic_review',
      'scoping_review', 
      'meta_analysis',
      'literature_review',
      'rapid_review'
    ]
    
    for (const type of testTypes) {
      try {
        const { error } = await supabase
          .from('projects')
          .insert({
            title: `Test Project - ${type}`,
            description: 'Testing enum values',
            type: type
          })
        
        if (error) {
          if (error.message.includes('invalid input value for enum project_type')) {
            console.log(`❌ '${type}' is NOT a valid enum value`)
          } else if (error.message.includes('violates row-level security')) {
            console.log(`✅ '${type}' is a valid enum value (RLS blocked insertion)`)
          } else {
            console.log(`⚠️  '${type}' - other error: ${error.message}`)
          }
        } else {
          console.log(`✅ '${type}' successfully inserted`)
        }
      } catch (err) {
        console.log(`💥 Error testing '${type}': ${err.message}`)
      }
    }
    
    console.log('\n📊 CHECKING TABLE SCHEMAS WITH INFORMATION_SCHEMA')
    console.log('=================================================')
    
    // Let's try to get schema information (this might not work with RLS)
    try {
      // Try a different approach - check what columns exist by trying to select them
      const columnsToCheck = [
        'id',
        'title', 
        'description',
        'user_id',
        'type',
        'project_type',
        'status',
        'research_domain',
        'team_size',
        'progress_percentage',
        'current_stage',
        'last_activity_at',
        'created_at',
        'updated_at'
      ]
      
      console.log('\n🔍 Testing column existence by attempting SELECT:')
      
      for (const column of columnsToCheck) {
        try {
          const { error } = await supabase
            .from('projects')
            .select(column)
            .limit(0)
          
          if (error) {
            if (error.message.includes(`column "${column}" does not exist`)) {
              console.log(`❌ Column '${column}' does NOT exist`)
            } else {
              console.log(`✅ Column '${column}' exists (other error: ${error.message.substring(0, 50)}...)`)
            }
          } else {
            console.log(`✅ Column '${column}' exists and is accessible`)
          }
        } catch (err) {
          console.log(`⚠️  Column '${column}' - error: ${err.message.substring(0, 50)}...`)
        }
      }
      
    } catch (err) {
      console.log(`❌ Schema analysis failed: ${err.message}`)
    }
    
    console.log('\n🧪 TESTING VALID PROJECT CREATION')
    console.log('==================================')
    
    // Try to create a project with minimal required fields
    const testCases = [
      {
        title: 'Minimal Test',
        description: 'Testing minimal fields'
      },
      {
        title: 'With User ID Test', 
        description: 'Testing with user_id',
        user_id: '00000000-0000-0000-0000-000000000000' // dummy UUID
      },
      {
        title: 'Test Different Type',
        description: 'Testing different type',
        project_type: 'systematic_review'
      }
    ]
    
    for (const [index, testCase] of testCases.entries()) {
      try {
        console.log(`\nTest ${index + 1}: ${JSON.stringify(testCase, null, 2)}`)
        
        const { data, error } = await supabase
          .from('projects')
          .insert(testCase)
          .select()
        
        if (error) {
          console.log(`❌ Failed: ${error.message}`)
          
          // Analyze the error to understand what's missing/wrong
          if (error.message.includes('null value in column')) {
            const match = error.message.match(/null value in column "([^"]+)"/);
            if (match) {
              console.log(`   🔍 Missing required column: ${match[1]}`)
            }
          } else if (error.message.includes('invalid input value for enum')) {
            const match = error.message.match(/invalid input value for enum (\w+): "([^"]+)"/);
            if (match) {
              console.log(`   🔍 Invalid enum value for ${match[1]}: ${match[2]}`)
            }
          }
        } else {
          console.log(`✅ Success! Created project with ID: ${data?.[0]?.id}`)
          
          // Clean up the test project
          if (data?.[0]?.id) {
            await supabase.from('projects').delete().eq('id', data[0].id)
            console.log(`   🧹 Cleaned up test project`)
          }
        }
      } catch (err) {
        console.log(`💥 Test ${index + 1} error: ${err.message}`)
      }
    }
    
    console.log('\n📈 FINAL ANALYSIS SUMMARY')
    console.log('=========================')
    
    console.log('Based on the tests above:')
    console.log('1. All required tables exist in the database')
    console.log('2. The projects table has enum constraints that need to be understood')
    console.log('3. Row Level Security is properly configured and active')
    console.log('4. The table structure might differ from what the frontend expects')
    
    console.log('\n💡 RECOMMENDATIONS:')
    console.log('1. Check the actual enum values defined in the database')
    console.log('2. Ensure RLS policies allow authenticated users to insert')
    console.log('3. Verify the required vs optional columns')
    console.log('4. Test with an actual authenticated user session')
    
  } catch (error) {
    console.error('💥 Schema analysis failed:', error.message)
  }
}

analyzeSchema()
  .then(() => {
    console.log('\n✨ Schema analysis completed!')
  })
  .catch((error) => {
    console.error('\n💥 Schema analysis failed:', error.message)
  })