/**
 * Shared Authentication Utilities
 * Consolidates all authentication patterns across services to eliminate duplication
 * Follows VCT framework for consistent authentication handling
 */

import { baseSupabaseClient as supabase } from '@/lib/supabase'

export interface AuthenticatedUser {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
}

/**
 * Ensures user is authenticated and returns the user object
 * Throws consistent error if user is not authenticated
 * Replaces all duplicate auth check patterns
 */
export async function ensureAuthenticated(): Promise<AuthenticatedUser> {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    throw new Error(`Authentication check failed: ${error.message}`)
  }
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  return {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
    app_metadata: user.app_metadata
  }
}

/**
 * Gets the current user without throwing if not authenticated
 * Useful for optional authentication scenarios
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata
    }
  } catch {
    return null
  }
}

/**
 * Checks if user is authenticated without making an API call
 * Uses session from local storage/memory
 */
export function isUserAuthenticated(): boolean {
  const session = supabase.auth.getSession()
  return !!session
}

/**
 * Higher-order function to wrap service methods with authentication
 * Automatically ensures authentication before executing the wrapped function
 */
export function withAuth<TArgs extends unknown[], TReturn>(
  fn: (user: AuthenticatedUser, ...args: TArgs) => Promise<TReturn>
) {
  return async (...args: TArgs): Promise<TReturn> => {
    const user = await ensureAuthenticated()
    return fn(user, ...args)
  }
}

/**
 * Higher-order function for optional authentication
 * Passes null if user is not authenticated, user object if authenticated
 */
export function withOptionalAuth<TArgs extends unknown[], TReturn>(
  fn: (user: AuthenticatedUser | null, ...args: TArgs) => Promise<TReturn>
) {
  return async (...args: TArgs): Promise<TReturn> => {
    const user = await getCurrentUser()
    return fn(user, ...args)
  }
}

/**
 * User ID extraction helper
 * Throws consistent error for authenticated operations that need user ID
 */
export async function getUserId(): Promise<string> {
  const user = await ensureAuthenticated()
  return user.id
}

/**
 * Batch authentication check for multiple operations
 * Returns user once for multiple operations to avoid redundant API calls
 */
export class AuthSession {
  private _user: AuthenticatedUser | null = null
  private _isAuthenticated: boolean | null = null

  async getUser(): Promise<AuthenticatedUser> {
    if (this._user && this._isAuthenticated) {
      return this._user
    }

    this._user = await ensureAuthenticated()
    this._isAuthenticated = true
    return this._user
  }

  async getUserId(): Promise<string> {
    const user = await this.getUser()
    return user.id
  }

  async isAuthenticated(): Promise<boolean> {
    if (this._isAuthenticated !== null) {
      return this._isAuthenticated
    }

    try {
      await this.getUser()
      return true
    } catch {
      this._isAuthenticated = false
      return false
    }
  }

  reset(): void {
    this._user = null
    this._isAuthenticated = null
  }
}

/**
 * Creates a new auth session for batch operations
 * Use this when you need to perform multiple authenticated operations
 * to avoid redundant authentication checks
 */
export function createAuthSession(): AuthSession {
  return new AuthSession()
}

/**
 * Authentication error types for consistent error handling
 */
export class AuthenticationError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string, public readonly resource?: string) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Enhanced authentication check with custom error handling
 */
export async function ensureAuthenticatedWithContext(): Promise<AuthenticatedUser> {
  try {
    return await ensureAuthenticated()
  } catch (error) {
    throw new AuthenticationError(
      `Authentication required for ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'AUTH_REQUIRED'
    )
  }
}