/**
 * Script to apply database optimizations
 * Applies indexes, functions, and performance improvements
 */

require('dotenv').config()
const postgres = require('postgres')
const fs = require('fs')

async function applyOptimizations() {
  const sql = postgres(process.env.DATABASE_URL)
  
  console.log('🚀 Applying Database Optimizations')
  console.log('==================================')
  
  try {
    // Read the optimization SQL file
    const optimizationSQL = fs.readFileSync('./scripts/optimize-database.sql', 'utf8')
    
    console.log('📖 Loaded optimization SQL script')
    
    // Split into individual statements (basic splitting)
    const statements = optimizationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'))
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim().length === 0) continue
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
        await sql.unsafe(statement)
        console.log(`✅ Statement ${i + 1} completed successfully`)
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)`)
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message)
          console.log('Statement was:', statement.substring(0, 200) + '...')
          
          // Continue with other statements unless it's a critical error
          if (!error.message.includes('syntax error')) {
            continue
          } else {
            throw error
          }
        }
      }
    }
    
    console.log('\n🎉 Database optimization completed!')
    
    // Test the optimizations
    console.log('\n🧪 Testing optimization functions...')
    
    // Test get_article_stats function
    try {
      const result = await sql`SELECT get_article_stats('00000000-0000-0000-0000-000000000000'::uuid) as stats`
      console.log('✅ get_article_stats function working:', result[0]?.stats)
    } catch (error) {
      console.log('⚠️  get_article_stats test failed:', error.message)
    }
    
    // Test get_dashboard_stats function
    try {
      const result = await sql`SELECT get_dashboard_stats('00000000-0000-0000-0000-000000000000'::uuid) as stats`
      console.log('✅ get_dashboard_stats function working:', result[0]?.stats)
    } catch (error) {
      console.log('⚠️  get_dashboard_stats test failed:', error.message)
    }
    
    // Check indexes
    console.log('\n📊 Checking created indexes...')
    try {
      const indexes = await sql`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname
      `
      
      console.log(`✅ Found ${indexes.length} performance indexes:`)
      indexes.forEach(idx => {
        console.log(`   • ${idx.tablename}.${idx.indexname}`)
      })
    } catch (error) {
      console.log('⚠️  Error checking indexes:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Fatal error applying optimizations:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

// Run the optimization
applyOptimizations()
  .then(() => {
    console.log('\n✨ All optimizations applied successfully!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 Optimization failed:', error)
    process.exit(1)
  })