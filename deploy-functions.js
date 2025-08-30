#!/usr/bin/env node

import { exec } from 'child_process'
import { promisify } from 'util'
import { readdir } from 'fs/promises'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const execAsync = promisify(exec)

// Configuration
const PROJECT_REF = 'qzvfufadiqmizrozejci'
const FUNCTIONS_DIR = './supabase/functions'

async function deployEdgeFunctions() {
  console.log('🚀 Supabase Edge Functions Deployment')
  console.log('=====================================\n')
  
  try {
    // Get list of functions
    const functions = await readdir(FUNCTIONS_DIR)
    console.log(`📦 Found ${functions.length} edge functions:\n`)
    functions.forEach(func => console.log(`   • ${func}`))
    console.log('')

    // Check Supabase CLI availability
    console.log('🔍 Checking Supabase CLI...')
    const { stdout: version } = await execAsync('npx supabase --version')
    console.log(`✅ Supabase CLI version: ${version.trim()}\n`)

    // Deploy functions one by one
    console.log('📤 Starting deployment process...\n')
    
    const results = []
    for (const funcName of functions) {
      console.log(`📌 Deploying: ${funcName}`)
      
      try {
        // Build the deploy command
        const command = `npx supabase functions deploy ${funcName} --project-ref ${PROJECT_REF}`
        
        console.log(`   Running: ${command}`)
        const { stdout, stderr } = await execAsync(command)
        
        if (stderr && !stderr.includes('Warning')) {
          console.log(`   ⚠️  Warning: ${stderr}`)
        }
        
        console.log(`   ✅ Successfully deployed: ${funcName}`)
        if (stdout) {
          console.log(`   Response: ${stdout.trim()}`)
        }
        
        results.push({ function: funcName, status: 'success' })
      } catch (error) {
        console.log(`   ❌ Failed to deploy: ${funcName}`)
        console.log(`   Error: ${error.message}`)
        results.push({ function: funcName, status: 'failed', error: error.message })
      }
      
      console.log('')
    }

    // Summary
    console.log('📊 Deployment Summary:')
    console.log('======================')
    const successful = results.filter(r => r.status === 'success').length
    const failed = results.filter(r => r.status === 'failed').length
    
    console.log(`   ✅ Successful: ${successful}`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log('')

    if (failed > 0) {
      console.log('Failed functions:')
      results.filter(r => r.status === 'failed').forEach(r => {
        console.log(`   • ${r.function}: ${r.error}`)
      })
      console.log('')
    }

    // Instructions for testing
    console.log('🧪 Testing Instructions:')
    console.log('========================')
    console.log('To test a function:')
    console.log(`   npx supabase functions invoke <function-name> --project-ref ${PROJECT_REF}`)
    console.log('')
    console.log('Example:')
    console.log(`   npx supabase functions invoke hello-world --project-ref ${PROJECT_REF}`)
    console.log('')
    
    // List functions command
    console.log('To list all deployed functions:')
    console.log(`   npx supabase functions list --project-ref ${PROJECT_REF}`)
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message)
    console.log('\n💡 Troubleshooting:')
    console.log('1. Make sure you are logged in:')
    console.log('   npx supabase login')
    console.log('2. Link your project:')
    console.log(`   npx supabase link --project-ref ${PROJECT_REF}`)
    console.log('3. Check your access token:')
    console.log('   Get it from: https://supabase.com/dashboard/account/tokens')
    process.exit(1)
  }
}

// Run deployment
deployEdgeFunctions()