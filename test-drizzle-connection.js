import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { sql } from 'drizzle-orm'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL

console.log('🔍 Testing Drizzle Database Connection')
console.log('====================================\n')
console.log('Using DATABASE_URL from environment\n')

async function testConnection() {
  let client
  
  try {
    // Create connection
    client = postgres(DATABASE_URL, { 
      prepare: false // Required for transaction pool mode
    })
    
    const db = drizzle(client)
    
    console.log('✅ Connection established successfully!\n')

    // Test basic query
    const result = await db.execute(sql`SELECT 1 as test`)
    console.log('📊 Basic Query Test:')
    console.log(`   Test result: ${result[0].test}\n`)
    
    // Get database info
    const dbInfo = await db.execute(sql`SELECT current_database() as db, current_user as usr`)
    console.log('📊 Database Info:')
    console.log(`   Database: ${dbInfo[0].db}`)
    console.log(`   User: ${dbInfo[0].usr}\n`)

    // List tables
    const tables = await db.execute(sql`
      SELECT 
        tablename,
        schemaname,
        tableowner
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)

    console.log('📋 Public Schema Tables:')
    console.log('========================')
    if (tables.length === 0) {
      console.log('   No tables found in public schema')
    } else {
      for (const table of tables) {
        console.log(`   • ${table.tablename} (owner: ${table.tableowner})`)
      }
    }
    console.log('')

    // Test row count for each table
    const expectedTables = [
      'profiles',
      'user_preferences', 
      'conversations',
      'messages',
      'projects',
      'protocols',
      'protocol_versions',
      'articles',
      'search_queries',
      'extraction_templates',
      'export_logs'
    ]

    console.log('🔍 Table Row Counts:')
    console.log('====================')
    for (const tableName of expectedTables) {
      try {
        const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM public.${tableName}`))
        const count = countResult[0].count
        console.log(`   ✅ ${tableName}: ${count} records`)
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`   ❌ ${tableName}: Table does not exist`)
        } else {
          console.log(`   ⚠️  ${tableName}: Error - ${error.message}`)
        }
      }
    }

    console.log('\n🎉 Drizzle ORM connection test completed successfully!')
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    console.log('\n💡 Check:')
    console.log('1. DATABASE_URL is correct in .env')
    console.log('2. Database password is correct')
    console.log('3. Network connection to Supabase')
  } finally {
    if (client) {
      await client.end()
    }
  }
}

testConnection()