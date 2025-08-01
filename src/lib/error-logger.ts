/**
 * Comprehensive Error Logging and Monitoring System
 * Follows 2025 best practices for error handling, logging, and debugging
 */

export interface ErrorContext {
  userId?: string
  feature?: string
  action?: string
  metadata?: Record<string, unknown>
  timestamp?: Date
  sessionId?: string
  userAgent?: string
  url?: string
  stack?: string
}

export interface ErrorLog {
  id: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  context: ErrorContext
  timestamp: Date
  source: 'frontend' | 'backend' | 'database' | 'external'
}

class ErrorLogger {
  private static instance: ErrorLogger
  private sessionId: string
  private userId?: string
  private isProduction: boolean

  constructor() {
    this.sessionId = this.generateSessionId()
    this.isProduction = import.meta.env.PROD
    this.setupGlobalErrorHandlers()
    this.setupUnhandledRejectionHandler()
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  setUserId(userId: string) {
    this.userId = userId
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private setupGlobalErrorHandlers() {
    // Catch all JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError('Global JavaScript Error', {
        metadata: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        stack: event.error?.stack,
      })
    })

    // Catch all unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', {
        metadata: {
          reason: event.reason,
        },
        stack: event.reason?.stack,
      })
    })
  }

  private setupUnhandledRejectionHandler() {
    // Handle React error boundaries
    const originalConsoleError = console.error
    console.error = (...args) => {
      if (args[0]?.includes?.('React') || args[0]?.includes?.('Warning')) {
        this.logError('React Error/Warning', {
          metadata: {
            message: args.join(' '),
          },
          stack: new Error().stack,
        })
      }
      originalConsoleError.apply(console, args)
    }
  }

  private async sendToSupabase(errorLog: ErrorLog) {
    try {
      // In production, send to Supabase edge function for logging
      if (this.isProduction) {
        const response = await fetch('/api/log-error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorLog),
        })
        
        if (!response.ok) {
          console.warn('Failed to log error to backend:', response.statusText)
        }
      }
    } catch (err) {
      console.warn('Error logging failed:', err)
    }
  }

  private logToConsole(level: string, message: string, context: ErrorContext) {

    // Enhanced console logging with colors and formatting
    const colors = {
      error: '#ff4757',
      warn: '#ffa502',
      info: '#3742fa',
      debug: '#747d8c',
    }

    if (typeof window !== 'undefined' && window.console) {
      console.group(`%c${level.toUpperCase()} %c${message}`, 
        `color: white; background: ${colors[level as keyof typeof colors]}; padding: 2px 8px; border-radius: 3px;`,
        'color: inherit;'
      )
      console.log('Context:', context)
      console.log('Session ID:', this.sessionId)
      console.log('Timestamp:', new Date().toISOString())
      if (context.stack) {
        console.log('Stack Trace:', context.stack)
      }
      console.groupEnd()
    }
  }

  public logError(message: string, additionalContext: Partial<ErrorContext> = {}) {
    const context: ErrorContext = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stack: new Error().stack,
      ...additionalContext,
    }

    const errorLog: ErrorLog = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level: 'error',
      message,
      context,
      timestamp: new Date(),
      source: 'frontend',
    }

    this.logToConsole('error', message, context)
    this.sendToSupabase(errorLog)
  }

  public logWarning(message: string, additionalContext: Partial<ErrorContext> = {}) {
    const context: ErrorContext = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...additionalContext,
    }

    const errorLog: ErrorLog = {
      id: `warn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level: 'warn',
      message,
      context,
      timestamp: new Date(),
      source: 'frontend',
    }

    this.logToConsole('warn', message, context)
    this.sendToSupabase(errorLog)
  }

  public logInfo(message: string, additionalContext: Partial<ErrorContext> = {}) {
    const context: ErrorContext = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      url: window.location.href,
      ...additionalContext,
    }

    const errorLog: ErrorLog = {
      id: `info_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level: 'info',
      message,
      context,
      timestamp: new Date(),
      source: 'frontend',
    }

    this.logToConsole('info', message, context)
    
    // Only send info logs in development for debugging
    if (!this.isProduction) {
      this.sendToSupabase(errorLog)
    }
  }

  public logDebug(message: string, additionalContext: Partial<ErrorContext> = {}) {
    if (this.isProduction) return // Skip debug logs in production

    const context: ErrorContext = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      url: window.location.href,
      ...additionalContext,
    }

    this.logToConsole('debug', message, context)
  }

  // Supabase-specific error logger
  public logSupabaseError(operation: string, error: unknown, additionalContext: Partial<ErrorContext> = {}) {
    let errorMessage = 'Unknown Supabase error'
    let errorCode = 'UNKNOWN'

    if (error && typeof error === 'object') {
      if ('message' in error) {
        errorMessage = String(error.message)
      }
      if ('code' in error) {
        errorCode = String(error.code)
      }
    }

    this.logError(`Supabase ${operation} failed: ${errorMessage}`, {
      feature: 'supabase',
      action: operation,
      metadata: {
        errorCode,
        error: error,
      },
      ...additionalContext,
    })
  }

  // React Query specific error logger
  public logReactQueryError(queryKey: string[], error: unknown, additionalContext: Partial<ErrorContext> = {}) {
    let errorMessage = 'Unknown React Query error'
    
    if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message)
    }

    this.logError(`React Query failed for ${queryKey.join('.')}: ${errorMessage}`, {
      feature: 'react-query',
      action: 'query-failed',
      metadata: {
        queryKey,
        error,
      },
      ...additionalContext,
    })
  }

  // Performance monitoring
  public logPerformance(operation: string, duration: number, additionalContext: Partial<ErrorContext> = {}) {
    if (duration > 1000) { // Log slow operations (> 1 second)
      this.logWarning(`Slow operation detected: ${operation} took ${duration}ms`, {
        feature: 'performance',
        action: operation,
        metadata: {
          duration,
          threshold: 1000,
        },
        ...additionalContext,
      })
    } else {
      this.logDebug(`Performance: ${operation} completed in ${duration}ms`, {
        feature: 'performance',
        action: operation,
        metadata: { duration },
        ...additionalContext,
      })
    }
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance()

// Convenience functions
export const logError = (message: string, context?: Partial<ErrorContext>) => 
  errorLogger.logError(message, context)

export const logWarning = (message: string, context?: Partial<ErrorContext>) => 
  errorLogger.logWarning(message, context)

export const logInfo = (message: string, context?: Partial<ErrorContext>) => 
  errorLogger.logInfo(message, context)

export const logDebug = (message: string, context?: Partial<ErrorContext>) => 
  errorLogger.logDebug(message, context)

export const logSupabaseError = (operation: string, error: unknown, context?: Partial<ErrorContext>) => 
  errorLogger.logSupabaseError(operation, error, context)

export const logReactQueryError = (queryKey: string[], error: unknown, context?: Partial<ErrorContext>) => 
  errorLogger.logReactQueryError(queryKey, error, context)

export const logPerformance = (operation: string, duration: number, context?: Partial<ErrorContext>) => 
  errorLogger.logPerformance(operation, duration, context)