import { sql } from 'drizzle-orm'
import { db } from './client'

async function inspectDatabaseWithDrizzle() {
  console.log('🔍 Inspecting Database with Drizzle ORM')
  console.log('========================================\n')

  try {
    // Test connection
    const testConnection = await db.execute(sql`SELECT current_database(), current_user, version()`)
    console.log('✅ Database connection successful!')
    console.log(`   Database: ${testConnection[0].current_database}`)
    console.log(`   User: ${testConnection[0].current_user}`)
    console.log(`   Version: ${testConnection[0].version?.split(',')[0]}\n`)

    // List all tables
    const tables = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        (
          SELECT COUNT(*) 
          FROM information_schema.columns 
          WHERE table_schema = t.schemaname 
          AND table_name = t.tablename
        ) as column_count
      FROM pg_tables t
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)

    console.log('📊 Public Schema Tables:')
    console.log('========================')
    for (const table of tables) {
      console.log(`   • ${table.tablename} (${table.column_count} columns)`)
    }

    // Check for specific tables from our schema
    const expectedTables = [
      'profiles',
      'user_preferences',
      'projects',
      'protocols',
      'protocol_versions',
      'articles',
      'conversations',
      'messages',
      'search_queries',
      'extraction_templates',
      'export_logs'
    ]

    console.log('\n✅ Schema Verification:')
    console.log('=======================')
    for (const tableName of expectedTables) {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ) as exists
      `)
      const exists = result[0].exists
      console.log(`   ${exists ? '✅' : '❌'} ${tableName}`)
    }

    // Check for functions
    const functions = await db.execute(sql`
      SELECT 
        proname as function_name,
        pronargs as arg_count
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.prokind = 'f'
      ORDER BY p.proname
    `)

    if (functions.length > 0) {
      console.log('\n⚡ Database Functions:')
      console.log('======================')
      for (const func of functions) {
        console.log(`   • ${func.function_name} (${func.arg_count} args)`)
      }
    }

    // Check indexes
    const indexes = await db.execute(sql`
      SELECT 
        indexname,
        tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `)

    console.log('\n📑 Indexes:')
    console.log('===========')
    const indexByTable: Record<string, string[]> = {}
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

  } catch (error) {
    console.error('❌ Error:', error)
    console.log('\n💡 Tips:')
    console.log('1. Make sure DATABASE_URL is set in .env')
    console.log('2. Get your database password from Supabase dashboard')
    console.log('3. Check Settings > Database > Connection string')
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  inspectDatabaseWithDrizzle()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export { inspectDatabaseWithDrizzle }