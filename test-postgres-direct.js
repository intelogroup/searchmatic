import postgres from 'postgres'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL

console.log('🔍 Testing Direct Postgres Connection')
console.log('===================================\n')

async function testDirectConnection() {
  let sql
  
  try {
    // Create connection
    sql = postgres(DATABASE_URL, {
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      username: 'postgres.qzvfufadiqmizrozejci',
      password: 'Goldyear2023#$25',
      ssl: 'require',
      prepare: false,
      max: 1
    })
    
    console.log('✅ Connection pool created\n')

    // Test basic query
    console.log('🧪 Testing basic query...')
    const result = await sql`SELECT 1 as test`
    console.log(`   Result: ${result[0].test}\n`)

    // Get database info
    console.log('📊 Getting database info...')
    const [dbInfo] = await sql`SELECT current_database() as db, current_user as usr`
    console.log(`   Database: ${dbInfo.db}`)
    console.log(`   User: ${dbInfo.usr}\n`)

    // List tables
    console.log('📋 Listing tables...')
    const tables = await sql`
      SELECT tablename, schemaname 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    
    if (tables.length === 0) {
      console.log('   No tables found in public schema')
    } else {
      console.log('   Public schema tables:')
      for (const table of tables) {
        console.log(`      • ${table.tablename}`)
      }
    }
    console.log('')

    console.log('🎉 Direct postgres connection test successful!')
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    if (error.code) {
      console.error(`   Error code: ${error.code}`)
    }
    console.log('\n💡 Troubleshooting:')
    console.log('1. Check if password has special characters that need escaping')
    console.log('2. Verify the correct pooler endpoint and port')
    console.log('3. Check SSL requirements')
  } finally {
    if (sql) {
      await sql.end()
    }
  }
}

testDirectConnection()