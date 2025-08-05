#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co'
const serviceRoleKey = 'sbp_99c994d6970e1d4cb36d4cb8caae9e120e499337'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔍 EXAMINING DATABASE SCHEMAS')
console.log('==============================\n')

async function examineTableStructures() {
  try {
    // Query information_schema to get table structures
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            table_name,
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name IN ('projects', 'profiles', 'conversations', 'messages', 'protocols')
          ORDER BY table_name, ordinal_position;
        `
      })

    if (tableError) {
      console.log('❌ Error querying table info:', tableError.message)
      
      // Fallback: Try to examine each table individually
      await examineIndividualTables()
      return
    }

    if (tableInfo && tableInfo.length > 0) {
      let currentTable = ''
      
      tableInfo.forEach(col => {
        if (col.table_name !== currentTable) {
          currentTable = col.table_name
          console.log(`\n📋 TABLE: ${currentTable.toUpperCase()}`)
          console.log('─'.repeat(50))
        }
        
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)'
        const defaultVal = col.column_default ? ` [default: ${col.column_default}]` : ''
        const maxLength = col.character_maximum_length ? ` (max: ${col.character_maximum_length})` : ''
        
        console.log(`  ${col.column_name}: ${col.data_type}${maxLength} ${nullable}${defaultVal}`)
      })
    } else {
      console.log('❌ No table information found. Trying fallback method...')
      await examineIndividualTables()
    }

    // Check RLS policies
    await checkRLSPolicies()
    
    // Check indexes
    await checkIndexes()
    
  } catch (error) {
    console.log('❌ Error:', error.message)
    await examineIndividualTables()
  }
}

async function examineIndividualTables() {
  console.log('\n🔍 FALLBACK: Examining tables individually')
  console.log('=========================================\n')
  
  const tables = ['profiles', 'projects', 'conversations', 'messages', 'protocols']
  
  for (const table of tables) {
    try {
      console.log(`📋 Examining ${table}...`)
      
      // Try to select with limit 0 to get column info
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
        
        // Check if table exists at all
        const { data: existsData, error: existsError } = await supabase
          .rpc('exec_sql', {
            sql: `SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = '${table}'
            );`
          })
        
        if (existsError) {
          console.log(`   Cannot verify if ${table} exists: ${existsError.message}`)
        } else if (existsData && existsData[0] && existsData[0].exists) {
          console.log(`   ✅ ${table} exists but may have RLS restrictions`)
        } else {
          console.log(`   ❌ ${table} does not exist`)
        }
      } else {
        console.log(`   ✅ ${table} accessible (${data ? data.length : 0} records visible)`)
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
    }
  }
}

async function checkRLSPolicies() {
  console.log('\n🔒 CHECKING RLS POLICIES')
  console.log('========================\n')
  
  try {
    const { data: policies, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE schemaname = 'public'
          ORDER BY tablename, policyname;
        `
      })
    
    if (error) {
      console.log('❌ Error querying RLS policies:', error.message)
      return
    }
    
    if (policies && policies.length > 0) {
      let currentTable = ''
      
      policies.forEach(policy => {
        if (policy.tablename !== currentTable) {
          currentTable = policy.tablename
          console.log(`\n📋 ${currentTable.toUpperCase()} policies:`)
        }
        
        console.log(`  • ${policy.policyname} (${policy.cmd}) - roles: ${policy.roles}`)
        if (policy.qual) console.log(`    Condition: ${policy.qual}`)
      })
    } else {
      console.log('❌ No RLS policies found or not accessible')
    }
  } catch (error) {
    console.log('❌ Error checking RLS policies:', error.message)
  }
}

async function checkIndexes() {
  console.log('\n📊 CHECKING INDEXES')
  console.log('===================\n')
  
  try {
    const { data: indexes, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            indexname,
            indexdef
          FROM pg_indexes 
          WHERE schemaname = 'public'
            AND tablename IN ('projects', 'profiles', 'conversations', 'messages', 'protocols')
          ORDER BY tablename, indexname;
        `
      })
    
    if (error) {
      console.log('❌ Error querying indexes:', error.message)
      return
    }
    
    if (indexes && indexes.length > 0) {
      let currentTable = ''
      
      indexes.forEach(index => {
        if (index.tablename !== currentTable) {
          currentTable = index.tablename
          console.log(`\n📋 ${currentTable.toUpperCase()} indexes:`)
        }
        
        console.log(`  • ${index.indexname}`)
        console.log(`    ${index.indexdef}`)
      })
    } else {
      console.log('❌ No indexes found or not accessible')
    }
  } catch (error) {
    console.log('❌ Error checking indexes:', error.message)
  }
}

async function checkConstraints() {
  console.log('\n🔗 CHECKING CONSTRAINTS')
  console.log('=======================\n')
  
  try {
    const { data: constraints, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            tc.table_name,
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            rc.match_option AS match_type,
            rc.update_rule,
            rc.delete_rule,
            ccu.table_name AS referenced_table_name,
            ccu.column_name AS referenced_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          LEFT JOIN information_schema.referential_constraints AS rc
            ON tc.constraint_name = rc.constraint_name
            AND tc.table_schema = rc.constraint_schema
          LEFT JOIN information_schema.constraint_column_usage AS ccu
            ON rc.unique_constraint_name = ccu.constraint_name
            AND rc.unique_constraint_schema = ccu.table_schema
          WHERE tc.table_schema = 'public'
            AND tc.table_name IN ('projects', 'profiles', 'conversations', 'messages', 'protocols')
          ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
        `
      })
    
    if (error) {
      console.log('❌ Error querying constraints:', error.message)
      return
    }
    
    if (constraints && constraints.length > 0) {
      let currentTable = ''
      
      constraints.forEach(constraint => {
        if (constraint.table_name !== currentTable) {
          currentTable = constraint.table_name
          console.log(`\n📋 ${currentTable.toUpperCase()} constraints:`)
        }
        
        console.log(`  • ${constraint.constraint_name} (${constraint.constraint_type})`)
        console.log(`    Column: ${constraint.column_name}`)
        
        if (constraint.referenced_table_name) {
          console.log(`    References: ${constraint.referenced_table_name}.${constraint.referenced_column_name}`)
          console.log(`    Update rule: ${constraint.update_rule}, Delete rule: ${constraint.delete_rule}`)
        }
      })
    } else {
      console.log('❌ No constraints found or not accessible')
    }
  } catch (error) {
    console.log('❌ Error checking constraints:', error.message)
  }
}

// Run the analysis
examineTableStructures()
  .then(() => checkConstraints())
  .then(() => {
    console.log('\n✅ Database schema examination complete')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })