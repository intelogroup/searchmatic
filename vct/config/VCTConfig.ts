/**
 * VCT Configuration - Centralized configuration for the VCT framework
 */

import * as path from 'path';
import { promises as fs } from 'fs';

export interface VCTConfig {
  // Environment settings
  environment: 'local' | 'staging' | 'prod';
  
  // Base URLs for different environments
  baseUrls: {
    local: string;
    staging: string;
    prod: string;
  };
  
  // Database configuration
  database: {
    supabaseUrl: string;
    serviceRoleKey?: string;
    anonKey: string;
  };
  
  // AI configuration
  ai: {
    openaiApiKey?: string;
    model: string;
    maxTokens: number;
  };
  
  // Testing configuration
  testing: {
    headless: boolean;
    timeout: number;
    retries: number;
    browsers: string[];
    viewport: {
      width: number;
      height: number;
    };
    screenshotMode: 'always' | 'failure' | 'never';
  };
  
  // Error monitoring
  monitoring: {
    sentryDsn?: string;
    highlightProjectId?: string;
    logaiApiKey?: string;
  };
  
  // Paths configuration
  paths: {
    artifacts: string;
    docs: string;
    screenshots: string;
    traces: string;
    logs: string;
  };
  
  // Agent configuration
  agents: {
    enabledAgents: string[];
    cacheExpiry: number;
    maxConcurrentOperations: number;
  };
}

export class VCTConfigManager {
  private static instance: VCTConfigManager;
  private config: VCTConfig | null = null;
  private configPath: string;

  private constructor() {
    this.configPath = path.join(process.cwd(), 'vct.config.json');
  }

  static getInstance(): VCTConfigManager {
    if (!VCTConfigManager.instance) {
      VCTConfigManager.instance = new VCTConfigManager();
    }
    return VCTConfigManager.instance;
  }

  /**
   * Load configuration from file and environment variables
   */
  async loadConfig(): Promise<VCTConfig> {
    if (this.config) {
      return this.config;
    }

    // Load default configuration
    this.config = this.getDefaultConfig();

    // Try to load from config file
    try {
      const configFile = await fs.readFile(this.configPath, 'utf8');
      const fileConfig = JSON.parse(configFile);
      this.config = this.mergeConfigs(this.config, fileConfig);
    } catch (error) {
      // Config file doesn't exist or is invalid, use defaults
      console.log('No VCT config file found, using defaults');
    }

    // Override with environment variables
    this.config = this.applyEnvironmentOverrides(this.config);

    return this.config;
  }

  /**
   * Save current configuration to file
   */
  async saveConfig(config?: VCTConfig): Promise<void> {
    const configToSave = config || this.config;
    if (!configToSave) {
      throw new Error('No configuration to save');
    }

    await fs.writeFile(
      this.configPath,
      JSON.stringify(configToSave, null, 2),
      'utf8'
    );
  }

  /**
   * Get current configuration
   */
  getConfig(): VCTConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<VCTConfig>): void {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    this.config = this.mergeConfigs(this.config, updates);
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): VCTConfig {
    return {
      environment: 'local',
      
      baseUrls: {
        local: 'http://localhost:5175',
        staging: 'https://staging.searchmatic.app',
        prod: 'https://searchmatic.app'
      },
      
      database: {
        supabaseUrl: 'https://qzvfufadiqmizrozejci.supabase.co',
        anonKey: 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS'
      },
      
      ai: {
        model: 'gpt-4',
        maxTokens: 4000
      },
      
      testing: {
        headless: true,
        timeout: 30000,
        retries: 2,
        browsers: ['chromium'],
        viewport: {
          width: 1280,
          height: 720
        },
        screenshotMode: 'failure'
      },
      
      monitoring: {},
      
      paths: {
        artifacts: path.join(process.cwd(), 'artifacts'),
        docs: path.join(process.cwd(), 'docs'),
        screenshots: path.join(process.cwd(), 'artifacts', 'screenshots'),
        traces: path.join(process.cwd(), 'artifacts', 'traces'),
        logs: path.join(process.cwd(), 'vct', 'logs')
      },
      
      agents: {
        enabledAgents: [
          'SpecAgent',
          'SchemaAgent', 
          'TestAgent',
          'ErrorAgent',
          'DocAgent',
          'Orchestrator'
        ],
        cacheExpiry: 300000, // 5 minutes
        maxConcurrentOperations: 3
      }
    };
  }

  /**
   * Apply environment variable overrides
   */
  private applyEnvironmentOverrides(config: VCTConfig): VCTConfig {
    const overrides: Partial<VCTConfig> = {};

    // Environment
    if (process.env.VCT_ENVIRONMENT) {
      overrides.environment = process.env.VCT_ENVIRONMENT as any;
    }

    // Database
    if (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) {
      overrides.database = {
        ...config.database,
        supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!
      };
    }

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      overrides.database = {
        ...config.database,
        ...overrides.database,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
      };
    }

    if (process.env.VITE_SUPABASE_ANON_KEY) {
      overrides.database = {
        ...config.database,
        ...overrides.database,
        anonKey: process.env.VITE_SUPABASE_ANON_KEY
      };
    }

    // AI
    if (process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY) {
      overrides.ai = {
        ...config.ai,
        openaiApiKey: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY
      };
    }

    // Testing
    if (process.env.VCT_HEADLESS) {
      overrides.testing = {
        ...config.testing,
        headless: process.env.VCT_HEADLESS === 'true'
      };
    }

    // Monitoring
    const monitoring: any = {};
    if (process.env.SENTRY_DSN) {
      monitoring.sentryDsn = process.env.SENTRY_DSN;
    }
    if (process.env.HIGHLIGHT_PROJECT_ID) {
      monitoring.highlightProjectId = process.env.HIGHLIGHT_PROJECT_ID;
    }
    if (process.env.LOGAI_API_KEY) {
      monitoring.logaiApiKey = process.env.LOGAI_API_KEY;
    }
    if (Object.keys(monitoring).length > 0) {
      overrides.monitoring = monitoring;
    }

    return this.mergeConfigs(config, overrides);
  }

  /**
   * Deep merge configuration objects
   */
  private mergeConfigs(base: VCTConfig, override: Partial<VCTConfig>): VCTConfig {
    const merged = { ...base };

    for (const [key, value] of Object.entries(override)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Deep merge objects
        merged[key as keyof VCTConfig] = {
          ...(merged[key as keyof VCTConfig] as any),
          ...value
        };
      } else {
        // Direct assignment for primitives and arrays
        (merged as any)[key] = value;
      }
    }

    return merged;
  }

  /**
   * Validate configuration
   */
  validateConfig(config: VCTConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!config.database.supabaseUrl) {
      errors.push('database.supabaseUrl is required');
    }
    if (!config.database.anonKey) {
      errors.push('database.anonKey is required');
    }

    // URL validation
    try {
      new URL(config.database.supabaseUrl);
    } catch {
      errors.push('database.supabaseUrl must be a valid URL');
    }

    // Environment validation
    if (!['local', 'staging', 'prod'].includes(config.environment)) {
      errors.push('environment must be local, staging, or prod');
    }

    // Base URL validation
    for (const [env, url] of Object.entries(config.baseUrls)) {
      try {
        new URL(url);
      } catch {
        errors.push(`baseUrls.${env} must be a valid URL`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Initialize configuration directories
   */
  async initializeDirectories(): Promise<void> {
    const config = await this.loadConfig();
    
    const dirs = [
      config.paths.artifacts,
      config.paths.docs,
      config.paths.screenshots,
      config.paths.traces,
      config.paths.logs
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.warn(`Failed to create directory ${dir}:`, error);
      }
    }
  }
}