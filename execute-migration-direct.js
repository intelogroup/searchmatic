#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

// Supabase configuration
const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';

console.log('🔄 Attempting to apply database migration with updated service key...');
console.log('');

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!serviceKey) {
  console.log('❌ No service role key provided. Exiting...');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('📖 Reading migration file...');
    const migrationSQL = readFileSync(join(__dirname, 'complete-database-setup.sql'), 'utf8');
    
    console.log('🔗 Testing connection...');
    const { data: testQuery, error: testError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError.message);
      return;
    }
    
    console.log('✅ Connected successfully');
    console.log('');
    console.log('🚀 Executing migration...');
    
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('sql', { 
      query: migrationSQL 
    });
    
    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.log('');
      console.log('💡 Alternative: Copy the SQL from complete-database-setup.sql');
      console.log('   and run it directly in the Supabase SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql');
      return;
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    
    // Verify the tables were created
    console.log('🔍 Verifying table creation...');
    
    const tables = ['conversations', 'messages', 'protocols'];
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: Created successfully`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }
    
    console.log('');
    console.log('🎉 Database migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test the AI chat features in the app');
    console.log('2. Create a new project and test the protocol creation');
    console.log('3. Verify all data is saving correctly');
    
  } catch (error) {
    console.error('❌ Migration script failed:', error.message);
    console.log('');
    console.log('💡 Manual fallback: Run the SQL directly in Supabase Dashboard');
    console.log('   https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql');
  }
}

runMigration();