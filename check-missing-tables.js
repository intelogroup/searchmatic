import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function checkMissingTables() {
  console.log('🔍 Checking for Missing Tables');
  console.log('==============================\n');

  // Tables defined in Drizzle schema
  const schemaTables = [
    'profiles',
    'user_preferences',
    'projects',
    'protocols',
    'protocol_versions',
    'search_queries',
    'articles',
    'conversations',
    'messages',
    'extraction_templates',
    'export_logs'
  ];

  // Query existing tables
  const existingTablesQuery = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;

  const existingTables = existingTablesQuery.map(row => row.table_name);

  console.log('📋 Tables in Drizzle Schema:', schemaTables.length);
  console.log('📊 Tables in Database:', existingTables.length);
  console.log('');

  // Find missing tables
  const missingTables = schemaTables.filter(table => !existingTables.includes(table));
  const extraTables = existingTables.filter(table => !schemaTables.includes(table));

  console.log('✅ Tables that exist:');
  schemaTables.forEach(table => {
    if (existingTables.includes(table)) {
      console.log(`   ✓ ${table}`);
    }
  });

  console.log('\n❌ Missing tables:');
  if (missingTables.length === 0) {
    console.log('   None - all tables exist!');
  } else {
    missingTables.forEach(table => {
      console.log(`   ✗ ${table}`);
    });
  }

  console.log('\n📦 Extra tables in database (not in schema):');
  if (extraTables.length === 0) {
    console.log('   None');
  } else {
    extraTables.forEach(table => {
      console.log(`   - ${table}`);
    });
  }

  // Check for missing enums
  const enumsQuery = await sql`
    SELECT t.typname as enum_name
    FROM pg_type t 
    JOIN pg_namespace n ON n.oid = t.typnamespace 
    WHERE n.nspname = 'public' 
    AND t.typtype = 'e'
    ORDER BY enum_name
  `;

  const existingEnums = enumsQuery.map(row => row.enum_name);
  const schemaEnums = [
    'project_status',
    'article_status',
    'article_source',
    'screening_decision',
    'protocol_status',
    'framework_type'
  ];

  console.log('\n🎨 Enum Types:');
  console.log('Existing enums:', existingEnums.length > 0 ? existingEnums.join(', ') : 'None');
  
  const missingEnums = schemaEnums.filter(e => !existingEnums.includes(e));
  if (missingEnums.length > 0) {
    console.log('Missing enums:', missingEnums.join(', '));
  }

  return { missingTables, missingEnums };
}

checkMissingTables()
  .then(({ missingTables, missingEnums }) => {
    console.log('\n📊 Summary:');
    if (missingTables.length === 0 && missingEnums.length === 0) {
      console.log('✅ All tables and enums are in sync!');
    } else {
      console.log(`⚠️  ${missingTables.length} missing tables`);
      console.log(`⚠️  ${missingEnums.length} missing enums`);
      console.log('\nRun: npx drizzle-kit push');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });