/**
 * VCT Orchestrator - Coordinates all subagents and manages slash-command workflows
 * Central coordinator for the VCT framework
 */

import { VCTAgent } from './base/VCTAgent';
import { SpecAgent } from './SpecAgent';
import { SchemaAgent } from './SchemaAgent';
import { TestAgent } from './TestAgent';
import { ErrorAgent } from './ErrorAgent';
import { DocAgent } from './DocAgent';

interface WorkflowContext {
  workflowId: string;
  command: string;
  parameters: { [key: string]: any };
  environment: 'local' | 'staging' | 'prod';
  user?: string;
  startTime: string;
}

interface WorkflowResult {
  workflowId: string;
  success: boolean;
  duration: number;
  results: { [agentName: string]: any };
  artifacts: string[];
  errors: string[];
  summary: string;
}

interface SlashCommand {
  command: string;
  description: string;
  parameters: string[];
  requiredAgents: string[];
  workflow: string;
}

// Define all supported slash commands
const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/spec-create',
    description: 'Create feature specification and tasks',
    parameters: ['feature', 'description'],
    requiredAgents: ['SpecAgent', 'SchemaAgent', 'DocAgent'],
    workflow: 'spec-creation'
  },
  {
    command: '/spec-orchestrate',
    description: 'Orchestrate full feature implementation',
    parameters: ['feature'],
    requiredAgents: ['SpecAgent', 'SchemaAgent', 'TestAgent', 'DocAgent'],
    workflow: 'full-orchestration'
  },
  {
    command: '/bug-create',
    description: 'Create bug report from issue description',
    parameters: ['issue', 'description'],
    requiredAgents: ['ErrorAgent', 'DocAgent'],
    workflow: 'bug-creation'
  },
  {
    command: '/bug-analyze',
    description: 'Analyze existing bug and provide insights',
    parameters: ['issue'],
    requiredAgents: ['ErrorAgent', 'SchemaAgent'],
    workflow: 'bug-analysis'
  },
  {
    command: '/bug-fix',
    description: 'Implement bug fix with testing',
    parameters: ['issue'],
    requiredAgents: ['ErrorAgent', 'SchemaAgent', 'TestAgent', 'DocAgent'],
    workflow: 'bug-fix'
  },
  {
    command: '/bug-verify',
    description: 'Verify bug fix is working',
    parameters: ['issue'],
    requiredAgents: ['TestAgent', 'ErrorAgent', 'DocAgent'],
    workflow: 'bug-verification'
  },
  {
    command: '/test-journey',
    description: 'Execute complete user journey test',
    parameters: ['journeyName', 'environment?'],
    requiredAgents: ['TestAgent', 'DocAgent'],
    workflow: 'journey-testing'
  },
  {
    command: '/test-visual',
    description: 'Execute visual regression test',
    parameters: ['environment?'],
    requiredAgents: ['TestAgent', 'DocAgent'],
    workflow: 'visual-testing'
  },
  {
    command: '/schema-sync',
    description: 'Sync and validate database schema',
    parameters: ['environment?'],
    requiredAgents: ['SchemaAgent', 'DocAgent'],
    workflow: 'schema-sync'
  },
  {
    command: '/docs-update',
    description: 'Update canonical documentation',
    parameters: ['docName', 'content'],
    requiredAgents: ['DocAgent'],
    workflow: 'docs-update'
  }
];

export class Orchestrator extends VCTAgent {
  private specAgent: SpecAgent;
  private schemaAgent: SchemaAgent;
  private testAgent: TestAgent;
  private errorAgent: ErrorAgent;
  private docAgent: DocAgent;
  
  private activeWorkflows: Map<string, WorkflowContext> = new Map();
  private workflowHistory: WorkflowResult[] = [];

  constructor() {
    super('Orchestrator');
    this.initializeAgents();
  }

  /**
   * Initialize all subagents
   */
  private initializeAgents(): void {
    this.log('Initializing VCT subagents');
    
    this.specAgent = new SpecAgent();
    this.schemaAgent = new SchemaAgent();
    this.testAgent = new TestAgent();
    this.errorAgent = new ErrorAgent();
    this.docAgent = new DocAgent();

    this.log('All subagents initialized successfully');
  }

  /**
   * Process a slash command and execute appropriate workflow
   */
  async processSlashCommand(
    command: string, 
    parameters: { [key: string]: any },
    environment: 'local' | 'staging' | 'prod' = 'local'
  ): Promise<WorkflowResult> {
    return this.measureTime(`processSlashCommand:${command}`, async () => {
      const workflowId = this.generateWorkflowId(command);
      
      this.log(`Processing slash command: ${command}`, { workflowId, parameters, environment });

      // Validate command
      const slashCommand = this.validateSlashCommand(command, parameters);
      
      // Create workflow context
      const context: WorkflowContext = {
        workflowId,
        command,
        parameters,
        environment,
        startTime: new Date().toISOString()
      };

      this.activeWorkflows.set(workflowId, context);

      try {
        // Execute workflow based on command
        const result = await this.executeWorkflow(slashCommand, context);
        
        // Store result in history
        this.workflowHistory.push(result);
        
        // Cleanup
        this.activeWorkflows.delete(workflowId);

        this.log(`Slash command completed: ${command}`, { 
          workflowId, 
          success: result.success,
          duration: result.duration
        });

        return result;

      } catch (error) {
        this.logError(`Slash command failed: ${command}`, error);
        
        const failedResult: WorkflowResult = {
          workflowId,
          success: false,
          duration: Date.now() - new Date(context.startTime).getTime(),
          results: {},
          artifacts: [],
          errors: [error.message],
          summary: `Workflow failed: ${error.message}`
        };

        this.workflowHistory.push(failedResult);
        this.activeWorkflows.delete(workflowId);

        return failedResult;
      }
    });
  }

  /**
   * Execute workflow based on slash command
   */
  private async executeWorkflow(slashCommand: SlashCommand, context: WorkflowContext): Promise<WorkflowResult> {
    const startTime = Date.now();
    const results: { [agentName: string]: any } = {};
    const artifacts: string[] = [];
    const errors: string[] = [];

    this.log(`Executing workflow: ${slashCommand.workflow}`, { workflowId: context.workflowId });

    try {
      switch (slashCommand.workflow) {
        case 'spec-creation':
          await this.executeSpecCreationWorkflow(context, results, artifacts);
          break;
          
        case 'full-orchestration':
          await this.executeFullOrchestrationWorkflow(context, results, artifacts);
          break;
          
        case 'bug-creation':
          await this.executeBugCreationWorkflow(context, results, artifacts);
          break;
          
        case 'bug-analysis':
          await this.executeBugAnalysisWorkflow(context, results, artifacts);
          break;
          
        case 'bug-fix':
          await this.executeBugFixWorkflow(context, results, artifacts);
          break;
          
        case 'bug-verification':
          await this.executeBugVerificationWorkflow(context, results, artifacts);
          break;
          
        case 'journey-testing':
          await this.executeJourneyTestingWorkflow(context, results, artifacts);
          break;
          
        case 'visual-testing':
          await this.executeVisualTestingWorkflow(context, results, artifacts);
          break;
          
        case 'schema-sync':
          await this.executeSchemaSyncWorkflow(context, results, artifacts);
          break;
          
        case 'docs-update':
          await this.executeDocsUpdateWorkflow(context, results, artifacts);
          break;
          
        default:
          throw new Error(`Unknown workflow: ${slashCommand.workflow}`);
      }

      const duration = Date.now() - startTime;
      const success = errors.length === 0;

      return {
        workflowId: context.workflowId,
        success,
        duration,
        results,
        artifacts,
        errors,
        summary: this.generateWorkflowSummary(slashCommand.workflow, success, results)
      };

    } catch (error) {
      errors.push(error.message);
      throw error;
    }
  }

  /**
   * Workflow implementations
   */
  private async executeSpecCreationWorkflow(
    context: WorkflowContext, 
    results: any, 
    artifacts: string[]
  ): Promise<void> {
    const { feature, description } = context.parameters;

    // 1. Get current schema context
    this.log('Fetching current schema context');
    const schema = await this.schemaAgent.getCurrentSchema();
    results.schema = { tablesCount: schema.tables.length };

    // 2. Generate specification
    this.log('Generating feature specification');
    const specResult = await this.specAgent.createSpec({
      feature,
      description,
      priority: 'medium'
    });
    results.spec = specResult;
    artifacts.push(...specResult.documentation);

    // 3. Update documentation
    this.log('Updating canonical documentation');
    await this.docAgent.updateHandoff({
      newFeatures: [feature],
      bugFixes: [],
      knownIssues: [],
      nextSteps: specResult.tasks.map(t => t.title)
    });
  }

  private async executeFullOrchestrationWorkflow(
    context: WorkflowContext,
    results: any,
    artifacts: string[]
  ): Promise<void> {
    const { feature } = context.parameters;

    // 1. Schema validation
    const schema = await this.schemaAgent.getCurrentSchema();
    results.schema = schema;

    // 2. Spec generation (if not exists)
    const specResult = await this.specAgent.createSpec({
      feature,
      description: `Full orchestration for ${feature}`,
      priority: 'high'
    });
    results.spec = specResult;

    // 3. Execute tests for the feature
    const testResults = await this.testAgent.executeUserJourney(
      {
        name: `${feature}-journey`,
        steps: [
          { action: 'goto', text: '/' },
          { action: 'wait', waitFor: 1000 },
          { action: 'click', selector: '[data-testid="new-project"]', screenshot: true }
        ],
        expectedOutcome: 'Feature works as expected',
        criticalPath: true
      },
      {
        testName: `${feature}-orchestration`,
        environment: context.environment,
        headless: true
      }
    );
    results.test = testResults;
    artifacts.push(...testResults.screenshots);

    // 4. Document results
    await this.docAgent.recordTestResults({
      success: testResults.success,
      testName: `${feature}-orchestration`,
      details: `Full orchestration test for ${feature}`,
      screenshots: testResults.screenshots,
      errors: testResults.errors.map(e => e.message)
    });
  }

  private async executeBugCreationWorkflow(
    context: WorkflowContext,
    results: any,
    artifacts: string[]
  ): Promise<void> {
    const { issue, description } = context.parameters;

    // 1. Create bug report
    const bugReport = await this.errorAgent.createBugReport(issue, description);
    results.bugReport = bugReport;

    // 2. Capture debug session
    const debugSession = await this.errorAgent.captureDebugSession();
    results.debugSession = debugSession;

    // 3. Document the bug
    await this.docAgent.appendToDoc('failures.md', `
### Bug Report: ${issue}
- **Bug ID**: ${bugReport.bugId}
- **Severity**: ${bugReport.severity}
- **Description**: ${description}
- **Created**: ${bugReport.created}
- **Debug Session**: ${debugSession.sessionId}
`, 'Active Bugs');
  }

  private async executeBugAnalysisWorkflow(
    context: WorkflowContext,
    results: any,
    artifacts: string[]
  ): Promise<void> {
    const { issue } = context.parameters;

    // 1. Analyze the error
    const errorAnalysis = await this.errorAgent.analyzeError(issue);
    results.analysis = errorAnalysis;

    // 2. Check schema for related issues
    if (errorAnalysis.category === 'database') {
      const schema = await this.schemaAgent.getCurrentSchema();
      results.schemaContext = schema;
    }

    // 3. Document analysis
    await this.docAgent.appendToDoc('failures.md', `
### Bug Analysis: ${issue}
- **Root Cause**: ${errorAnalysis.rootCause || 'Under investigation'}
- **Affected Users**: ${errorAnalysis.affectedUsers}
- **Frequency**: ${errorAnalysis.frequency}
- **Suggested Fix**: ${errorAnalysis.suggestedFix || 'Analysis pending'}
`, 'Bug Analysis');
  }

  private async executeBugFixWorkflow(
    context: WorkflowContext,
    results: any,
    artifacts: string[]
  ): Promise<void> {
    const { issue } = context.parameters;

    // 1. Analyze the bug first
    const analysis = await this.errorAgent.analyzeError(issue);
    results.analysis = analysis;

    // 2. Validate any schema changes needed
    if (analysis.category === 'database') {
      const schema = await this.schemaAgent.getCurrentSchema();
      results.schemaValidation = schema;
    }

    // 3. Test the fix
    const testResult = await this.testAgent.executeUserJourney(
      {
        name: `${issue}-fix-verification`,
        steps: [
          { action: 'goto', text: '/' },
          { action: 'wait', waitFor: 2000, screenshot: true }
        ],
        expectedOutcome: 'Bug should be resolved',
        criticalPath: true
      },
      {
        testName: `${issue}-fix-test`,
        environment: context.environment
      }
    );
    results.test = testResult;
    artifacts.push(...testResult.screenshots);

    // 4. Document the fix
    await this.docAgent.recordTestResults({
      success: testResult.success,
      testName: `${issue}-fix`,
      details: `Bug fix verification for ${issue}`,
      screenshots: testResult.screenshots
    });
  }

  private async executeBugVerificationWorkflow(
    context: WorkflowContext,
    results: any,
    artifacts: string[]
  ): Promise<void> {
    const { issue } = context.parameters;

    // 1. Verify the fix
    const verification = await this.errorAgent.verifyBugFix(issue);
    results.verification = verification;

    // 2. Run comprehensive tests
    const testResult = await this.testAgent.executeUserJourney(
      {
        name: `${issue}-verification`,
        steps: [
          { action: 'goto', text: '/' },
          { action: 'wait', waitFor: 1000 },
          { action: 'click', selector: 'body', screenshot: true }
        ],
        expectedOutcome: 'No errors should occur',
        criticalPath: true
      },
      {
        testName: `${issue}-verification`,
        environment: context.environment
      }
    );
    results.test = testResult;

    // 3. Document verification
    if (verification.fixed) {
      await this.docAgent.appendToDoc('success.md', `
### Bug Fixed: ${issue}
- **Confidence**: ${verification.confidence}%
- **Evidence**: ${verification.evidence.join('; ')}
- **Verified**: ${new Date().toISOString()}
`, 'Resolved Bugs');
    } else {
      await this.docAgent.appendToDoc('failures.md', `
### Bug Fix Failed: ${issue}
- **Confidence**: ${verification.confidence}%
- **Remaining Issues**: ${verification.evidence.join('; ')}
- **Recommendation**: ${verification.recommendation}
`, 'Failed Fixes');
    }
  }

  private async executeJourneyTestingWorkflow(
    context: WorkflowContext,
    results: any,
    artifacts: string[]
  ): Promise<void> {
    const { journeyName } = context.parameters;
    const environment = context.parameters.environment || context.environment;

    // Execute the user journey test
    const journey = this.getPreDefinedJourney(journeyName);
    const testResult = await this.testAgent.executeUserJourney(journey, {
      testName: journeyName,
      environment: environment as any
    });
    
    results.test = testResult;
    artifacts.push(...testResult.screenshots);

    // Document results
    await this.docAgent.recordTestResults({
      success: testResult.success,
      testName: journeyName,
      details: `User journey test: ${journeyName}`,
      screenshots: testResult.screenshots,
      errors: testResult.errors.map(e => e.message)
    });
  }

  private async executeVisualTestingWorkflow(
    context: WorkflowContext,
    results: any,
    artifacts: string[]
  ): Promise<void> {
    const environment = context.parameters.environment || context.environment;

    // Execute visual regression test
    const testResult = await this.testAgent.executeVisualTest('visual-regression', {
      testName: 'visual-regression',
      environment: environment as any
    });
    
    results.test = testResult;
    artifacts.push(...testResult.screenshots);

    // Document results
    await this.docAgent.recordTestResults({
      success: testResult.success,
      testName: 'visual-regression',
      details: 'Visual regression test across breakpoints',
      screenshots: testResult.screenshots
    });
  }

  private async executeSchemaSyncWorkflow(
    context: WorkflowContext,
    results: any,
    artifacts: string[]
  ): Promise<void> {
    // 1. Fetch current schema
    const schema = await this.schemaAgent.getCurrentSchema();
    results.schema = schema;

    // 2. Generate TypeScript types
    const typescript = await this.schemaAgent.generateTypeScript();
    results.typescript = { generated: true, length: typescript.length };

    // 3. Validate schema consistency
    const validation = await this.docAgent.validateDocuments();
    results.validation = validation;

    // 4. Update documentation
    await this.docAgent.updateSection('database.md', 'Current Schema', `
Last synced: ${new Date().toISOString()}
Tables: ${schema.tables.length}
Views: ${schema.views.length}
Functions: ${schema.functions.length}
`);
  }

  private async executeDocsUpdateWorkflow(
    context: WorkflowContext,
    results: any,
    artifacts: string[]
  ): Promise<void> {
    const { docName, content } = context.parameters;

    // Update the specified document
    const filePath = await this.docAgent.updateFile(docName, content);
    results.update = { filePath, success: true };
    artifacts.push(filePath);

    // Generate status report
    const status = await this.docAgent.generateStatusReport();
    results.status = status;
  }

  /**
   * Helper methods
   */
  private validateSlashCommand(command: string, parameters: any): SlashCommand {
    const slashCommand = SLASH_COMMANDS.find(cmd => cmd.command === command);
    
    if (!slashCommand) {
      throw new Error(`Unknown slash command: ${command}. Available commands: ${SLASH_COMMANDS.map(c => c.command).join(', ')}`);
    }

    // Validate required parameters
    for (const param of slashCommand.parameters) {
      const paramName = param.replace('?', ''); // Remove optional marker
      const isOptional = param.endsWith('?');
      
      if (!isOptional && !parameters[paramName]) {
        throw new Error(`Missing required parameter: ${paramName}`);
      }
    }

    return slashCommand;
  }

  private generateWorkflowId(command: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `${command.replace('/', '')}-${timestamp}-${random}`;
  }

  private generateWorkflowSummary(workflow: string, success: boolean, results: any): string {
    const status = success ? '✅ SUCCESS' : '❌ FAILED';
    const resultCount = Object.keys(results).length;
    
    return `${status}: ${workflow} completed with ${resultCount} results`;
  }

  private getPreDefinedJourney(journeyName: string): any {
    const journeys: { [key: string]: any } = {
      'login-flow': {
        name: 'login-flow',
        steps: [
          { action: 'goto', text: '/' },
          { action: 'click', selector: '[href="/login"]' },
          { action: 'fill', selector: 'input[type="email"]', text: 'test@example.com' },
          { action: 'fill', selector: 'input[type="password"]', text: 'password123' },
          { action: 'click', selector: 'button[type="submit"]', screenshot: true },
          { action: 'wait', waitFor: 2000 }
        ],
        expectedOutcome: 'User should be logged in and redirected to dashboard',
        criticalPath: true
      },
      'project-creation': {
        name: 'project-creation',
        steps: [
          { action: 'goto', text: '/dashboard' },
          { action: 'click', selector: '[data-testid="new-project"]' },
          { action: 'fill', selector: 'input[name="title"]', text: 'Test Project' },
          { action: 'fill', selector: 'textarea[name="description"]', text: 'Test Description' },
          { action: 'click', selector: 'button[type="submit"]', screenshot: true },
          { action: 'wait', waitFor: 3000 }
        ],
        expectedOutcome: 'New project should be created successfully',
        criticalPath: true
      }
    };

    return journeys[journeyName] || {
      name: journeyName,
      steps: [
        { action: 'goto', text: '/' },
        { action: 'wait', waitFor: 1000, screenshot: true }
      ],
      expectedOutcome: 'Basic navigation should work',
      criticalPath: false
    };
  }

  /**
   * Get list of available slash commands
   */
  public getAvailableCommands(): SlashCommand[] {
    return SLASH_COMMANDS;
  }

  /**
   * Get workflow history
   */
  public getWorkflowHistory(): WorkflowResult[] {
    return [...this.workflowHistory];
  }

  /**
   * Get active workflows
   */
  public getActiveWorkflows(): WorkflowContext[] {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * Cleanup all agents
   */
  public async cleanup(): Promise<void> {
    this.log('Orchestrator cleanup initiated');
    
    await Promise.all([
      this.testAgent.cleanup(),
      this.specAgent.cleanup(),
      this.schemaAgent.cleanup(),
      this.errorAgent.cleanup(),
      this.docAgent.cleanup()
    ]);

    this.log('All agents cleaned up successfully');
  }
}