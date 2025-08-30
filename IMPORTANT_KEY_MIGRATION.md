# ⚠️ CRITICAL: Supabase Key Format Migration

## IMPORTANT NOTICE FOR ALL AGENTS AND DEVELOPERS

**Date of Change:** August 2025  
**Status:** ✅ MIGRATION COMPLETE  
**Reference:** https://github.com/orgs/supabase/discussions/29260

---

## 🔴 BREAKING CHANGES - READ THIS FIRST

### OLD Keys (DEPRECATED - DO NOT USE)
- ❌ **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT format)
- ❌ **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT format)

### NEW Keys (CURRENT - USE THESE)
- ✅ **Publishable Key**: `sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS` (replaces anon key)
- ✅ **Secret Key**: `sb_secret_0HF5k5_nhplbINXe-IL9zA_gZQjDN8p` (replaces service role key)

---

## 📋 Current Configuration

```env
# CORRECT - New format
VITE_SUPABASE_ANON_KEY=sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS
SUPABASE_SECRET_KEY=sb_secret_0HF5k5_nhplbINXe-IL9zA_gZQjDN8p

# WRONG - Old format (DO NOT USE)
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔑 JWT Keys for Verification

### Current Active Key
```json
{
  "kid": "ee8e6058-6e20-48ff-b3df-5229b6f97809",
  "alg": "ES256",
  "discovery_url": "https://qzvfufadiqmizrozejci.supabase.co/auth/v1/.well-known/jwks.json"
}
```

### Standby Key
```json
{
  "kid": "92028fb7-7a2d-4314-9f84-ce5ab7293bcb",
  "alg": "ES256",
  "discovery_url": "https://qzvfufadiqmizrozejci.supabase.co/auth/v1/.well-known/jwks.json"
}
```

---

## ⚡ What This Means

1. **Authentication Changes**:
   - The new keys are NOT JWTs themselves
   - They are opaque identifiers used by Supabase SDK
   - Edge functions still require valid JWT tokens from authenticated users

2. **SDK Usage**:
   ```javascript
   // CORRECT - Using new publishable key
   const supabase = createClient(
     'https://qzvfufadiqmizrozejci.supabase.co',
     'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS'
   );
   ```

3. **Edge Functions**:
   - Cannot use publishable/secret keys directly as Bearer tokens
   - Must authenticate users and use their JWT tokens
   - Or generate JWT tokens using the JWT secret

---

## 🛠️ For Generating JWT Tokens

If you need to generate JWT tokens for testing:

```javascript
// JWT Secret (for generating tokens only - NEVER expose in client)
const JWT_SECRET = 'W8rSWkvO+1bfTMWpzH2S89WV2OK5n6v6vPuPJo7IJDxgDyjv8W1S+LYNKIv2XK73PkzvsDxjDGYziGvSdWQv0g==';

// Use generate-jwt-token.mjs script to create valid tokens
```

---

## 📚 Required Reading

**ALL agents working on this project MUST read:**
→ https://github.com/orgs/supabase/discussions/29260

This discussion explains:
- Why the key format changed
- Security improvements
- Migration guidelines
- SDK compatibility

---

## ✅ Migration Checklist

- [x] Updated `.env` with new key format
- [x] Updated `.env.example` with new format
- [x] Removed all references to old JWT-format keys
- [x] Updated authentication scripts
- [x] Tested edge functions with proper JWT tokens
- [x] Documented JWT key information

---

## ⚠️ Common Mistakes to Avoid

1. ❌ **DON'T** use publishable/secret keys as JWT tokens
2. ❌ **DON'T** try to decode the new keys (they're not JWTs)
3. ❌ **DON'T** use old JWT-format keys anywhere
4. ✅ **DO** use Supabase SDK with new keys
5. ✅ **DO** authenticate users to get valid JWT tokens
6. ✅ **DO** read the GitHub discussion for full context

---

## 🔄 Last Updated
- Date: August 30, 2025
- By: Terry (Terragon Labs Agent)
- Status: All systems migrated to new format