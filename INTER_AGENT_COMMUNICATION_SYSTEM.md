# Inter-Agent Communication System

## Overview
This system enables subagents to share crucial information through short reports (<50 words) while working or after completing tasks, facilitating better coordination and knowledge sharing across the agent ecosystem.

## Core Communication Architecture

### 1. Agent Report Structure
```typescript
interface AgentReport {
  id: string;
  timestamp: Date;
  sourceAgent: string;
  targetAgents?: string[]; // specific agents or "all"
  priority: "low" | "medium" | "high" | "critical";
  category: "discovery" | "warning" | "completion" | "insight" | "dependency";
  message: string; // max 50 words
  context: {
    task?: string;
    stack?: string;
    files?: string[];
    tools?: string[];
  };
  actionRequired?: boolean;
}
```

### 2. Communication Channels

#### A. Shared Memory Channel
- **Tool**: `memory` (existing MCP tool)
- **Storage**: `/tmp/agent-reports/` with timestamped JSON files
- **Persistence**: Reports persist across agent sessions

#### B. Real-time Broadcast
- **Method**: File-based message queue
- **Location**: `/tmp/agent-broadcasts/` 
- **Format**: One file per report, consumed and deleted by reading agents

#### C. Critical Alerts
- **Method**: Immediate notification via Slack (when available)
- **Trigger**: Priority = "critical" reports
- **Fallback**: File-based alert queue

## Implementation

### 3. Core Communication Functions

```typescript
// Send report to other agents
function sendAgentReport(report: AgentReport): void {
  const reportPath = `/tmp/agent-reports/${report.timestamp}-${report.sourceAgent}.json`;
  writeToFile(reportPath, JSON.stringify(report));
  
  if (report.priority === "critical") {
    broadcastCriticalAlert(report);
  }
}

// Check for incoming reports
function checkAgentReports(agentName: string): AgentReport[] {
  const reportsDir = "/tmp/agent-reports/";
  const reports = listFiles(reportsDir)
    .filter(file => !file.includes(agentName)) // exclude own reports
    .map(file => JSON.parse(readFile(file)))
    .filter(report => 
      !report.targetAgents || 
      report.targetAgents.includes(agentName) || 
      report.targetAgents.includes("all")
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return reports;
}
```

### 4. Agent Integration Patterns

#### A. Task Start Pattern
```typescript
// At beginning of agent execution
function onAgentStart(agentName: string): void {
  const recentReports = checkAgentReports(agentName);
  const relevantReports = filterRelevantReports(recentReports, agentName);
  
  if (relevantReports.length > 0) {
    processIncomingReports(relevantReports);
  }
}
```

#### B. Task Progress Pattern  
```typescript
// During agent execution when discovering something crucial
function onCrucialDiscovery(discovery: string, context: any): void {
  sendAgentReport({
    sourceAgent: getCurrentAgent(),
    priority: "medium",
    category: "discovery", 
    message: `Found ${discovery}. ${context.impact}`,
    context: context,
    targetAgents: getRelatedAgents(context.stack)
  });
}
```

#### C. Task Completion Pattern
```typescript
// At end of agent execution
function onAgentComplete(agentName: string, result: any): void {
  const completionReport = generateCompletionReport(agentName, result);
  
  if (completionReport.isSignificant) {
    sendAgentReport({
      sourceAgent: agentName,
      priority: "low",
      category: "completion",
      message: completionReport.summary,
      context: completionReport.context,
      targetAgents: ["all"]
    });
  }
}
```

## 5. Communication Scenarios

### Scenario A: Database Schema Change
```typescript
// database-migration-agent discovers schema inconsistency
sendAgentReport({
  sourceAgent: "database-migration-agent",
  priority: "high",
  category: "warning",
  message: "Schema mismatch detected. Users table missing email_verified column. Affects auth flows.",
  context: {
    stack: "supabase",
    files: ["schema.sql"],
    tools: ["supabase-db", "postgres"]
  },
  targetAgents: ["auth-security-agent", "testing-qa-agent"],
  actionRequired: true
});
```

### Scenario B: Performance Issue Discovery
```typescript
// performance-optimization-agent finds bundle size issue
sendAgentReport({
  sourceAgent: "performance-optimization-agent", 
  priority: "medium",
  category: "discovery",
  message: "Bundle size 250KB (>200KB target). Large React components in /components/dashboard/*",
  context: {
    files: ["components/dashboard/"],
    tools: ["playwright"]
  },
  targetAgents: ["frontend-ui-agent"]
});
```

### Scenario C: Critical Error
```typescript
// auth-security-agent detects security issue
sendAgentReport({
  sourceAgent: "auth-security-agent",
  priority: "critical", 
  category: "warning",
  message: "CRITICAL: RLS policies disabled on users table. Data exposure risk!",
  context: {
    stack: "supabase",
    tools: ["supabase-admin", "postgres"]
  },
  targetAgents: ["all"],
  actionRequired: true
});
```

## 6. Agent-Specific Behaviors

### High-Communication Agents
- **failure-analysis-expert-agent**: Shares debugging insights
- **database-migration-agent**: Reports schema changes 
- **auth-security-agent**: Alerts on security issues
- **testing-qa-agent**: Reports test failures/coverage issues

### Medium-Communication Agents  
- **frontend-ui-agent**: Reports component patterns
- **performance-optimization-agent**: Shares optimization findings
- **deployment-devops-agent**: Reports deployment status

### Low-Communication Agents
- **documentation-agent**: Reports documentation updates
- **accessibility-agent**: Reports accessibility findings

## 7. Message Filtering & Relevance

### Stack-Aware Filtering
```typescript
function getRelatedAgents(stack: string): string[] {
  const stackRelations = {
    "supabase": ["database-migration-agent", "auth-security-agent", "api-integration-agent"],
    "react": ["frontend-ui-agent", "testing-qa-agent", "performance-optimization-agent"],
    "netlify": ["deployment-devops-agent", "performance-optimization-agent"]
  };
  
  return stackRelations[stack] || ["all"];
}
```

### Priority-Based Processing
```typescript
function processIncomingReports(reports: AgentReport[]): void {
  const criticalReports = reports.filter(r => r.priority === "critical");
  const highReports = reports.filter(r => r.priority === "high");
  
  // Process critical reports first
  criticalReports.forEach(processReport);
  highReports.forEach(processReport);
}
```

## 8. Implementation Steps

1. **Memory Tool Enhancement**: Use existing `memory` tool for persistent storage
2. **Report Generation**: Add reporting functions to each agent
3. **Message Queue**: Implement file-based message queue system
4. **Agent Integration**: Update each agent to check reports on start
5. **Critical Alerts**: Add Slack integration for critical reports
6. **Testing**: Verify cross-agent communication works

## 9. Benefits

- **Faster Problem Resolution**: Agents learn from each other's discoveries
- **Reduced Duplication**: Agents avoid repeating work others have done
- **Better Coordination**: Related tasks are handled with full context
- **Quality Improvement**: Issues discovered by one agent benefit all others
- **Knowledge Retention**: Important findings persist across sessions

## 10. Usage Examples

### Start-up Report Check
```bash
# Agent checks for relevant reports when starting
reports = checkAgentReports("frontend-ui-agent")
if hasHighPriorityReports(reports):
    processReports(reports)
```

### Mid-task Discovery
```bash  
# Agent discovers something important during work
sendReport("Bundle optimization reduced size from 250KB to 180KB using code splitting")
```

### Task Completion
```bash
# Agent completes task and shares key outcomes  
sendReport("Auth flows tested. 98% success rate achieved. Known issue: password reset emails delayed 30s")
```

This system transforms isolated subagents into a collaborative ecosystem where crucial information flows seamlessly, improving overall development efficiency and quality.