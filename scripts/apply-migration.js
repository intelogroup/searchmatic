#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_SERVICE_KEY = 'sbp_99c994d6970e1d4cb36d4cb8caae9e120e499337';

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createMigrationFunction() {
  try {
    console.log('📦 Creating migration function...');
    
    // Read the function creation SQL
    const functionSQL = fs.readFileSync(
      path.join(__dirname, 'create-migration-function.sql'), 
      'utf8'
    );
    
    // Since we can't execute raw SQL directly, we'll need to create this function manually first
    console.log('⚠️  Please run the following SQL in your Supabase Dashboard first:');
    console.log('---');
    console.log(functionSQL);
    console.log('---');
    console.log('');
    
    return false;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

async function applyMigration() {
  try {
    console.log('🚀 Starting database migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250801_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log(`📏 Migration size: ${migrationSQL.length} characters`);
    
    // Call the migration function via RPC
    console.log('🔄 Executing migration via RPC...');
    const { data, error } = await supabase.rpc('run_migration', {
      migration_sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      
      // If function doesn't exist, provide instructions
      if (error.message?.includes('function run_migration') || error.code === '42883') {
        console.log('\n⚠️  The migration function does not exist yet.');
        console.log('Please follow these steps:');
        console.log('1. Go to your Supabase Dashboard SQL Editor');
        console.log('2. Run the SQL from scripts/create-migration-function.sql');
        console.log('3. Then run this script again');
        
        await createMigrationFunction();
      }
      
      process.exit(1);
    }
    
    if (data?.success) {
      console.log('✅ Migration applied successfully!');
      console.log('📅 Completed at:', data.timestamp);
    } else {
      console.error('❌ Migration failed with error:', data?.error);
      console.error('📝 Error detail:', data?.detail);
      process.exit(1);
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Create storage buckets in Supabase Dashboard:');
    console.log('   - pdfs (for PDF uploads)');
    console.log('   - exports (for export files)');
    console.log('2. Apply storage policies from the migration comments');
    console.log('3. Set up environment variables in your deployment platform');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

// Check if we should create the function or run the migration
const args = process.argv.slice(2);

if (args.includes('--create-function')) {
  createMigrationFunction();
} else {
  applyMigration();
}