#!/usr/bin/env node

/**
 * VCT CLI - Command line interface for Visual Code Testing framework
 * Provides slash-command interface and interactive mode
 */

import { Orchestrator } from '../agents/Orchestrator';
import * as readline from 'readline';

class VCTCli {
  private orchestrator: Orchestrator;
  private rl: readline.Interface;
  private interactiveMode: boolean = false;

  constructor() {
    this.orchestrator = new Orchestrator();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'VCT> '
    });
  }

  /**
   * Start the CLI in interactive mode
   */
  async startInteractive(): Promise<void> {
    this.interactiveMode = true;
    
    console.log('🎯 VCT (Visual Code Testing) Framework v1.0.0');
    console.log('Type /help for available commands or /exit to quit\n');
    
    this.rl.prompt();
    
    this.rl.on('line', async (input) => {
      const command = input.trim();
      
      if (command === '/exit' || command === '/quit') {
        await this.cleanup();
        process.exit(0);
      }
      
      if (command === '/help') {
        this.showHelp();
        this.rl.prompt();
        return;
      }
      
      if (command.startsWith('/')) {
        await this.processCommand(command);
      } else if (command) {
        console.log('Invalid command. Use /help for available commands.');
      }
      
      this.rl.prompt();
    });
    
    this.rl.on('close', async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  /**
   * Process a single command (non-interactive)
   */
  async processSingleCommand(args: string[]): Promise<void> {
    if (args.length === 0) {
      this.showHelp();
      return;
    }
    
    const command = args[0];
    const parameters = this.parseParameters(args.slice(1));
    
    await this.executeCommand(command, parameters);
    await this.cleanup();
  }

  /**
   * Process command in interactive mode
   */
  private async processCommand(input: string): Promise<void> {
    const parts = input.split(' ');
    const command = parts[0];
    const parameters = this.parseParameters(parts.slice(1));
    
    await this.executeCommand(command, parameters);
  }

  /**
   * Execute a VCT command
   */
  private async executeCommand(command: string, parameters: { [key: string]: any }): Promise<void> {
    try {
      console.log(`\n🚀 Executing: ${command}`);
      console.log(`📋 Parameters:`, parameters);
      console.log('⏳ Processing...\n');
      
      const startTime = Date.now();
      
      const result = await this.orchestrator.processSlashCommand(
        command, 
        parameters,
        process.env.VCT_ENVIRONMENT as any || 'local'
      );
      
      const duration = Date.now() - startTime;
      
      // Display results
      this.displayResult(result, duration);
      
    } catch (error) {
      console.error('❌ Command failed:', error.message);
      if (process.env.VCT_DEBUG) {
        console.error('Stack trace:', error.stack);
      }
    }
  }

  /**
   * Parse command line parameters
   */
  private parseParameters(args: string[]): { [key: string]: any } {
    const parameters: { [key: string]: any } = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        // Named parameter: --key=value or --key value
        const key = arg.substring(2);
        
        if (key.includes('=')) {
          const [k, v] = key.split('=', 2);
          parameters[k] = v;
        } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
          parameters[key] = args[i + 1];
          i++; // Skip next arg as it's the value
        } else {
          parameters[key] = true; // Boolean flag
        }
      } else if (i === 0) {
        // First positional argument
        parameters.feature = arg;
      } else if (i === 1) {
        // Second positional argument
        parameters.description = arg;
      }
    }
    
    return parameters;
  }

  /**
   * Display command result
   */
  private displayResult(result: any, duration: number): void {
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    
    console.log(`\n${status} (${duration}ms)`);
    console.log(`📊 Workflow ID: ${result.workflowId}`);
    console.log(`📝 Summary: ${result.summary}`);
    
    if (result.artifacts.length > 0) {
      console.log(`📎 Artifacts: ${result.artifacts.length} files created`);
      result.artifacts.forEach((artifact: string, index: number) => {
        console.log(`   ${index + 1}. ${artifact}`);
      });
    }
    
    if (result.errors.length > 0) {
      console.log(`⚠️  Errors: ${result.errors.length}`);
      result.errors.forEach((error: string, index: number) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    // Show detailed results if debug mode
    if (process.env.VCT_DEBUG) {
      console.log(`\n🔍 Detailed Results:`);
      console.log(JSON.stringify(result.results, null, 2));
    }
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    const commands = this.orchestrator.getAvailableCommands();
    
    console.log('\n🎯 VCT Framework - Available Commands:\n');
    
    commands.forEach(cmd => {
      console.log(`${cmd.command} - ${cmd.description}`);
      console.log(`   Parameters: ${cmd.parameters.join(', ')}`);
      console.log(`   Agents: ${cmd.requiredAgents.join(', ')}\n`);
    });
    
    console.log('Examples:');
    console.log('  /spec-create --feature="user-authentication" --description="Add login/signup"');
    console.log('  /test-journey --journeyName="login-flow" --environment="staging"');
    console.log('  /bug-create --issue="login-error" --description="Users cannot log in"');
    console.log('  /docs-update --docName="claude.md" --content="New feature added"');
    
    console.log('\nEnvironment Variables:');
    console.log('  VCT_ENVIRONMENT=local|staging|prod - Set default environment');
    console.log('  VCT_DEBUG=true - Enable debug output');
    console.log('  SUPABASE_URL - Supabase project URL');
    console.log('  SUPABASE_SERVICE_ROLE_KEY - Service role key for schema access');
    console.log('  OPENAI_API_KEY - OpenAI API key for AI features\n');
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up VCT resources...');
    await this.orchestrator.cleanup();
    this.rl.close();
  }
}

// CLI Entry Point
async function main() {
  const cli = new VCTCli();
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--interactive') || args.includes('-i')) {
    // Interactive mode
    await cli.startInteractive();
  } else {
    // Single command mode
    await cli.processSingleCommand(args);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { VCTCli };