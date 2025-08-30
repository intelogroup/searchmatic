import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function applyMissingTables() {
  console.log('🚀 Creating Missing Tables and Enums');
  console.log('=====================================\n');

  try {
    // Create missing enums first
    console.log('📋 Creating missing enum types...');
    
    const enumQueries = [
      `CREATE TYPE IF NOT EXISTS "public"."article_source" AS ENUM('pubmed', 'scopus', 'wos', 'manual', 'other')`,
      `CREATE TYPE IF NOT EXISTS "public"."screening_decision" AS ENUM('include', 'exclude', 'maybe')`,
      `CREATE TYPE IF NOT EXISTS "public"."protocol_status" AS ENUM('draft', 'active', 'archived', 'locked')`,
      `CREATE TYPE IF NOT EXISTS "public"."framework_type" AS ENUM('pico', 'spider', 'other')`
    ];

    for (const query of enumQueries) {
      try {
        await sql.unsafe(query);
        console.log('   ✅ Created enum type');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('   ⏭️  Enum already exists');
        } else {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }
    }

    // Create missing tables
    console.log('\n📋 Creating missing tables...');

    // 1. user_preferences table
    console.log('\n1️⃣ Creating user_preferences table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "user_preferences" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        "theme" text DEFAULT 'light',
        "language" text DEFAULT 'en',
        "notifications_enabled" boolean DEFAULT true,
        "email_notifications" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `;
    console.log('   ✅ user_preferences table created');

    // 2. protocol_versions table
    console.log('\n2️⃣ Creating protocol_versions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "protocol_versions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "protocol_id" uuid NOT NULL,
        "version_number" integer NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "research_question" text NOT NULL,
        "framework_type" "framework_type" NOT NULL,
        "changes_summary" text NOT NULL,
        "snapshot_data" jsonb NOT NULL,
        "created_by" uuid NOT NULL,
        "created_at" timestamp DEFAULT now()
      )
    `;
    console.log('   ✅ protocol_versions table created');

    // 3. export_logs table
    console.log('\n3️⃣ Creating export_logs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "export_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "project_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "file_path" text,
        "format" text,
        "filters" jsonb,
        "created_at" timestamp DEFAULT now()
      )
    `;
    console.log('   ✅ export_logs table created');

    // Add missing columns to existing tables if needed
    console.log('\n📋 Checking and adding missing columns...');

    // Check if articles table needs the new columns
    const articleColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'articles' 
      AND table_schema = 'public'
    `;
    
    const existingColumns = articleColumns.map(row => row.column_name);
    
    if (!existingColumns.includes('source')) {
      await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS "source" "article_source" DEFAULT 'manual'`;
      console.log('   ✅ Added source column to articles');
    }
    
    if (!existingColumns.includes('screening_decision')) {
      await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS "screening_decision" "screening_decision"`;
      console.log('   ✅ Added screening_decision column to articles');
    }
    
    if (!existingColumns.includes('screening_notes')) {
      await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS "screening_notes" text`;
      console.log('   ✅ Added screening_notes column to articles');
    }

    // Add indexes
    console.log('\n📋 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS "idx_articles_project_id" ON "articles" ("project_id")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_articles_status" ON "articles" ("status")`;
    await sql`CREATE INDEX IF NOT EXISTS "idx_articles_screening_decision" ON "articles" ("screening_decision")`;
    console.log('   ✅ Indexes created');

    // Enable Row Level Security
    console.log('\n🔒 Enabling Row Level Security...');
    const tables = ['user_preferences', 'protocol_versions', 'export_logs'];
    for (const table of tables) {
      await sql`ALTER TABLE ${sql(table)} ENABLE ROW LEVEL SECURITY`;
      console.log(`   ✅ RLS enabled for ${table}`);
    }

    // Verify all tables now exist
    console.log('\n✅ Verifying tables...');
    const finalCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_preferences', 'protocol_versions', 'export_logs')
    `;

    console.log('   Created tables:', finalCheck.map(r => r.table_name).join(', '));

    console.log('\n🎉 All missing tables and enums have been created successfully!');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

applyMissingTables()
  .then(() => {
    console.log('\n✨ Database schema update complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Failed to update database:', error);
    process.exit(1);
  });