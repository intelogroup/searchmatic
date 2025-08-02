#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dmZ1ZmFkaXFtaXpyb3plamNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTI2NzYzOCwiZXhwIjoyMDUwODQzNjM4fQ.QmOA89F8kLjWd9X4b4BDbLiAoHXZoTEwHN-e0xp5ZJg';

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function checkCurrentSchema() {
  console.log('🔍 Checking current database schema...\n');
  
  // Check existing tables
  const tablesQuery = `
    SELECT table_name, table_schema 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  
  const { data: tables, error: tablesError } = await supabase.rpc('sql', {
    query: tablesQuery
  });
  
  if (tablesError) {
    // Try alternative method for checking tables
    const { data: altTables, error: altError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (altError) {
      console.log('❌ Error checking tables:', altError.message);
      return null;
    }
    
    console.log('📋 Current tables in database:');
    if (altTables && altTables.length > 0) {
      altTables.forEach(table => console.log(`  - ${table.table_name}`));
    } else {
      console.log('  No tables found');
    }
    return altTables;
  }
  
  console.log('📋 Current tables in database:');
  if (tables && tables.length > 0) {
    tables.forEach(table => console.log(`  - ${table.table_name}`));
  } else {
    console.log('  No tables found');
  }
  
  return tables;
}

async function checkProjectsTable() {
  console.log('\n🔍 Checking projects table schema...\n');
  
  const columnsQuery = `
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'projects' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `;
  
  try {
    // Try to select from projects table to see if it exists
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
      
    if (projectsError) {
      console.log('❌ Projects table error:', projectsError.message);
      return false;
    }
    
    console.log('✅ Projects table exists and is accessible');
    console.log('📊 Sample data structure:', projectsData?.[0] || 'No data yet');
    
    return true;
  } catch (error) {
    console.log('❌ Error checking projects table:', error.message);
    return false;
  }
}

async function runMigration() {
  console.log('\n🚀 Running database migration...\n');
  
  try {
    // Read the migration script
    const migrationPath = path.join(__dirname, 'complete-database-setup.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons but keep complete statements
    const statements = migrationSQL
      .split(/;\s*(?=(?:[^']*'[^']*')*[^']*$)/) // Split on semicolons not inside quotes
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length < 10) continue; // Skip very short statements
      
      try {
        const { error } = await supabase.rpc('sql', {
          query: statement + ';'
        });
        
        if (error) {
          console.log(`❌ Statement ${i + 1} failed:`, error.message.substring(0, 100));
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Statement ${i + 1} error:`, err.message.substring(0, 100));
        errorCount++;
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Migration Results:`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Failed: ${errorCount}`);
    
    return errorCount === 0;
  } catch (error) {
    console.log('❌ Migration failed:', error.message);
    return false;
  }
}

async function verifyFinalSchema() {
  console.log('\n🔍 Verifying final schema...\n');
  
  const requiredTables = ['projects', 'conversations', 'messages', 'protocols'];
  const existingTables = [];
  
  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ Table '${tableName}' - Error: ${error.message}`);
      } else {
        console.log(`✅ Table '${tableName}' - Accessible and ready`);
        existingTables.push(tableName);
      }
    } catch (err) {
      console.log(`❌ Table '${tableName}' - Exception: ${err.message}`);
    }
  }
  
  // Check for 'type' column in projects table specifically
  if (existingTables.includes('projects')) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, type')
        .limit(1);
        
      if (error) {
        console.log(`❌ Projects table 'type' column check failed: ${error.message}`);
      } else {
        console.log(`✅ Projects table has 'type' column - Ready for use`);
      }
    } catch (err) {
      console.log(`❌ Projects table 'type' column check error: ${err.message}`);
    }
  }
  
  console.log(`\n📋 Final Status:`);
  console.log(`  Required tables: ${requiredTables.length}`);
  console.log(`  Successfully verified: ${existingTables.length}`);
  
  if (existingTables.length === requiredTables.length) {
    console.log(`\n🎉 SUCCESS: All required tables are present and accessible!`);
    return true;
  } else {
    console.log(`\n⚠️  WARNING: ${requiredTables.length - existingTables.length} tables are missing or inaccessible`);
    return false;
  }
}

async function main() {
  console.log('🚀 Searchmatic Database Schema Check & Migration\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Check current schema
    await checkCurrentSchema();
    
    // Step 2: Check projects table specifically
    await checkProjectsTable();
    
    // Step 3: Run migration
    const migrationSuccess = await runMigration();
    
    // Step 4: Verify final schema
    const verificationSuccess = await verifyFinalSchema();
    
    console.log('\n' + '=' .repeat(60));
    if (migrationSuccess && verificationSuccess) {
      console.log('🎉 COMPLETE SUCCESS: Database is fully configured and ready!');
      process.exit(0);
    } else {
      console.log('⚠️  PARTIAL SUCCESS: Some issues remain, but core functionality may work');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 FATAL ERROR:', error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);