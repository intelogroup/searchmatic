import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Database connection URL for direct connection
const DATABASE_URL = process.env.DATABASE_URL || 
  `postgres://postgres.qzvfufadiqmizrozejci:[YOUR-DB-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres`

async function inspectDatabase() {
  console.log('🔍 Inspecting Supabase Database with Drizzle ORM...\n')
  
  try {
    // Create postgres connection
    const queryClient = postgres(DATABASE_URL)
    const db = drizzle(queryClient)

    // Query to get all tables
    const tables = await queryClient`
      SELECT 
        schemaname,
        tablename,
        tableowner
      FROM pg_tables 
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schemaname, tablename;
    `
    
    console.log('📊 Database Tables:')
    console.log('==================')
    const groupedTables: Record<string, string[]> = {}
    
    for (const table of tables) {
      if (!groupedTables[table.schemaname]) {
        groupedTables[table.schemaname] = []
      }
      groupedTables[table.schemaname].push(table.tablename)
    }
    
    for (const [schema, tableList] of Object.entries(groupedTables)) {
      console.log(`\n📁 Schema: ${schema}`)
      for (const table of tableList) {
        console.log(`   • ${table}`)
      }
    }

    // Check for migrations table
    const migrations = await queryClient`
      SELECT * FROM supabase_migrations.schema_migrations
      ORDER BY version DESC
      LIMIT 10;
    `.catch(() => [])
    
    if (migrations.length > 0) {
      console.log('\n📋 Recent Migrations:')
      console.log('====================')
      for (const migration of migrations) {
        console.log(`   • ${migration.version} - Applied at: ${migration.executed_at || 'Unknown'}`)
      }
    } else {
      console.log('\n⚠️  No migrations table found or no migrations applied')
    }

    // Check edge functions
    const functions = await queryClient`
      SELECT 
        p.proname as function_name,
        n.nspname as schema_name,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.prokind = 'f'
      ORDER BY p.proname;
    `
    
    console.log('\n⚡ Database Functions:')
    console.log('=====================')
    if (functions.length > 0) {
      for (const func of functions) {
        console.log(`   • ${func.function_name}`)
      }
    } else {
      console.log('   No custom functions found')
    }

    // Check for specific tables from migrations
    const expectedTables = [
      'profiles',
      'projects', 
      'articles',
      'conversations',
      'messages',
      'search_queries',
      'extraction_templates',
      'export_logs',
      'protocols',
      'protocol_versions'
    ]
    
    console.log('\n✅ Migration Status Check:')
    console.log('==========================')
    
    for (const tableName of expectedTables) {
      const exists = await queryClient`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ) as exists;
      `
      
      const status = exists[0].exists ? '✅' : '❌'
      console.log(`   ${status} ${tableName}`)
    }

    // Check for undeployed edge functions from filesystem
    console.log('\n📦 Edge Functions Status:')
    console.log('=========================')
    const edgeFunctions = [
      'analyze-literature',
      'chat-completion',
      'duplicate-detection',
      'export-data',
      'hello-world',
      'process-document',
      'protocol-guidance',
      'search-articles'
    ]
    
    console.log('   Functions in /supabase/functions/:')
    for (const funcName of edgeFunctions) {
      console.log(`   📄 ${funcName}`)
    }
    
    console.log('\n   💡 To deploy edge functions, run:')
    console.log('      supabase functions deploy <function-name>')
    console.log('      or')
    console.log('      supabase functions deploy --all')

    // Close connection
    await queryClient.end()
    
  } catch (error) {
    console.error('❌ Error inspecting database:', error)
    console.log('\n💡 Make sure to set DATABASE_URL or update the connection string')
    console.log('   You may need the database password from Supabase dashboard')
  }
}

// Run inspection
inspectDatabase()