/**
 * VCT Error Monitoring Integration
 * Connects with Sentry, Highlight, and other monitoring services
 */

import { VCTAgent } from '../agents/base/VCTAgent';

interface MonitoringConfig {
  sentry?: {
    dsn: string;
    environment: string;
    release?: string;
  };
  highlight?: {
    projectId: string;
    environment: string;
  };
  logai?: {
    apiKey: string;
    endpoint?: string;
  };
}

interface ErrorEvent {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  environment: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  level: 'error' | 'warning' | 'info';
  tags?: { [key: string]: string };
  extra?: { [key: string]: any };
}

export class ErrorMonitoring extends VCTAgent {
  private config: MonitoringConfig = {};
  private sentryClient: any = null;
  private highlightClient: any = null;
  private logaiClient: any = null;

  constructor(config?: MonitoringConfig) {
    super('ErrorMonitoring');
    
    if (config) {
      this.config = config;
    } else {
      this.loadConfigFromEnv();
    }
    
    this.initializeClients();
  }

  /**
   * Initialize monitoring clients
   */
  private initializeClients(): void {
    // Initialize Sentry
    if (this.config.sentry?.dsn) {
      this.log('Initializing Sentry monitoring');
      this.sentryClient = this.initSentry(this.config.sentry);
    }

    // Initialize Highlight
    if (this.config.highlight?.projectId) {
      this.log('Initializing Highlight monitoring');
      this.highlightClient = this.initHighlight(this.config.highlight);
    }

    // Initialize LogAI
    if (this.config.logai?.apiKey) {
      this.log('Initializing LogAI monitoring');
      this.logaiClient = this.initLogAI(this.config.logai);
    }
  }

  /**
   * Capture error with all monitoring services
   */
  async captureError(error: Error | string, extra?: { [key: string]: any }): Promise<string> {
    return this.measureTime('captureError', async () => {
      const errorEvent: ErrorEvent = {
        id: this.generateErrorId(),
        message: typeof error === 'string' ? error : error.message,
        stack: typeof error === 'object' ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        environment: process.env.VCT_ENVIRONMENT || 'local',
        level: 'error',
        extra
      };

      this.log(`Capturing error: ${errorEvent.message}`);

      // Send to all configured services
      const promises = [];

      if (this.sentryClient) {
        promises.push(this.sendToSentry(errorEvent));
      }

      if (this.highlightClient) {
        promises.push(this.sendToHighlight(errorEvent));
      }

      if (this.logaiClient) {
        promises.push(this.sendToLogAI(errorEvent));
      }

      // Wait for all services to respond
      await Promise.allSettled(promises);

      this.log(`Error captured with ID: ${errorEvent.id}`);
      return errorEvent.id;
    });
  }

  /**
   * Capture performance metric
   */
  async capturePerformance(metric: {
    name: string;
    value: number;
    unit: string;
    tags?: { [key: string]: string };
  }): Promise<void> {
    return this.measureTime('capturePerformance', async () => {
      this.log(`Capturing performance metric: ${metric.name} = ${metric.value}${metric.unit}`);

      // Send to monitoring services
      if (this.sentryClient) {
        // Sentry performance monitoring
        this.sentryClient.addBreadcrumb({
          message: `Performance: ${metric.name}`,
          level: 'info',
          data: metric
        });
      }

      if (this.logaiClient) {
        await this.logaiClient.track('performance', metric);
      }
    });
  }

  /**
   * Capture user interaction
   */
  async captureUserInteraction(interaction: {
    action: string;
    element?: string;
    url?: string;
    userId?: string;
    sessionId?: string;
    metadata?: { [key: string]: any };
  }): Promise<void> {
    return this.measureTime('captureUserInteraction', async () => {
      this.log(`Capturing user interaction: ${interaction.action}`);

      const event = {
        type: 'user_interaction',
        ...interaction,
        timestamp: new Date().toISOString()
      };

      if (this.highlightClient) {
        this.highlightClient.track(interaction.action, event);
      }

      if (this.logaiClient) {
        await this.logaiClient.track('interaction', event);
      }
    });
  }

  /**
   * Start session recording
   */
  async startSession(sessionId: string, userId?: string): Promise<void> {
    this.log(`Starting monitoring session: ${sessionId}`);

    if (this.highlightClient) {
      this.highlightClient.identify(userId || 'anonymous', {
        sessionId,
        environment: process.env.VCT_ENVIRONMENT || 'local'
      });
    }

    if (this.sentryClient) {
      this.sentryClient.setUser({
        id: userId || 'anonymous',
        sessionId
      });
    }
  }

  /**
   * End session recording
   */
  async endSession(sessionId: string): Promise<void> {
    this.log(`Ending monitoring session: ${sessionId}`);

    if (this.highlightClient) {
      this.highlightClient.flush();
    }

    if (this.sentryClient) {
      this.sentryClient.addBreadcrumb({
        message: 'Session ended',
        level: 'info',
        data: { sessionId }
      });
    }
  }

  /**
   * Private helper methods
   */
  private loadConfigFromEnv(): void {
    this.config = {
      sentry: process.env.SENTRY_DSN ? {
        dsn: process.env.SENTRY_DSN,
        environment: process.env.VCT_ENVIRONMENT || 'local',
        release: process.env.VCT_RELEASE
      } : undefined,
      
      highlight: process.env.HIGHLIGHT_PROJECT_ID ? {
        projectId: process.env.HIGHLIGHT_PROJECT_ID,
        environment: process.env.VCT_ENVIRONMENT || 'local'
      } : undefined,
      
      logai: process.env.LOGAI_API_KEY ? {
        apiKey: process.env.LOGAI_API_KEY,
        endpoint: process.env.LOGAI_ENDPOINT
      } : undefined
    };
  }

  private initSentry(config: any): any {
    try {
      // Mock Sentry client for now
      return {
        captureException: (error: Error) => {
          console.log('[SENTRY]', error.message);
        },
        captureMessage: (message: string) => {
          console.log('[SENTRY]', message);
        },
        addBreadcrumb: (breadcrumb: any) => {
          console.log('[SENTRY BREADCRUMB]', breadcrumb);
        },
        setUser: (user: any) => {
          console.log('[SENTRY USER]', user);
        }
      };
    } catch (error) {
      this.logError('Failed to initialize Sentry', error);
      return null;
    }
  }

  private initHighlight(config: any): any {
    try {
      // Mock Highlight client for now
      return {
        identify: (userId: string, traits: any) => {
          console.log('[HIGHLIGHT]', `User: ${userId}`, traits);
        },
        track: (event: string, properties: any) => {
          console.log('[HIGHLIGHT]', `Event: ${event}`, properties);
        },
        flush: () => {
          console.log('[HIGHLIGHT] Flushed');
        }
      };
    } catch (error) {
      this.logError('Failed to initialize Highlight', error);
      return null;
    }
  }

  private initLogAI(config: any): any {
    try {
      // Mock LogAI client for now
      return {
        track: async (type: string, data: any) => {
          console.log('[LOGAI]', `Type: ${type}`, data);
        },
        query: async (query: string) => {
          console.log('[LOGAI QUERY]', query);
          return { results: [] };
        }
      };
    } catch (error) {
      this.logError('Failed to initialize LogAI', error);
      return null;
    }
  }

  private async sendToSentry(errorEvent: ErrorEvent): Promise<void> {
    if (!this.sentryClient) return;

    try {
      if (errorEvent.stack) {
        const error = new Error(errorEvent.message);
        error.stack = errorEvent.stack;
        this.sentryClient.captureException(error);
      } else {
        this.sentryClient.captureMessage(errorEvent.message);
      }
    } catch (error) {
      this.logError('Failed to send error to Sentry', error);
    }
  }

  private async sendToHighlight(errorEvent: ErrorEvent): Promise<void> {
    if (!this.highlightClient) return;

    try {
      this.highlightClient.track('error', {
        message: errorEvent.message,
        stack: errorEvent.stack,
        level: errorEvent.level,
        timestamp: errorEvent.timestamp,
        extra: errorEvent.extra
      });
    } catch (error) {
      this.logError('Failed to send error to Highlight', error);
    }
  }

  private async sendToLogAI(errorEvent: ErrorEvent): Promise<void> {
    if (!this.logaiClient) return;

    try {
      await this.logaiClient.track('error', errorEvent);
    } catch (error) {
      this.logError('Failed to send error to LogAI', error);
    }
  }

  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}