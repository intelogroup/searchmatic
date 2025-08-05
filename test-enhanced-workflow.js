#!/usr/bin/env node

/**
 * Enhanced Workflow Test Script
 * Tests the complete project-centric workflow implementation
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

// Test with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const log = (message, status = 'info') => {
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' }
  console.log(`${icons[status]} ${message}`)
}

async function testDatabaseConnection() {
  log('Testing database connection...')
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1)
    
    if (error) {
      log(`Database connection failed: ${error.message}`, 'error')
      return false
    }
    
    log('Database connection successful', 'success')
    return true
  } catch (error) {
    log(`Database connection error: ${error.message}`, 'error')
    return false
  }
}

async function testProjectsTable() {
  log('Testing projects table...')
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, project_type, status')
      .limit(5)
    
    if (error) {
      log(`Projects table test failed: ${error.message}`, 'error')
      return false
    }
    
    log(`Projects table accessible - found ${data?.length || 0} projects`, 'success')
    return true
  } catch (error) {
    log(`Projects table error: ${error.message}`, 'error')
    return false
  }
}

async function testStudiesTable() {
  log('Testing studies table (requires migration)...')
  
  try {
    const { data, error } = await supabase
      .from('studies')
      .select('id, title, status')
      .limit(1)
    
    if (error) {
      if (error.code === '42P01') {
        log('Studies table does not exist - database migration required', 'warning')
        return false
      }
      log(`Studies table test failed: ${error.message}`, 'error')
      return false
    }
    
    log('Studies table accessible', 'success')
    return true
  } catch (error) {
    log(`Studies table error: ${error.message}`, 'error')
    return false
  }
}

async function testEnumTypes() {
  log('Testing enum types (requires migration)...')
  
  try {
    const { data, error } = await supabase
      .rpc('pg_typeof', { value: 'systematic_review::project_type' })
    
    if (error) {
      if (error.code === '42883' || error.message.includes('does not exist')) {
        log('Enum types not found - database migration required', 'warning')
        return false
      }
      log(`Enum types test failed: ${error.message}`, 'error')
      return false
    }
    
    log('Enum types available', 'success')
    return true
  } catch (error) {
    log('Enum types not found - database migration required', 'warning')
    return false
  }
}

async function testProjectCreation() {
  log('Testing project creation with enhanced fields...')
  
  try {
    // Check if enhanced columns exist
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, project_type, methodology, objective')
      .limit(1)
    
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        log('Enhanced project columns missing - database migration required', 'warning')
        return false
      }
      log(`Project creation test failed: ${error.message}`, 'error')
      return false
    }
    
    log('Enhanced project fields available', 'success')
    return true
  } catch (error) {
    log(`Project creation test error: ${error.message}`, 'error')
    return false
  }
}

async function testStatisticsFunction() {
  log('Testing project statistics function...')
  
  try {
    const { data, error } = await supabase
      .rpc('get_project_stats', { project_id: '00000000-0000-0000-0000-000000000000' })
    
    if (error) {
      if (error.code === '42883') {
        log('Statistics function not found - database migration required', 'warning')
        return false
      }
      log(`Statistics function test failed: ${error.message}`, 'error')
      return false
    }
    
    log('Statistics function available', 'success')
    return true
  } catch (error) {
    log('Statistics function not found - database migration required', 'warning')
    return false
  }
}

async function main() {
  log('🚀 Enhanced Workflow Test Suite')
  log('=====================================')
  
  const tests = [
    { name: 'Database Connection', test: testDatabaseConnection },
    { name: 'Projects Table', test: testProjectsTable },
    { name: 'Studies Table', test: testStudiesTable },
    { name: 'Enum Types', test: testEnumTypes },
    { name: 'Enhanced Project Fields', test: testProjectCreation },
    { name: 'Statistics Function', test: testStatisticsFunction },
  ]
  
  const results = []
  
  for (const { name, test } of tests) {
    const result = await test()
    results.push({ name, passed: result })
  }
  
  log('')
  log('📊 Test Results Summary')
  log('=====================')
  
  const passed = results.filter(r => r.passed).length
  const total = results.length
  
  results.forEach(({ name, passed }) => {
    log(`${name}: ${passed ? 'PASS' : 'FAIL'}`, passed ? 'success' : 'error')
  })
  
  log('')
  log(`Overall: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    log('🎉 All tests passed! Database migration is complete.', 'success')
  } else {
    log('⚠️  Some tests failed. Database migration may be required.', 'warning')
    log('')
    log('📋 Next Steps:')
    log('1. Apply the database migration: enhanced-database-migration.sql')
    log('2. Run this test script again to verify')
    log('3. Test the application workflow manually')
  }
  
  process.exit(passed === total ? 0 : 1)
}

main().catch(error => {
  log(`Test suite error: ${error.message}`, 'error')
  process.exit(1)
})