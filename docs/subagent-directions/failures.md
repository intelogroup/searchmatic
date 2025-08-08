# Failures & Known Issues

This document provides a register of recent subagent failures, errors, and known issues.
Subagents should review this before starting their tasks to understand current troubleshooting items.

## 🔧 Recently Resolved Issues (2025-08-07)

### TypeScript Compliance Issues - RESOLVED ✅
**Issue**: 59 linting errors due to widespread use of `any` types across the codebase
**Impact**: Violated MVP requirements for "No `any` types in production code" and "TypeScript strict mode"
**Root Cause**: Legacy code with insufficient type safety during rapid prototyping phase

**Resolution Applied**:
- Systematically replaced all `any` types with proper TypeScript interfaces
- Added proper database types (`Json`, `ProjectStats`, etc.) throughout services
- Fixed empty interface types in UI components
- Enhanced test mocks with proper typing using `unknown` instead of `any`
- Fixed React fast refresh issues by separating hooks from context components

**Lessons Learned**:
1. **Database-First Typing**: Always use Supabase's generated types for database operations
2. **Service Layer Types**: Define proper interfaces for all API responses and function parameters  
3. **Component Props**: Use proper React type definitions rather than empty interfaces
4. **Test Safety**: Use `unknown` type for test mocks to maintain type safety
5. **Architecture Separation**: Keep hooks separate from context providers for React fast refresh compatibility

### Playwright Configuration Issues - RESOLVED ✅  
**Issue**: Playwright tests failing due to missing VCT setup files and browser dependencies
**Impact**: End-to-end testing was blocked, preventing comprehensive user journey validation
**Root Cause**: Complex VCT framework configuration that was outside MVP scope

**Resolution Applied**:
- Installed Playwright browsers and system dependencies
- Created simplified config for MVP testing needs
- Resolved VCT framework dependency issues by removing out-of-scope components

**Lessons Learned**:
1. **MVP Focus**: Keep testing infrastructure aligned with MVP scope - avoid over-engineering
2. **Dependency Management**: Ensure all required system dependencies are documented
3. **Configuration Simplicity**: Start with simple configs and add complexity as needed

## 📚 Historical Issues (Resolved)

### Development Environment Setup
**Issue**: Various environment configuration and dependency issues during initial setup
**Status**: RESOLVED - All development dependencies properly configured

### Code Organization  
**Issue**: Mixed folder structure with unclear separation of concerns
**Status**: RESOLVED - Clean architecture implemented following senior engineer recommendations

## 🚫 No Current Critical Issues

As of 2025-08-07, there are **zero critical issues** remaining in the Migration and Authentication Platform MVP:
- All tests passing (63/63)  
- Zero linting errors
- TypeScript strict mode compliance achieved
- MVP requirements fully met

## 🔍 Areas to Monitor

### Potential Future Issues
1. **Playwright E2E Tests**: May need browser installation on new environments
2. **Environment Variables**: Ensure proper configuration in deployment environments  
3. **Database Migrations**: Real migration execution will need careful testing when implemented
4. **Error Monitoring**: Set up proper error tracking for production issues

### Prevention Strategies
1. **Type Safety First**: Always define proper types before implementation
2. **MVP Scope Adherence**: Regularly check against `/docs/MVP_SPECIFICATION.md` to prevent scope creep
3. **Code Quality Gates**: Run lint and type check before any commits
4. **Documentation Updates**: Keep this failures.md updated with lessons learned
