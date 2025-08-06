import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qzvfufadiqmizrozejci.supabase.co',
  'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS'
);

async function checkSchema() {
  console.log('🔍 Checking database schema...');
  
  // Check profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (!profilesError) console.log('✅ profiles table exists');
  else console.log('❌ profiles:', profilesError.message);
  
  // Check projects table
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .limit(1);
    
  if (!projectsError) console.log('✅ projects table exists');
  else console.log('❌ projects:', projectsError.message);
  
  // Check protocols table
  const { data: protocols, error: protocolsError } = await supabase
    .from('protocols')
    .select('*')
    .limit(1);
    
  if (!protocolsError) console.log('✅ protocols table exists');
  else console.log('❌ protocols:', protocolsError.message);
  
  // Check conversations table
  const { data: conversations, error: conversationsError } = await supabase
    .from('conversations')
    .select('*')
    .limit(1);
    
  if (!conversationsError) console.log('✅ conversations table exists');
  else console.log('❌ conversations:', conversationsError.message);
  
  // Check messages table
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .limit(1);
    
  if (!messagesError) console.log('✅ messages table exists');
  else console.log('❌ messages:', messagesError.message);
  
  // Check articles table
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('*')
    .limit(1);
    
  if (!articlesError) console.log('✅ articles table exists');
  else console.log('❌ articles:', articlesError.message);
}

checkSchema().catch(console.error);