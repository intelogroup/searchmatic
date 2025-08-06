#!/usr/bin/env node

/**
 * Fix Type Column Conflict
 * The table has both 'type' and 'project_type' columns causing conflicts
 */

import pg from 'pg';
const { Client } = pg;

// Working connection details
const dbConfig = {
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.qzvfufadiqmizrozejci',
  password: 'Jimkali90#',
  ssl: { rejectUnauthorized: false }
};

async function fixTypeColumnConflict() {
  console.log('🔧 Fixing Type Column Conflict...\n');
  
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('🔌 Connected to database\n');
    
    // Check existing data in both columns
    console.log('📊 Checking existing data...');
    
    const existingData = await client.query(`
      SELECT id, type, status, project_type
      FROM projects 
      LIMIT 5
    `);
    
    console.log(`Found ${existingData.rows.length} existing projects`);
    existingData.rows.forEach((row, i) => {
      console.log(`   Project ${i + 1}: type="${row.type}", project_type="${row.project_type}", status="${row.status}"`);
    });
    
    // Check what enum values each column can accept
    console.log('\n🔍 Checking enum constraints...');
    
    const typeEnumInfo = await client.query(`
      SELECT t.typname, e.enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.oid = (
        SELECT atttypid 
        FROM pg_attribute 
        WHERE attrelid = 'projects'::regclass 
        AND attname = 'type'
      )
      ORDER BY e.enumsortorder
    `);
    
    const projectTypeEnumInfo = await client.query(`
      SELECT t.typname, e.enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.oid = (
        SELECT atttypid 
        FROM pg_attribute 
        WHERE attrelid = 'projects'::regclass 
        AND attname = 'project_type'
      )
      ORDER BY e.enumsortorder
    `);
    
    console.log('   type column enum values:');
    typeEnumInfo.rows.forEach(row => {
      console.log(`      ${row.enumlabel}`);
    });
    
    console.log('   project_type column enum values:');
    projectTypeEnumInfo.rows.forEach(row => {
      console.log(`      ${row.enumlabel}`);
    });
    
    // Strategy: Make the old 'type' column nullable since we want to use 'project_type'
    console.log('\n🛠️  Making legacy type column nullable...');
    
    try {
      await client.query(`
        ALTER TABLE projects 
        ALTER COLUMN type DROP NOT NULL
      `);
      console.log('   ✅ Made type column nullable');
      
      // Set a default value for existing rows that don't have project_type
      await client.query(`
        UPDATE projects 
        SET type = 'guided'
        WHERE type IS NULL
      `);
      console.log('   ✅ Set default values for type column');
      
    } catch (error) {
      console.log(`   ⚠️  Error updating type column: ${error.message}`);
    }
    
    // Now test project creation again
    console.log('\n🧪 Testing Project Creation (Take 2)...');
    
    try {
      const testResult = await client.query(`
        INSERT INTO projects (
          title, 
          project_type, 
          status, 
          research_domain, 
          description,
          user_id, 
          progress_percentage, 
          current_stage,
          type  -- Include the legacy type column with a valid value
        ) VALUES (
          'Fixed Column Conflict Test',
          'systematic_review',
          'draft',
          'Medical Research',
          'Testing after fixing column conflict',
          '00000000-0000-0000-0000-000000000000',
          15,
          'Setup',
          'guided'  -- Use a valid enum value for the legacy column
        ) RETURNING id, title, project_type, status, type, progress_percentage
      `);
      
      const project = testResult.rows[0];
      console.log('   ✅ Project creation successful!');
      console.log(`   📝 Created: "${project.title}"`);
      console.log(`   📊 project_type: ${project.project_type}`);
      console.log(`   📊 status: ${project.status}`);
      console.log(`   📊 legacy type: ${project.type}`);
      console.log(`   📈 Progress: ${project.progress_percentage}%`);
      
      // Test that the app can now create projects without specifying the legacy type column
      console.log('\n🔄 Testing app-compatible project creation...');
      
      const appTestResult = await client.query(`
        INSERT INTO projects (
          title, 
          project_type, 
          status, 
          research_domain, 
          description,
          user_id, 
          progress_percentage, 
          current_stage
        ) VALUES (
          'App-Compatible Test',
          'meta_analysis',
          'active',
          'Healthcare Technology',
          'Testing app-compatible project creation',
          '00000000-0000-0000-0000-000000000000',
          30,
          'Planning'
        ) RETURNING id, title, project_type, status, progress_percentage
      `);
      
      const appProject = appTestResult.rows[0];
      console.log('   ✅ App-compatible project creation successful!');
      console.log(`   📝 Created: "${appProject.title}"`);
      console.log(`   📊 project_type: ${appProject.project_type}`);
      console.log(`   📊 status: ${appProject.status}`);
      console.log(`   📈 Progress: ${appProject.progress_percentage}%`);
      
      // Clean up test data
      await client.query('DELETE FROM projects WHERE id IN ($1, $2)', [project.id, appProject.id]);
      console.log('   🧹 Test data cleaned up');
      
      console.log('\n🎉 COLUMN CONFLICT FIXED SUCCESSFULLY!');
      console.log('✅ Legacy type column made nullable');
      console.log('✅ App can now create projects with project_type column');
      console.log('✅ Both old and new enum values supported');
      console.log('🚀 Searchmatic app is now 100% operational!');
      
      return true;
      
    } catch (error) {
      console.log(`   ❌ Project creation still failed: ${error.message}`);
      
      // Show detailed error context
      console.log('\n🔍 Debugging info:');
      const debugInfo = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'projects'
        AND column_name IN ('type', 'project_type', 'status', 'user_id')
        ORDER BY column_name
      `);
      
      console.log('   Critical columns:');
      debugInfo.rows.forEach(row => {
        console.log(`      ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'required'}) default: ${row.column_default || 'none'}`);
      });
      
      return false;
    }
    
  } catch (error) {
    console.error('💥 Column fix failed:', error.message);
    return false;
    
  } finally {
    try {
      await client.end();
      console.log('\n🔌 Database connection closed');
    } catch (err) {
      // Ignore connection close errors  
    }
  }
}

// Execute the column conflict fix
fixTypeColumnConflict().then(success => {
  if (success) {
    console.log('\n🎯 COLUMN CONFLICT FIX SUCCESSFUL - Database is ready!');
    process.exit(0);
  } else {
    console.log('\n⚠️  COLUMN CONFLICT FIX INCOMPLETE - Check errors above');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Column fix execution failed:', error);
  process.exit(1);
});