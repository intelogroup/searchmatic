/**
 * Base VCT Agent - Abstract base class for all VCT agents
 * Provides common functionality and interface for VCT framework
 */

export abstract class VCTAgent {
  protected name: string;
  protected sessionId: string;
  protected startTime: number;

  constructor(name: string) {
    this.name = name;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  /**
   * Logs agent activity with context
   */
  protected log(message: string, context?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      agent: this.name,
      sessionId: this.sessionId,
      message,
      context
    };

    console.log(`[${this.name}] ${message}`, context || '');
    
    // Store log for later analysis
    this.storeLog(logEntry);
  }

  /**
   * Logs errors with full context
   */
  protected logError(message: string, error: any): void {
    const timestamp = new Date().toISOString();
    const errorEntry = {
      timestamp,
      agent: this.name,
      sessionId: this.sessionId,
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    };

    console.error(`[${this.name}] ERROR: ${message}`, error);
    
    // Store error for later analysis
    this.storeError(errorEntry);
  }

  /**
   * Measures execution time for operations
   */
  protected async measureTime<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      this.log(`Operation completed: ${operation}`, { 
        duration: `${duration}ms`,
        success: true 
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      this.logError(`Operation failed: ${operation}`, { 
        duration: `${duration}ms`,
        error 
      });
      
      throw error;
    }
  }

  /**
   * Validates agent input parameters
   */
  protected validateInput(input: any, schema: any): boolean {
    // Basic validation - could integrate with Zod or similar
    if (!input) {
      throw new Error('Input is required');
    }
    
    return true;
  }

  /**
   * Gets agent status and metrics
   */
  public getStatus(): AgentStatus {
    return {
      name: this.name,
      sessionId: this.sessionId,
      uptime: Date.now() - this.startTime,
      status: 'active'
    };
  }

  /**
   * Cleanup resources when agent is done
   */
  public async cleanup(): Promise<void> {
    this.log('Agent cleanup initiated');
    // Override in subclasses for specific cleanup
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store log entry for analysis
   */
  private storeLog(logEntry: any): void {
    // In a real implementation, this would store to a proper logging system
    // For now, we'll just store in memory or file
    if (typeof window === 'undefined') {
      // Node.js environment
      this.writeToLogFile('vct-logs.json', logEntry);
    }
  }

  /**
   * Store error entry for analysis
   */
  private storeError(errorEntry: any): void {
    // In a real implementation, this would integrate with error tracking
    if (typeof window === 'undefined') {
      // Node.js environment
      this.writeToLogFile('vct-errors.json', errorEntry);
    }
  }

  /**
   * Write to log file (Node.js only)
   */
  private writeToLogFile(filename: string, entry: any): void {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const logDir = path.join(process.cwd(), 'vct', 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const logFile = path.join(logDir, filename);
      const logData = fs.existsSync(logFile) ? 
        JSON.parse(fs.readFileSync(logFile, 'utf8')) : [];
      
      logData.push(entry);
      fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
    } catch (error) {
      console.error('Failed to write log file:', error);
    }
  }
}

export interface AgentStatus {
  name: string;
  sessionId: string;
  uptime: number;
  status: 'active' | 'idle' | 'error' | 'stopped';
}