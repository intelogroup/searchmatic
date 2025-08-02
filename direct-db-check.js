#!/usr/bin/env node

// Direct database check using fetch API
const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dmZ1ZmFkaXFtaXpyb3plamNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTI2NzYzOCwiZXhwIjoyMDUwODQzNjM4fQ.QmOA89F8kLjWd9X4b4BDbLiAoHXZoTEwHN-e0xp5ZJg';

async function checkTables() {
  console.log('🔍 Checking database tables directly...\n');
  
  const requiredTables = ['projects', 'conversations', 'messages', 'protocols'];
  
  for (const table of requiredTables) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=count&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        }
      });
      
      if (response.ok) {
        console.log(`✅ Table '${table}' - Accessible`);
      } else {
        const errorText = await response.text();
        console.log(`❌ Table '${table}' - Error ${response.status}: ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`❌ Table '${table}' - Exception: ${error.message}`);
    }
  }
}

async function executeSQLDirect(sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (response.ok) {
      const result = await response.json();
      return { success: true, data: result };
    } else {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function checkSchema() {
  console.log('🔍 Checking current schema...\n');
  
  const schemaQuery = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  
  const result = await executeSQLDirect(schemaQuery);
  
  if (result.success) {
    console.log('📋 Current tables:');
    if (result.data && result.data.length > 0) {
      result.data.forEach(row => console.log(`  - ${row.table_name}`));
    } else {
      console.log('  No tables found');
    }
  } else {
    console.log('❌ Schema check failed:', result.error);
  }
}

async function main() {
  console.log('🚀 Direct Database Check\n');
  console.log('=' .repeat(50));
  
  await checkSchema();
  console.log();
  await checkTables();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Direct check completed');
}

main().catch(console.error);