import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { logInfo, logError } from '@/lib/error-logger'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          logError('Failed to get initial session', {
            feature: 'auth-context',
            action: 'get-initial-session',
            metadata: { error: error.message }
          })
        }

        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }

        logInfo('Initial auth session loaded', {
          feature: 'auth-context',
          action: 'initial-session-loaded',
          metadata: { 
            hasSession: !!session,
            userId: session?.user?.id
          }
        })
      } catch (error) {
        logError('Unexpected error getting initial session', {
          feature: 'auth-context',
          action: 'initial-session-error',
          metadata: { error: String(error) }
        })
        
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      logInfo('Auth state changed', {
        feature: 'auth-context',
        action: 'auth-state-change',
        metadata: { 
          event,
          hasSession: !!session,
          userId: session?.user?.id
        }
      })

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async (): Promise<void> => {
    try {
      logInfo('Sign out initiated', {
        feature: 'auth-context',
        action: 'sign-out-initiated',
        metadata: { userId: user?.id }
      })

      const { error } = await supabase.auth.signOut()
      
      if (error) {
        logError('Sign out failed', {
          feature: 'auth-context',
          action: 'sign-out-failed',
          metadata: { error: error.message }
        })
        throw error
      }

      logInfo('Sign out successful', {
        feature: 'auth-context',
        action: 'sign-out-success'
      })
    } catch (error) {
      logError('Unexpected sign out error', {
        feature: 'auth-context',
        action: 'sign-out-error',
        metadata: { error: String(error) }
      })
      throw error
    }
  }

  const refreshSession = async (): Promise<void> => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        logError('Session refresh failed', {
          feature: 'auth-context',
          action: 'session-refresh-failed',
          metadata: { error: error.message }
        })
        throw error
      }

      setSession(session)
      setUser(session?.user ?? null)

      logInfo('Session refreshed successfully', {
        feature: 'auth-context',
        action: 'session-refresh-success',
        metadata: { userId: session?.user?.id }
      })
    } catch (error) {
      logError('Unexpected session refresh error', {
        feature: 'auth-context',
        action: 'session-refresh-error',
        metadata: { error: String(error) }
      })
      throw error
    }
  }

  const value: AuthContextType = {
    session,
    user,
    loading,
    signOut,
    refreshSession,
    isAuthenticated: !!session && !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }