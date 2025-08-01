# 🔧 Advanced MCP Configuration Guide

## Overview
This document provides comprehensive setup instructions for all Model Context Protocol (MCP) servers used in the Searchmatic project, including error monitoring, testing, and debugging tools.

## Required MCP Servers

### 1. PostgreSQL/Supabase MCP Server ✅ CRITICAL
**Purpose**: Direct database access for debugging and data analysis

```bash
npm install -g @modelcontextprotocol/server-postgres
```

**Configuration**:
- Connection String: `postgresql://postgres.qzvfufadiqmizrozejci:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`
- Replace `YOUR_PASSWORD` with your Supabase database password
- **Security**: Read-only access recommended for safety

### 2. Playwright MCP Server ✅ CRITICAL
**Purpose**: Automated testing, UI verification, screenshot capture

```bash
npm install -g @executeautomation/playwright-mcp-server
```

**Features**:
- Automated UI testing
- Screenshot capture for debugging
- Performance monitoring
- Cross-browser testing

### 3. Memory MCP Server ✅ RECOMMENDED
**Purpose**: Persistent context storage across sessions

```bash
npm install -g @modelcontextprotocol/server-memory
```

**Use Cases**:
- Store architectural decisions
- Remember bug fixes and solutions
- Track project progress
- Cache frequently accessed information

### 4. Brave Search MCP Server ⚠️ REQUIRES API KEY
**Purpose**: Real-time web search for documentation and solutions

```bash
npm install -g @modelcontextprotocol/server-brave-search
```

**Setup**:
1. Get API key: https://brave.com/search/api/
2. Add to environment: `BRAVE_API_KEY=your_key_here`

### 5. Sentry MCP Server ⚠️ REQUIRES SETUP
**Purpose**: Production error monitoring and debugging

```bash
npm install -g @modelcontextprotocol/server-sentry
```

**Setup**:
1. Create Sentry account: https://sentry.io/
2. Create new project for Searchmatic
3. Configure environment variables:
   ```
   SENTRY_ORG=your_organization
   SENTRY_PROJECT=searchmatic-mvp
   SENTRY_AUTH_TOKEN=your_auth_token
   ```

### 6. GitHub MCP Server ⚠️ REQUIRES TOKEN
**Purpose**: Repository management, issue tracking, PR automation

```bash
npm install -g @modelcontextprotocol/server-github
```

**Setup**:
1. Generate Personal Access Token in GitHub
2. Required scopes: `repo`, `issues`, `pull_requests`
3. Add to environment: `GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here`

### 7. Fetch MCP Server ✅ NO SETUP REQUIRED
**Purpose**: HTTP requests, API testing, external integrations

```bash
npm install -g @modelcontextprotocol/server-fetch
```

### 8. Filesystem MCP Server ✅ NO SETUP REQUIRED
**Purpose**: File operations, code analysis, project structure management

```bash
npm install -g @modelcontextprotocol/server-filesystem
```

## Configuration Files

### Claude Desktop Configuration
Create or update `~/.config/claude-desktop/mcp.json`:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "mcp-server-postgres",
      "args": ["postgresql://postgres.qzvfufadiqmizrozejci:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"]
    },
    "playwright": {
      "command": "playwright-mcp-server",
      "env": {
        "PLAYWRIGHT_HEADLESS": "true"
      }
    },
    "memory": {
      "command": "mcp-server-memory"
    },
    "brave": {
      "command": "mcp-server-brave-search",
      "env": {
        "BRAVE_API_KEY": "YOUR_BRAVE_API_KEY"
      }
    },
    "sentry": {
      "command": "mcp-server-sentry",
      "env": {
        "SENTRY_ORG": "YOUR_SENTRY_ORG",
        "SENTRY_PROJECT": "searchmatic-mvp",
        "SENTRY_AUTH_TOKEN": "YOUR_SENTRY_TOKEN"
      }
    },
    "github": {
      "command": "mcp-server-github",
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_TOKEN"
      }
    },
    "fetch": {
      "command": "mcp-server-fetch"
    },
    "filesystem": {
      "command": "mcp-server-filesystem",
      "args": ["/path/to/searchmatic/repo"]
    }
  }
}
```

### VS Code/Cursor Configuration
Update `.vscode/mcp.json` for IDE integration:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres@latest"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://postgres.qzvfufadiqmizrozejci:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server@latest"],
      "env": {
        "PLAYWRIGHT_HEADLESS": "false",
        "PLAYWRIGHT_BROWSER": "chromium"
      }
    }
  }
}
```

## Manual Setup Tasks for User

### 🔑 Required API Keys and Tokens
1. **Supabase Database Password** (CRITICAL)
   - Access: Supabase Dashboard → Settings → Database
   - Used for: Direct database access via MCP

2. **Brave Search API Key** (Recommended)
   - Get it: https://brave.com/search/api/
   - Free tier: 2,000 queries/month
   - Used for: Real-time documentation search

3. **GitHub Personal Access Token** (Recommended)
   - Generate: GitHub → Settings → Developer settings → Personal access tokens
   - Scopes needed: `repo`, `issues`, `pull_requests`
   - Used for: Automated repository management

4. **Sentry Integration** (Optional but Recommended)
   - Create account: https://sentry.io/
   - Create project: "searchmatic-mvp"
   - Used for: Production error monitoring

### 🛠️ Installation Steps
1. **Install MCP Servers Globally**:
   ```bash
   npm install -g @modelcontextprotocol/server-postgres
   npm install -g @executeautomation/playwright-mcp-server
   npm install -g @modelcontextprotocol/server-memory
   npm install -g @modelcontextprotocol/server-brave-search
   npm install -g @modelcontextprotocol/server-sentry
   npm install -g @modelcontextprotocol/server-github
   npm install -g @modelcontextprotocol/server-fetch
   npm install -g @modelcontextprotocol/server-filesystem
   ```

2. **Configure Environment Variables**:
   Create `.env.mcp` in your home directory:
   ```bash
   # Supabase
   POSTGRES_CONNECTION_STRING=postgresql://postgres.qzvfufadiqmizrozejci:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   
   # API Keys
   BRAVE_API_KEY=your_brave_api_key_here
   GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here
   
   # Sentry
   SENTRY_ORG=your_organization
   SENTRY_PROJECT=searchmatic-mvp
   SENTRY_AUTH_TOKEN=your_sentry_token
   
   # Playwright
   PLAYWRIGHT_HEADLESS=true
   PLAYWRIGHT_BROWSER=chromium
   ```

3. **Update Claude Desktop Configuration**:
   - Copy the configuration above to `~/.config/claude-desktop/mcp.json`
   - Replace placeholder values with your actual credentials
   - Restart Claude Desktop

## Testing MCP Setup

### Verification Script
Run this to test your MCP configuration:

```bash
# Test Postgres connection
npx @modelcontextprotocol/server-postgres postgresql://your_connection_string

# Test Playwright
npx @executeautomation/playwright-mcp-server

# Test Memory
npx @modelcontextprotocol/server-memory

# Test Brave Search (requires API key)
BRAVE_API_KEY=your_key npx @modelcontextprotocol/server-brave-search

# Test Sentry (requires setup)
SENTRY_ORG=your_org SENTRY_PROJECT=your_project npx @modelcontextprotocol/server-sentry
```

## Troubleshooting

### Common Issues

1. **PostgreSQL Connection Failed**
   - Verify Supabase password is correct
   - Check firewall settings
   - Ensure connection string format is correct

2. **Playwright Browser Launch Failed**
   - Install browsers: `npx playwright install chromium`
   - Check system dependencies: `npx playwright install-deps`

3. **API Key Invalid**
   - Verify API keys are active and have correct permissions
   - Check rate limits and usage quotas

4. **MCP Server Not Found**
   - Ensure global npm packages are in PATH
   - Try local installation: `npm install` instead of global

### Debug Mode
Enable debug logging:
```bash
export DEBUG=mcp:*
# Then run your MCP server
```

## Benefits of This Setup

### Development Benefits
- **Real-time database inspection** via Postgres MCP
- **Automated UI testing** via Playwright MCP
- **Persistent context** via Memory MCP
- **Live documentation search** via Brave Search MCP

### Production Benefits
- **Error monitoring** via Sentry MCP
- **Repository automation** via GitHub MCP
- **Performance tracking** via enhanced logging
- **Comprehensive debugging** via multiple data sources

### AI-Assisted Development
- **Smart context awareness** across all project components
- **Automated testing and verification** of changes
- **Real-time error detection and resolution**
- **Performance optimization suggestions**

## Security Considerations

1. **Database Access**: Use read-only credentials where possible
2. **API Keys**: Store in secure environment variables, never commit to repo
3. **Tokens**: Regularly rotate GitHub and API tokens
4. **Network**: Consider VPN for production database access

## Performance Optimization

1. **Connection Pooling**: Use connection pooling for database MCP
2. **Caching**: Leverage Memory MCP for frequently accessed data
3. **Rate Limiting**: Respect API rate limits for external services
4. **Monitoring**: Use Sentry MCP to track performance metrics

This comprehensive MCP setup provides a powerful foundation for AI-assisted development with full observability and debugging capabilities.