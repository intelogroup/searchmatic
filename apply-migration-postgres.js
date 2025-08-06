#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { join } from 'path';

// Database connection string
const connectionString = 'postgresql://postgres.qzvfufadiqmizrozejci:YOUR_SUPABASE_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

console.log('🚀 ENHANCED DATABASE MIGRATION - DIRECT POSTGRES');
console.log('===============================================');

async function applyMigration() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read the migration file
    const migrationPath = join(process.cwd(), 'enhanced-database-migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log('🗂️  Size:', Math.round(migrationSQL.length / 1024), 'KB');
    
    // Execute the migration
    console.log('\n🔄 Executing migration...');
    
    const result = await client.query(migrationSQL);
    console.log('✅ Migration executed successfully!');
    
    // Verify the results
    await verifyMigration(client);
    
  } catch (error) {
    if (error.message.includes('password authentication failed')) {
      console.error('🚨 Authentication failed. Please check the database password.');
      console.log('💡 You need to get the actual database password from Supabase Dashboard > Settings > Database');
      console.log('🔗 https://supabase.com/dashboard/project/qzvfufadiqmizrozejci/settings/database');
    } else {
      console.error('🚨 Migration failed:', error.message);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

async function verifyMigration(client) {
  console.log('\n🔍 VERIFYING MIGRATION RESULTS');
  console.log('===============================');
  
  try {
    // Check enum types
    const enumResult = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typname IN ('project_type', 'project_status', 'study_type', 'study_status')
      ORDER BY typname;
    `);
    
    console.log('📋 Enum types found:', enumResult.rows.map(row => row.typname));
    
    // Check projects table structure
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position;
    `);
    
    console.log('🏗️  Projects table columns:');
    columnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if studies table exists
    const studiesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'studies' AND table_schema = 'public';
    `);
    
    const studiesExists = studiesResult.rows.length > 0;
    console.log('📚 Studies table:', studiesExists ? '✅ EXISTS' : '❌ NOT FOUND');
    
    // Check RLS status
    const rlsResult = await client.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename IN ('projects', 'studies') 
      AND schemaname = 'public';
    `);
    
    console.log('🔐 RLS Status:');
    rlsResult.rows.forEach(table => {
      console.log(`   - ${table.tablename}: ${table.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
    });
    
    console.log('\n✨ Verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Execute the migration
await applyMigration();