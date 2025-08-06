import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qzvfufadiqmizrozejci.supabase.co',
  'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS'
);

async function checkTables() {
  console.log('📋 Checking database tables for articles/studies...');
  
  // Check studies table
  const { data: studies, error: studiesError } = await supabase
    .from('studies')
    .select('*')
    .limit(1);
  
  if (!studiesError) console.log('✅ studies table exists');
  else console.log('❌ studies:', studiesError.message);
  
  // Check articles table
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('*')
    .limit(1);
  
  if (!articlesError) console.log('✅ articles table exists');
  else console.log('❌ articles:', articlesError.message);
}

checkTables().catch(console.error);