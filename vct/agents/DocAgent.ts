/**
 * VCT DocAgent - Manages canonical documentation updates
 * Maintains the 10 core documentation files with versioning and consistency
 */

import { VCTAgent } from './base/VCTAgent';
import { promises as fs } from 'fs';
import * as path from 'path';

interface DocUpdate {
  filename: string;
  content: string;
  updateType: 'append' | 'replace' | 'section' | 'merge';
  section?: string;
  timestamp: string;
}

interface DocHistory {
  filename: string;
  updates: DocUpdate[];
  currentVersion: number;
}

const CANONICAL_DOCS = [
  'claude.md',
  'developerhandoff.md', 
  'failures.md',
  'success.md',
  'externalservices.md',
  'database.md',
  'uidesign.md',
  'testing.md',
  'tasks.md',
  'logicmap.md'
] as const;

type CanonicalDoc = typeof CANONICAL_DOCS[number];

export class DocAgent extends VCTAgent {
  private docsDir: string;
  private historyDir: string;
  private docHistory: Map<string, DocHistory> = new Map();

  constructor() {
    super('DocAgent');
    this.docsDir = path.join(process.cwd(), 'docs');
    this.historyDir = path.join(this.docsDir, '.history');
    this.initializeDocsDirectory();
  }

  /**
   * Update a canonical documentation file
   */
  async updateFile(filename: CanonicalDoc, content: string, updateType: DocUpdate['updateType'] = 'append'): Promise<string> {
    return this.measureTime(`updateFile:${filename}`, async () => {
      this.validateCanonicalDoc(filename);
      
      this.log(`Updating documentation: ${filename}`, { updateType });

      const filePath = path.join(this.docsDir, filename);
      const timestamp = new Date().toISOString();
      
      // Read existing content
      const existingContent = await this.readFileIfExists(filePath);
      
      // Apply update based on type
      const newContent = await this.applyUpdate(existingContent, content, updateType);
      
      // Create backup before update
      await this.createBackup(filename, existingContent, timestamp);
      
      // Write updated content
      await fs.writeFile(filePath, newContent, 'utf8');
      
      // Record update in history
      await this.recordUpdate(filename, {
        filename,
        content,
        updateType,
        timestamp
      });

      this.log(`Documentation updated successfully: ${filename}`, {
        previousLength: existingContent.length,
        newLength: newContent.length
      });

      return filePath;
    });
  }

  /**
   * Update a specific section within a document
   */
  async updateSection(filename: CanonicalDoc, sectionName: string, content: string): Promise<string> {
    return this.measureTime(`updateSection:${filename}:${sectionName}`, async () => {
      this.log(`Updating section '${sectionName}' in ${filename}`);

      const filePath = path.join(this.docsDir, filename);
      const existingContent = await this.readFileIfExists(filePath);
      
      // Find and replace the section
      const newContent = await this.replaceSectionContent(existingContent, sectionName, content);
      
      // Create backup and save
      const timestamp = new Date().toISOString();
      await this.createBackup(filename, existingContent, timestamp);
      await fs.writeFile(filePath, newContent, 'utf8');
      
      // Record update
      await this.recordUpdate(filename, {
        filename,
        content,
        updateType: 'section',
        section: sectionName,
        timestamp
      });

      this.log(`Section updated successfully: ${filename}#${sectionName}`);
      return filePath;
    });
  }

  /**
   * Append content to a document with proper formatting
   */
  async appendToDoc(filename: CanonicalDoc, content: string, sectionHeader?: string): Promise<string> {
    return this.measureTime(`appendToDoc:${filename}`, async () => {
      let formattedContent = content;
      
      if (sectionHeader) {
        formattedContent = `\n\n## ${sectionHeader}\n\n${content}`;
      } else {
        formattedContent = `\n\n${content}`;
      }

      return await this.updateFile(filename, formattedContent, 'append');
    });
  }

  /**
   * Record test results in appropriate documentation
   */
  async recordTestResults(results: {
    success: boolean;
    testName: string;
    details: string;
    screenshots?: string[];
    errors?: string[];
  }): Promise<void> {
    return this.measureTime('recordTestResults', async () => {
      const timestamp = new Date().toISOString();
      const testEntry = this.formatTestEntry(results, timestamp);

      if (results.success) {
        await this.appendToDoc('success.md', testEntry, results.testName);
        this.log(`Test success recorded: ${results.testName}`);
      } else {
        await this.appendToDoc('failures.md', testEntry, results.testName);
        this.log(`Test failure recorded: ${results.testName}`);
      }

      // Also update testing.md with latest test status
      const testingSummary = this.generateTestingSummary(results);
      await this.updateSection('testing.md', 'Latest Test Results', testingSummary);
    });
  }

  /**
   * Record deployment information
   */
  async recordDeployment(deployment: {
    environment: string;
    version: string;
    status: 'success' | 'failed';
    details: string;
  }): Promise<void> {
    return this.measureTime('recordDeployment', async () => {
      const timestamp = new Date().toISOString();
      const deploymentEntry = `
### Deployment ${deployment.version} to ${deployment.environment}
- **Status**: ${deployment.status}
- **Timestamp**: ${timestamp}
- **Details**: ${deployment.details}
`;

      if (deployment.status === 'success') {
        await this.appendToDoc('success.md', deploymentEntry, 'Deployments');
      } else {
        await this.appendToDoc('failures.md', deploymentEntry, 'Deployments');
      }

      this.log(`Deployment recorded: ${deployment.version} to ${deployment.environment}`);
    });
  }

  /**
   * Update developer handoff documentation
   */
  async updateHandoff(handoffData: {
    newFeatures: string[];
    bugFixes: string[];
    knownIssues: string[];
    nextSteps: string[];
  }): Promise<void> {
    return this.measureTime('updateHandoff', async () => {
      const timestamp = new Date().toISOString();
      const handoffContent = `
## Handoff Update - ${timestamp}

### New Features Completed
${handoffData.newFeatures.map(feature => `- ${feature}`).join('\n')}

### Bug Fixes
${handoffData.bugFixes.map(fix => `- ${fix}`).join('\n')}

### Known Issues
${handoffData.knownIssues.map(issue => `- ${issue}`).join('\n')}

### Next Steps
${handoffData.nextSteps.map(step => `- ${step}`).join('\n')}
`;

      await this.appendToDoc('developerhandoff.md', handoffContent);
      this.log('Developer handoff documentation updated');
    });
  }

  /**
   * Generate comprehensive status report across all docs
   */
  async generateStatusReport(): Promise<{
    summary: string;
    docStats: { [key: string]: any };
    recentUpdates: DocUpdate[];
  }> {
    return this.measureTime('generateStatusReport', async () => {
      this.log('Generating comprehensive status report');

      const docStats: { [key: string]: any } = {};
      const allUpdates: DocUpdate[] = [];

      // Analyze each canonical document
      for (const docName of CANONICAL_DOCS) {
        const filePath = path.join(this.docsDir, docName);
        const stats = await this.analyzeDocument(filePath);
        docStats[docName] = stats;

        // Collect recent updates
        const history = this.docHistory.get(docName);
        if (history) {
          allUpdates.push(...history.updates.slice(-3)); // Last 3 updates per doc
        }
      }

      // Sort updates by timestamp
      const recentUpdates = allUpdates
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10); // Top 10 most recent

      const summary = this.generateSummaryText(docStats);

      this.log('Status report generated', {
        documentsAnalyzed: Object.keys(docStats).length,
        recentUpdatesCount: recentUpdates.length
      });

      return {
        summary,
        docStats,
        recentUpdates
      };
    });
  }

  /**
   * Validate document consistency and structure
   */
  async validateDocuments(): Promise<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    return this.measureTime('validateDocuments', async () => {
      this.log('Validating document consistency');

      const issues: string[] = [];
      const recommendations: string[] = [];

      for (const docName of CANONICAL_DOCS) {
        const filePath = path.join(this.docsDir, docName);
        const validation = await this.validateSingleDocument(filePath, docName);
        
        issues.push(...validation.issues);
        recommendations.push(...validation.recommendations);
      }

      const valid = issues.length === 0;

      this.log('Document validation completed', {
        valid,
        issuesFound: issues.length,
        recommendationsCount: recommendations.length
      });

      return {
        valid,
        issues,
        recommendations
      };
    });
  }

  /**
   * Helper methods
   */
  private validateCanonicalDoc(filename: string): void {
    if (!CANONICAL_DOCS.includes(filename as CanonicalDoc)) {
      throw new Error(`Invalid canonical document: ${filename}. Must be one of: ${CANONICAL_DOCS.join(', ')}`);
    }
  }

  private async readFileIfExists(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return '';
      }
      throw error;
    }
  }

  private async applyUpdate(existing: string, content: string, updateType: DocUpdate['updateType']): Promise<string> {
    switch (updateType) {
      case 'append':
        return existing + content;
      
      case 'replace':
        return content;
      
      case 'merge':
        return this.mergeContent(existing, content);
      
      default:
        return existing + content;
    }
  }

  private async replaceSectionContent(existing: string, sectionName: string, content: string): Promise<string> {
    const sectionRegex = new RegExp(`(## ${sectionName}\\s*\\n)([\\s\\S]*?)(?=\\n## |$)`, 'g');
    
    if (sectionRegex.test(existing)) {
      return existing.replace(sectionRegex, `$1${content}\n`);
    } else {
      // Section doesn't exist, append it
      return existing + `\n\n## ${sectionName}\n\n${content}`;
    }
  }

  private mergeContent(existing: string, newContent: string): string {
    // Intelligent merge - avoid duplicates, maintain structure
    const existingLines = existing.split('\n');
    const newLines = newContent.split('\n');
    
    const merged = [...existingLines];
    
    for (const line of newLines) {
      if (line.trim() && !existingLines.includes(line)) {
        merged.push(line);
      }
    }
    
    return merged.join('\n');
  }

  private formatTestEntry(results: any, timestamp: string): string {
    return `
### ${results.testName} - ${timestamp}
- **Status**: ${results.success ? '✅ PASSED' : '❌ FAILED'}
- **Details**: ${results.details}
${results.screenshots ? `- **Screenshots**: ${results.screenshots.length} captured` : ''}
${results.errors ? `- **Errors**: ${results.errors.join(', ')}` : ''}
`;
  }

  private generateTestingSummary(results: any): string {
    return `
**Last Test Run**: ${new Date().toISOString()}
**Test**: ${results.testName}
**Result**: ${results.success ? 'PASSED' : 'FAILED'}
**Details**: ${results.details}
`;
  }

  private async analyzeDocument(filePath: string): Promise<any> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const stats = await fs.stat(filePath);
      
      return {
        exists: true,
        size: stats.size,
        lines: content.split('\n').length,
        lastModified: stats.mtime.toISOString(),
        wordCount: content.split(/\s+/).length,
        headerCount: (content.match(/^#+\s/gm) || []).length
      };
    } catch (error) {
      return {
        exists: false,
        error: (error as Error).message
      };
    }
  }

  private generateSummaryText(docStats: { [key: string]: any }): string {
    const existingDocs = Object.entries(docStats).filter(([_, stats]) => stats.exists);
    const missingDocs = Object.entries(docStats).filter(([_, stats]) => !stats.exists);
    
    return `
Documentation Status Summary:
- ${existingDocs.length}/${CANONICAL_DOCS.length} canonical documents exist
- ${missingDocs.length} documents missing: ${missingDocs.map(([name]) => name).join(', ')}
- Total content: ${existingDocs.reduce((sum, [_, stats]) => sum + stats.wordCount, 0)} words
- Last updated: ${new Date().toISOString()}
`;
  }

  private async validateSingleDocument(filePath: string, docName: string): Promise<{
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Check for basic structure
      if (!content.includes('#')) {
        issues.push(`${docName}: No headers found`);
      }
      
      if (content.length < 100) {
        recommendations.push(`${docName}: Document seems very short (${content.length} characters)`);
      }
      
      // Check for placeholder content
      if (content.includes('TODO') || content.includes('PLACEHOLDER')) {
        recommendations.push(`${docName}: Contains placeholder content`);
      }
      
    } catch (error) {
      issues.push(`${docName}: File not accessible - ${(error as Error).message}`);
    }

    return { issues, recommendations };
  }

  private async createBackup(filename: string, content: string, timestamp: string): Promise<void> {
    const backupDir = path.join(this.historyDir, filename.replace('.md', ''));
    await fs.mkdir(backupDir, { recursive: true });
    
    const backupFile = path.join(backupDir, `${timestamp.replace(/[:.]/g, '-')}.md`);
    await fs.writeFile(backupFile, content, 'utf8');
  }

  private async recordUpdate(filename: string, update: DocUpdate): Promise<void> {
    let history = this.docHistory.get(filename);
    
    if (!history) {
      history = {
        filename,
        updates: [],
        currentVersion: 0
      };
    }
    
    history.updates.push(update);
    history.currentVersion++;
    
    this.docHistory.set(filename, history);
    
    // Persist history to disk
    const historyFile = path.join(this.historyDir, `${filename}.history.json`);
    await fs.writeFile(historyFile, JSON.stringify(history, null, 2), 'utf8');
  }

  private async initializeDocsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.docsDir, { recursive: true });
      await fs.mkdir(this.historyDir, { recursive: true });
      
      // Initialize empty canonical docs if they don't exist
      for (const docName of CANONICAL_DOCS) {
        const filePath = path.join(this.docsDir, docName);
        try {
          await fs.access(filePath);
        } catch (error) {
          // File doesn't exist, create empty template
          const template = this.getDocumentTemplate(docName);
          await fs.writeFile(filePath, template, 'utf8');
          this.log(`Initialized empty document: ${docName}`);
        }
      }
    } catch (error) {
      this.logError('Failed to initialize docs directory', error);
    }
  }

  private getDocumentTemplate(docName: CanonicalDoc): string {
    const templates: { [key in CanonicalDoc]: string } = {
      'claude.md': '# Claude Development Guide\n\nThis document contains project-specific instructions and context for Claude.\n',
      'developerhandoff.md': '# Developer Handoff\n\nThis document tracks handoffs between development sessions.\n',
      'failures.md': '# Test Failures and Issues\n\nThis document tracks failed tests and unresolved issues.\n',
      'success.md': '# Test Successes and Achievements\n\nThis document tracks successful tests and completed milestones.\n',
      'externalservices.md': '# External Services\n\nThis document tracks external service integrations and configurations.\n',
      'database.md': '# Database Documentation\n\nThis document tracks database schema and changes.\n',
      'uidesign.md': '# UI Design Documentation\n\nThis document tracks UI components and design decisions.\n',
      'testing.md': '# Testing Documentation\n\nThis document tracks testing strategies and results.\n',
      'tasks.md': '# Task Management\n\nThis document tracks current and completed tasks.\n',
      'logicmap.md': '# Logic Map\n\nThis document tracks application logic and data flow.\n'
    };

    return templates[docName] || `# ${docName}\n\nThis document is part of the canonical documentation suite.\n`;
  }
}