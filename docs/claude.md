# Claude Development Guide

This document contains project-specific instructions and context for Claude.

## VCT Framework Integration

This project now includes the VCT (Visual Code Testing) Framework, which transforms Claude into a vision-, schema-, database-, and workflow-aware CI/CD orchestrator.

### Key Features

- **Visual Awareness**: Screenshot capture and comparison across environments
- **Schema-First**: Live database schema fetching and validation
- **Subagent Architecture**: Specialized agents for different responsibilities
- **Slash Commands**: Interactive workflow orchestration
- **Error Monitoring**: Integration with Sentry, Highlight, and LogAI
- **Canonical Documentation**: This file and 9 others maintained automatically

### VCT Agents

1. **SpecAgent**: Feature specification generation and task breakdown
2. **SchemaAgent**: Database schema management and validation
3. **TestAgent**: Playwright test execution with visual verification
4. **ErrorAgent**: Error analysis and bug tracking
5. **DocAgent**: Documentation maintenance and updates
6. **Orchestrator**: Coordinates all agents and manages workflows

### Slash Commands Available

- `/spec-create` - Create feature specifications
- `/spec-orchestrate` - Full feature implementation workflow
- `/bug-create` - Create bug reports with context
- `/bug-analyze` - Analyze existing bugs
- `/bug-fix` - Implement and test bug fixes
- `/bug-verify` - Verify bug fixes are working
- `/test-journey` - Execute user journey tests
- `/test-visual` - Run visual regression tests
- `/schema-sync` - Sync and validate database schema
- `/docs-update` - Update canonical documentation

### Usage Examples

```bash
# Interactive mode
npm run vct:interactive

# Direct commands
npm run vct /spec-create --feature="user-authentication" --description="Add login system"
npm run vct /test-journey --journeyName="login-flow" --environment="staging"
npm run vct /bug-create --issue="login-error" --description="Users cannot log in"

# VCT-enhanced testing
npm run test:vct          # Local VCT tests
npm run test:vct:staging  # Staging environment tests
npm run test:vct:visual   # Visual regression tests only
```

### Environment Configuration

VCT supports multiple environments with automatic configuration:

- **Local**: `http://localhost:5175` (headless: false, full debugging)
- **Staging**: Configured URL (headless: true, comprehensive screenshots) 
- **Production**: Production URL (headless: true, minimal artifacts)

### Visual Testing

The VCT framework includes comprehensive visual regression testing:

- Baseline management per environment
- Pixel-level comparison with configurable thresholds
- Responsive testing across breakpoints
- Component-level visual validation
- Diff image generation for failures

### Error Monitoring

Real-time error capture and analysis:

- Integration with Sentry for exception tracking
- Highlight session replay for user interactions
- LogAI for log analytics and pattern detection
- Automatic bug report generation
- Root cause analysis with AI

### Artifacts Management

All VCT artifacts are organized by environment:

```
artifacts/
├── local/
│   ├── screenshots/
│   ├── traces/
│   └── test-results/
├── staging/
│   └── ...
└── prod/
    └── ...
```

### Schema-First Development

VCT maintains live awareness of the database schema:

- Automatic schema fetching from Supabase
- TypeScript type generation
- Query validation against RLS policies
- Schema change detection and documentation
- Migration planning and verification

### Integration with Existing Workflow

VCT enhances rather than replaces existing development practices:

- Extends Playwright with visual capabilities
- Integrates with existing test suites
- Maintains compatibility with current CI/CD
- Provides additional debugging and monitoring
- Generates comprehensive documentation automatically

## Project Context

This is the Searchmatic MVP - an AI-powered systematic literature review tool. The VCT framework helps ensure high-quality development through automated testing, monitoring, and documentation.

Last updated: ${new Date().toISOString()}