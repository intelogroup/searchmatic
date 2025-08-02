#!/usr/bin/env node

// Check projects table structure by attempting operations
const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co';
const anonKey = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';

async function checkProjectsStructure() {
  console.log('🔍 Checking projects table structure...\n');
  
  try {
    // Try to select with type column
    const response = await fetch(`${supabaseUrl}/rest/v1/projects?select=id,title,type&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Projects table accessible with type column');
      
      if (data.length > 0) {
        console.log(`📊 Sample project: ${JSON.stringify(data[0], null, 2)}`);
        console.log(`🎯 Type column exists: ${data[0].hasOwnProperty('type') ? '✅ YES' : '❌ NO'}`);
      } else {
        console.log('📊 Table exists but is empty');
        console.log('🎯 Type column query successful - column likely exists');
      }
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ Error accessing projects with type column: ${errorText}`);
      
      // Try without type column to see if that's the issue
      const fallbackResponse = await fetch(`${supabaseUrl}/rest/v1/projects?select=*&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        }
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        console.log('✅ Projects table accessible without specifying type column');
        
        if (fallbackData.length > 0) {
          const project = fallbackData[0];
          console.log(`📊 Available columns: ${Object.keys(project).join(', ')}`);
          console.log(`🎯 Type column exists: ${project.hasOwnProperty('type') ? '✅ YES' : '❌ NO - MIGRATION NEEDED'}`);
        } else {
          console.log('📊 Table exists but is empty - cannot determine column structure');
        }
      } else {
        const fallbackErrorText = await fallbackResponse.text();
        console.log(`❌ Fallback check also failed: ${fallbackErrorText}`);
      }
      
      return false;
    }
  } catch (error) {
    console.log(`❌ Exception checking projects structure: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Projects Table Structure Check\n');
  console.log('=' .repeat(50));
  
  await checkProjectsStructure();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Structure check completed');
}

main().catch(console.error);