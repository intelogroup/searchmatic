# Supabase MCP Server Setup Guide

## Overview
The Supabase MCP (Model Context Protocol) server provides enhanced access to Supabase services, allowing for better integration with AI tools and automated workflows.

## Prerequisites
- Supabase Access Token: `sbp_ec0c7e042a9d8c2aea396e5042955f477203929e`
- Project Reference: `qzvfufadiqmizrozejci`
- Supabase URL: `https://qzvfufadiqmizrozejci.supabase.co`

## Installation Steps

### 1. Install MCP Server Package
```bash
npm install @modelcontextprotocol/server-supabase
# or
npm install @supabase/mcp-server
```

### 2. Configuration
Create a `.mcp/config.json` file:

```json
{
  "servers": {
    "supabase": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://qzvfufadiqmizrozejci.supabase.co",
        "SUPABASE_ACCESS_TOKEN": "sbp_ec0c7e042a9d8c2aea396e5042955f477203929e",
        "SUPABASE_PROJECT_REF": "qzvfufadiqmizrozejci"
      }
    }
  }
}
```

### 3. Environment Variables
Add to `.env`:
```bash
# MCP Server Configuration
MCP_SUPABASE_URL=https://qzvfufadiqmizrozejci.supabase.co
MCP_SUPABASE_ACCESS_TOKEN=sbp_ec0c7e042a9d8c2aea396e5042955f477203929e
MCP_SUPABASE_PROJECT_REF=qzvfufadiqmizrozejci
```

## Benefits of MCP Server

### 1. **Direct Database Access**
- Query and modify database without SQL
- Automatic schema introspection
- Type-safe operations

### 2. **Edge Functions Management**
- Deploy functions directly
- Monitor function logs
- Test functions with proper auth

### 3. **Storage Operations**
- Upload/download files
- Manage buckets
- Set permissions

### 4. **Auth Management**
- Create/manage users
- Handle sessions
- Configure auth providers

### 5. **Real-time Subscriptions**
- Subscribe to database changes
- Manage channels
- Handle presence

## Available MCP Commands

### Database Operations
- `supabase.db.query` - Execute queries
- `supabase.db.schema` - Get schema info
- `supabase.db.migrate` - Run migrations

### Edge Functions
- `supabase.functions.list` - List all functions
- `supabase.functions.deploy` - Deploy function
- `supabase.functions.invoke` - Call function
- `supabase.functions.logs` - View logs

### Storage
- `supabase.storage.list` - List buckets
- `supabase.storage.upload` - Upload files
- `supabase.storage.download` - Download files

### Auth
- `supabase.auth.users` - List users
- `supabase.auth.create` - Create user
- `supabase.auth.update` - Update user

## Working JWT Tokens

Based on our testing, here are the working tokens:

### Anon Token (Generated)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dmZ1ZmFkaXFtaXpyb3plamNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NDE1NTMsImV4cCI6MTc1NjU0NTE1M30...
```

### Service Token (Generated)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dmZ1ZmFkaXFtaXpyb3plamNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU0MTU1MywiZXhwIjoxNzU2NTQ1MTUzfQ...
```

## JWT Key Information

### Current Key (Active)
- **Key ID**: `ee8e6058-6e20-48ff-b3df-5229b6f97809`
- **Algorithm**: ES256
- **Discovery URL**: `https://qzvfufadiqmizrozejci.supabase.co/auth/v1/.well-known/jwks.json`

### Standby Key
- **Key ID**: `92028fb7-7a2d-4314-9f84-ce5ab7293bcb`
- **Algorithm**: ES256

## Testing MCP Server

Once configured, test with:

```javascript
// Test MCP connection
const mcp = require('@modelcontextprotocol/client');
const client = await mcp.connect({
  server: 'supabase',
  config: require('./.mcp/config.json').servers.supabase
});

// List edge functions
const functions = await client.call('supabase.functions.list');
console.log('Functions:', functions);

// Query database
const result = await client.call('supabase.db.query', {
  query: 'SELECT * FROM profiles LIMIT 5'
});
console.log('Profiles:', result);
```

## Security Notes

1. **Access Token**: Keep the `sbp_` access token secure
2. **JWT Secret**: Never expose the JWT secret in client code
3. **Environment Variables**: Use `.env` files and never commit them
4. **Key Rotation**: Monitor the JWT key IDs for rotation

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check JWT token expiration
2. **Invalid JWT**: Ensure using correct JWT secret
3. **Connection Failed**: Verify Supabase URL and project ref
4. **MCP Not Found**: Install MCP server package globally

### Debug Mode

Enable debug logging:
```bash
export MCP_DEBUG=true
export SUPABASE_DEBUG=true
```

## Next Steps

1. ✅ JWT tokens are working
2. ✅ Edge functions are accessible
3. 🔄 Configure MCP server for enhanced access
4. 🔄 Test all edge functions with proper auth
5. 🔄 Implement automated deployment pipeline