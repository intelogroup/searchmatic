#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_SERVICE_KEY = 'sbp_99c994d6970e1d4cb36d4cb8caae9e120e499337';

// Create Supabase client with service key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('🚀 Starting database migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250801_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration applied successfully!');
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

// Run the migration
applyMigration();