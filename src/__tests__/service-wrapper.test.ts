/**
 * Service Wrapper Unit Tests
 * Tests for shared service wrapper utilities to ensure consistent error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  executeServiceOperation,
  executeAuthenticatedServiceOperation,
  executeSupabaseOperation,
  executeAuthenticatedSupabaseOperation,
  BaseService,
  createBatchOperation,
  ServiceError,
  DatabaseError
} from '@/lib/service-wrapper'

// Mock dependencies
vi.mock('@/lib/error-logger', () => ({
  errorLogger: {
    logError: vi.fn()
  },
  logSupabaseError: vi.fn(),
  logInfo: vi.fn(),
  logPerformance: vi.fn()
}))

vi.mock('@/lib/auth-utils', () => ({
  ensureAuthenticated: vi.fn(),
  createAuthSession: vi.fn(() => ({
    getUser: vi.fn().mockResolvedValue({ id: 'user-123', email: 'test@example.com' })
  }))
}))

import { errorLogger, logSupabaseError, logInfo, logPerformance } from '@/lib/error-logger'
import { ensureAuthenticated, createAuthSession } from '@/lib/auth-utils'

describe('Service Wrapper', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {},
    app_metadata: {}
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ensureAuthenticated).mockResolvedValue(mockUser)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('executeServiceOperation', () => {
    it('should execute operation successfully and log performance', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success')
      const context = { service: 'test', action: 'test-action' }

      const result = await executeServiceOperation(context, mockOperation)

      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(1)
      expect(logInfo).toHaveBeenCalledWith(
        'Executing test.test-action',
        expect.any(Object)
      )
      expect(logPerformance).toHaveBeenCalledWith(
        'test.test-action',
        expect.any(Number),
        expect.any(Object)
      )
    })

    it('should handle operation errors and log them', async () => {
      const error = new Error('Operation failed')
      const mockOperation = vi.fn().mockRejectedValue(error)
      const context = { service: 'test', action: 'test-action' }

      await expect(executeServiceOperation(context, mockOperation)).rejects.toThrow('Operation failed')

      expect(errorLogger.logError).toHaveBeenCalledWith(
        'test.test-action failed: Operation failed',
        expect.objectContaining({
          feature: 'test',
          action: 'test-action-error'
        })
      )
    })

    it('should include metadata in logs', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success')
      const context = { 
        service: 'test', 
        action: 'test-action',
        metadata: { userId: '123', requestId: 'req-456' }
      }

      await executeServiceOperation(context, mockOperation)

      expect(logInfo).toHaveBeenCalledWith(
        'Executing test.test-action',
        expect.objectContaining({
          metadata: { userId: '123', requestId: 'req-456' }
        })
      )
    })
  })

  describe('executeAuthenticatedServiceOperation', () => {
    it('should execute with user authentication', async () => {
      const mockOperation = vi.fn().mockResolvedValue('authenticated-success')
      const context = { service: 'test', action: 'auth-action' }

      const result = await executeAuthenticatedServiceOperation(context, mockOperation)

      expect(result).toBe('authenticated-success')
      expect(ensureAuthenticated).toHaveBeenCalledTimes(1)
      expect(mockOperation).toHaveBeenCalledWith(mockUser)
    })

    it('should propagate authentication errors', async () => {
      const authError = new Error('Not authenticated')
      vi.mocked(ensureAuthenticated).mockRejectedValue(authError)
      
      const mockOperation = vi.fn()
      const context = { service: 'test', action: 'auth-action' }

      await expect(executeAuthenticatedServiceOperation(context, mockOperation)).rejects.toThrow('Not authenticated')
      expect(mockOperation).not.toHaveBeenCalled()
    })
  })

  describe('executeSupabaseOperation', () => {
    it('should execute successful Supabase operation', async () => {
      const mockData = { id: '1', name: 'Test' }
      const mockOperation = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const context = { service: 'test', action: 'db-action', table: 'users' }

      const result = await executeSupabaseOperation(context, mockOperation)

      expect(result).toBe(mockData)
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should handle Supabase errors', async () => {
      const dbError = { message: 'Database connection failed', code: 'DB001' }
      const mockOperation = vi.fn().mockResolvedValue({ data: null, error: dbError })
      const context = { service: 'test', action: 'db-action', table: 'users' }

      await expect(executeSupabaseOperation(context, mockOperation)).rejects.toThrow('Database operation failed')

      expect(logSupabaseError).toHaveBeenCalledWith(
        'db-action on users',
        dbError,
        expect.objectContaining({
          feature: 'test',
          action: 'db-action',
          metadata: expect.objectContaining({
            table: 'users'
          })
        })
      )
    })

    it('should handle null data response', async () => {
      const mockOperation = vi.fn().mockResolvedValue({ data: null, error: null })
      const context = { service: 'test', action: 'db-action' }

      await expect(executeSupabaseOperation(context, mockOperation)).rejects.toThrow('Database operation returned no data')
    })
  })

  describe('executeAuthenticatedSupabaseOperation', () => {
    it('should execute with authentication and database operation', async () => {
      const mockData = { id: '1', user_id: 'user-123' }
      const mockOperation = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const context = { service: 'test', action: 'auth-db-action', table: 'user_data' }

      const result = await executeAuthenticatedSupabaseOperation(context, mockOperation)

      expect(result).toBe(mockData)
      expect(ensureAuthenticated).toHaveBeenCalledTimes(1)
      expect(mockOperation).toHaveBeenCalledWith(mockUser)
    })

    it('should include user ID in error metadata', async () => {
      const dbError = { message: 'Permission denied', code: 'PERM001' }
      const mockOperation = vi.fn().mockResolvedValue({ data: null, error: dbError })
      const context = { service: 'test', action: 'auth-db-action', table: 'user_data' }

      await expect(executeAuthenticatedSupabaseOperation(context, mockOperation)).rejects.toThrow('Database operation failed')

      expect(logSupabaseError).toHaveBeenCalledWith(
        'auth-db-action on user_data',
        dbError,
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: 'user-123'
          })
        })
      )
    })
  })

  describe('BaseService', () => {
    class TestService extends BaseService {
      constructor() {
        super('test-service')
      }

      async testMethod(data: string) {
        return this.execute('test-method', async () => {
          return `processed-${data}`
        })
      }

      async testAuthMethod(data: string) {
        return this.executeAuthenticated('auth-method', async (user) => {
          return `${user.id}-processed-${data}`
        })
      }

      async testSupabaseMethod(data: string) {
        return this.executeSupabase('db-method', async () => {
          return { data: `db-${data}`, error: null }
        })
      }

      async testAuthSupabaseMethod(data: string) {
        return this.executeAuthenticatedSupabase('auth-db-method', async (user) => {
          return { data: `${user.id}-db-${data}`, error: null }
        })
      }
    }

    let service: TestService

    beforeEach(() => {
      service = new TestService()
    })

    it('should execute regular methods', async () => {
      const result = await service.testMethod('input')
      expect(result).toBe('processed-input')
    })

    it('should execute authenticated methods', async () => {
      const result = await service.testAuthMethod('input')
      expect(result).toBe('user-123-processed-input')
    })

    it('should execute Supabase methods', async () => {
      const result = await service.testSupabaseMethod('input')
      expect(result).toBe('db-input')
    })

    it('should execute authenticated Supabase methods', async () => {
      const result = await service.testAuthSupabaseMethod('input')
      expect(result).toBe('user-123-db-input')
    })

    it('should create auth sessions', () => {
      const session = service['createAuthSession']()
      expect(createAuthSession).toHaveBeenCalledTimes(1)
      expect(session).toBeDefined()
    })
  })

  describe('BatchServiceOperation', () => {
    it('should execute batch operations sequentially', async () => {
      const batch = createBatchOperation({ service: 'batch-test' })
      const results: string[] = []

      batch
        .addOperation('op1', async () => {
          results.push('op1')
          return 'result1'
        })
        .addOperation('op2', async () => {
          results.push('op2')
          return 'result2'
        })
        .addAuthenticatedOperation('op3', async (user) => {
          results.push(`op3-${user.id}`)
          return 'result3'
        })

      const batchResults = await batch.execute()

      expect(batchResults).toEqual(['result1', 'result2', 'result3'])
      expect(results).toEqual(['op1', 'op2', 'op3-user-123'])
    })

    it('should execute batch operations in parallel', async () => {
      const batch = createBatchOperation({ service: 'batch-test' })
      
      batch
        .addOperation('op1', async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          return 'result1'
        })
        .addOperation('op2', async () => {
          return 'result2'
        })

      const start = Date.now()
      const batchResults = await batch.executeParallel()
      const duration = Date.now() - start

      expect(batchResults).toEqual(['result1', 'result2'])
      expect(duration).toBeLessThan(50) // Should be much faster than sequential
    })
  })

  describe('Error Classes', () => {
    it('should create ServiceError with correct properties', () => {
      const originalError = new Error('Original error')
      const error = new ServiceError('Service failed', 'user-service', 'get-user', originalError)
      
      expect(error.name).toBe('ServiceError')
      expect(error.message).toBe('Service failed')
      expect(error.service).toBe('user-service')
      expect(error.action).toBe('get-user')
      expect(error.originalError).toBe(originalError)
    })

    it('should create DatabaseError with correct properties', () => {
      const originalError = new Error('DB error')
      const error = new DatabaseError('DB operation failed', 'user-service', 'insert-user', 'users', originalError)
      
      expect(error.name).toBe('DatabaseError')
      expect(error.message).toBe('DB operation failed')
      expect(error.service).toBe('user-service')
      expect(error.action).toBe('insert-user')
      expect(error.table).toBe('users')
      expect(error.originalError).toBe(originalError)
    })
  })
})