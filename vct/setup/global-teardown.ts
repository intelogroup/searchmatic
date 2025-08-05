/**
 * VCT Global Teardown for Playwright
 * Cleans up VCT framework after test execution
 */

import { FullConfig } from '@playwright/test';
import { DocAgent } from '../agents/DocAgent';
import { SchemaAgent } from '../agents/SchemaAgent';

async function globalTeardown(config: FullConfig) {
  console.log('🎯 VCT Global Teardown: Cleaning up framework...');

  try {
    const timestamp = new Date().toISOString();
    const environment = process.env.TEST_ENV || process.env.VCT_ENVIRONMENT || 'local';

    // 1. Generate final status report
    const docAgent = new DocAgent();
    const statusReport = await docAgent.generateStatusReport();
    
    console.log('✅ Final status report generated');

    // 2. Validate post-test schema state
    const schemaAgent = new SchemaAgent();
    const finalSchema = await schemaAgent.getCurrentSchema();
    
    console.log(`✅ Final schema state: ${finalSchema.tables.length} tables`);

    // 3. Update testing documentation with session summary
    await docAgent.appendToDoc('testing.md', `
## Test Session Completed - ${timestamp}

**Environment**: ${environment}  
**Status**: ${statusReport.summary}

### Post-Test Schema Status
- Tables: ${finalSchema.tables.length}
- Views: ${finalSchema.views.length}
- Functions: ${finalSchema.functions.length}
- Policies: ${finalSchema.policies.length}

### Artifacts Generated
${statusReport.recentUpdates.length > 0 ? 
  statusReport.recentUpdates.map(update => `- ${update.filename}: ${update.updateType}`).join('\n') :
  '- No new artifacts generated'
}

### Session Summary
${statusReport.summary}

---
`, 'Test Sessions');

    // 4. Perform cleanup validation
    const validation = await docAgent.validateDocuments();
    
    if (!validation.valid) {
      console.warn('⚠️  Documentation validation issues found:');
      validation.issues.forEach(issue => console.warn(`   - ${issue}`));
      
      await docAgent.appendToDoc('failures.md', `
### Documentation Validation Issues - ${timestamp}

**Issues Found**: ${validation.issues.length}

${validation.issues.map(issue => `- ${issue}`).join('\n')}

**Recommendations**: ${validation.recommendations.length}

${validation.recommendations.map(rec => `- ${rec}`).join('\n')}
`, 'Validation Issues');
    } else {
      console.log('✅ Documentation validation passed');
    }

    // 5. Archive artifacts if in CI environment
    if (process.env.CI) {
      console.log('📦 CI environment detected - archiving artifacts');
      
      await docAgent.updateSection('testing.md', 'CI Artifacts', `
**Last CI Run**: ${timestamp}  
**Environment**: ${environment}  
**Artifacts Location**: ./artifacts/${environment}/  
**Status**: ${validation.valid ? 'Clean' : 'Issues found'}
`);
    }

    console.log('🎯 VCT Global Teardown: Complete ✅');

  } catch (error) {
    console.error('❌ VCT Global Teardown failed:', error);
    
    // Record teardown failure but don't fail the test run
    try {
      const docAgent = new DocAgent();
      await docAgent.appendToDoc('failures.md', `
### Global Teardown Failure - ${new Date().toISOString()}

**Error**: ${error.message}  
**Stack**: ${error.stack}

This indicates a problem with VCT framework cleanup.
Test results should still be valid.
`, 'Teardown Issues');
    } catch (docError) {
      console.error('❌ Failed to record teardown failure:', docError);
    }
  }
}

export default globalTeardown;