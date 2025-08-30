# Developer Handoff Document

## Project State (2025-08-30)

### Current Branch
- **Branch**: `terragon/install-drizzle-orm`
- **Status**: Clean, all changes committed
- **Ready for**: Merge to main or continue development

### What's Working

#### ✅ Database
- Drizzle ORM fully configured and connected
- All schema tables created (11 tables)
- Migrations applied successfully
- Connection string: `DATABASE_URL` in .env

#### ✅ Authentication
- JWT token generation working
- Test scripts available: `generate-jwt-token.mjs`
- Edge functions require user JWT tokens

#### ✅ Edge Functions
- All 9 functions deployed
- Test functions working: `test-simple`, `hello-world`
- Other functions require authenticated user context

### Key Files to Know

#### Configuration
- `.env` - Environment variables (don't commit!)
- `drizzle.config.ts` - Drizzle ORM configuration
- `/src/db/schema.ts` - Database schema definition
- `.claude/` - Agent configurations

#### Testing Scripts
- `test-drizzle-connection.js` - Test DB connection
- `generate-jwt-token.mjs` - Generate JWT tokens
- `test-all-functions-with-jwt.mjs` - Test edge functions
- `check-missing-tables.js` - Verify schema sync

#### Documentation
- `CLAUDE.md` - Main project documentation
- `IMPORTANT_KEY_MIGRATION.md` - Critical key format info
- This file - Current state and handoff notes

### Next Developer Tasks

1. **Frontend Development**
   - Implement authentication flow UI
   - Create project management interface
   - Build article screening workflow

2. **API Integration**
   - Connect frontend to edge functions
   - Implement real-time subscriptions
   - Add file upload for PDFs

3. **Testing**
   - Write unit tests for components
   - Add E2E tests with Playwright
   - Test edge function error handling

### Important Notes

#### ⚠️ CRITICAL: New Key Format
- **DON'T** use old JWT-format keys
- **DO** use `sb_publishable_*` and `sb_secret_*`
- Read: https://github.com/orgs/supabase/discussions/29260

#### Database Migrations
- Use manual approach (see `create-missing-schema.js`)
- Don't rely on `drizzle-kit push` with Supabase
- Always check for existing enums/tables first

#### Authentication
- Edge functions need user JWT tokens
- Generate test tokens with `generate-jwt-token.mjs`
- Tokens expire after 1 hour

### Environment Setup for New Developer

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Copy environment variables**
   ```bash
   cp .env.example .env
   # Update with actual values from team
   ```

3. **Test database connection**
   ```bash
   node test-drizzle-connection.js
   ```

4. **Generate JWT tokens for testing**
   ```bash
   node generate-jwt-token.mjs
   ```

5. **Test edge functions**
   ```bash
   node test-all-functions-with-jwt.mjs
   ```

### Contact & Resources

- **Supabase Project**: https://qzvfufadiqmizrozejci.supabase.co
- **Documentation**: See CLAUDE.md
- **Agent Config**: .claude/config.json
- **Last Updated By**: Terry (Terragon Labs)

### Commit Ready
All work is committed. Ready to:
- Continue development
- Merge to main
- Deploy to staging

No uncommitted changes or pending work.