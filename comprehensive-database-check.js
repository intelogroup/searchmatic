#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 COMPREHENSIVE SUPABASE DATABASE ANALYSIS')
console.log('============================================')
console.log(`📡 URL: ${supabaseUrl}`)
console.log(`🔑 Key: ${supabaseKey?.substring(0, 20)}...`)
console.log()

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseState() {
  try {
    console.log('1️⃣ CHECKING AUTHENTICATION')
    console.log('==========================')
    
    // Test basic connection
    const { data: authData, error: authError } = await supabase.auth.getSession()
    if (authError) {
      console.log(`❌ Auth error: ${authError.message}`)
    } else {
      console.log('✅ Supabase connection successful')
      console.log(`📝 Session state: ${authData.session ? 'Active' : 'No session'}`)
    }
    
    console.log('\n2️⃣ CHECKING EXISTING TABLES')
    console.log('============================')
    
    // Check each expected table
    const expectedTables = [
      'profiles',
      'projects', 
      'conversations',
      'messages',
      'protocols',
      'articles',
      'search_queries',
      'extraction_templates',
      'extracted_data',
      'export_logs'
    ]
    
    const tableResults = {}
    
    for (const tableName of expectedTables) {
      try {
        console.log(`\n📋 Checking table: ${tableName}`)
        
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          if (error.message.includes("doesn't exist") || 
              error.message.includes('relation') || 
              error.code === 'PGRST116') {
            console.log(`   ❌ Table '${tableName}' does NOT exist`)
            tableResults[tableName] = { exists: false, error: error.message }
          } else {
            console.log(`   ⚠️  Table '${tableName}' exists but has access issues: ${error.message}`)
            tableResults[tableName] = { exists: true, accessible: false, error: error.message }
          }
        } else {
          console.log(`   ✅ Table '${tableName}' exists and is accessible`)
          console.log(`   📊 Row count: ${count}`)
          tableResults[tableName] = { exists: true, accessible: true, count }
          
          // If table has data, show structure
          if (count > 0) {
            const { data: sampleData } = await supabase
              .from(tableName)
              .select('*')
              .limit(1)
            
            if (sampleData && sampleData.length > 0) {
              const columns = Object.keys(sampleData[0])
              console.log(`   🏗️  Columns: ${columns.join(', ')}`)
            }
          }
        }
      } catch (err) {
        console.log(`   💥 Error checking ${tableName}: ${err.message}`)
        tableResults[tableName] = { exists: false, error: err.message }
      }
    }
    
    console.log('\n3️⃣ CHECKING PROJECTS TABLE STRUCTURE')
    console.log('====================================')
    
    if (tableResults.projects?.exists) {
      try {
        // Try to get any existing projects to see structure
        const { data: projects } = await supabase
          .from('projects')
          .select('*')
          .limit(1)
        
        if (projects && projects.length > 0) {
          const columns = Object.keys(projects[0])
          console.log('✅ Current projects table columns:')
          columns.forEach(col => console.log(`   - ${col}`))
          
          // Check for missing columns
          const requiredColumns = [
            'id', 'title', 'description', 'user_id', 'created_at', 'updated_at',
            'type', // This is the key missing column from our earlier analysis
            'status', 'project_type', 'research_domain'
          ]
          
          const missingColumns = requiredColumns.filter(col => !columns.includes(col))
          if (missingColumns.length > 0) {
            console.log('\n⚠️  Missing columns that need to be added:')
            missingColumns.forEach(col => console.log(`   - ${col}`))
          } else {
            console.log('\n✅ All required columns are present!')
          }
        } else {
          console.log('ℹ️  Projects table is empty - cannot determine structure')
          
          // Try to create a test project to see what fails
          console.log('\n🧪 Testing project creation to identify missing columns...')
          const { error: createError } = await supabase
            .from('projects')
            .insert({
              title: 'Test Project',
              description: 'Testing database structure',
              type: 'systematic_review'
            })
          
          if (createError) {
            console.log(`❌ Project creation failed: ${createError.message}`)
            if (createError.message.includes('violates row-level security')) {
              console.log('   🔒 RLS policies are active - this is expected')
              console.log('   ✅ The table structure appears to be working')
            } else if (createError.message.includes('column') && createError.message.includes('does not exist')) {
              console.log('   ⚠️  Missing column detected in error message')
            }
          } else {
            console.log('✅ Test project creation succeeded')
          }
        }
      } catch (err) {
        console.log(`❌ Error analyzing projects table: ${err.message}`)
      }
    }
    
    console.log('\n4️⃣ MIGRATION REQUIREMENTS SUMMARY')
    console.log('==================================')
    
    const existingTables = Object.entries(tableResults)
      .filter(([name, info]) => info.exists)
      .map(([name]) => name)
    
    const missingTables = Object.entries(tableResults)
      .filter(([name, info]) => !info.exists)
      .map(([name]) => name)
    
    console.log(`✅ Existing tables (${existingTables.length}):`)
    existingTables.forEach(table => console.log(`   - ${table}`))
    
    if (missingTables.length > 0) {
      console.log(`\n❌ Missing tables (${missingTables.length}):`)
      missingTables.forEach(table => console.log(`   - ${table}`))
    }
    
    console.log('\n5️⃣ RECOMMENDED NEXT STEPS')
    console.log('==========================')
    
    if (missingTables.length > 0) {
      console.log('🚨 MIGRATION REQUIRED')
      console.log('1. Copy the complete-database-setup.sql file content')
      console.log('2. Open Supabase SQL Editor:')
      console.log('   https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql')
      console.log('3. Paste and execute the migration script')
      console.log('4. Run this script again to verify')
      
      console.log('\n📋 Tables that will be created:')
      missingTables.forEach(table => console.log(`   + ${table}`))
    } else {
      console.log('✅ All tables exist! The database appears to be ready.')
      console.log('💡 If you\'re having issues, check RLS policies and permissions.')
    }
    
    console.log('\n6️⃣ QUICK ACCESS LINKS')
    console.log('======================')
    console.log('🔗 Supabase Dashboard: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci')
    console.log('📊 SQL Editor: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql')
    console.log('🗄️  Table Editor: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/editor')
    console.log('🔐 Authentication: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/auth')
    
  } catch (error) {
    console.error('💥 Database analysis failed:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Run the analysis
checkDatabaseState()
  .then(() => {
    console.log('\n✨ Database analysis completed!')
  })
  .catch((error) => {
    console.error('\n💥 Database analysis failed:', error.message)
    process.exit(1)
  })