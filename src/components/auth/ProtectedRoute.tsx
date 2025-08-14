import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoadingScreen } from '@/components/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Show loading state while auth is being determined
  if (loading) {
    return <LoadingScreen message="Authenticating..." />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    )
  }

  // Render protected content
  return <>{children}</>
}

interface PublicOnlyRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ 
  children, 
  redirectTo = '/dashboard' 
}) => {
  const { isAuthenticated, loading } = useAuth()

  // Show loading state while auth is being determined
  if (loading) {
    return <LoadingScreen message="Checking authentication..." />
  }

  // Redirect authenticated users away from public-only pages (like login)
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  // Render public content
  return <>{children}</>
}