/**
 * Service Wrapper for Consistent Error Handling and Patterns
 * Consolidates all service error handling patterns to eliminate duplication
 * Follows VCT framework for standardized service layer architecture
 */

import { errorLogger, logSupabaseError, logInfo, logPerformance } from '@/lib/error-logger'
import { ensureAuthenticated, createAuthSession, type AuthenticatedUser } from '@/lib/auth-utils'

/**
 * Standard service operation context for logging and debugging
 */
export interface ServiceContext {
  service: string
  action: string
  metadata?: Record<string, unknown>
}

/**
 * Service operation result with consistent error handling
 */
export interface ServiceResult<T> {
  data: T
  error?: never
}

export interface ServiceError {
  data?: never
  error: Error
}

export type ServiceResponse<T> = ServiceResult<T> | ServiceError

/**
 * High-level service wrapper that provides:
 * - Consistent error handling
 * - Performance monitoring
 * - Authentication checks
 * - Logging standardization
 */
export async function executeServiceOperation<T>(
  context: ServiceContext,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = performance.now()
  
  logInfo(`Executing ${context.service}.${context.action}`, {
    feature: context.service,
    action: context.action,
    metadata: context.metadata
  })

  try {
    const result = await operation()
    const duration = performance.now() - startTime
    
    logPerformance(`${context.service}.${context.action}`, duration, {
      feature: context.service,
      metadata: context.metadata
    })

    logInfo(`Successfully completed ${context.service}.${context.action}`, {
      feature: context.service,
      action: `${context.action}-success`,
      metadata: context.metadata
    })

    return result
  } catch (error) {
    const duration = performance.now() - startTime
    logPerformance(`Failed ${context.service}.${context.action}`, duration)
    
    errorLogger.logError(`${context.service}.${context.action} failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      feature: context.service,
      action: `${context.action}-error`,
      metadata: {
        ...context.metadata,
        originalError: error
      }
    })
    
    throw error
  }
}

/**
 * Service wrapper specifically for authenticated operations
 * Automatically handles authentication and provides user context
 */
export async function executeAuthenticatedServiceOperation<T>(
  context: ServiceContext,
  operation: (user: AuthenticatedUser) => Promise<T>
): Promise<T> {
  return executeServiceOperation(context, async () => {
    const user = await ensureAuthenticated()
    return operation(user)
  })
}

/**
 * Service wrapper for Supabase operations with enhanced error handling
 * Provides consistent error logging for all database operations
 */
export async function executeSupabaseOperation<T>(
  context: ServiceContext & { table?: string },
  operation: () => Promise<{ data: T | null; error: Error | null }>
): Promise<T> {
  return executeServiceOperation(context, async () => {
    const { data, error } = await operation()
    
    if (error) {
      logSupabaseError(`${context.action}${context.table ? ` on ${context.table}` : ''}`, error, {
        feature: context.service,
        action: context.action,
        metadata: { ...context.metadata, table: context.table }
      })
      throw new Error(`Database operation failed: ${error.message}`)
    }
    
    if (data === null) {
      throw new Error('Database operation returned no data')
    }
    
    return data
  })
}

/**
 * Service wrapper for authenticated Supabase operations
 * Combines authentication and database operation error handling
 */
export async function executeAuthenticatedSupabaseOperation<T>(
  context: ServiceContext & { table?: string },
  operation: (user: AuthenticatedUser) => Promise<{ data: T | null; error: Error | null }>
): Promise<T> {
  return executeAuthenticatedServiceOperation(context, async (user) => {
    const { data, error } = await operation(user)
    
    if (error) {
      logSupabaseError(`${context.action}${context.table ? ` on ${context.table}` : ''}`, error, {
        feature: context.service,
        action: context.action,
        metadata: { 
          ...context.metadata, 
          table: context.table,
          userId: user.id 
        }
      })
      throw new Error(`Database operation failed: ${error.message}`)
    }
    
    if (data === null) {
      throw new Error('Database operation returned no data')
    }
    
    return data
  })
}

/**
 * Base service class that provides consistent patterns for all services
 * Eliminates service pattern inconsistencies
 */
export abstract class BaseService {
  protected serviceName: string

  constructor(serviceName: string) {
    this.serviceName = serviceName
  }

  /**
   * Execute a service operation with consistent error handling
   */
  protected async execute<T>(
    action: string,
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    return executeServiceOperation(
      {
        service: this.serviceName,
        action,
        metadata
      },
      operation
    )
  }

  /**
   * Execute an authenticated service operation
   */
  protected async executeAuthenticated<T>(
    action: string,
    operation: (user: AuthenticatedUser) => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    return executeAuthenticatedServiceOperation(
      {
        service: this.serviceName,
        action,
        metadata
      },
      operation
    )
  }

  /**
   * Execute a Supabase operation with consistent error handling
   */
  protected async executeSupabase<T>(
    action: string,
    operation: () => Promise<{ data: T | null; error: Error | null }>,
    table?: string,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    return executeSupabaseOperation(
      {
        service: this.serviceName,
        action,
        table,
        metadata
      },
      operation
    )
  }

  /**
   * Execute an authenticated Supabase operation
   */
  protected async executeAuthenticatedSupabase<T>(
    action: string,
    operation: (user: AuthenticatedUser) => Promise<{ data: T | null; error: Error | null }>,
    table?: string,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    return executeAuthenticatedSupabaseOperation(
      {
        service: this.serviceName,
        action,
        table,
        metadata
      },
      operation
    )
  }

  /**
   * Create an auth session for batch operations
   */
  protected createAuthSession() {
    return createAuthSession()
  }
}

/**
 * Batch operation handler for services that need to perform multiple operations
 * Uses auth session to avoid redundant authentication checks
 */
export class BatchServiceOperation {
  private authSession = createAuthSession()
  private operations: Array<() => Promise<unknown>> = []
  private context: Omit<ServiceContext, 'action'>

  constructor(context: Omit<ServiceContext, 'action'>) {
    this.context = context
  }

  /**
   * Add an authenticated operation to the batch
   */
  addAuthenticatedOperation<T>(
    action: string,
    operation: (user: AuthenticatedUser) => Promise<T>
  ): this {
    this.operations.push(async () => {
      const user = await this.authSession.getUser()
      return executeServiceOperation(
        { ...this.context, action },
        () => operation(user)
      )
    })
    return this
  }

  /**
   * Add a regular operation to the batch
   */
  addOperation<T>(
    action: string,
    operation: () => Promise<T>
  ): this {
    this.operations.push(() => 
      executeServiceOperation({ ...this.context, action }, operation)
    )
    return this
  }

  /**
   * Execute all operations in the batch
   */
  async execute(): Promise<unknown[]> {
    const results = []
    for (const operation of this.operations) {
      const result = await operation()
      results.push(result)
    }
    return results
  }

  /**
   * Execute all operations in parallel (use with caution for database operations)
   */
  async executeParallel(): Promise<unknown[]> {
    return Promise.all(this.operations.map(op => op()))
  }
}

/**
 * Create a new batch operation context
 */
export function createBatchOperation(context: Omit<ServiceContext, 'action'>): BatchServiceOperation {
  return new BatchServiceOperation(context)
}

/**
 * Error types for consistent service error handling
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly action: string,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

export class DatabaseError extends ServiceError {
  constructor(
    message: string,
    service: string,
    action: string,
    public readonly table?: string,
    originalError?: Error
  ) {
    super(message, service, action, originalError)
    this.name = 'DatabaseError'
  }
}