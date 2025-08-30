# CLAUDE.md - Project Instructions for AI Agents

## 🔴 CRITICAL: Supabase Key Migration

**⚠️ MANDATORY READING:** https://github.com/orgs/supabase/discussions/29260

### Key Format Changes (August 2025)
- **OLD (DEPRECATED)**: JWT-format anon and service keys
- **NEW (CURRENT)**: 
  - Publishable key: `sb_publishable_*` (replaces anon key)
  - Secret key: `sb_secret_*` (replaces service role key)

**IMPORTANT**: The new keys are NOT JWTs. They are opaque identifiers. See `IMPORTANT_KEY_MIGRATION.md` for details.

---

## Project Overview

**Name**: Searchmatic MVP  
**Type**: Systematic Literature Review Platform  
**Stack**: React + TypeScript + Supabase + Drizzle ORM

### Core Technologies
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **ORM**: Drizzle ORM with PostgreSQL driver
- **AI**: OpenAI, Deepseek, Gemini APIs
- **Testing**: Playwright, Vitest

---

## Environment Configuration

### Current Keys (USE THESE)
```env
VITE_SUPABASE_URL=https://qzvfufadiqmizrozejci.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS
SUPABASE_SECRET_KEY=sb_secret_0HF5k5_nhplbINXe-IL9zA_gZQjDN8p
SUPABASE_ACCESS_TOKEN=sbp_ec0c7e042a9d8c2aea396e5042955f477203929e
```

### JWT Configuration
- **Active Key ID**: ee8e6058-6e20-48ff-b3df-5229b6f97809
- **Standby Key ID**: 92028fb7-7a2d-4314-9f84-ce5ab7293bcb
- **Algorithm**: ES256
- **Discovery URL**: https://qzvfufadiqmizrozejci.supabase.co/auth/v1/.well-known/jwks.json

---

## Database Schema

### Main Tables (Drizzle ORM)
- `profiles` - User profiles linked to Supabase Auth
- `projects` - Research projects with protocols
- `articles` - Research articles with embeddings
- `protocols` - PICO/SPIDER frameworks
- `conversations` - AI chat history
- `extraction_templates` - Data extraction configs

**Schema Location**: `/src/db/schema.ts`

---

## Edge Functions Status

### Deployed Functions
1. ✅ `test-simple` - Basic test (working)
2. ✅ `hello-world` - Simple greeting (working)
3. 🔒 `analyze-literature` - Requires user auth
4. 🔒 `chat-completion` - Requires user auth
5. 🔒 `duplicate-detection` - Requires user auth
6. 🔒 `export-data` - Requires user auth
7. 🔒 `process-document` - Requires user auth
8. 🔒 `protocol-guidance` - Requires user auth
9. 🔒 `search-articles` - Requires user auth

**Note**: Functions require JWT tokens from authenticated users, not the publishable/secret keys.

---

## Authentication Flow

1. **User Authentication**: Use Supabase Auth to get JWT tokens
2. **Edge Functions**: Use JWT tokens as Bearer tokens
3. **Database Access**: Use Supabase client with publishable key

### Generating Test Tokens
```bash
node generate-jwt-token.mjs  # Creates valid JWT tokens for testing
```

---

## Important Scripts

### Database
- `node test-drizzle-connection.js` - Test DB connection
- `node drizzle-inspect.js` - Inspect schema
- `npx drizzle-kit generate` - Generate migrations

### Edge Functions
- `node test-all-functions-with-jwt.mjs` - Test all functions
- `npx supabase functions deploy` - Deploy functions

### Authentication
- `node generate-jwt-token.mjs` - Generate JWT tokens
- `node supabase-auth-test.mjs` - Test authentication

---

## Project Structure

```
/root/repo/
├── src/
│   ├── db/           # Drizzle ORM schema and client
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── services/     # API services
│   └── utils/        # Utilities
├── supabase/
│   ├── functions/    # Edge functions
│   └── migrations/   # Database migrations
├── tests/           # Test files
└── scripts/         # Utility scripts
```

---

## Critical Rules for AI Agents

1. **ALWAYS** read https://github.com/orgs/supabase/discussions/29260 first
2. **NEVER** use old JWT-format keys (eyJhbGci...)
3. **ALWAYS** use new format keys (sb_publishable_*, sb_secret_*)
4. **REMEMBER** new keys are not JWTs themselves
5. **CHECK** `IMPORTANT_KEY_MIGRATION.md` for details
6. **USE** Supabase SDK with new keys, not as Bearer tokens
7. **AUTHENTICATE** users to get valid JWT tokens for edge functions

---

## Testing Checklist

- [ ] Database connection working
- [ ] Drizzle ORM schema matches database
- [ ] Edge functions deployed
- [ ] JWT tokens generated successfully
- [ ] Authentication flow tested
- [ ] Environment variables correct

---

## Support & Documentation

- **Supabase Docs**: https://supabase.com/docs
- **Drizzle ORM**: https://orm.drizzle.team
- **Key Migration**: https://github.com/orgs/supabase/discussions/29260
- **Project Repo**: Current repository

---

## Last Updated
- **Date**: August 30, 2025
- **Updated By**: Terry (Terragon Labs)
- **Key Change**: Migrated to new Supabase key format