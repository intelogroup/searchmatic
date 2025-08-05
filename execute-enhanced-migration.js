#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Found' : '❌ Missing')
  process.exit(1)
}

console.log('🚀 Executing Enhanced Database Migration')
console.log('📍 Supabase URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeMigration() {
  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'enhanced-database-migration.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    console.log('📂 Migration file loaded:', migrationPath)
    console.log('📏 Migration size:', migrationSQL.length, 'characters')
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(/;\s*\n/)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'))
    
    console.log('📋 Found', statements.length, 'SQL statements to execute')
    
    let successCount = 0
    let errorCount = 0
    const errors = []
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement) continue
      
      try {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`)
        console.log('📝 Statement preview:', statement.substring(0, 100) + '...')
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        })
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message)
          errors.push({ statement: i + 1, error: error.message, sql: statement.substring(0, 200) })
          errorCount++
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
          successCount++
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message)
        errors.push({ statement: i + 1, error: err.message, sql: statement.substring(0, 200) })
        errorCount++
      }
    }
    
    console.log('\n📊 Migration Summary:')
    console.log('✅ Successful statements:', successCount)
    console.log('❌ Failed statements:', errorCount)
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:')
      errors.forEach((err, idx) => {
        console.log(`${idx + 1}. Statement ${err.statement}: ${err.error}`)
        console.log(`   SQL: ${err.sql}...`)
      })
    }
    
    // Verify the migration results
    console.log('\n🔍 Verifying migration results...')
    await verifyMigration()
    
  } catch (error) {
    console.error('❌ Migration execution failed:', error.message)
    process.exit(1)
  }
}

async function verifyMigration() {
  try {
    // Check enum types
    console.log('\n🔍 Checking enum types...')
    const { data: enums, error: enumError } = await supabase
      .from('pg_type')
      .select('typname')
      .in('typname', ['project_type', 'project_status', 'study_type', 'study_status'])
    
    if (enumError) {
      console.error('❌ Error checking enums:', enumError.message)
    } else {
      console.log('✅ Found enums:', enums?.map(e => e.typname).join(', ') || 'none')
    }
    
    // Check projects table structure
    console.log('\n🔍 Checking projects table...')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1)
    
    if (projectsError) {
      console.error('❌ Projects table error:', projectsError.message)
    } else {
      console.log('✅ Projects table accessible')
    }
    
    // Check studies table
    console.log('\n🔍 Checking studies table...')
    const { data: studies, error: studiesError } = await supabase
      .from('studies')
      .select('*')
      .limit(1)
    
    if (studiesError) {
      console.error('❌ Studies table error:', studiesError.message)
    } else {
      console.log('✅ Studies table accessible')
    }
    
    // Test project creation
    console.log('\n🧪 Testing project creation...')
    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert({
        title: 'Test Migration Project',
        description: 'Testing enhanced migration',
        project_type: 'systematic_review',
        status: 'draft'
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Project creation failed:', createError.message)
    } else {
      console.log('✅ Project creation successful:', newProject?.id)
      
      // Clean up test project
      await supabase.from('projects').delete().eq('id', newProject.id)
      console.log('🧹 Test project cleaned up')
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

// Execute the migration
executeMigration()
  .then(() => {
    console.log('\n🎉 Migration process completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Migration process failed:', error.message)
    process.exit(1)
  })