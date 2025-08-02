#!/usr/bin/env node

/**
 * Final Table Verification - Determine exactly what tables exist
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const ANON_KEY = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

console.log('🔍 FINAL TABLE VERIFICATION');
console.log('===========================\n');

const allPossibleTables = [
  // Expected MVP tables
  'profiles',
  'projects', 
  'protocols',
  'articles',
  'search_queries',
  'conversations',
  'messages',
  'extraction_templates',
  'extracted_data',
  'export_logs',
  
  // Legacy/alternative names
  'manifestos',
  'ai_conversations',
  
  // Additional tables found in earlier analysis
  'extracted_elements',
  'extracted_references',
  'pdf_files',
  'pdf_processing_queue',
  'pdf_processing_logs',
  'pdf_processing_stats',
  'duplicate_pairs',
  'deduplication_stats'
];

async function testTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        return { exists: false, reason: 'Table not found' };
      } else if (error.code === 'PGRST301') {
        return { exists: true, reason: 'RLS policy blocks access', hasRLS: true };
      } else if (error.code === '42P01') {
        return { exists: false, reason: 'Relation does not exist' };
      } else {
        return { exists: true, reason: `Error: ${error.message}`, error: error.code };
      }
    }
    
    // No error means we can access it
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    return { exists: true, reason: 'Accessible', recordCount: count, hasRLS: false };
    
  } catch (error) {
    return { exists: false, reason: `Exception: ${error.message}` };
  }
}

async function main() {
  const results = {};
  
  console.log('Testing all possible tables...\n');
  
  for (const table of allPossibleTables) {
    const result = await testTable(table);
    results[table] = result;
    
    const status = result.exists ? '✅' : '❌';
    const rlsStatus = result.hasRLS ? ' [RLS]' : '';
    const count = result.recordCount !== undefined ? ` (${result.recordCount} records)` : '';
    
    console.log(`${status} ${table}${rlsStatus}${count}`);
    console.log(`   ${result.reason}`);
  }
  
  console.log('\n📊 SUMMARY');
  console.log('===========');
  
  const existing = Object.entries(results).filter(([_, result]) => result.exists);
  const missing = Object.entries(results).filter(([_, result]) => !result.exists);
  const withRLS = existing.filter(([_, result]) => result.hasRLS);
  const withoutRLS = existing.filter(([_, result]) => !result.hasRLS);
  
  console.log(`\n✅ EXISTING TABLES (${existing.length}):`);
  existing.forEach(([table, result]) => {
    const rls = result.hasRLS ? ' [RLS Protected]' : ' [No RLS/Accessible]';
    const count = result.recordCount !== undefined ? ` (${result.recordCount} records)` : '';
    console.log(`   • ${table}${rls}${count}`);
  });
  
  console.log(`\n❌ MISSING TABLES (${missing.length}):`);
  missing.forEach(([table, result]) => {
    console.log(`   • ${table} - ${result.reason}`);
  });
  
  console.log(`\n🔒 RLS STATUS:`);
  console.log(`   • With RLS: ${withRLS.length} tables`);
  console.log(`   • Without RLS: ${withoutRLS.length} tables`);
  
  if (withRLS.length > 0) {
    console.log(`   Tables with RLS:`);
    withRLS.forEach(([table]) => console.log(`     - ${table}`));
  }
  
  if (withoutRLS.length > 0) {
    console.log(`   Tables without RLS (potential security issue):`);
    withoutRLS.forEach(([table]) => console.log(`     - ${table}`));
  }
  
  console.log(`\n🎯 MVP READINESS CHECK:`);
  
  const mvpTables = ['profiles', 'projects', 'articles', 'search_queries', 'extraction_templates'];
  const mvpMissing = mvpTables.filter(table => !results[table]?.exists);
  const mvpFound = mvpTables.filter(table => results[table]?.exists);
  
  console.log(`   Core MVP tables: ${mvpFound.length}/${mvpTables.length} found`);
  
  if (mvpMissing.length > 0) {
    console.log(`   Missing: ${mvpMissing.join(', ')}`);
  } else {
    console.log(`   ✅ All core MVP tables present`);
  }
  
  // Check for naming issues
  if (results['manifestos']?.exists && !results['protocols']?.exists) {
    console.log(`   ⚠️  'manifestos' table exists but should be renamed to 'protocols'`);
  }
  
  if (results['ai_conversations']?.exists && !results['conversations']?.exists) {
    console.log(`   ⚠️  'ai_conversations' table exists but should be renamed to 'conversations'`);
  }
  
  // Chat system check
  const chatTables = ['conversations', 'messages'];
  const chatMissing = chatTables.filter(table => !results[table]?.exists);
  
  if (chatMissing.length > 0) {
    console.log(`   ⚠️  Chat system incomplete: missing ${chatMissing.join(', ')}`);
  } else {
    console.log(`   ✅ Chat system tables present`);
  }
  
  console.log(`\n🔧 RECOMMENDATIONS:`);
  
  if (results['manifestos']?.exists) {
    console.log(`   1. Rename 'manifestos' table to 'protocols'`);
  }
  
  if (chatMissing.length > 0) {
    console.log(`   2. Create missing chat tables: ${chatMissing.join(', ')}`);
  }
  
  if (!results['export_logs']?.exists) {
    console.log(`   3. Create 'export_logs' table for export tracking`);
  }
  
  if (withoutRLS.length > 0) {
    console.log(`   4. Review RLS policies for: ${withoutRLS.map(([table]) => table).join(', ')}`);
  }
}

main().catch(console.error);