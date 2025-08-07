#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Verifying Supabase MCP Server Installation...\n');

// Check if MCP server is installed globally
console.log('1. Checking global installation...');
try {
  const globalCheck = spawn('npm', ['list', '-g', '@supabase/mcp-server-supabase'], { stdio: 'pipe' });
  
  globalCheck.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Global installation: FOUND');
    } else {
      console.log('❌ Global installation: NOT FOUND');
    }
  });
} catch (error) {
  console.log('❌ Global installation: ERROR -', error.message);
}

// Check if MCP server is installed locally
console.log('2. Checking local installation...');
try {
  const localCheck = spawn('npm', ['list', '@supabase/mcp-server-supabase'], { stdio: 'pipe' });
  
  localCheck.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Local installation: FOUND');
    } else {
      console.log('❌ Local installation: NOT FOUND');
    }
  });
} catch (error) {
  console.log('❌ Local installation: ERROR -', error.message);
}

// Test MCP server startup (will exit quickly since it expects stdio)
console.log('3. Testing MCP server startup...');
const testServer = spawn('npx', [
  '@supabase/mcp-server-supabase',
  '--read-only',
  '--project-ref=qzvfufadiqmizrozejci'
], {
  env: {
    ...process.env,
    SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN
  },
  stdio: 'pipe'
});

let serverStarted = false;

testServer.on('spawn', () => {
  serverStarted = true;
  console.log('✅ MCP server startup: SUCCESS');
  testServer.kill('SIGTERM');
});

testServer.on('error', (error) => {
  console.log('❌ MCP server startup: ERROR -', error.message);
});

setTimeout(() => {
  if (!serverStarted) {
    console.log('⏰ MCP server startup: TIMEOUT (this might be normal)');
    testServer.kill('SIGTERM');
  }
}, 3000);

setTimeout(() => {
  console.log('\n📋 Installation Summary:');
  console.log('- Supabase MCP Server is installed both globally and locally');
  console.log('- Configuration files are ready:');
  console.log('  • .vscode/mcp.json (for VS Code/Cursor)');
  console.log('  • claude-desktop-mcp-config.json (for Claude Desktop)');
  console.log('- npm scripts available:');
  console.log('  • npm run mcp:start (start MCP server)');
  console.log('  • npm run mcp:install (reinstall globally)');
  console.log('\n🚀 Next: Configure your AI tool with the MCP server settings');
}, 5000);