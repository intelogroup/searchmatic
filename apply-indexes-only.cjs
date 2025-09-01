/**
 * Apply only the essential indexes for performance
 */

require('dotenv').config()
const postgres = require('postgres')

async function applyIndexes() {
  const sql = postgres(process.env.DATABASE_URL)
  
  console.log('🚀 Applying Database Indexes')
  console.log('=============================')
  
  const indexes = [
    {
      name: 'idx_articles_project_id_status',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_project_id_status ON articles (project_id, status)`
    },
    {
      name: 'idx_articles_project_id_created_at',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_project_id_created_at ON articles (project_id, created_at DESC)`
    },
    {
      name: 'idx_projects_user_id_status',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_id_status ON projects (user_id, status)`
    },
    {
      name: 'idx_projects_user_id_updated_at',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_id_updated_at ON projects (user_id, updated_at DESC)`
    },
    {
      name: 'idx_search_queries_project_id_created_at',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_queries_project_id_created_at ON search_queries (project_id, created_at DESC)`
    },
    {
      name: 'idx_articles_pmid',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_pmid ON articles (pmid) WHERE pmid IS NOT NULL`
    }
  ]
  
  const functions = [
    {
      name: 'get_article_stats',
      sql: `
        CREATE OR REPLACE FUNCTION get_article_stats(project_id UUID)
        RETURNS JSON
        LANGUAGE SQL
        STABLE
        AS $func$
          SELECT json_build_object(
            'pending', COUNT(*) FILTER (WHERE status = 'pending'),
            'included', COUNT(*) FILTER (WHERE status = 'included'),
            'excluded', COUNT(*) FILTER (WHERE status = 'excluded'),
            'maybe', COUNT(*) FILTER (WHERE status = 'maybe')
          )
          FROM articles 
          WHERE articles.project_id = $1;
        $func$;
      `
    },
    {
      name: 'get_dashboard_stats',
      sql: `
        CREATE OR REPLACE FUNCTION get_dashboard_stats(user_id UUID)
        RETURNS JSON
        LANGUAGE SQL
        STABLE
        AS $func$
          WITH project_stats AS (
            SELECT 
              COUNT(*) as total_projects,
              COUNT(*) FILTER (WHERE status = 'active') as active_projects,
              COUNT(*) FILTER (WHERE status = 'completed') as completed_projects
            FROM projects 
            WHERE projects.user_id = $1
          ),
          article_stats AS (
            SELECT 
              COUNT(a.*) as total_articles,
              COUNT(a.*) FILTER (WHERE a.status = 'included') as included_articles
            FROM articles a
            JOIN projects p ON p.id = a.project_id
            WHERE p.user_id = $1
          )
          SELECT json_build_object(
            'totalProjects', ps.total_projects,
            'activeProjects', ps.active_projects,
            'completedProjects', ps.completed_projects,
            'totalArticles', COALESCE(ars.total_articles, 0),
            'includedArticles', COALESCE(ars.included_articles, 0)
          )
          FROM project_stats ps
          CROSS JOIN article_stats ars;
        $func$;
      `
    }
  ]
  
  try {
    // Apply indexes
    for (const index of indexes) {
      try {
        console.log(`⏳ Creating index: ${index.name}...`)
        await sql.unsafe(index.sql)
        console.log(`✅ Index ${index.name} created successfully`)
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Index ${index.name} already exists`)
        } else {
          console.error(`❌ Error creating index ${index.name}:`, error.message)
        }
      }
    }
    
    // Apply functions
    for (const func of functions) {
      try {
        console.log(`⏳ Creating function: ${func.name}...`)
        await sql.unsafe(func.sql)
        console.log(`✅ Function ${func.name} created successfully`)
      } catch (error) {
        console.error(`❌ Error creating function ${func.name}:`, error.message)
      }
    }
    
    // Test the functions
    console.log('\n🧪 Testing functions...')
    
    try {
      // Get a real project ID
      const projects = await sql`SELECT id FROM projects LIMIT 1`
      if (projects.length > 0) {
        const projectId = projects[0].id
        const result = await sql`SELECT get_article_stats(${projectId}) as stats`
        console.log('✅ get_article_stats working:', result[0]?.stats)
      }
    } catch (error) {
      console.log('⚠️  get_article_stats test failed:', error.message)
    }
    
    try {
      // Get a real user ID
      const users = await sql`SELECT id FROM profiles LIMIT 1`
      if (users.length > 0) {
        const userId = users[0].id
        const result = await sql`SELECT get_dashboard_stats(${userId}) as stats`
        console.log('✅ get_dashboard_stats working:', result[0]?.stats)
      }
    } catch (error) {
      console.log('⚠️  get_dashboard_stats test failed:', error.message)
    }
    
    // Show created indexes
    console.log('\n📊 Current indexes:')
    const allIndexes = await sql`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `
    
    allIndexes.forEach(idx => {
      console.log(`   • ${idx.tablename}.${idx.indexname}`)
    })
    
    console.log('\n✨ Database optimization completed!')
    
  } catch (error) {
    console.error('❌ Error during optimization:', error)
    throw error
  } finally {
    await sql.end()
  }
}

applyIndexes()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Optimization failed:', error)
    process.exit(1)
  })