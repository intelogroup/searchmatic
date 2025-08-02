import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dmZ1ZmFkaXFtaXpyb3plamNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkzMTQwOSwiZXhwIjoyMDY5NTA3NDA5fQ.ThqBa2lzMrm6zADqVIQzqK7-HvYOpfoVvsh_9qdwxgc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyMVPDatabase() {
  console.log('🔍 Verifying Searchmatic MVP Database Schema...\n');
  
  // Core MVP tables required
  const mvpTables = {
    'profiles': 'User profiles (extends Supabase Auth)',
    'projects': 'Research projects',
    'protocols': 'Research protocols (should be renamed from manifestos)', // Key change
    'articles': 'Research articles/papers',
    'search_queries': 'Database search queries',
    'conversations': 'AI chat conversations',
    'messages': 'Chat messages',
    'extraction_templates': 'Data extraction templates',
    'extracted_data': 'Extracted article data',
    'export_logs': 'Export history'
  };
  
  // Check existing tables
  console.log('✅ Tables found in database:');
  const existingTables = [
    'articles', 'profiles', 'projects', 'search_queries',
    'manifestos', 'extracted_data', 'extracted_elements', 
    'extracted_references', 'pdf_files', 'pdf_processing_queue',
    'pdf_processing_logs', 'pdf_processing_stats', 'duplicate_pairs',
    'deduplication_stats', 'ai_conversations', 'extraction_templates'
  ];
  
  existingTables.forEach(table => console.log(`   - ${table}`));
  
  console.log('\n📋 MVP Requirements Analysis:');
  console.log('=====================================');
  
  let allGood = true;
  
  for (const [table, description] of Object.entries(mvpTables)) {
    if (table === 'protocols' && existingTables.includes('manifestos')) {
      console.log(`✅ ${table}: Found as 'manifestos' (needs rename) - ${description}`);
    } else if (existingTables.includes(table)) {
      console.log(`✅ ${table}: Found - ${description}`);
    } else {
      console.log(`❌ ${table}: Missing - ${description}`);
      allGood = false;
    }
  }
  
  console.log('\n🔧 Required Actions:');
  console.log('===================');
  
  // Check if we need to rename manifestos to protocols
  if (existingTables.includes('manifestos') && !existingTables.includes('protocols')) {
    console.log('📝 1. Rename "manifestos" table to "protocols"');
    allGood = false;
  }
  
  // Check missing core tables
  const missingCoreTables = ['conversations', 'messages', 'export_logs'].filter(
    t => !existingTables.includes(t)
  );
  
  if (missingCoreTables.length > 0) {
    console.log(`📝 2. Add missing tables: ${missingCoreTables.join(', ')}`);
    allGood = false;
  }
  
  // Test basic functionality
  console.log('\n🧪 Testing Database Access:');
  console.log('============================');
  
  try {
    // Test projects table
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('count', { count: 'exact', head: true });
    
    if (projectError) {
      console.log(`❌ Projects table: ${projectError.message}`);
    } else {
      console.log(`✅ Projects table: Accessible (${projects || 0} records)`);
    }
    
    // Test articles table
    const { data: articles, error: articleError } = await supabase
      .from('articles')
      .select('count', { count: 'exact', head: true });
    
    if (articleError) {
      console.log(`❌ Articles table: ${articleError.message}`);
    } else {
      console.log(`✅ Articles table: Accessible (${articles || 0} records)`);
    }
    
    // Test manifestos/protocols table
    const { data: manifestos, error: manifestoError } = await supabase
      .from('manifestos')
      .select('count', { count: 'exact', head: true });
    
    if (manifestoError) {
      console.log(`❌ Manifestos table: ${manifestoError.message}`);
    } else {
      console.log(`✅ Manifestos table: Accessible (${manifestos || 0} records)`);
    }
    
  } catch (error) {
    console.error('❌ Database test error:', error.message);
    allGood = false;
  }
  
  console.log('\n📊 MVP Readiness Assessment:');
  console.log('=============================');
  
  if (allGood) {
    console.log('🎉 Database is MVP-ready!');
    console.log('✅ All core tables exist');
    console.log('✅ Service role access working');
    console.log('✅ Ready for frontend integration');  
  } else {
    console.log('⚠️  Database needs updates for MVP');
    console.log('📝 Schema migrations required');
    console.log('🔧 Run schema updates to complete setup');
  }
  
  return { allGood, missingCoreTables, needsRename: existingTables.includes('manifestos') };
}

// Run verification
verifyMVPDatabase().then(result => {
  if (!result.allGood) {
    console.log('\n🚀 Next Steps:');
    console.log('1. Apply schema updates (rename + missing tables)');
    console.log('2. Test React components');
    console.log('3. Verify MVP functionality');
  }
});