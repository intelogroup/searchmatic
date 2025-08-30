import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function createMissingSchema() {
  console.log('🚀 Creating Missing Database Schema');
  console.log('====================================\n');

  try {
    // Step 1: Create enums (check if they exist first)
    console.log('📋 Step 1: Creating enum types...');
    
    // Check existing enums
    const existingEnums = await sql`
      SELECT t.typname as enum_name
      FROM pg_type t 
      JOIN pg_namespace n ON n.oid = t.typnamespace 
      WHERE n.nspname = 'public' 
      AND t.typtype = 'e'
    `;
    const enumNames = existingEnums.map(e => e.enum_name);
    
    // Create missing enums
    if (!enumNames.includes('article_source')) {
      await sql`CREATE TYPE "article_source" AS ENUM('pubmed', 'scopus', 'wos', 'manual', 'other')`;
      console.log('   ✅ Created article_source enum');
    }
    
    if (!enumNames.includes('screening_decision')) {
      await sql`CREATE TYPE "screening_decision" AS ENUM('include', 'exclude', 'maybe')`;
      console.log('   ✅ Created screening_decision enum');
    }
    
    if (!enumNames.includes('protocol_status')) {
      await sql`CREATE TYPE "protocol_status" AS ENUM('draft', 'active', 'archived', 'locked')`;
      console.log('   ✅ Created protocol_status enum');
    }
    
    if (!enumNames.includes('framework_type')) {
      await sql`CREATE TYPE "framework_type" AS ENUM('pico', 'spider', 'other')`;
      console.log('   ✅ Created framework_type enum');
    }

    // Step 2: Create missing tables
    console.log('\n📋 Step 2: Creating missing tables...');

    // Check existing tables
    const existingTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    const tableNames = existingTables.map(t => t.table_name);

    // Create user_preferences
    if (!tableNames.includes('user_preferences')) {
      console.log('\n   Creating user_preferences...');
      await sql`
        CREATE TABLE "user_preferences" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "user_id" uuid NOT NULL,
          "theme" text DEFAULT 'light',
          "language" text DEFAULT 'en',
          "notifications_enabled" boolean DEFAULT true,
          "email_notifications" boolean DEFAULT true,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        )
      `;
      
      // Add foreign key to profiles
      await sql`
        ALTER TABLE "user_preferences" 
        ADD CONSTRAINT "user_preferences_user_id_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "profiles"("id") 
        ON DELETE CASCADE
      `;
      
      console.log('   ✅ Created user_preferences table');
    }

    // Create protocol_versions
    if (!tableNames.includes('protocol_versions')) {
      console.log('\n   Creating protocol_versions...');
      await sql`
        CREATE TABLE "protocol_versions" (
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
      
      // Add foreign keys
      await sql`
        ALTER TABLE "protocol_versions" 
        ADD CONSTRAINT "protocol_versions_protocol_id_fkey" 
        FOREIGN KEY ("protocol_id") 
        REFERENCES "protocols"("id") 
        ON DELETE CASCADE
      `;
      
      await sql`
        ALTER TABLE "protocol_versions" 
        ADD CONSTRAINT "protocol_versions_created_by_fkey" 
        FOREIGN KEY ("created_by") 
        REFERENCES "profiles"("id")
      `;
      
      console.log('   ✅ Created protocol_versions table');
    }

    // Create export_logs
    if (!tableNames.includes('export_logs')) {
      console.log('\n   Creating export_logs...');
      await sql`
        CREATE TABLE "export_logs" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "project_id" uuid NOT NULL,
          "user_id" uuid NOT NULL,
          "file_path" text,
          "format" text,
          "filters" jsonb,
          "created_at" timestamp DEFAULT now()
        )
      `;
      
      // Add foreign keys
      await sql`
        ALTER TABLE "export_logs" 
        ADD CONSTRAINT "export_logs_project_id_fkey" 
        FOREIGN KEY ("project_id") 
        REFERENCES "projects"("id") 
        ON DELETE CASCADE
      `;
      
      await sql`
        ALTER TABLE "export_logs" 
        ADD CONSTRAINT "export_logs_user_id_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "profiles"("id")
      `;
      
      console.log('   ✅ Created export_logs table');
    }

    // Step 3: Update existing tables with missing columns
    console.log('\n📋 Step 3: Adding missing columns to existing tables...');

    // Check articles table columns
    const articleColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'articles' 
      AND table_schema = 'public'
    `;
    const articleColumnNames = articleColumns.map(c => c.column_name);

    // Add missing columns to articles
    if (!articleColumnNames.includes('source')) {
      await sql`ALTER TABLE articles ADD COLUMN "source" "article_source" DEFAULT 'manual'`;
      console.log('   ✅ Added source column to articles');
    }

    if (!articleColumnNames.includes('screening_decision')) {
      await sql`ALTER TABLE articles ADD COLUMN "screening_decision" "screening_decision"`;
      console.log('   ✅ Added screening_decision to articles');
    }

    if (!articleColumnNames.includes('screening_notes')) {
      await sql`ALTER TABLE articles ADD COLUMN "screening_notes" text`;
      console.log('   ✅ Added screening_notes to articles');
    }

    // Step 4: Create indexes
    console.log('\n📋 Step 4: Creating indexes...');
    
    // Create indexes (ignore if they exist)
    try {
      await sql`CREATE INDEX "idx_articles_project_id" ON "articles" ("project_id")`;
      console.log('   ✅ Created idx_articles_project_id');
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
    }

    try {
      await sql`CREATE INDEX "idx_articles_status" ON "articles" ("status")`;
      console.log('   ✅ Created idx_articles_status');
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
    }

    try {
      await sql`CREATE INDEX "idx_articles_screening_decision" ON "articles" ("screening_decision")`;
      console.log('   ✅ Created idx_articles_screening_decision');
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
    }

    // Step 5: Enable RLS
    console.log('\n📋 Step 5: Enabling Row Level Security...');
    const rlsTables = ['user_preferences', 'protocol_versions', 'export_logs'];
    
    for (const table of rlsTables) {
      try {
        await sql`ALTER TABLE ${sql(table)} ENABLE ROW LEVEL SECURITY`;
        console.log(`   ✅ RLS enabled for ${table}`);
      } catch (e) {
        console.log(`   ⏭️  RLS already enabled for ${table}`);
      }
    }

    // Step 6: Verify
    console.log('\n📋 Step 6: Verifying schema...');
    
    const finalTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_preferences', 'protocol_versions', 'export_logs')
      ORDER BY table_name
    `;

    const finalEnums = await sql`
      SELECT t.typname as enum_name
      FROM pg_type t 
      JOIN pg_namespace n ON n.oid = t.typnamespace 
      WHERE n.nspname = 'public' 
      AND t.typtype = 'e'
      ORDER BY enum_name
    `;

    console.log('\n✅ Tables created:', finalTables.map(t => t.table_name).join(', '));
    console.log('✅ Enums created:', finalEnums.map(e => e.enum_name).join(', '));

    console.log('\n🎉 Database schema successfully updated!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

createMissingSchema()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));