/**
 * VCT GitService - Handles Git operations for the VCT framework
 */

import { execSync } from 'child_process';
import { VCTAgent } from '../agents/base/VCTAgent';

export class GitService extends VCTAgent {
  constructor() {
    super('GitService');
  }

  /**
   * Commit changes with VCT standard format
   */
  async commitChanges(message: string): Promise<void> {
    return this.measureTime('commitChanges', async () => {
      try {
        // Add all changes
        execSync('git add .', { stdio: 'inherit' });
        
        // Commit with message
        execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
        
        this.log('Git commit successful', { message });
      } catch (error) {
        this.logError('Git commit failed', error);
        throw error;
      }
    });
  }

  /**
   * Get current git status
   */
  async getStatus(): Promise<string> {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      return status;
    } catch (error) {
      this.logError('Failed to get git status', error);
      return '';
    }
  }

  /**
   * Get current branch
   */
  async getCurrentBranch(): Promise<string> {
    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      return branch;
    } catch (error) {
      this.logError('Failed to get current branch', error);
      return 'unknown';
    }
  }
}