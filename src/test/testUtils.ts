/**
 * Shared Test Utilities
 * Provides consistent mocking patterns and test helpers across all test files
 */

import { vi } from 'vitest'

/**
 * Creates a chainable Supabase mock that properly handles method chaining
 */
export function createSupabaseMock() {
  const createChainableMock = (finalValue: { data: unknown; error: unknown } = { data: null, error: null }) => {
    const chainable = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(finalValue),
      then: vi.fn((callback) => Promise.resolve(finalValue).then(callback))
    }

    // Make all methods return the same chainable object
    Object.keys(chainable).forEach(key => {
      if (key !== 'single' && key !== 'then') {
        chainable[key as keyof typeof chainable] = vi.fn(() => chainable)
      }
    })

    return chainable
  }

  return {
    from: vi.fn(() => createChainableMock())
  }
}

/**
 * Standard auth utilities mock
 */
export const createAuthMock = () => ({
  ensureAuthenticated: vi.fn(),
  createAuthSession: vi.fn(() => ({
    getUser: vi.fn().mockResolvedValue({ id: 'user-123', email: 'test@example.com' }),
    getUserId: vi.fn().mockResolvedValue('user-123'),
    isAuthenticated: vi.fn().mockResolvedValue(true),
    reset: vi.fn()
  }))
})

/**
 * Standard error logger mock
 */
export const createErrorLoggerMock = () => ({
  logInfo: vi.fn(),
  logSupabaseError: vi.fn(),
  logPerformance: vi.fn(),
  errorLogger: {
    logError: vi.fn(),
    setUserId: vi.fn()
  }
})

/**
 * Standard test user object
 */
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: {},
  app_metadata: {}
}

/**
 * Helper to setup a Supabase mock with specific return value
 */
export function mockSupabaseOperation(returnValue: unknown, error: unknown = null) {
  const finalValue = error ? { data: null, error } : { data: returnValue, error: null }
  return createChainableMock(finalValue)
}

/**
 * Helper to create a chainable mock for complex operations
 */
function createChainableMock(finalValue: { data: unknown; error: unknown }) {
  const chainable: Record<string, unknown> = {}
  
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'limit']
  methods.forEach(method => {
    chainable[method] = vi.fn(() => chainable)
  })
  
  chainable.single = vi.fn().mockResolvedValue(finalValue)
  chainable.then = vi.fn((callback) => Promise.resolve(finalValue).then(callback))
  
  return chainable
}

/**
 * Helper to verify service method calls
 */
export function expectServiceMethodCalled(mockFrom: unknown, table: string, method: string) {
  expect(mockFrom).toHaveBeenCalledWith(table)
  const mockChain = mockFrom.mock.results[0].value
  expect(mockChain[method]).toHaveBeenCalled()
}

/**
 * Helper to setup authentication mock for tests
 */
export function setupAuthMock(user = mockUser) {
  return vi.fn().mockResolvedValue(user)
}

/**
 * Helper to create mock data for testing
 */
export const createMockData = {
  project: (overrides = {}) => ({
    id: 'project-123',
    user_id: 'user-123',
    title: 'Test Project',
    description: 'A test project',
    project_type: 'systematic_review' as const,
    status: 'draft' as const,
    research_domain: 'medicine',
    progress_percentage: 0,
    current_stage: 'planning',
    last_activity_at: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides
  }),

  protocol: (overrides = {}) => ({
    id: 'protocol-123',
    project_id: 'project-123',
    user_id: 'user-123',
    title: 'Test Protocol',
    description: 'A test research protocol',
    research_question: 'What is the effectiveness of X?',
    framework_type: 'pico' as const,
    inclusion_criteria: ['Adults', 'Published studies'],
    exclusion_criteria: ['Children', 'Non-English'],
    search_strategy: { databases: ['PubMed', 'Cochrane'] },
    databases: ['pubmed', 'cochrane'],
    keywords: ['intervention', 'outcome'],
    study_types: ['randomized_trial'],
    status: 'draft' as const,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides
  }),

  conversation: (overrides = {}) => ({
    id: 'conv-123',
    project_id: 'project-123',
    user_id: 'user-123',
    title: 'Test Conversation',
    context: 'Research discussion',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides
  }),

  message: (overrides = {}) => ({
    id: 'msg-123',
    conversation_id: 'conv-123',
    role: 'user' as const,
    content: 'Hello, how can you help?',
    metadata: null,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides
  })
}

/**
 * Helper to create a database error for testing
 */
export const createDatabaseError = (message: string, code: string = 'DB_ERROR') => ({
  message,
  code
})

/**
 * Helper to test error scenarios
 */
export function testErrorScenario(errorMessage: string, errorCode?: string) {
  return createDatabaseError(errorMessage, errorCode)
}

/**
 * Helper to setup service tests with common patterns
 */
export function setupServiceTest() {
  const mockSupabase = createSupabaseMock()
  const mockAuth = createAuthMock()
  const mockLogger = createErrorLoggerMock()

  return {
    mockSupabase,
    mockAuth,
    mockLogger,
    mockUser
  }
}