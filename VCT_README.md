# 🎯 VCT Framework: Visual Code Testing

**Transform your Claude-based coding agent into a vision-, schema-, database-, and workflow-aware CI/CD orchestrator.**

## 🚀 What is VCT?

VCT (Visual Code Testing) is a comprehensive framework that enhances Claude's development capabilities with:

- **🔍 Visual Awareness**: Screenshot capture, comparison, and regression detection
- **📊 Schema Intelligence**: Live database schema fetching and validation  
- **🤖 Subagent Architecture**: Specialized agents for different responsibilities
- **⚡ Slash Command Interface**: Interactive workflow orchestration
- **📈 Error Monitoring**: Integration with Sentry, Highlight, and LogAI
- **📚 Canonical Documentation**: Self-maintaining documentation system

## 🏗️ Architecture Overview

```
VCT Framework
├── 🎭 Agents/
│   ├── SpecAgent      # Feature specs & task breakdown
│   ├── SchemaAgent    # Database schema management
│   ├── TestAgent      # Playwright + visual testing
│   ├── ErrorAgent     # Bug tracking & analysis
│   ├── DocAgent       # Documentation maintenance
│   └── Orchestrator   # Workflow coordination
├── 🖼️ Visual/
│   ├── Screenshot Engine    # Multi-environment capture
│   ├── Comparison Engine    # Pixel-level diff detection
│   └── Baseline Management  # Version-controlled baselines
├── 🔧 CLI/
│   ├── Interactive Mode     # Slash command interface
│   └── Direct Commands      # Single command execution
└── 📋 Monitoring/
    ├── Error Tracking       # Real-time error capture
    ├── Performance Metrics  # Load time & interaction speed
    └── Session Replay       # User interaction recording
```

## 🚀 Quick Start

### 1. Installation

The VCT framework is already integrated into this project. Install dependencies:

```bash
npm install
```

### 2. Configuration

Configure your environment in `vct.config.json`:

```json
{
  "environment": "local",
  "baseUrls": {
    "local": "http://localhost:5175",
    "staging": "https://staging.example.com",
    "prod": "https://example.com"
  },
  "database": {
    "supabaseUrl": "your-supabase-url",
    "anonKey": "your-anon-key"
  }
}
```

### 3. Start Interactive Mode

```bash
npm run vct:interactive
```

This opens the VCT interactive shell where you can use slash commands.

## 🎮 Slash Commands

### Feature Development

```bash
# Create feature specification
/spec-create --feature="user-authentication" --description="Add login system"

# Full feature implementation workflow
/spec-orchestrate --feature="user-authentication"
```

### Bug Management

```bash
# Create bug report
/bug-create --issue="login-error" --description="Users cannot log in"

# Analyze existing bug  
/bug-analyze --issue="login-error"

# Implement and test fix
/bug-fix --issue="login-error"

# Verify fix is working
/bug-verify --issue="login-error"
```

### Testing & Quality

```bash
# Execute user journey tests
/test-journey --journeyName="login-flow" --environment="staging"

# Run visual regression tests
/test-visual --environment="local"

# Sync database schema
/schema-sync --environment="prod"
```

### Documentation

```bash
# Update canonical documentation
/docs-update --docName="claude.md" --content="New feature documentation"
```

## 🧪 Testing Capabilities

### Visual Regression Testing

```bash
# Run VCT test suite
npm run test:vct              # Local environment
npm run test:vct:staging      # Staging environment
npm run test:vct:visual       # Visual regression only
```

VCT captures screenshots across:
- **Multiple environments** (local, staging, prod)
- **Multiple browsers** (Chromium, Firefox, WebKit)
- **Multiple viewports** (mobile, tablet, desktop)
- **Component level** (headers, forms, navigation)

### User Journey Testing

Comprehensive user flow validation:

```typescript
// Example user journey test
test('complete login journey', async ({ page }) => {
  await page.goto('/');
  await page.click('[href="/login"]');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // VCT automatically captures screenshots at each step
  // and compares with baselines
});
```

## 📊 Schema-First Development

VCT maintains live awareness of your database schema:

### Automatic Schema Fetching

```bash
# Get current schema
const schema = await schemaAgent.getCurrentSchema();

# Validate query against RLS policies
const validation = await schemaAgent.validateQuery(query, 'users');

# Generate TypeScript types
const types = await schemaAgent.generateTypeScript();
```

### Schema Change Detection

VCT automatically detects and documents:
- New tables and columns
- Modified constraints and indexes
- RLS policy changes
- Migration requirements

## 🔍 Error Monitoring

Real-time error tracking and analysis:

### Error Capture

```typescript
// Automatic error capture
await errorMonitoring.captureError(error, {
  userId: 'user-123',
  feature: 'authentication',
  environment: 'production'
});
```

### Session Replay

```typescript
// Start session recording
await errorMonitoring.startSession('session-456', 'user-123');

// Capture user interactions
await errorMonitoring.captureUserInteraction({
  action: 'click',
  element: 'login-button',
  url: '/login'
});
```

### Integration with Monitoring Services

- **Sentry**: Exception tracking and performance monitoring
- **Highlight**: Session replay and user interaction tracking  
- **LogAI**: Log analytics and pattern detection

## 📚 Canonical Documentation

VCT maintains 10 core documentation files:

1. **claude.md** - Claude development guide
2. **developerhandoff.md** - Development session handoffs
3. **failures.md** - Test failures and issues
4. **success.md** - Test successes and achievements
5. **externalservices.md** - External service integrations
6. **database.md** - Database schema and changes
7. **uidesign.md** - UI components and design decisions
8. **testing.md** - Testing strategies and results
9. **tasks.md** - Task management and tracking
10. **logicmap.md** - Application logic and data flow

### Automatic Updates

Documentation is automatically updated by:
- Test results and failures
- Schema changes and migrations
- Feature implementation progress
- Bug reports and resolutions
- Performance metrics and optimizations

## 🌍 Multi-Environment Support

VCT seamlessly works across environments:

### Environment Configuration

```javascript
const ENV_CONFIG = {
  local: {
    baseURL: 'http://localhost:5175',
    headless: false,     // Visual debugging
    screenshots: 'failure-only'
  },
  staging: {
    baseURL: 'https://staging.example.com', 
    headless: true,      // Automated testing
    screenshots: 'always'
  },
  prod: {
    baseURL: 'https://example.com',
    headless: true,      // Smoke tests only
    screenshots: 'failure-only'
  }
};
```

### Environment-Specific Testing

```bash
# Test against different environments
VCT_ENVIRONMENT=local npm run test:vct
VCT_ENVIRONMENT=staging npm run test:vct
VCT_ENVIRONMENT=prod npm run test:vct
```

## 🔧 Configuration

### VCT Configuration File

Create `vct.config.json` in your project root:

```json
{
  "environment": "local",
  "baseUrls": {
    "local": "http://localhost:5175",
    "staging": "https://staging.example.com", 
    "prod": "https://example.com"
  },
  "database": {
    "supabaseUrl": "https://your-project.supabase.co",
    "anonKey": "your-anon-key",
    "serviceRoleKey": "your-service-role-key"
  },
  "ai": {
    "openaiApiKey": "your-openai-key",
    "model": "gpt-4",
    "maxTokens": 4000
  },
  "testing": {
    "headless": true,
    "timeout": 30000,
    "retries": 2,
    "browsers": ["chromium", "firefox", "webkit"],
    "viewport": { "width": 1280, "height": 720 },
    "screenshotMode": "failure"
  },
  "monitoring": {
    "sentryDsn": "your-sentry-dsn",
    "highlightProjectId": "your-highlight-project-id",
    "logaiApiKey": "your-logai-api-key"
  }
}
```

### Environment Variables

```bash
# Core Configuration
VCT_ENVIRONMENT=local|staging|prod
VCT_DEBUG=true

# Database
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Integration  
VITE_OPENAI_API_KEY=your-openai-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
HIGHLIGHT_PROJECT_ID=your-highlight-project-id
LOGAI_API_KEY=your-logai-api-key
```

## 📁 Project Structure

```
your-project/
├── vct/                    # VCT Framework
│   ├── agents/            # Specialized agents
│   ├── cli/               # Command line interface
│   ├── config/            # Configuration management
│   ├── monitoring/        # Error monitoring
│   ├── reporters/         # Test reporters
│   ├── setup/             # Global setup/teardown
│   └── visual/            # Visual comparison engine
├── tests/vct/             # VCT test suites
├── docs/                  # Canonical documentation
├── artifacts/             # Test artifacts by environment
│   ├── local/
│   ├── staging/
│   └── prod/
└── vct.config.json        # VCT configuration
```

## 🤝 Integration with Existing Workflow

VCT enhances rather than replaces your existing development practices:

### Playwright Integration

VCT extends your existing Playwright configuration:

```typescript
// playwright.config.ts automatically enhanced with VCT
export default defineConfig({
  // Your existing config
  testDir: './tests',
  
  // VCT enhancements
  outputDir: `./artifacts/${ENV}/test-results`,
  reporter: [
    ['html'],
    ['./vct/reporters/VCTReporter.ts']  // VCT reporter
  ],
  globalSetup: './vct/setup/global-setup.ts',
  globalTeardown: './vct/setup/global-teardown.ts'
});
```

### Package.json Scripts

VCT adds new scripts without modifying existing ones:

```json
{
  "scripts": {
    "test:e2e": "playwright test",           // Your existing script
    "vct": "tsx vct/cli/VCTCli.ts",         // VCT CLI
    "vct:interactive": "tsx vct/cli/VCTCli.ts --interactive",
    "test:vct": "VCT_ENVIRONMENT=local playwright test tests/vct/",
    "test:vct:visual": "npm run test:vct -- --grep='Visual Regression'"
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Schema Agent Connection Failed**
   ```bash
   # Verify Supabase configuration
   npm run vct /schema-sync --environment=local
   ```

2. **Visual Tests Failing**
   ```bash
   # Update baselines after approved changes  
   npm run test:vct:visual -- --update-snapshots
   ```

3. **Interactive Mode Not Starting**
   ```bash
   # Check Node.js version (requires 18+)
   node --version
   
   # Install tsx if missing
   npm install -D tsx
   ```

### Debug Mode

Enable detailed logging:

```bash
VCT_DEBUG=true npm run vct:interactive
```

## 📈 Metrics and Analytics

VCT tracks comprehensive metrics:

### Test Metrics
- Test execution time and success rates
- Visual regression detection accuracy
- Cross-browser compatibility scores
- Performance benchmark tracking

### Development Metrics
- Feature implementation velocity
- Bug detection and resolution time
- Schema change impact analysis
- Documentation coverage and quality

### Quality Metrics
- Code coverage across environments
- Accessibility compliance scores
- Performance budget adherence
- Error rate and user impact tracking

## 🤖 AI-Powered Features

VCT leverages AI for:

### Intelligent Test Generation
- Automatic user journey creation from specifications
- Edge case identification and test scenario generation
- Regression test prioritization based on change impact

### Smart Error Analysis
- Root cause analysis from error patterns
- Fix suggestion based on similar issues
- Impact assessment and user prioritization

### Documentation Intelligence
- Automatic documentation updates from code changes
- Context-aware content generation
- Consistency validation across documentation

## 🔮 Future Enhancements

### Planned Features
- **AI-powered test maintenance**: Automatic test updates when UI changes
- **Advanced visual diff algorithms**: Semantic comparison beyond pixel matching
- **Cross-platform testing**: Mobile app and API testing integration
- **Performance regression detection**: Automatic performance benchmark tracking
- **Custom webhook integrations**: Slack, Teams, and custom notification systems

### Community Contributions
VCT is designed to be extensible. Contribute by:
- Adding new monitoring service integrations
- Creating custom agents for specialized workflows
- Developing new visual comparison algorithms
- Enhancing AI-powered analysis capabilities

## 📞 Support

For questions and support:

1. **Documentation**: Check the canonical docs in `/docs/`
2. **Interactive Help**: Run `npm run vct:help`
3. **Debug Mode**: Enable with `VCT_DEBUG=true`
4. **Issue Tracking**: Check `/docs/failures.md` for known issues

---

**VCT Framework - Making Claude vision-aware, one test at a time.** 🎯✨