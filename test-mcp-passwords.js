#!/usr/bin/env node

/**
 * Test MCP Database Connections with Different Passwords
 * Tests which password works for the Supabase database connection
 */

import pg from 'pg';
const { Client } = pg;

// Test passwords provided by user
const passwords = [
  'Jimkali90#',
  'GoldYear23#', 
  'Goldyear2023#'
];

// Connection configurations to test
const connectionConfigs = [
  // Session Pooler (5432)
  {
    name: 'Session Pooler (5432)',
    getConfig: (password) => ({
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 5432,
      database: 'postgres',
      user: 'postgres.qzvfufadiqmizrozejci',
      password: password,
      ssl: { rejectUnauthorized: false }
    })
  },
  // Transaction Pooler (6543)
  {
    name: 'Transaction Pooler (6543)',
    getConfig: (password) => ({
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres.qzvfufadiqmizrozejci',
      password: password,
      ssl: { rejectUnauthorized: false }
    })
  },
  // Direct Connection
  {
    name: 'Direct Connection',
    getConfig: (password) => ({
      host: 'db.qzvfufadiqmizrozejci.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: password,
      ssl: { rejectUnauthorized: false }
    })
  }
];

async function testConnection(config, password) {
  const client = new Client(config.getConfig(password));
  
  try {
    await client.connect();
    console.log(`   ✅ SUCCESS: ${config.name} with password: ${password.replace(/./g, '*')}`);
    
    // Test a simple query
    const result = await client.query('SELECT current_database(), current_user, version()');
    console.log(`   📊 Connected to: ${result.rows[0].current_database} as ${result.rows[0].current_user}`);
    
    // Test if we can see the projects table
    const tablesResult = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position
      LIMIT 10
    `);
    
    console.log(`   📋 Projects table columns found: ${tablesResult.rows.length}`);
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`      - ${row.column_name} (${row.data_type})`);
      });
    }
    
    await client.end();
    return { success: true, config: config.name, password };
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${config.name} with password: ${password.replace(/./g, '*')}`);
    console.log(`   📝 Error: ${error.message.split('\\n')[0]}`);
    
    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup errors
    }
    
    return { success: false, config: config.name, password, error: error.message };
  }
}

async function testAllCombinations() {
  console.log('🔍 Testing Database Connections with Different Passwords...\n');
  
  const results = [];
  
  for (const password of passwords) {
    console.log(`🔑 Testing password: ${password.replace(/./g, '*')}`);
    
    for (const config of connectionConfigs) {
      const result = await testConnection(config, password);
      results.push(result);
    }
    
    console.log(''); // Empty line between password tests
  }
  
  // Summary
  console.log('📊 CONNECTION TEST SUMMARY:');
  console.log('==========================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful connections: ${successful.length}`);
  console.log(`❌ Failed connections: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log('\\n🎉 WORKING CONNECTIONS:');
    successful.forEach(result => {
      console.log(`   ✅ ${result.config} with password: ${result.password.replace(/./g, '*')}`);
    });
    
    // Return the first successful connection for MCP configuration
    const bestConnection = successful[0];
    console.log('\\n🔧 RECOMMENDED MCP CONFIGURATION:');
    console.log(`Password: ${bestConnection.password}`);
    console.log(`Config: ${bestConnection.config}`);
    
    return bestConnection;
    
  } else {
    console.log('\\n⚠️  NO WORKING CONNECTIONS FOUND');
    console.log('Common issues to check:');
    console.log('- Network connectivity to Supabase');
    console.log('- Database password has changed');
    console.log('- IP restrictions or firewall blocking connection');
    console.log('- SSL/TLS certificate issues');
    
    return null;
  }
}

async function testMigrationSQL(workingConnection) {
  if (!workingConnection) {
    console.log('⚠️  No working connection to test migration SQL');
    return false;
  }
  
  console.log('\\n🧪 Testing Migration SQL Execution...');
  
  const config = connectionConfigs.find(c => c.name === workingConnection.config);
  const client = new Client(config.getConfig(workingConnection.password));
  
  try {
    await client.connect();
    
    // Test the critical migration SQL
    const migrationSQL = `
      DO $$ 
      BEGIN
          -- Test if we can create enum types
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_project_type') THEN
              CREATE TYPE test_project_type AS ENUM ('test_value');
              RAISE NOTICE 'Test enum created successfully';
          END IF;
          
          -- Clean up test enum
          DROP TYPE IF EXISTS test_project_type;
          RAISE NOTICE 'Test enum cleaned up';
      END $$;
    `;
    
    const result = await client.query(migrationSQL);
    console.log('   ✅ Migration SQL test passed');
    console.log('   🎉 Database is ready for the actual migration!');
    
    await client.end();
    return true;
    
  } catch (error) {
    console.log(`   ❌ Migration SQL test failed: ${error.message}`);
    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup errors
    }
    return false;
  }
}

// Main execution
async function main() {
  try {
    const workingConnection = await testAllCombinations();
    const migrationReady = await testMigrationSQL(workingConnection);
    
    if (workingConnection && migrationReady) {
      console.log('\\n🚀 READY FOR MIGRATION!');
      console.log(`Use password: ${workingConnection.password}`);
      console.log(`Connection: ${workingConnection.config}`);
    } else {
      console.log('\\n⚠️  Migration setup incomplete');
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
  }
}

main();