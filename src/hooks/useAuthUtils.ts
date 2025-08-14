/**
 * Hook that bridges AuthContext with auth-utils for better integration
 */

import { useAuth } from '@/contexts/AuthContext'
import type { AuthenticatedUser } from '@/lib/auth-utils'
import { AuthenticationError } from '@/lib/auth-utils'

export const useAuthUtils = () => {
  const { user, isAuthenticated, session } = useAuth()

  /**
   * Get current authenticated user or throw error
   */
  const ensureAuthenticated = (): AuthenticatedUser => {
    if (!isAuthenticated || !user) {
      throw new AuthenticationError('User not authenticated', 'AUTH_REQUIRED')
    }

    return {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata
    }
  }

  /**
   * Get current user or null (no error)
   */
  const getCurrentUser = (): AuthenticatedUser | null => {
    if (!isAuthenticated || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata
    }
  }

  /**
   * Get user ID or throw error
   */
  const getUserId = (): string => {
    const authenticatedUser = ensureAuthenticated()
    return authenticatedUser.id
  }

  /**
   * Get access token from current session
   */
  const getAccessToken = (): string | null => {
    return session?.access_token ?? null
  }

  /**
   * Check if user is authenticated (convenience method)
   */
  const checkAuthenticated = (): boolean => {
    return isAuthenticated
  }

  return {
    ensureAuthenticated,
    getCurrentUser,
    getUserId,
    getAccessToken,
    isAuthenticated: checkAuthenticated,
    user: getCurrentUser()
  }
}