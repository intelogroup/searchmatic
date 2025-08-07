# Claude Development Guide

This document contains project-specific instructions and context for Claude working on the Migration and Authentication Platform MVP.

## Project Overview

This is a migration and authentication platform leveraging edge functions, designed to provide:
- Core email/password authentication flows (signup, login, logout)
- Database migration engine with versioned schema management
- Basic logging and event capture
- Automated deployment pipeline

## MVP Scope & Focus

### In-Scope (MVP 1.0)
- **User Authentication**: Email/password signup, login, logout flows only
- **Database Migration Engine**: Apply versioned schema migrations (up only)
- **Basic Logging**: Capture key authentication events and migration results
- **Single Environment Deployment**: Deploy edge functions and backend services
- **Core Testing**: Unit tests for core modules, smoke integration tests for auth/migration

### Strictly Out-of-Scope (Deferred to Phase 2)
- Password-reset flows, email verification, profile management
- Rollback/down migrations and migration history dashboard
- Advanced admin dashboard and role-based access control
- Enhanced security logging, audit trails, alerting integrations
- Multi-environment CI/CD (staging, production, canary rollouts)
- Third-party social login integrations and OAuth providers

## Development Approach & Subagent Coordination

### Subagent Architecture
Use specialized subagents for complex, multi-step operations:

1. **AuthAgent**: Authentication flow implementation and testing
2. **MigrationAgent**: Database schema and migration logic
3. **TestAgent**: Playwright test execution and validation
4. **UIAgent**: Frontend component development and styling
5. **SecurityAgent**: Security analysis and vulnerability assessment
6. **NetlifyAgent**: Deployment, build optimization, and Netlify platform management

### Sequential Subagent Usage
- Use Task tool proactively for complex operations
- Coordinate subagents sequentially to maintain context
- Each subagent should have clear domain expertise and responsibilities
- Maintain todo tracking across subagent operations

## Technical Architecture Guidelines

### Frontend Structure (React + TypeScript + Vite)
Follow the senior engineer's recommended folder structure:
```
src/
├── app/                # Root wiring: App.tsx, routing, theming
├── pages/              # Route-level folders (auth/, dashboard/, migrations/)
├── entities/           # Domain-specific logic and types
├── features/           # Composite feature components
└── shared/
    ├── ui/             # Design-system components (Button, Input, Toast, Skeleton)
    ├── hooks/          # Generic hooks (useDebounce, useToast)
    └── lib/            # API clients, logger wrappers
```

### UI/UX Standards
- Unified AuthForm component with toggle between login/signup modes
- Inline field validation on blur events
- Toast/Alert system for error and success feedback
- Loading states and skeleton screens during async operations
- Mobile-first responsive design with proper accessibility

### Database-First Development
- Always understand database schema before code changes
- Use MCP for tight database integration
- Validate schema against application models
- Implement proper RLS policies for security
- Use migrations for all schema changes

## Success Metrics & Quality Gates

### Performance Targets
- 95% pass rate for automated auth tests
- 100% success rate for migration application in CI
- 80%+ code coverage for core modules
- <5 minute deployment time
- All lint and type check passes

### Quality Requirements
- TypeScript strict mode enabled
- No `any` types in production code
- Proper error boundaries at route level
- Security best practices (no secrets in code)
- Conventional commit messages

## Development Workflow

1. **Planning**: Use TodoWrite for complex tasks
2. **Database First**: Understand schema before implementation
3. **Implementation**: Follow MVP scope strictly
4. **Testing**: Unit tests + smoke integration tests
5. **Validation**: Run lint, typecheck, and tests before completion
6. **Documentation**: Update existing docs only - NO NEW .md FILES

## Critical Documentation Rules

**PRIMARY REFERENCE**: Always consult `/docs` directory first for project specifications, guidelines, and context before any implementation work.

**NO DOCUMENT SPAM**: After each implementation, update ONLY these existing files:
- `docs/subagent-directions/failures.md` - Document what failed and lessons learned
- `docs/subagent-directions/success.md` - Record successful implementations for replication
- `docs/subagent-directions/devhandoff.md` - Keep current for team coordination
- `docs/claude.md` - Update architectural decisions and status (this file)

**NEVER CREATE NEW .md FILES** - The documentation ecosystem is complete. Focus on updating existing documentation rather than creating new files.

## Key Guardrails & Risk Mitigation

### Scope Creep Prevention
- Reference MVP_SPECIFICATION.md before any feature work
- Reject features not explicitly in MVP scope
- Use feature flags for experimental features
- Measure component complexity (<500 lines per component)

### Technical Debt Management
- Follow PREVENT_DEV_GAPS_GUARDRAILS.md recommendations
- Address security and performance debt over convenience debt
- Regular refactoring allocation in development cycles
- Monitor and enforce bundle size budgets

### Security & Best Practices
- Never commit secrets or API keys
- Use environment variables for configuration
- Implement proper input validation and sanitization
- Follow principle of least privilege for database access
- Proper authentication and authorization flows

## Specialized Subagent Specifications

### NetlifyAgent - Deployment & Platform Specialist

The NetlifyAgent is a specialized deployment expert with comprehensive Netlify platform integration, CLI tools, MCP server capabilities, and intelligent documentation access.

#### Core Capabilities
- **Netlify CLI Integration**: Full access to netlify-cli with all deployment, site management, and debugging commands
- **MCP Server**: Integrated Netlify MCP server for direct platform API access and real-time site management
- **Build Optimization**: Automatic build performance analysis, bundle optimization, and build error resolution
- **Documentation Intelligence**: Cached Netlify documentation with web search fallback for latest updates
- **Environment Management**: Environment variable management, secrets handling, and configuration validation

#### Specialized Tools & Knowledge
1. **Deployment Automation**
   - Automated build and deploy workflows
   - Branch deploy strategies (preview, production, staging)
   - Rollback capabilities and deployment history management
   - Performance monitoring and Core Web Vitals tracking

2. **Build Problem Resolution**
   - TypeScript compilation error resolution
   - Dependency conflict resolution
   - Build optimization for faster deploy times
   - Bundle analysis and size optimization
   - Memory usage optimization for large builds

3. **Netlify Platform Integration**
   - Edge Functions deployment and debugging
   - Form handling and serverless function management
   - CDN configuration and cache optimization
   - Domain management and SSL configuration
   - Analytics and performance monitoring

4. **Documentation & Support**
   - **Cached Docs**: Maintains local cache of latest Netlify documentation
   - **Web Search Integration**: Uses WebSearch tool to fetch latest docs when cache is stale
   - **Best Practices Database**: Curated knowledge base of common issues and solutions
   - **Version Compatibility**: Tracks Netlify CLI versions and feature compatibility

#### Usage Patterns
```bash
# NetlifyAgent Task Examples
Task: "Deploy to production with build optimization"
Task: "Fix build errors and optimize bundle size"  
Task: "Set up branch deploys with preview environments"
Task: "Debug edge function deployment issues"
Task: "Optimize site performance and Core Web Vitals"
```

#### MCP Server Integration
The NetlifyAgent includes a dedicated Netlify MCP server providing:
- Real-time site status monitoring
- Direct API access to Netlify platform
- Build log streaming and analysis
- Environment variable management
- Site configuration management

#### Error Resolution Expertise
- **Build Failures**: Dependency resolution, TypeScript errors, configuration issues
- **Deploy Issues**: Environment variables, routing problems, function deployment
- **Performance Problems**: Bundle size, loading speed, CDN optimization
- **Security**: SSL configuration, environment variable security, access controls

#### Documentation Strategy
1. **Primary Cache**: Maintains updated local copy of Netlify docs
2. **Web Search Fallback**: Automatically searches docs.netlify.com when needed
3. **Community Resources**: Access to Netlify community forums and Stack Overflow
4. **Version Tracking**: Monitors Netlify CLI and platform updates

The NetlifyAgent ensures reliable, optimized deployments while providing comprehensive troubleshooting and platform expertise.

## Current Status & Next Steps

The project is transitioning from proof-of-concept to production-ready MVP. Focus areas:

1. **Code Structure**: Implement recommended folder architecture
2. **Auth Flow**: Unified login/signup component with proper validation
3. **Migration Engine**: Core up-migration functionality only
4. **Testing**: Comprehensive test coverage for auth and migration flows
5. **Deployment**: Single-environment automated deployment pipeline

Last updated: 2025-08-07