# Security Documentation

## 🔒 Security Overview

This document outlines the security measures implemented in the application and provides guidelines for maintaining security standards.

## Critical Security Remediation Completed

### ❌ VULNERABILITIES FIXED

1. **CRITICAL: Service Role Key Exposure**
   - **Issue**: Supabase service role keys were hardcoded in multiple files
   - **Risk**: Full database access, potential data breach
   - **Fix**: All keys moved to environment variables
   - **Files Fixed**: `mcp.json`, `package.json`, `scripts/apply-migration.js`, `scripts/verify-mcp.js`, `scripts/MIGRATION_GUIDE.md`

2. **Configuration Security**
   - **Issue**: Multiple credential exposures across configuration files
   - **Fix**: Implemented secure environment variable pattern
   - **Prevention**: Enhanced `.gitignore` with security patterns

## 🛡️ Security Architecture

### Authentication & Authorization
- **Supabase Auth**: JWT-based authentication
- **Row Level Security (RLS)**: Enabled on all user data tables
- **Service Role Keys**: Server-side only, environment variables

### Row Level Security Policies

#### Conversations Table
- Users can only view/modify their own conversations
- Policies: SELECT, INSERT, UPDATE, DELETE restricted to `auth.uid() = user_id`

#### Messages Table  
- Users can only access messages in their conversations
- Policies check conversation ownership via subquery

#### Protocols Table
- Users can only manage their own protocols
- Update/Delete restricted to unlocked protocols only
- Policy: `auth.uid() = user_id AND is_locked = FALSE`

#### Projects Table (Future Implementation)
- RLS policies need to be implemented
- Should follow same user isolation pattern

### Input Validation & Sanitization
- **React**: Built-in XSS protection via JSX
- **TypeScript**: Type safety prevents many injection issues
- **Input Components**: Using controlled components with proper validation
- **No Dangerous Patterns**: No `dangerouslySetInnerHTML` or `innerHTML` usage detected

## 🔐 Environment Variable Security

### Security Levels

1. **PUBLIC (Client-Side)**
   ```
   VITE_SUPABASE_URL=https://project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_OPENAI_API_KEY=sk-... (if needed client-side)
   ```

2. **SERVER-SIDE ONLY (CRITICAL)**
   ```
   SUPABASE_SERVICE_ROLE_KEY=sbp_...
   SUPABASE_ACCESS_TOKEN=sbp_...
   ```

3. **DEVELOPMENT/INTEGRATION**
   ```
   BRAVE_API_KEY=...
   SENTRY_AUTH_TOKEN=...
   GITHUB_PERSONAL_ACCESS_TOKEN=...
   ```

### Environment Setup

1. **Copy template**: `cp .env.example .env`
2. **Configure values**: Fill in your actual credentials
3. **Validate**: Run `node scripts/validate-env-security.js`
4. **Verify**: Check `.env` is in `.gitignore`

## 🚨 Security Validation

### Automated Security Checks

Run security validation:
```bash
node scripts/validate-env-security.js
```

This validates:
- ✅ Required environment variables present
- ✅ No placeholder values in production
- ✅ Proper credential formats
- ✅ No obviously insecure values
- ✅ Environment file configuration

### Pre-Deployment Security Checklist

- [ ] All service role keys in environment variables
- [ ] No credentials in git history
- [ ] RLS policies enabled on all user tables
- [ ] Environment validation passing
- [ ] Input validation implemented
- [ ] Error handling doesn't leak sensitive data
- [ ] HTTPS enforced in production
- [ ] Security headers configured

## 📋 Security Incident Response

### If Credentials Are Compromised

1. **IMMEDIATE ACTIONS**:
   - Rotate keys in Supabase dashboard immediately
   - Check Supabase logs for unauthorized access
   - Review git history for committed secrets
   - Notify team members

2. **INVESTIGATION**:
   - Analyze access logs for suspicious activity
   - Check for data exfiltration
   - Review user accounts for unauthorized access
   - Document timeline of events

3. **REMEDIATION**:
   - Update all affected environment configurations
   - Deploy with new credentials
   - Monitor for continued suspicious activity
   - Implement additional monitoring if needed

### Security Monitoring

#### Supabase Dashboard Monitoring
- Check "Logs" section regularly
- Monitor authentication failures
- Review API usage patterns
- Set up alerts for unusual activity

#### Application Monitoring
- Error boundaries catch and log security-related errors
- Input validation logs suspicious attempts
- Monitor for SQL injection attempts in logs

## 🔍 Security Testing

### Automated Security Tests

Located in `tests/security-focused.spec.ts` and `tests/auth-edge-cases.spec.ts`:

- ✅ XSS prevention testing
- ✅ SQL injection prevention
- ✅ Input validation testing
- ✅ Session security testing
- ✅ API key exposure detection
- ✅ Storage security validation

Run security tests:
```bash
npm run test:e2e -- tests/security-focused.spec.ts
npm run test:e2e -- tests/auth-edge-cases.spec.ts
```

### Manual Security Testing

1. **Authentication Testing**:
   - Test with expired tokens
   - Verify session timeout
   - Check cross-user data access

2. **Input Validation**:
   - Test with malicious payloads
   - Verify proper error handling
   - Check for information leakage

3. **Database Security**:
   - Verify RLS policy enforcement
   - Test service role key isolation
   - Check for SQL injection vulnerabilities

## 📚 Security Best Practices

### Development Guidelines

1. **Never Commit Secrets**:
   - Use `.env.example` for templates
   - Check files before committing
   - Use git pre-commit hooks

2. **Use Principle of Least Privilege**:
   - Client-side: Only anon keys
   - Server-side: Service keys with proper validation
   - Database: RLS policies for user isolation

3. **Input Validation**:
   - Validate all user inputs
   - Use TypeScript for type safety
   - Sanitize data before database operations

4. **Error Handling**:
   - Don't expose internal errors to users
   - Log security events for monitoring
   - Use proper HTTP status codes

### Production Deployment

1. **Environment Variables**:
   - Use Netlify environment variables
   - Never embed secrets in build artifacts
   - Validate configuration before deployment

2. **Database Security**:
   - Use different credentials for different environments
   - Enable RLS on all user data tables
   - Regular security audits

3. **Monitoring**:
   - Set up error monitoring (Sentry)
   - Monitor authentication logs
   - Alert on security events

## 🆘 Security Contacts

For security issues:
1. Review this documentation
2. Check the validation scripts
3. Consult team security guidelines
4. Report critical issues immediately

## 📝 Security Changelog

### 2025-08-07 - Critical Security Remediation
- **FIXED**: Removed all hardcoded service role keys
- **ADDED**: Comprehensive environment variable system
- **ENHANCED**: Security validation scripts
- **IMPROVED**: `.gitignore` security patterns
- **DOCUMENTED**: Complete security procedures

### RLS Policy Status
- ✅ **conversations**: Complete RLS implementation
- ✅ **messages**: Complete RLS implementation  
- ✅ **protocols**: Complete RLS implementation
- ⚠️ **projects**: RLS policies exist but need validation
- ⚠️ **profiles**: RLS implementation status unknown

---

**⚠️ REMEMBER**: Security is everyone's responsibility. When in doubt, ask for a security review before proceeding.