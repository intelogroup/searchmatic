# Claude Code Agent Orchestration Guide

## Overview
This guide provides clear instructions for Claude Code on when and how to invoke the **16 specialized subagents** with prioritized MCP tools for efficient MVP development and testing.

## Quick Agent Invocation Reference

### 👨‍🏫 **failure-analysis-expert-agent** (THE WISE DEBUGGER)
**INVOKE FOR**: Mysterious errors, cryptic messages, repeated failures, deep error analysis needed
**TOOLS**: brave-search → fetch → filesystem → memory → sequential-thinking
```
Use when: Complex errors other agents can't solve, need expert diagnosis, debugging wisdom
Example: "Strange React hydration error only in production" → invoke failure-analysis-expert-agent
PERSONALITY: Wise old debugger - reads, researches, documents wisdom (NO CODE CHANGES)
OUTPUTS: Updates failures.md with deep analysis and debugging recommendations
```

### 🔐 **auth-security-agent**
**INVOKE FOR**: Authentication bugs, login/signup issues, security vulnerabilities, session problems
**PRIORITY TOOLS**: supabase-admin → sentry → playwright → postgres
```
Use when: Auth flows broken, security testing needed, user management issues
Example: "Login form not working" → invoke auth-security-agent
```

### 🗄️ **database-migration-agent** 
**INVOKE FOR**: Schema issues, migration failures, database errors, data integrity problems
**PRIORITY TOOLS**: supabase-db → postgres → sequential-thinking → supabase-admin
```
Use when: Database schema inconsistencies, migration needed, DB performance issues
Example: "Missing table error" → invoke database-migration-agent
FIRST ACTION: Always fetch current DB schema
```

### 🎨 **frontend-ui-agent**
**INVOKE FOR**: UI components, frontend bugs, styling issues, responsive design
**PRIORITY TOOLS**: typescript → figma → storybook → eslint
```
Use when: React components needed, UI bugs, design implementation
Example: "Component not rendering correctly" → invoke frontend-ui-agent
FIRST ACTION: Read existing component files
```

### ⚡ **supabase-edge-functions-agent**
**INVOKE FOR**: Edge function issues, serverless backend problems, API endpoints
**PRIORITY TOOLS**: supabase-functions → deno → supabase-admin → sentry
```
Use when: API endpoints failing, serverless function deployment issues
Example: "Edge function timeout error" → invoke supabase-edge-functions-agent
```

### 🧪 **testing-qa-agent**
**INVOKE FOR**: Test failures, quality issues, coverage problems, bug reproduction
**PRIORITY TOOLS**: playwright → testsprite → eslint → sentry
```
Use when: Tests failing, coverage <80%, quality assurance needed
Example: "Tests not passing" → invoke testing-qa-agent
MVP TARGET: Achieve 95% auth success rate, >80% coverage
```

### 🚀 **deployment-devops-agent**
**INVOKE FOR**: Deployment failures, CI/CD issues, infrastructure problems
**PRIORITY TOOLS**: netlify-cli → github → docker → aws
```
Use when: Deployment failing, CI/CD pipeline broken, infrastructure issues
Example: "Netlify build failing" → invoke deployment-devops-agent
```

### ⚡ **performance-optimization-agent**
**INVOKE FOR**: Slow load times, large bundles, performance issues
**PRIORITY TOOLS**: playwright → brave-search → fetch
```
Use when: Load time >3s, bundle size >200KB, performance degradation
Example: "App loading slowly" → invoke performance-optimization-agent
VCT TARGET: <3s load, <200KB bundle
```

### 🔗 **api-integration-agent**
**INVOKE FOR**: API integration problems, external service issues, data fetching errors
**PRIORITY TOOLS**: fetch → supabase-admin → sentry → brave-search
```
Use when: API calls failing, external service integration issues
Example: "Third-party API not responding" → invoke api-integration-agent
```

### 🔄 **state-management-agent**
**INVOKE FOR**: React state issues, data flow problems, state synchronization
**PRIORITY TOOLS**: typescript → memory → supabase-admin → playwright
```
Use when: State management bugs, data flow issues, state synchronization problems
Example: "Component state not updating" → invoke state-management-agent
```

### 🚨 **error-monitoring-agent**
**INVOKE FOR**: Error tracking, monitoring setup, incident analysis
**PRIORITY TOOLS**: sentry → supabase-admin → memory → fetch
```
Use when: Error tracking needed, monitoring setup, incident analysis
Example: "Need to track production errors" → invoke error-monitoring-agent
```

## Agent Coordination Patterns

### 🔄 **Sequential Invocation Pattern**
For complex issues requiring multiple agents:
```
1. database-migration-agent → Validate/fix schema
2. auth-security-agent → Implement auth flows  
3. testing-qa-agent → Validate implementation
4. deployment-devops-agent → Deploy to production
```

### 🔀 **Parallel Invocation Pattern**
For independent tasks:
```
frontend-ui-agent (UI work) || testing-qa-agent (test setup) || database-migration-agent (schema fixes)
```

### 🎯 **MVP Critical Path Pattern**
For MVP delivery focus:
```
1. database-migration-agent → Ensure schema ready
2. auth-security-agent → Auth flows working (95% success)
3. testing-qa-agent → Coverage >80%, all tests pass
4. performance-optimization-agent → <3s load, <200KB bundle
5. deployment-devops-agent → Production deployment
```

## MCP Tool Usage Guidelines

### Priority Levels
1. **PRIMARY** - First tool to use for the task
2. **CRITICAL** - Essential for monitoring/validation
3. **TESTING** - For testing and validation
4. **BACKUP** - Alternative if primary fails
5. **SUPPORT** - Supporting functionality

### Tool Sharing Across Agents
- **supabase-admin**: Shared by auth, database, API agents
- **playwright**: Shared by testing, frontend, performance agents
- **sentry**: Shared by error-monitoring, auth, deployment agents
- **typescript**: Shared by frontend, testing, development agents

## Real-World Usage Examples

### Example 1: Authentication Not Working
```
Issue: "Users can't login"
→ Invoke: auth-security-agent
→ Tools Used: supabase-admin (check auth config) → sentry (check errors) → playwright (test flows)
→ Follow-up: testing-qa-agent (validate fix)
```

### Example 2: Database Schema Missing Tables
```
Issue: "Application errors due to missing tables"
→ Invoke: database-migration-agent  
→ First Action: Fetch schema with supabase-db
→ Tools Used: postgres (validate) → sequential-thinking (plan fix) → supabase-db (apply)
→ Follow-up: testing-qa-agent (validate schema)
```

### Example 3: Frontend Component Not Rendering
```
Issue: "React component showing blank"
→ Invoke: frontend-ui-agent
→ First Action: Read component files with filesystem
→ Tools Used: typescript (fix code) → eslint (validate) → storybook (test)
→ Follow-up: testing-qa-agent (e2e validation)
```

### Example 4: Tests Failing
```
Issue: "Test suite failing, coverage below 80%"
→ Invoke: testing-qa-agent
→ Tools Used: playwright (run tests) → testsprite (analyze) → eslint (code quality)
→ Target: Achieve >80% coverage, 95% auth success rate
```

### Example 5: App Loading Slowly
```
Issue: "App takes 6 seconds to load"
→ Invoke: performance-optimization-agent
→ Tools Used: playwright (measure) → brave-search (research solutions)
→ Target: <3 seconds load time, <200KB bundle
→ Follow-up: testing-qa-agent (validate performance)
```

## MVP Success Criteria Validation

### Critical Checkpoints
- **95% auth flow success rate** → auth-security-agent + testing-qa-agent
- **>80% code coverage** → testing-qa-agent
- **<3s load time** → performance-optimization-agent + testing-qa-agent  
- **<200KB bundle** → performance-optimization-agent + frontend-ui-agent
- **100% migration success** → database-migration-agent + testing-qa-agent

### Agent Responsibility Matrix
| Success Metric | Primary Agent | Validation Agent | Tools Used |
|----------------|---------------|------------------|------------|
| Auth Success 95% | auth-security-agent | testing-qa-agent | supabase-admin, playwright |
| Coverage >80% | testing-qa-agent | - | playwright, testsprite |
| Load <3s | performance-optimization-agent | testing-qa-agent | playwright, brave-search |
| Bundle <200KB | frontend-ui-agent | performance-optimization-agent | typescript, eslint |
| Migration 100% | database-migration-agent | testing-qa-agent | supabase-db, postgres |

## Best Practices

### 1. Always Start with Schema
For any database-related issue, invoke `database-migration-agent` first to validate schema.

### 2. Test After Every Change  
Follow every implementation with `testing-qa-agent` to validate changes.

### 3. Prioritize MCP Tools
Always use priority tools first, fallback to alternatives only if needed.

### 4. Document Decisions
Use agents to document architectural decisions and fixes.

### 5. MVP Focus
Keep all agent invocations aligned with MVP success metrics.

This orchestration guide ensures Claude Code can efficiently coordinate all 15 specialized agents with their prioritized MCP tools for successful MVP delivery within the 5-week timeline.