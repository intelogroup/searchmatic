import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import postgres from 'postgres'

console.log('🔍 Drizzle ORM Database Inspection')
console.log('==================================\n')

async function inspectWithDrizzle() {
  let client
  
  try {
    // Create connection (same as our client.ts)
    client = postgres({
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      username: 'postgres.qzvfufadiqmizrozejci',
      password: 'Goldyear2023#$25',
      ssl: 'require',
      prepare: false,
      max: 10
    })
    
    const db = drizzle(client)
    
    console.log('✅ Drizzle ORM connected successfully!\n')

    // Database info with separate queries
    const dbResult = await db.execute(sql`SELECT current_database() as db`)
    const userResult = await db.execute(sql`SELECT current_user as usr`)
    console.log('📊 Database Information:')
    console.log(`   Database: ${dbResult[0].db}`)
    console.log(`   User: ${userResult[0].usr}\n`)

    // List all tables with details
    const tables = await db.execute(sql`
      SELECT 
        t.tablename,
        t.schemaname,
        (
          SELECT COUNT(*) 
          FROM information_schema.columns 
          WHERE table_schema = t.schemaname 
          AND table_name = t.tablename
        ) as column_count,
        (
          SELECT COUNT(*) 
          FROM information_schema.table_constraints tc
          WHERE tc.table_schema = t.schemaname 
          AND tc.table_name = t.tablename
          AND tc.constraint_type = 'PRIMARY KEY'
        ) as has_pk
      FROM pg_tables t
      WHERE t.schemaname = 'public'
      ORDER BY t.tablename
    `)

    console.log('📋 Database Tables:')
    console.log('===================')
    for (const table of tables) {
      const pkIndicator = table.has_pk > 0 ? '🔑' : '⚠️ '
      console.log(`   ${pkIndicator} ${table.tablename} (${table.column_count} columns)`)
    }
    console.log('')

    // Check our expected tables from the schema
    const expectedTables = [
      'profiles', 'user_preferences', 'projects', 'protocols', 'protocol_versions',
      'articles', 'conversations', 'messages', 'search_queries', 
      'extraction_templates', 'export_logs'
    ]

    console.log('✅ Schema Verification:')
    console.log('=======================')
    let existingTables = 0
    let missingTables = 0

    for (const tableName of expectedTables) {
      const exists = tables.some(t => t.tablename === tableName)
      if (exists) {
        console.log(`   ✅ ${tableName} - EXISTS`)
        existingTables++
      } else {
        console.log(`   ❌ ${tableName} - MISSING`)
        missingTables++
      }
    }

    console.log(`\n   Summary: ${existingTables} existing, ${missingTables} missing\n`)

    // Check record counts for existing tables
    console.log('📊 Record Counts:')
    console.log('=================')
    for (const table of tables) {
      try {
        const [countResult] = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM public."${table.tablename}"`))
        console.log(`   ${table.tablename}: ${countResult.count} records`)
      } catch (error) {
        console.log(`   ${table.tablename}: Error counting - ${error.message}`)
      }
    }
    console.log('')

    // Check indexes
    const indexes = await db.execute(sql`
      SELECT 
        indexname,
        tablename,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `)

    console.log('📑 Indexes:')
    console.log('===========')
    const indexByTable = {}
    for (const idx of indexes) {
      if (!indexByTable[idx.tablename]) {
        indexByTable[idx.tablename] = []
      }
      indexByTable[idx.tablename].push(idx.indexname)
    }
    
    for (const [table, idxList] of Object.entries(indexByTable)) {
      console.log(`   ${table}:`)
      for (const idx of idxList) {
        console.log(`      • ${idx}`)
      }
    }
    console.log('')

    // Check functions
    const functions = await db.execute(sql`
      SELECT 
        p.proname as function_name,
        p.pronargs as arg_count,
        n.nspname as schema_name
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.prokind = 'f'
      ORDER BY p.proname
    `)

    console.log('⚡ Custom Functions:')
    console.log('===================')
    if (functions.length === 0) {
      console.log('   No custom functions found')
    } else {
      for (const func of functions) {
        console.log(`   • ${func.function_name} (${func.arg_count} args)`)
      }
    }

    console.log('\n🎉 Drizzle ORM inspection completed successfully!')
    console.log('\n📚 Usage:')
    console.log('=========')
    console.log('Import the Drizzle client in your app:')
    console.log('```typescript')
    console.log("import { db } from './src/db/client'")
    console.log("import { profiles } from './src/db/schema'")
    console.log('')
    console.log('// Query examples:')
    console.log('const users = await db.select().from(profiles)')
    console.log('const user = await db.select().from(profiles).where(eq(profiles.id, userId))')
    console.log('```')
    
  } catch (error) {
    console.error('❌ Drizzle inspection failed:', error.message)
  } finally {
    if (client) {
      await client.end()
    }
  }
}

inspectWithDrizzle()