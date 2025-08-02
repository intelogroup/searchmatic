/**
 * Enhanced React Error Boundary with comprehensive logging
 * Follows 2025 best practices for error handling and user experience
 */

import React, { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { errorLogger } from '@/lib/error-logger'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  feature?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Log to our error logging system
    errorLogger.logError('React Error Boundary caught error', {
      feature: this.props.feature || 'error-boundary',
      action: 'component-error',
      metadata: {
        errorId,
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
      stack: error.stack,
    })

    // Call optional onError callback
    this.props.onError?.(error, errorInfo)

    this.setState({
      error,
      errorInfo,
      errorId,
    })
  }

  handleRetry = () => {
    errorLogger.logInfo('User clicked retry after error boundary', {
      feature: this.props.feature || 'error-boundary',
      action: 'retry',
      metadata: {
        errorId: this.state.errorId,
      },
    })

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  handleGoHome = () => {
    errorLogger.logInfo('User clicked go home after error boundary', {
      feature: this.props.feature || 'error-boundary',
      action: 'go-home',
      metadata: {
        errorId: this.state.errorId,
      },
    })

    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Something went wrong
              </h1>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>
              
              {this.state.errorId && (
                <div className="bg-gray-100 rounded p-3 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Error ID:</strong> {this.state.errorId}
                  </p>
                </div>
              )}

              {/* Show error details in development */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    Technical Details (Development Only)
                  </summary>
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm font-medium text-red-800 mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    <pre className="text-xs text-red-700 overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-red-800 mb-1">
                          Component Stack:
                        </p>
                        <pre className="text-xs text-red-700 overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={this.handleRetry}
                className="flex-1"
                variant="default"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                If this problem persists, please contact support with the error ID above.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Hook for manually triggering error boundary (useful for testing)
 */
export function useErrorBoundary() {
  const throwError = React.useCallback((error: Error) => {
    throw error
  }, [])

  return { throwError }
}