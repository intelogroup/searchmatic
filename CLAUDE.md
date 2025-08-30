# CLAUDE.md - Project Instructions for AI Agents

## ⚠️ CRITICAL NOTICE - READ FIRST
**All agents MUST read https://github.com/orgs/supabase/discussions/29260 before starting work**

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

## Drizzle ORM - Working Approaches

### ✅ What Works

#### 1. Connection Setup
```javascript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);
```

#### 2. Schema Definition
- Define all tables in `/src/db/schema.ts`
- Use proper Drizzle types (pgTable, uuid, text, etc.)
- Define enums with `pgEnum`
- Create relations with `relations`

#### 3. Migration Commands That Work
```bash
# Generate migrations (creates SQL files)
npx drizzle-kit generate --config drizzle.config.ts

# Inspect current database
node drizzle-inspect.js

# Test connection
node test-drizzle-connection.js
```

#### 4. Manual Migration Approach (PROVEN TO WORK)
When `drizzle-kit push` fails, use this approach:
```javascript
// 1. Check existing tables/enums
const existingTables = await sql`
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public'
`;

// 2. Create enums first
await sql`CREATE TYPE "enum_name" AS ENUM('value1', 'value2')`;

// 3. Create tables with proper foreign keys
await sql`CREATE TABLE ...`;

// 4. Enable RLS
await sql`ALTER TABLE table_name ENABLE ROW LEVEL SECURITY`;
```

### ❌ What Doesn't Work
- `drizzle-kit push` - Often fails with connection errors
- `CREATE TYPE IF NOT EXISTS` - PostgreSQL doesn't support this syntax
- Using new Supabase keys as JWT tokens directly

### 🔧 Troubleshooting

#### Connection Issues
- Use `DATABASE_URL` from .env (with encoded password)
- Don't use `drizzle-kit push` with Supabase pooler

#### Migration Issues
- Create enums before tables that use them
- Check for existing objects before creating
- Use transactions for multi-step operations

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

## Agent Configuration

### Main Agent: Terry (Terragon Labs)
- **Role**: Senior Full-Stack Developer & Project Lead
- **Responsibilities**: 
  - Overall project architecture
  - Database schema management with Drizzle ORM
  - Edge functions deployment
  - Authentication and security
  - Code quality and standards

### Available Subagents

#### 1. Database Agent
- **Specialty**: PostgreSQL, Drizzle ORM, migrations
- **Tasks**: Schema design, query optimization, RLS policies
- **Tools**: drizzle-kit, postgres, supabase-cli

#### 2. Frontend Agent  
- **Specialty**: React, TypeScript, UI/UX
- **Tasks**: Component development, state management, routing
- **Tools**: Vite, TailwindCSS, React Query

#### 3. API Agent
- **Specialty**: Edge functions, REST APIs, authentication
- **Tasks**: Endpoint development, JWT handling, API testing
- **Tools**: Deno, Supabase Functions, curl

#### 4. Testing Agent
- **Specialty**: E2E testing, unit testing, CI/CD
- **Tasks**: Test automation, coverage reports, regression testing
- **Tools**: Playwright, Vitest, GitHub Actions

#### 5. Documentation Agent
- **Specialty**: Technical writing, API docs, user guides
- **Tasks**: README updates, API documentation, troubleshooting guides
- **Tools**: Markdown, JSDoc, Swagger

### Agent Communication Protocol

1. **State Management**: All agents must read current state from:
   - Database schema: `/src/db/schema.ts`
   - Environment: `.env`
   - Project docs: `CLAUDE.md`, `IMPORTANT_KEY_MIGRATION.md`

2. **Task Handoff**: When switching agents:
   - Document completed work in relevant `.md` files
   - Update todo list with `TodoWrite` tool
   - Commit changes with descriptive messages

3. **Error Reporting**: Log failures in `failures.md` with:
   - Error description
   - Steps to reproduce
   - Attempted solutions
   - Recommended next steps

---

## Database Schema (Current State)

### ✅ Implemented Tables
- `profiles` - User profiles (18 records)
- `projects` - Research projects (1 record)
- `protocols` - Research protocols
- `protocol_versions` - Protocol version history
- `articles` - Research articles with embeddings
- `search_queries` - Search history
- `conversations` - Chat conversations
- `messages` - Chat messages
- `extraction_templates` - Data extraction configs
- `export_logs` - Export history
- `user_preferences` - User settings

### ✅ Implemented Enums
- `project_status`: active, completed, archived
- `article_status`: pending, processing, completed, error
- `article_source`: pubmed, scopus, wos, manual, other
- `screening_decision`: include, exclude, maybe
- `protocol_status`: draft, active, archived, locked
- `framework_type`: pico, spider, other

### 📦 Additional Database Tables (not in Drizzle schema)
- `ai_conversations`
- `duplicate_pairs`
- `extracted_data`
- `extracted_elements`
- `extracted_references`
- `pdf_files`
- `pdf_processing_logs`
- `pdf_processing_queue`
- `protocol` (legacy)

---

## Future Migration Guide

### When to Create Migrations

1. **Schema Changes**
   - Adding new tables
   - Adding/removing columns
   - Changing column types
   - Adding/removing indexes

2. **Data Migrations**
   - Transforming existing data
   - Populating new columns
   - Cleaning up legacy data

### Migration Process

#### Step 1: Analyze Current State
```bash
# Check current schema
node check-missing-tables.js

# Inspect with Drizzle
node drizzle-inspect.js
```

#### Step 2: Update Drizzle Schema
```typescript
// Edit src/db/schema.ts
export const newTable = pgTable('new_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  // ... columns
});
```

#### Step 3: Generate Migration
```bash
# Generate SQL migration file
npx drizzle-kit generate --config drizzle.config.ts
```

#### Step 4: Apply Migration
```javascript
// Use manual approach if drizzle-kit push fails
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

// Apply migration SQL
await sql`[migration SQL here]`;
```

#### Step 5: Verify
```bash
# Test the changes
node test-drizzle-connection.js
```

### Migration Best Practices

1. **Always Backup First**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```

2. **Use Transactions**
   ```sql
   BEGIN;
   -- migration statements
   COMMIT;
   ```

3. **Test Locally**
   - Use a local Supabase instance
   - Test migrations before production

4. **Document Changes**
   - Update CLAUDE.md
   - Add to migration history
   - Update schema documentation

5. **Handle Rollbacks**
   ```sql
   -- Keep rollback scripts
   DROP TABLE IF EXISTS new_table;
   ALTER TABLE ... DROP COLUMN ...;
   ```

### Common Migration Scenarios

#### Adding a Table
```javascript
// 1. Add to schema.ts
export const tableName = pgTable('table_name', {...});

// 2. Generate migration
npx drizzle-kit generate

// 3. Apply to database
node create-missing-schema.js
```

#### Adding a Column
```sql
ALTER TABLE table_name 
ADD COLUMN column_name data_type DEFAULT default_value;
```

#### Creating an Index
```sql
CREATE INDEX idx_name ON table_name(column_name);
```

#### Adding Foreign Key
```sql
ALTER TABLE child_table
ADD CONSTRAINT fk_name
FOREIGN KEY (column) REFERENCES parent_table(id);
```

---

## Last Updated
- **Date**: August 30, 2025
- **Updated By**: Terry (Terragon Labs)
- **Key Changes**: 
  - Migrated to new Supabase key format
  - Created missing database tables
  - Configured agent responsibilities
  - Documented Drizzle ORM working approaches
  - Added comprehensive migration guide