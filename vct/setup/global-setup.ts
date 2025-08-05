/**
 * VCT Global Setup for Playwright
 * Initializes VCT framework before test execution
 */

import { FullConfig } from '@playwright/test';
import { VCTConfigManager } from '../config/VCTConfig';
import { SchemaAgent } from '../agents/SchemaAgent';
import { DocAgent } from '../agents/DocAgent';

async function globalSetup(config: FullConfig) {
  console.log('🎯 VCT Global Setup: Initializing framework...');

  try {
    // 1. Load VCT configuration
    const vctConfig = VCTConfigManager.getInstance();
    await vctConfig.loadConfig();
    await vctConfig.initializeDirectories();
    
    console.log('✅ VCT configuration loaded');

    // 2. Initialize schema context
    const schemaAgent = new SchemaAgent();
    const schema = await schemaAgent.getCurrentSchema();
    
    console.log(`✅ Schema loaded: ${schema.tables.length} tables, ${schema.views.length} views`);

    // 3. Initialize documentation
    const docAgent = new DocAgent();
    const timestamp = new Date().toISOString();
    
    await docAgent.appendToDoc('testing.md', `
## Test Session Started - ${timestamp}

**Environment**: ${process.env.TEST_ENV || process.env.VCT_ENVIRONMENT || 'local'}  
**Playwright Config**: ${config.configFile || 'default'}  
**Test Directory**: ${config.testDir}  
**Workers**: ${config.workers}  
**Base URL**: ${config.use?.baseURL}

### Pre-Test Schema Status
- Tables: ${schema.tables.length}
- Views: ${schema.views.length}  
- Functions: ${schema.functions.length}
- Policies: ${schema.policies.length}

### Environment Configuration
- Headless: ${config.use?.headless}
- Screenshot: ${config.use?.screenshot}
- Video: ${config.use?.video}
- Trace: ${config.use?.trace}
`, 'Test Sessions');

    console.log('✅ Documentation initialized');

    // 4. Validate environment
    const environment = process.env.TEST_ENV || process.env.VCT_ENVIRONMENT || 'local';
    const baseURL = config.use?.baseURL;
    
    if (baseURL) {
      console.log(`🔍 Testing environment: ${environment} (${baseURL})`);
      
      // For non-local environments, perform basic connectivity check
      if (environment !== 'local') {
        try {
          const response = await fetch(baseURL, { method: 'HEAD' });
          if (!response.ok) {
            console.warn(`⚠️  Environment check failed: ${baseURL} returned ${response.status}`);
          } else {
            console.log('✅ Environment connectivity verified');
          }
        } catch (error) {
          console.warn(`⚠️  Environment check failed: ${error.message}`);
        }
      }
    }

    // 5. Set up test artifacts directory
    const artifactsDir = `./artifacts/${environment}`;
    console.log(`📁 Artifacts directory: ${artifactsDir}`);

    console.log('🎯 VCT Global Setup: Complete ✅');

  } catch (error) {
    console.error('❌ VCT Global Setup failed:', error);
    
    // Don't fail the entire test run, but log the issue
    const docAgent = new DocAgent();
    await docAgent.appendToDoc('failures.md', `
### Global Setup Failure - ${new Date().toISOString()}

**Error**: ${error.message}  
**Stack**: ${error.stack}

This indicates a problem with VCT framework initialization.
Tests may proceed but VCT features will be limited.
`, 'Setup Issues');
  }
}

export default globalSetup;