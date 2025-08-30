# 🚀 Edge Functions Deployment Guide

## Current Status

### ✅ Completed
- Supabase CLI installed (v2.39.2)
- Edge functions created in `/supabase/functions/`
- Drizzle ORM configured with schema
- Database tables verified and accessible

### 📦 Edge Functions Ready for Deployment
1. `hello-world` - Test function
2. `chat-completion` - AI chat completions
3. `analyze-literature` - Literature analysis
4. `duplicate-detection` - Duplicate article detection
5. `export-data` - Data export functionality
6. `process-document` - Document processing
7. `protocol-guidance` - Protocol assistance
8. `search-articles` - Article search

## 🔧 Deployment Steps

### Step 1: Authenticate with Supabase

```bash
# Login to Supabase (opens browser)
npx supabase login
```

Or set access token directly:
```bash
# Get your access token from: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN=your-access-token-here
```

### Step 2: Link to Your Project

```bash
npx supabase link --project-ref qzvfufadiqmizrozejci
```

### Step 3: Deploy Functions

Deploy all functions at once:
```bash
npx supabase functions deploy --project-ref qzvfufadiqmizrozejci
```

Or deploy individually:
```bash
npx supabase functions deploy hello-world --project-ref qzvfufadiqmizrozejci
npx supabase functions deploy chat-completion --project-ref qzvfufadiqmizrozejci
# ... repeat for each function
```

### Step 4: Verify Deployment

List deployed functions:
```bash
npx supabase functions list --project-ref qzvfufadiqmizrozejci
```

### Step 5: Test Functions

Test a deployed function:
```bash
# Test hello-world function
npx supabase functions invoke hello-world \
  --project-ref qzvfufadiqmizrozejci \
  --body '{"name":"World"}'

# Test chat-completion function
npx supabase functions invoke chat-completion \
  --project-ref qzvfufadiqmizrozejci \
  --body '{"messages":[{"role":"user","content":"Hello"}]}'
```

## 🔐 Environment Variables for Functions

If your edge functions need environment variables:

1. Set them in Supabase Dashboard:
   - Go to Project Settings > Edge Functions
   - Add environment variables

2. Or use CLI:
```bash
npx supabase secrets set OPENAI_API_KEY=your-key-here --project-ref qzvfufadiqmizrozejci
```

## 📊 Using Drizzle with Edge Functions

The Drizzle schema is configured in `/src/db/schema.ts` and can be used in edge functions:

```typescript
// In your edge function
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../../src/db/schema'

const connectionString = Deno.env.get('DATABASE_URL')!
const client = postgres(connectionString, { prepare: false })
const db = drizzle(client, { schema })

// Use db to query
const profiles = await db.select().from(schema.profiles)
```

## 🧪 Local Testing

To test functions locally before deployment:

```bash
# Start local Supabase stack
npx supabase start

# Serve functions locally
npx supabase functions serve

# Test locally
curl -i --location --request POST 'http://localhost:54321/functions/v1/hello-world' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"name":"Functions"}'
```

## 📝 Automated Deployment Script

Use the provided deployment script:
```bash
node deploy-functions.js
```

This script will:
- Check Supabase CLI availability
- List all functions
- Deploy each function
- Provide deployment summary
- Show testing instructions

## ⚠️ Troubleshooting

### Authentication Issues
- Make sure you're logged in: `npx supabase login`
- Check access token is valid
- Verify project permissions

### Deployment Failures
- Check function code for errors
- Verify Deno compatibility
- Check function size limits (2MB max)
- Review function logs in Supabase Dashboard

### Runtime Errors
- Check function logs: Dashboard > Functions > Logs
- Verify environment variables are set
- Check CORS settings if calling from browser

## 📚 Resources
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)

---

**Note**: You need to authenticate with Supabase before deploying. Get your access token from the Supabase Dashboard or use `npx supabase login`.