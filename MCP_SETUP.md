# Supabase MCP Server Setup Guide

## ✅ Installation Status
- **Global Installation**: ✅ COMPLETE
- **Local Installation**: ✅ COMPLETE  
- **Server Startup Test**: ✅ VERIFIED
- **Configuration Files**: ✅ READY

## Overview
The Model Context Protocol (MCP) server allows AI assistants to interact directly with your Supabase database, enabling features like:
- Reading database schemas
- Executing queries
- Managing tables
- Fetching configuration

## Project Details
- **Project Reference ID**: `qzvfufadiqmizrozejci`
- **Project URL**: https://qzvfufadiqmizrozejci.supabase.co
- **Access Token**: `sbp_99c994d6970e1d4cb36d4cb8caae9e120e499337`

## Setup Instructions

### For VS Code / Cursor

1. The `.vscode/mcp.json` file has already been created in this project
2. When using VS Code or Cursor, the MCP server will prompt you for the access token
3. Enter: `sbp_99c994d6970e1d4cb36d4cb8caae9e120e499337`

### For Claude Desktop

1. Open Claude Desktop
2. Navigate to Settings → Developer tab
3. Click "Edit Config" to open the configuration file
4. Add the contents from `claude-desktop-mcp-config.json` to your configuration
5. Save and restart Claude Desktop

### For Cline (VS Code Extension)

1. Open the Cline extension in VS Code
2. Click the MCP Servers icon
3. Click "Configure MCP Servers"
4. Add the Supabase server configuration with the access token

## Security Configuration

This MCP server is configured with:
- **Read-only mode**: Prevents accidental write operations
- **Project scoping**: Limited to only the Searchmatic project
- **Development environment**: Safe for testing and development

## Available MCP Tools

Once connected, you'll have access to:
- `query`: Execute read-only SQL queries
- `list_tables`: View all tables in the database
- `describe_table`: Get schema information for a specific table
- `get_config`: Retrieve project configuration

## Verifying Connection

After setup:
1. Reload your AI tool
2. Look for a green "active" status
3. In the chat, you should see Supabase tools available

## Troubleshooting

If connection fails:
1. Verify the access token is correct
2. Check that Node.js is installed
3. Ensure you've saved the configuration file
4. Try restarting your AI tool

## Quick Commands

```bash
# Start MCP server manually
npm run mcp:start

# Verify installation
node scripts/verify-mcp.js

# Reinstall globally if needed
npm run mcp:install
```

## Important Notes

- This is configured for **development use only**
- The MCP server has read-only access to prevent accidental data modifications
- Always use development/test data, not production data
- The access token should not be shared publicly in production scenarios
- MCP server is installed both globally and locally for maximum compatibility