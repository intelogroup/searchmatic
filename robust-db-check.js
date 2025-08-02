#!/usr/bin/env node

// Robust database check with both anon and service keys
const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co';
const anonKey = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dmZ1ZmFkaXFtaXpyb3plamNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTI2NzYzOCwiZXhwIjoyMDUwODQzNjM4fQ.QmOA89F8kLjWd9X4b4BDbLiAoHXZoTEwHN-e0xp5ZJg';

async function testConnection(apiKey, keyType) {
  console.log(`\n🔑 Testing connection with ${keyType} key...\n`);
  
  try {
    // Test basic connection
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      }
    });
    
    if (response.ok) {
      console.log(`✅ ${keyType} key - Connection successful`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ ${keyType} key - Error ${response.status}: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${keyType} key - Exception: ${error.message}`);
    return false;
  }
}

async function checkTablesWithKey(apiKey, keyType) {
  console.log(`\n📋 Checking tables with ${keyType} key...\n`);
  
  const requiredTables = ['projects', 'conversations', 'messages', 'protocols'];
  const accessibleTables = [];
  
  for (const table of requiredTables) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=count&limit=0`, {
        method: 'HEAD',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Prefer': 'count=exact'
        }
      });
      
      if (response.ok) {
        console.log(`✅ Table '${table}' - Accessible`);
        accessibleTables.push(table);
      } else {
        console.log(`❌ Table '${table}' - Error ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Table '${table}' - Exception: ${error.message}`);
    }
  }
  
  return accessibleTables;
}

async function checkProjectsTableStructure(apiKey) {
  console.log(`\n🔍 Checking projects table structure...\n`);
  
  try {
    // Try to get one project to see the structure
    const response = await fetch(`${supabaseUrl}/rest/v1/projects?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Projects table structure check successful');
      
      if (data.length > 0) {
        const project = data[0];
        const hasTypeColumn = 'type' in project;
        console.log(`📊 Sample project keys: ${Object.keys(project).join(', ')}`);
        console.log(`🎯 Has 'type' column: ${hasTypeColumn ? '✅ YES' : '❌ NO'}`);
        return hasTypeColumn;
      } else {
        console.log('📊 Table exists but is empty');
        
        // Try to insert a test record to see the structure
        const testInsert = await fetch(`${supabaseUrl}/rest/v1/projects`, {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            title: 'Schema Test Project',
            description: 'Test project to check schema',
            type: 'systematic_review'
          })
        });
        
        if (testInsert.ok) {
          const insertedData = await testInsert.json();
          console.log('✅ Test insert successful - type column exists');
          console.log(`📊 Inserted project structure: ${Object.keys(insertedData[0] || {}).join(', ')}`);
          
          // Clean up test record
          const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${insertedData[0].id}`, {
            method: 'DELETE',
            headers: {
              'apikey': apiKey,
              'Authorization': `Bearer ${apiKey}`,
            }
          });
          
          if (deleteResponse.ok) {
            console.log('🧹 Test record cleaned up');
          }
          
          return true;
        } else {
          const errorText = await testInsert.text();
          console.log(`❌ Test insert failed: ${errorText}`);
          return false;
        }
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Projects table check failed: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Projects table structure check error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Robust Database Schema Check\n');
  console.log('=' .repeat(60));
  
  // Test both keys
  const anonWorks = await testConnection(anonKey, 'anon');
  const serviceWorks = await testConnection(serviceRoleKey, 'service_role');
  
  // Use the working key
  const workingKey = serviceWorks ? serviceRoleKey : (anonWorks ? anonKey : null);
  const keyType = serviceWorks ? 'service_role' : (anonWorks ? 'anon' : 'none');
  
  if (!workingKey) {
    console.log('\n❌ FATAL: No working API key found');
    process.exit(1);
  }
  
  console.log(`\n🎯 Using ${keyType} key for database operations`);
  
  // Check tables
  const accessibleTables = await checkTablesWithKey(workingKey, keyType);
  
  // Check projects table structure specifically
  if (accessibleTables.includes('projects')) {
    await checkProjectsTableStructure(workingKey);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 SUMMARY:');
  console.log(`  Working API key: ${keyType}`);
  console.log(`  Accessible tables: ${accessibleTables.length}/4`);
  console.log(`  Tables found: ${accessibleTables.join(', ')}`);
  
  const missingTables = ['projects', 'conversations', 'messages', 'protocols']
    .filter(table => !accessibleTables.includes(table));
  
  if (missingTables.length > 0) {
    console.log(`  Missing tables: ${missingTables.join(', ')}`);
    console.log('\n⚠️  MIGRATION NEEDED: Some tables are missing');
  } else {
    console.log('\n🎉 SUCCESS: All required tables are accessible!');
  }
}

main().catch(console.error);