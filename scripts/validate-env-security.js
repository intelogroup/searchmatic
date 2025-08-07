#!/usr/bin/env node

/**
 * Security Environment Validation Script
 * Ensures all required environment variables are properly configured
 * and validates security patterns before application startup
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

class SecurityValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.requiredEnvVars = {
      client: [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY'
      ],
      server: [
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_ACCESS_TOKEN',
        'SUPABASE_PROJECT_REF'
      ],
      optional: [
        'VITE_OPENAI_API_KEY',
        'BRAVE_API_KEY',
        'SENTRY_AUTH_TOKEN',
        'GITHUB_PERSONAL_ACCESS_TOKEN',
        'DENO_DEPLOY_TOKEN'
      ]
    };
  }

  /**
   * Validate that .env file exists and is properly configured
   */
  validateEnvFile() {
    const envPath = join(process.cwd(), '.env');
    const envExamplePath = join(process.cwd(), '.env.example');

    if (!existsSync(envPath)) {
      this.errors.push('CRITICAL: .env file not found. Copy .env.example to .env and configure your credentials.');
    }

    if (!existsSync(envExamplePath)) {
      this.warnings.push('.env.example template missing. This helps other developers set up the environment.');
    }
  }

  /**
   * Validate required environment variables
   */
  validateRequiredVars() {
    // Check client-side variables
    this.requiredEnvVars.client.forEach(varName => {
      if (!process.env[varName]) {
        this.errors.push(`MISSING CLIENT VAR: ${varName} - Required for application to function`);
      } else if (process.env[varName].includes('your_') || process.env[varName].includes('placeholder')) {
        this.errors.push(`PLACEHOLDER VALUE: ${varName} - Still contains placeholder text`);
      }
    });

    // Check server-side variables (only if needed)
    const hasServerRequirements = process.env.NODE_ENV !== 'client-only';
    if (hasServerRequirements) {
      this.requiredEnvVars.server.forEach(varName => {
        if (!process.env[varName]) {
          this.warnings.push(`MISSING SERVER VAR: ${varName} - May be needed for server-side operations`);
        }
      });
    }
  }

  /**
   * Security validation for credential patterns
   */
  validateSecurityPatterns() {
    // Check for dangerous patterns in environment variables
    const dangerousPatterns = [
      { pattern: /service_role.*test|demo|example/i, message: 'Service role key appears to be a test/demo key' },
      { pattern: /^sk-[a-zA-Z0-9]{48}$/, message: 'Detected OpenAI API key format' },
      { pattern: /^sbp_[a-zA-Z0-9]{40}$/, message: 'Detected Supabase service role key' }
    ];

    Object.entries(process.env).forEach(([key, value]) => {
      if (!value) return;

      dangerousPatterns.forEach(({ pattern, message }) => {
        if (pattern.test(value)) {
          console.log(`⚠️ ${key}: ${message}`);
        }
      });

      // Check for obviously insecure values
      if (value.toLowerCase().includes('password123') || value.toLowerCase().includes('secret123')) {
        this.errors.push(`INSECURE VALUE: ${key} - Contains obviously insecure credential`);
      }
    });
  }

  /**
   * Validate Supabase URL format
   */
  validateSupabaseConfig() {
    const url = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (url && !url.match(/^https:\/\/[a-z0-9]+\.supabase\.co$/)) {
      this.errors.push('INVALID SUPABASE URL: Should be in format https://project-id.supabase.co');
    }

    if (anonKey && !anonKey.startsWith('eyJ')) {
      this.warnings.push('SUPABASE ANON KEY: Does not appear to be a valid JWT token');
    }

    // Check for development vs production URLs
    if (url && url.includes('localhost') && process.env.NODE_ENV === 'production') {
      this.errors.push('PRODUCTION SECURITY: Using localhost URL in production environment');
    }
  }

  /**
   * Run all validation checks
   */
  async validate() {
    console.log('🔒 Running Security Environment Validation...\n');

    this.validateEnvFile();
    this.validateRequiredVars();
    this.validateSecurityPatterns();
    this.validateSupabaseConfig();

    // Report results
    console.log('📊 Validation Results:');
    console.log(`✅ Checks completed`);
    console.log(`⚠️ Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}\n`);

    // Show warnings
    if (this.warnings.length > 0) {
      console.log('⚠️ WARNINGS:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
      console.log('');
    }

    // Show errors
    if (this.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.errors.forEach(error => console.log(`  - ${error}`));
      console.log('');
      console.log('🔴 SECURITY VALIDATION FAILED');
      console.log('Please fix the above errors before proceeding.\n');
      process.exit(1);
    }

    console.log('🟢 SECURITY VALIDATION PASSED');
    console.log('Environment configuration is secure.\n');
  }

  /**
   * Generate security report
   */
  generateSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: this.errors.length === 0 ? 'PASSED' : 'FAILED',
      errors: this.errors,
      warnings: this.warnings,
      environment: process.env.NODE_ENV || 'development',
      checkedVars: [...this.requiredEnvVars.client, ...this.requiredEnvVars.server]
    };

    console.log('📋 Security Report:', JSON.stringify(report, null, 2));
    return report;
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new SecurityValidator();
  await validator.validate();
  validator.generateSecurityReport();
}

export { SecurityValidator };