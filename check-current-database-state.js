#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Checking Current Database State')
console.log('==================================\n')

async function checkDatabaseState() {
  try {
    // Check projects table structure
    console.log('📋 Checking projects table structure...')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1)
    
    if (projectsError) {
      console.log(`❌ Projects table error: ${projectsError.message}`)
      return
    }
    
    let missingColumns = []
    
    if (projects && projects.length > 0) {
      console.log('✅ Projects table exists with columns:')
      const columns = Object.keys(projects[0])
      columns.forEach(col => console.log(`   - ${col}`))
      
      // Check for new columns that should be added
      const expectedColumns = [
        'project_type', 'status', 'research_domain', 'team_size', 
        'progress_percentage', 'current_stage', 'last_activity_at'
      ]
      
      missingColumns = expectedColumns.filter(col => !columns.includes(col))
      if (missingColumns.length > 0) {
        console.log('\n⚠️  Missing columns that need to be added:')
        missingColumns.forEach(col => console.log(`   - ${col}`))
      } else {
        console.log('\n✅ All expected columns are present!')
      }
    } else {
      console.log('ℹ️  Projects table exists but is empty')
      // Since table is empty, we can't check columns this way
      console.log('   Cannot determine column structure from empty table')
      
      // Assume all columns are missing for migration purposes
      missingColumns = [
        'project_type', 'status', 'research_domain', 'team_size', 
        'progress_percentage', 'current_stage', 'last_activity_at'
      ]
      console.log('   Assuming all enhanced columns need to be added')
    }
    
    // Check if studies table exists
    console.log('\n📋 Checking studies table...')
    const { data: studies, error: studiesError } = await supabase
      .from('studies')
      .select('*')
      .limit(1)
    
    if (studiesError) {
      if (studiesError.message.includes("doesn't exist") || studiesError.message.includes('relation') || studiesError.message.includes('table')) {
        console.log('❌ Studies table does NOT exist - needs to be created')
      } else {
        console.log(`❌ Studies table error: ${studiesError.message}`)
      }
    } else {
      console.log('✅ Studies table exists and is accessible')
      if (studies && studies.length > 0) {
        const studyColumns = Object.keys(studies[0])
        console.log('   Columns:', studyColumns.join(', '))
      }
    }
    
    // Test creating a basic project to see what happens
    console.log('\n🧪 Testing project creation...')
    const { data: testProject, error: createError } = await supabase
      .from('projects')
      .insert({
        title: 'Database State Test',
        description: 'Testing current schema capabilities'
      })
      .select()
      .single()
    
    if (createError) {
      console.log(`❌ Project creation failed: ${createError.message}`)
      console.log('   This tells us what columns/constraints are missing')
    } else {
      console.log(`✅ Basic project creation works`)
      console.log(`   Created project: ${testProject.title} (ID: ${testProject.id})`)
      
      // Clean up
      await supabase.from('projects').delete().eq('id', testProject.id)
      console.log('   🧹 Test project cleaned up')
    }
    
    // Check existing project data
    console.log('\n📊 Checking existing project data...')
    const { data: allProjects, error: allError } = await supabase
      .from('projects')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (allError) {
      console.log(`❌ Error fetching projects: ${allError.message}`)
    } else {
      console.log(`✅ Found ${allProjects?.length || 0} existing projects`)
      if (allProjects && allProjects.length > 0) {
        allProjects.forEach(p => {
          console.log(`   - ${p.title} (${p.id})`)
        })
      }
    }
    
    // Summary and recommendations
    console.log('\n📋 Summary & Next Steps:')
    console.log('========================')
    
    if (missingColumns && missingColumns.length > 0) {
      console.log('⚠️  MIGRATION NEEDED: Projects table is missing key columns')
      console.log('   Missing:', missingColumns.join(', '))
    }
    
    if (studiesError && studiesError.message.includes("doesn't exist")) {
      console.log('⚠️  MIGRATION NEEDED: Studies table does not exist')
    }
    
    console.log('\n✅ Recommended approach:')
    console.log('1. Copy the enhanced-database-migration.sql file')
    console.log('2. Go to Supabase Dashboard SQL Editor')
    console.log('3. Paste and execute the migration script')
    console.log('4. Run this script again to verify')
    
    console.log('\n🔗 Supabase SQL Editor:')
    console.log('   https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql')
    
  } catch (error) {
    console.error('❌ Database state check failed:', error.message)
  }
}

checkDatabaseState()
  .then(() => {
    console.log('\n✨ Database state check completed!')
  })
  .catch((error) => {
    console.error('\n💥 Database state check failed:', error.message)
  })