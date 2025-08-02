#!/usr/bin/env node

/**
 * Quick Database Health Check - Run this regularly to monitor database status
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const ANON_KEY = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

console.log('🏥 QUICK DATABASE HEALTH CHECK');
console.log(`${new Date().toISOString()}`);
console.log('===============================\n');

const criticalTables = ['profiles', 'projects', 'articles', 'search_queries', 'extraction_templates'];

async function quickHealthCheck() {
  let healthy = 0;
  let issues = 0;
  
  console.log('📊 Core Table Status:');
  
  for (const table of criticalTables) {
    try {
      const start = Date.now();
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      const duration = Date.now() - start;
      
      if (error && error.code !== 'PGRST301') {
        console.log(`❌ ${table}: ${error.message}`);
        issues++;
      } else {
        console.log(`✅ ${table}: OK (${duration}ms)`);
        healthy++;
      }
    } catch (e) {
      console.log(`❌ ${table}: Exception - ${e.message}`);
      issues++;
    }
  }
  
  console.log(`\n📈 Health Score: ${healthy}/${healthy + issues} (${Math.round(healthy/(healthy + issues) * 100)}%)`);
  
  if (issues === 0) {
    console.log('🎉 All systems operational!');
  } else {
    console.log(`⚠️  ${issues} issue(s) detected - check full analysis report.`);
  }
  
  // Quick RLS test
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({ test: 'unauthorized' });
    
    if (error && error.code === '42501') {
      console.log('🔒 RLS: Working correctly');
    } else {
      console.log('⚠️  RLS: May need attention');
    }
  } catch (e) {
    console.log('🔒 RLS: Protected (expected)');
  }
}

quickHealthCheck().catch(console.error);