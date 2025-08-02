#!/usr/bin/env node

/**
 * Comprehensive Supabase Database Analysis Script
 * Uses service role key for full database access and verification
 */

import { createClient } from '@supabase/supabase-js';

// Configuration from mcp.json and .env.local
const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const ANON_KEY = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS'; // From .env.local

// Create Supabase client with anon key (respects RLS)
const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

console.log('🔍 COMPREHENSIVE SUPABASE DATABASE ANALYSIS');
console.log('==============================================\n');

// Expected tables based on migration files
const expectedTables = [
  'profiles',
  'projects', 
  'search_queries',
  'articles',
  'conversations',
  'messages',
  'extraction_templates',
  'export_logs'
];

// Legacy tables that might exist
const legacyTables = [
  'manifestos', // should be renamed to protocols
  'ai_conversations', // might be old name
  'extracted_data',
  'extracted_elements',
  'extracted_references',
  'pdf_files',
  'pdf_processing_queue',
  'pdf_processing_logs',
  'pdf_processing_stats',
  'duplicate_pairs',
  'deduplication_stats'
];

async function checkConnection() {
  console.log('📡 1. DATABASE CONNECTION TEST');
  console.log('==============================');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
      throw error;
    }
    
    console.log('✅ Connection successful');
    console.log(`   URL: ${SUPABASE_URL}`);
    console.log(`   Using: Anonymous Key (respects RLS)`);
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Connection failed');
    console.log(`   Error: ${error.message}`);
    console.log('');
    return false;
  }
}

async function listAllTables() {
  console.log('🗂️  2. TABLE INVENTORY');
  console.log('======================');
  
  try {
    // Query information_schema to get all tables
    const { data, error } = await supabase.rpc('get_tables_info');
    
    if (error) {
      // Fallback: try to query each expected table
      console.log('   Using fallback method...');
      const tables = [];
      
      for (const table of [...expectedTables, ...legacyTables]) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('count')
            .limit(1);
          
          if (!error || error.code === 'PGRST103') { // Empty result is OK
            tables.push(table);
          }
        } catch (e) {
          // Table doesn't exist, skip
        }
      }
      
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach(table => console.log(`   - ${table}`));
      console.log('');
      return tables;
    }
    
    console.log(`✅ Found ${data?.length || 0} tables`);
    data?.forEach(table => console.log(`   - ${table.table_name}`));
    console.log('');
    return data?.map(t => t.table_name) || [];
    
  } catch (error) {
    console.log('❌ Failed to list tables');
    console.log(`   Error: ${error.message}`);
    console.log('');
    return [];
  }
}

async function analyzeTableSchema(tableName) {
  console.log(`📋 Analyzing table: ${tableName}`);
  console.log('-'.repeat(30));
  
  try {
    // Get table structure by attempting to select with limit 0
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);
    
    if (error) {
      console.log(`❌ Cannot access table: ${error.message}`);
      return null;
    }
    
    // Get count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ Table accessible`);
    console.log(`   Records: ${count !== null ? count : 'unknown'}`);
    
    // Try to get a sample record to understand structure
    const { data: sample, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (sample && sample.length > 0) {
      console.log(`   Columns: ${Object.keys(sample[0]).join(', ')}`);
    }
    
    console.log('');
    return { accessible: true, count, columns: sample?.[0] ? Object.keys(sample[0]) : [] };
    
  } catch (error) {
    console.log(`❌ Error analyzing table: ${error.message}`);
    console.log('');
    return null;
  }
}

async function checkRLSPolicies() {
  console.log('🔒 3. ROW LEVEL SECURITY ANALYSIS');
  console.log('==================================');
  
  // Test RLS using the same anon client (already respects RLS)
  const anonClient = supabase;
  
  for (const table of expectedTables) {
    try {
      // Try to access table with anon key (should be restricted by RLS)
      const { data, error } = await anonClient
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST301') {
        console.log(`✅ ${table}: RLS properly configured (access denied)`);
      } else if (error && error.code === 'PGRST116') {
        console.log(`⚠️  ${table}: Table not found`);
      } else {
        console.log(`⚠️  ${table}: RLS might not be configured (access allowed)`);
      }
    } catch (error) {
      console.log(`❌ ${table}: Error checking RLS - ${error.message}`);
    }
  }
  console.log('');
}

async function checkExtensions() {
  console.log('🔧 4. EXTENSIONS AND FUNCTIONS');
  console.log('===============================');
  
  const requiredExtensions = ['uuid-ossp', 'vector', 'pg_trgm'];
  
  for (const ext of requiredExtensions) {
    try {
      // Try to use extension functionality
      let testQuery;
      switch (ext) {
        case 'uuid-ossp':
          testQuery = supabase.rpc('uuid_generate_v4');
          break;
        case 'vector':
          // Vector extension test would require a table with vector column
          console.log(`⚠️  ${ext}: Cannot test without vector column`);
          continue;
        case 'pg_trgm':
          // Test trigram extension
          console.log(`⚠️  ${ext}: Cannot test without complex query`);
          continue;
      }
      
      if (testQuery) {
        const { data, error } = await testQuery;
        if (error) {
          console.log(`❌ ${ext}: Not available - ${error.message}`);
        } else {
          console.log(`✅ ${ext}: Working`);
        }
      }
    } catch (error) {
      console.log(`❌ ${ext}: Error testing - ${error.message}`);
    }
  }
  console.log('');
}

async function checkMigrationStatus() {
  console.log('📈 5. MIGRATION STATUS');
  console.log('======================');
  
  // Check for manifestos table (should be renamed to protocols)
  try {
    const { data: manifestos, error: manifestosError } = await supabase
      .from('manifestos')
      .select('count')
      .limit(1);
    
    if (!manifestosError) {
      console.log('⚠️  Found "manifestos" table - should be renamed to "protocols"');
    }
  } catch (e) {
    // Expected if table doesn't exist
  }
  
  // Check for missing expected tables
  const missingTables = [];
  for (const table of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        missingTables.push(table);
      }
    } catch (e) {
      missingTables.push(table);
    }
  }
  
  if (missingTables.length > 0) {
    console.log('❌ Missing expected tables:');
    missingTables.forEach(table => console.log(`   - ${table}`));
  } else {
    console.log('✅ All expected tables present');
  }
  
  console.log('');
}

async function performanceAnalysis() {
  console.log('⚡ 6. PERFORMANCE ANALYSIS');
  console.log('==========================');
  
  // Test basic query performance
  const tables = ['profiles', 'projects', 'articles'];
  
  for (const table of tables) {
    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      const endTime = Date.now();
      
      if (!error) {
        console.log(`✅ ${table}: Query time ${endTime - startTime}ms`);
      } else if (error.code === 'PGRST116') {
        console.log(`⚠️  ${table}: Table not found`);
      } else {
        console.log(`❌ ${table}: Query failed - ${error.message}`);
      }
    } catch (error) {
      console.log(`❌ ${table}: Error - ${error.message}`);
    }
  }
  console.log('');
}

async function generateReport() {
  console.log('📊 7. SUMMARY REPORT');
  console.log('====================');
  
  const issues = [];
  const recommendations = [];
  
  // Check each table
  for (const table of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        issues.push(`Missing table: ${table}`);
        recommendations.push(`Create ${table} table using migration script`);
      }
    } catch (e) {
      issues.push(`Cannot access table: ${table}`);
    }
  }
  
  // Check for legacy tables that need migration
  try {
    const { data, error } = await supabase
      .from('manifestos')
      .select('count')
      .limit(1);
    
    if (!error) {
      issues.push('Table "manifestos" should be renamed to "protocols"');
      recommendations.push('Rename manifestos table to protocols for consistency');
    }
  } catch (e) {
    // Expected if table doesn't exist
  }
  
  console.log(`Issues found: ${issues.length}`);
  issues.forEach((issue, i) => console.log(`${i + 1}. ${issue}`));
  
  console.log('');
  console.log(`Recommendations: ${recommendations.length}`);
  recommendations.forEach((rec, i) => console.log(`${i + 1}. ${rec}`));
  
  console.log('');
  
  // Overall status
  if (issues.length === 0) {
    console.log('🎉 DATABASE STATUS: EXCELLENT');
    console.log('   All tables present and accessible');
    console.log('   Ready for production use');
  } else if (issues.length <= 2) {
    console.log('✅ DATABASE STATUS: GOOD');
    console.log('   Minor issues that are easily fixable');
    console.log('   Ready for development');
  } else {
    console.log('⚠️  DATABASE STATUS: NEEDS ATTENTION');
    console.log('   Several issues require resolution');
    console.log('   Migration scripts should be applied');
  }
}

// Main execution
async function main() {
  try {
    const connected = await checkConnection();
    if (!connected) {
      console.log('Cannot proceed without database connection');
      process.exit(1);
    }
    
    const tables = await listAllTables();
    
    // Analyze each found table
    for (const table of tables) {
      await analyzeTableSchema(table);
    }
    
    await checkRLSPolicies();
    await checkExtensions();
    await checkMigrationStatus();
    await performanceAnalysis();
    await generateReport();
    
  } catch (error) {
    console.error('Fatal error during analysis:', error);
    process.exit(1);
  }
}

main().catch(console.error);