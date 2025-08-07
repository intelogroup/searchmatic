/**
 * Auth Utils Unit Tests
 * Tests for shared authentication utilities to ensure consistent behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  ensureAuthenticated, 
  getCurrentUser, 
  isUserAuthenticated,
  withAuth,
  withOptionalAuth,
  getUserId,
  createAuthSession,
  AuthenticationError,
  AuthorizationError,
  ensureAuthenticatedWithContext
} from '@/lib/auth-utils'

// Mock the Supabase client
vi.mock('@/lib/supabase', () => ({
  baseSupabaseClient: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn()
    }
  }
}))

import { baseSupabaseClient as supabase } from '@/lib/supabase'

describe('Auth Utils', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: { name: 'Test User' },
    app_metadata: { role: 'user' }
  }

  const mockAuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: { name: 'Test User' },
    app_metadata: { role: 'user' }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ensureAuthenticated', () => {
    it('should return user when authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const result = await ensureAuthenticated()
      expect(result).toEqual(mockAuthenticatedUser)
    })

    it('should throw error when user is null', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null
      })

      await expect(ensureAuthenticated()).rejects.toThrow('User not authenticated')
    })

    it('should throw error when auth check fails', async () => {
      const authError = new Error('Auth service unavailable')
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: authError
      })

      await expect(ensureAuthenticated()).rejects.toThrow('Authentication check failed: Auth service unavailable')
    })
  })

  describe('getCurrentUser', () => {
    it('should return user when authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const result = await getCurrentUser()
      expect(result).toEqual(mockAuthenticatedUser)
    })

    it('should return null when user is not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null
      })

      const result = await getCurrentUser()
      expect(result).toBeNull()
    })

    it('should return null when auth check fails', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: new Error('Network error')
      })

      const result = await getCurrentUser()
      expect(result).toBeNull()
    })

    it('should return null when an exception occurs', async () => {
      vi.mocked(supabase.auth.getUser).mockRejectedValue(new Error('Network error'))

      const result = await getCurrentUser()
      expect(result).toBeNull()
    })
  })

  describe('isUserAuthenticated', () => {
    it('should return true when session exists', () => {
      vi.mocked(supabase.auth.getSession).mockReturnValue({ data: { session: { access_token: 'token' } } })

      const result = isUserAuthenticated()
      expect(result).toBe(true)
    })

    it('should return false when no session exists', () => {
      vi.mocked(supabase.auth.getSession).mockReturnValue(null)

      const result = isUserAuthenticated()
      expect(result).toBe(false)
    })
  })

  describe('withAuth', () => {
    it('should execute function with authenticated user', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockFn = vi.fn().mockResolvedValue('success')
      const wrappedFn = withAuth(mockFn)

      const result = await wrappedFn('arg1', 'arg2')

      expect(mockFn).toHaveBeenCalledWith(mockAuthenticatedUser, 'arg1', 'arg2')
      expect(result).toBe('success')
    })

    it('should throw when user is not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null
      })

      const mockFn = vi.fn()
      const wrappedFn = withAuth(mockFn)

      await expect(wrappedFn()).rejects.toThrow('User not authenticated')
      expect(mockFn).not.toHaveBeenCalled()
    })
  })

  describe('withOptionalAuth', () => {
    it('should execute function with user when authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockFn = vi.fn().mockResolvedValue('authenticated')
      const wrappedFn = withOptionalAuth(mockFn)

      const result = await wrappedFn('arg1')

      expect(mockFn).toHaveBeenCalledWith(mockAuthenticatedUser, 'arg1')
      expect(result).toBe('authenticated')
    })

    it('should execute function with null when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null
      })

      const mockFn = vi.fn().mockResolvedValue('not-authenticated')
      const wrappedFn = withOptionalAuth(mockFn)

      const result = await wrappedFn('arg1')

      expect(mockFn).toHaveBeenCalledWith(null, 'arg1')
      expect(result).toBe('not-authenticated')
    })
  })

  describe('getUserId', () => {
    it('should return user ID when authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const result = await getUserId()
      expect(result).toBe('user-123')
    })

    it('should throw when user is not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null
      })

      await expect(getUserId()).rejects.toThrow('User not authenticated')
    })
  })

  describe('AuthSession', () => {
    it('should cache user data across multiple calls', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const session = createAuthSession()

      const user1 = await session.getUser()
      const user2 = await session.getUser()

      expect(user1).toEqual(mockAuthenticatedUser)
      expect(user2).toEqual(mockAuthenticatedUser)
      expect(supabase.auth.getUser).toHaveBeenCalledTimes(1)
    })

    it('should return consistent user ID across calls', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const session = createAuthSession()

      const id1 = await session.getUserId()
      const id2 = await session.getUserId()

      expect(id1).toBe('user-123')
      expect(id2).toBe('user-123')
      expect(supabase.auth.getUser).toHaveBeenCalledTimes(1)
    })

    it('should reset cache when reset is called', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const session = createAuthSession()

      await session.getUser()
      session.reset()
      await session.getUser()

      expect(supabase.auth.getUser).toHaveBeenCalledTimes(2)
    })

    it('should handle authentication check properly', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const session = createAuthSession()

      const isAuth1 = await session.isAuthenticated()
      const isAuth2 = await session.isAuthenticated()

      expect(isAuth1).toBe(true)
      expect(isAuth2).toBe(true)
      expect(supabase.auth.getUser).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Classes', () => {
    it('should create AuthenticationError with correct properties', () => {
      const error = new AuthenticationError('Auth failed', 'AUTH_ERROR')
      
      expect(error.name).toBe('AuthenticationError')
      expect(error.message).toBe('Auth failed')
      expect(error.code).toBe('AUTH_ERROR')
    })

    it('should create AuthorizationError with correct properties', () => {
      const error = new AuthorizationError('Access denied', 'user-profile')
      
      expect(error.name).toBe('AuthorizationError')
      expect(error.message).toBe('Access denied')
      expect(error.resource).toBe('user-profile')
    })
  })

  describe('ensureAuthenticatedWithContext', () => {
    it('should return user with successful authentication', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const result = await ensureAuthenticatedWithContext('test-operation')
      expect(result).toEqual(mockAuthenticatedUser)
    })

    it('should throw AuthenticationError with context when auth fails', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null
      })

      await expect(ensureAuthenticatedWithContext('test-operation', { extra: 'data' }))
        .rejects.toThrow(AuthenticationError)
      
      try {
        await ensureAuthenticatedWithContext('test-operation')
      } catch (error) {
        expect(error).toBeInstanceOf(AuthenticationError)
        expect(error.message).toContain('Authentication required for test-operation')
        expect(error.code).toBe('AUTH_REQUIRED')
      }
    })
  })
})