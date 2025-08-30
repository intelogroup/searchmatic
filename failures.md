# 🔍 Failure Analysis Documentation

*Maintained by the Failure Analysis Expert Agent*

> This document contains deep diagnostic analysis of errors, failures, and debugging wisdom collected across the project. Each entry represents thorough research and analysis to help prevent similar issues in the future.

---

## 📊 **FAILURE SUMMARY DASHBOARD**

| Category | Total | Resolved | Pending | Critical |
|----------|-------|----------|---------|----------|
| Database | 3 | 3 | 0 | 0 |
| Authentication | 2 | 2 | 0 | 0 |
| Frontend | 0 | 0 | 0 | 0 |
| Deployment | 1 | 1 | 0 | 0 |
| Performance | 0 | 0 | 0 | 0 |

---

## 📝 **ANALYSIS ENTRIES**

### 2025-08-30: Database Migration Failures

#### ❌ drizzle-kit push Command Failure
**Error**: "Tenant or user not found"
**Root Cause**: Connection string incompatibility with Supabase pooler
**Solution**: Implemented manual migration approach using direct SQL queries
**Prevention**: Always use manual migrations for Supabase projects

#### ❌ PostgreSQL CREATE TYPE Syntax
**Error**: "syntax error at or near 'NOT'"
**Root Cause**: PostgreSQL doesn't support `CREATE TYPE IF NOT EXISTS`
**Solution**: Check for existing types before creation
**Code Fix**:
```sql
-- Check first
SELECT typname FROM pg_type WHERE typname = 'enum_name';
-- Then create if not exists
CREATE TYPE enum_name AS ENUM(...);
```

#### ❌ Special Characters in Database Password
**Error**: Connection failures with special characters
**Root Cause**: URL encoding required for passwords with #, $, %
**Solution**: Use encodeURIComponent() or replace with %23, %24, %25

### 2025-08-30: Authentication Failures

#### ❌ New Supabase Keys Not Valid JWTs
**Error**: "Invalid JWT" when using sb_publishable_* or sb_secret_*
**Root Cause**: New key format are opaque identifiers, not JWTs
**Solution**: Generate JWT tokens using JWT secret
**Reference**: https://github.com/orgs/supabase/discussions/29260

#### ❌ Edge Functions Require User JWT
**Error**: 401 Unauthorized with service keys
**Root Cause**: Edge functions validate user sessions, not service keys
**Solution**: Authenticate users first, use their JWT tokens

#### ❌ Edge Functions JWT Validation Issue (2025-08-30)
**Error**: "Invalid JWT" for all edge function calls, even with valid user tokens
**Root Cause**: Unknown - possibly Supabase platform-level JWT validation changes
**Symptoms**: 
- User JWT tokens work for REST API calls (✅)
- Same tokens fail for edge functions (❌)
- JWT structure and timing are correct
- Key ID matches JWKS endpoint
- JWT_SECRET is configured correctly
**Status**: UNRESOLVED - Requires Supabase support investigation
**Workaround**: Use REST API endpoints instead of edge functions

---

## 🧠 **COMMON ERROR PATTERNS**

### **Pattern Recognition Database**

1. **Supabase Connection Issues**: Always use encoded passwords, manual migrations
2. **JWT vs New Keys**: New keys (sb_*) are not JWTs, need separate token generation
3. **PostgreSQL Limitations**: No IF NOT EXISTS for types, check existence first
4. **Edge Function Auth**: Requires user JWT, not service/anon keys

---

## 🔧 **DEBUGGING ENHANCEMENT RECOMMENDATIONS**

### **Suggested Logging Improvements**
*Strategic recommendations for better error visibility*

### **Error Monitoring Enhancements**  
*Proposed improvements to error tracking and alerting*

---

## 📚 **KNOWLEDGE BASE**

### **Stack-Specific Wisdom**
*Framework and technology-specific debugging insights*

### **Environmental Factors**
*Common environment-related failure causes and solutions*

---

## 🎯 **PREVENTION STRATEGIES**

### **Best Practices Learned**
*Preventive measures derived from failure analysis*

### **Code Review Checklist**
*Items to check based on common failure patterns*

---

*Last updated: $(date)*
*Maintained by: failure-analysis-expert-agent*