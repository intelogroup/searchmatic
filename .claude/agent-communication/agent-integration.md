# Agent Communication Integration Guide

## Quick Integration for All Agents

### 1. Standard Agent Startup Pattern

Add this to the beginning of every agent execution:

```typescript
// Check for relevant reports from other agents
const commUtils = require('../agent-communication/comm-utils.js');

function onAgentStart(agentName: string) {
    // Check critical alerts first
    const criticalAlerts = commUtils.checkCriticalAlerts(agentName);
    if (criticalAlerts.length > 0) {
        console.log(`🚨 ${criticalAlerts.length} CRITICAL alerts found:`);
        criticalAlerts.forEach(alert => {
            console.log(`   - ${alert.sourceAgent}: ${alert.message}`);
        });
    }
    
    // Check broadcasts (high/critical priority)
    const broadcasts = commUtils.checkBroadcasts(agentName);
    if (broadcasts.length > 0) {
        console.log(`📢 ${broadcasts.length} priority broadcasts:`);
        broadcasts.forEach(broadcast => {
            console.log(`   - ${broadcast.sourceAgent}: ${broadcast.message}`);
        });
    }
    
    // Check regular reports (last 1 hour)
    const reports = commUtils.checkAgentReports(agentName, '1h');
    const relevantReports = reports.filter(r => r.priority === 'high' || r.priority === 'medium');
    if (relevantReports.length > 0) {
        console.log(`💬 ${relevantReports.length} relevant reports found:`);
        relevantReports.slice(0, 3).forEach(report => { // Show max 3
            console.log(`   - ${report.sourceAgent}: ${report.message}`);
        });
    }
}
```

### 2. Send Discovery Reports

When your agent discovers something important:

```typescript
function reportDiscovery(message: string, context: any = {}) {
    const report = commUtils.createReport(getCurrentAgentName(), message, {
        priority: 'medium',
        category: 'discovery',
        context: context,
        targetAgents: getRelatedAgents(context.stack)
    });
    
    commUtils.sendAgentReport(report);
}

// Example usage:
reportDiscovery("Bundle size reduced from 250KB to 180KB using code splitting", {
    stack: "react",
    files: ["src/components/"],
    tools: ["typescript", "playwright"]
});
```

### 3. Send Warning Reports

For important warnings that affect other agents:

```typescript
function reportWarning(message: string, context: any = {}, critical: boolean = false) {
    const report = commUtils.createReport(getCurrentAgentName(), message, {
        priority: critical ? 'critical' : 'high',
        category: 'warning',
        context: context,
        targetAgents: critical ? ['all'] : getRelatedAgents(context.stack),
        actionRequired: critical
    });
    
    commUtils.sendAgentReport(report);
}

// Example usage:
reportWarning("RLS policies disabled on users table. Data exposure risk!", {
    stack: "supabase",
    tools: ["supabase-admin", "postgres"]
}, true); // critical = true
```

### 4. Send Completion Reports  

At the end of successful operations:

```typescript
function reportCompletion(summary: string, context: any = {}) {
    if (isSignificantChange(context)) {
        const report = commUtils.createReport(getCurrentAgentName(), summary, {
            priority: 'low',
            category: 'completion', 
            context: context,
            targetAgents: ['all']
        });
        
        commUtils.sendAgentReport(report);
    }
}

// Example usage:
reportCompletion("Auth flows tested. 98% success rate achieved. Password reset emails delayed 30s", {
    stack: "supabase",
    testResults: { successRate: 0.98, coverage: 0.85 }
});
```

## Agent-Specific Integration Examples

### database-migration-agent Integration
```typescript
// At start - check for schema-related reports
onAgentStart("database-migration-agent");

// When discovering schema issues
reportWarning("Schema mismatch: users table missing email_verified column", {
    stack: "supabase",
    files: ["schema.sql"],
    tools: ["supabase-db"]
}, false);

// After successful migration
reportCompletion("Migration complete. 3 tables updated, RLS policies applied", {
    stack: "supabase",
    migration: "20250109_add_email_verification"
});
```

### auth-security-agent Integration
```typescript
// At start - check for security-related reports
onAgentStart("auth-security-agent");

// When finding critical security issue
reportWarning("CRITICAL: RLS policies disabled on users table!", {
    stack: "supabase",
    tables: ["users"],
    impact: "data-exposure"
}, true);

// After fixing auth flows
reportCompletion("Auth flows fixed. 95% success rate achieved", {
    stack: "supabase", 
    flows: ["login", "signup", "password-reset"],
    successRate: 0.95
});
```

### frontend-ui-agent Integration
```typescript
// At start
onAgentStart("frontend-ui-agent");

// When discovering component patterns
reportDiscovery("Reusable button component created with variants", {
    stack: "react",
    files: ["src/components/ui/Button.tsx"],
    pattern: "component-library"
});

// When finding performance issues
reportWarning("Large component detected. Dashboard.tsx is 800 lines", {
    stack: "react",
    files: ["src/components/Dashboard.tsx"],
    size: 800
});
```

### testing-qa-agent Integration
```typescript
// At start
onAgentStart("testing-qa-agent");

// When tests fail
reportWarning("Test suite failing. 3 auth tests broken after schema change", {
    stack: "supabase",
    testFiles: ["tests/auth.spec.ts"],
    failedTests: 3
});

// When coverage drops
reportWarning("Code coverage dropped to 65% (target: 80%)", {
    coverage: 0.65,
    target: 0.80,
    affectedFiles: ["src/auth/", "src/components/"]
});

// After successful test run
reportCompletion("Tests passing. Coverage: 87%. Performance tests: all under 3s", {
    coverage: 0.87,
    performance: { maxLoadTime: 2.8 }
});
```

### performance-optimization-agent Integration
```typescript
// At start
onAgentStart("performance-optimization-agent");

// Bundle size discoveries
reportDiscovery("Bundle analysis: React DevTools adding 45KB in production", {
    stack: "react",
    bundleSize: 245000,
    issue: "devtools-in-prod"
});

// Performance improvements
reportCompletion("Performance optimized. Load time: 2.1s, bundle: 185KB", {
    beforeLoad: 4.2,
    afterLoad: 2.1,
    beforeBundle: 250,
    afterBundle: 185
});
```

## Stack-Based Targeting

```typescript
function getRelatedAgents(stack: string): string[] {
    const stackRelations = {
        "supabase": ["database-migration-agent", "auth-security-agent", "api-integration-agent"],
        "react": ["frontend-ui-agent", "testing-qa-agent", "performance-optimization-agent"],  
        "netlify": ["deployment-devops-agent", "performance-optimization-agent"],
        "auth": ["auth-security-agent", "testing-qa-agent"],
        "database": ["database-migration-agent", "api-integration-agent"],
        "performance": ["performance-optimization-agent", "frontend-ui-agent", "testing-qa-agent"]
    };
    
    return stackRelations[stack] || ["all"];
}
```

## Message Templates

### Discovery Templates
- "Found {issue}. Impact: {impact}. Location: {location}"
- "Performance improvement: {metric} reduced from {before} to {after}"
- "New pattern implemented: {pattern}. Reusable across {scope}"

### Warning Templates  
- "Issue detected: {problem}. Affects: {affected}. Action needed: {action}"
- "Dependency problem: {dependency} causing {issue}. Impacts {agents}"
- "Security concern: {risk}. Severity: {level}. Immediate attention required"

### Completion Templates
- "Task complete: {summary}. Results: {metrics}. Next: {recommendations}"
- "{feature} implemented. Performance: {perf}. Coverage: {coverage}"
- "Deployment successful. Status: {status}. Monitoring: {monitoring}"

## Best Practices

1. **Be Concise**: Maximum 50 words per message
2. **Be Specific**: Include relevant context (stack, files, tools)
3. **Be Actionable**: Clear what other agents should know/do
4. **Use Priorities**: Critical for blocking issues, high for important, medium for FYI
5. **Target Appropriately**: Send to relevant agents, not always "all"
6. **Clean Language**: Professional, clear, no jargon

This integration system turns isolated agents into a coordinated team that shares knowledge and prevents duplicate work.