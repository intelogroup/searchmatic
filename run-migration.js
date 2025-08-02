import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dmZ1ZmFkaXFtaXpyb3plamNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkzMTQwOSwiZXhwIjoyMDY5NTA3NDA5fQ.ThqBa2lzMrm6zADqVIQzqK7-HvYOpfoVvsh_9qdwxgc';

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  console.log('🔄 Testing connection with service role key...');
  
  // Test by trying to list tables
  const { data, error } = await supabase
    .from('profiles')
    .select('count', { count: 'exact', head: true });
  
  if (error) {
    if (error.message.includes('relation "public.profiles" does not exist')) {
      console.log('✅ Connection successful! Database is empty, ready for migration.');
      return true;
    } else {
      console.error('❌ Connection error:', error);
      return false;
    }
  } else {
    console.log('✅ Connection successful! Database already has tables.');
    return true;
  }
}

async function runMigration() {
  try {
    // First test the connection
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    console.log('\n📋 Migration Status:');
    console.log('-------------------');
    console.log('❌ Cannot run raw SQL migrations via JavaScript client');
    console.log('✅ Connection to database verified');
    console.log('✅ Service role authentication working');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Go to: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/sql');
    console.log('2. Copy the migration SQL from: supabase-work/supabase/migrations/20250801_initial_schema.sql');
    console.log('3. Paste and run in SQL Editor');
    
    console.log('\n📝 Alternative: Use the Supabase CLI with database password');
    console.log('   Get password from: https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/settings/database');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the test
runMigration();