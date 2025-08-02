/**
 * React hooks for error handling and monitoring
 * Integrates with our comprehensive error logging system
 */

import { useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { errorLogger, type ErrorContext } from '@/lib/error-logger'

/**
 * Hook for handling errors in React components
 */
export function useErrorHandler() {
  const queryClient = useQueryClient()

  const handleError = useCallback((error: unknown, context?: Partial<ErrorContext>) => {
    let errorMessage = 'An unexpected error occurred'
    
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    errorLogger.logError(errorMessage, {
      stack: error instanceof Error ? error.stack : new Error().stack,
      ...context,
    })
  }, [])

  const handleSupabaseError = useCallback((operation: string, error: unknown, context?: Partial<ErrorContext>) => {
    errorLogger.logSupabaseError(operation, error, context)
  }, [])

  const handleReactQueryError = useCallback((queryKey: string[], error: unknown, context?: Partial<ErrorContext>) => {
    errorLogger.logReactQueryError(queryKey, error, context)
  }, [])

  const clearErrorBoundary = useCallback(() => {
    // Reset React Query error boundary
    queryClient.resetQueries()
  }, [queryClient])

  return {
    handleError,
    handleSupabaseError,
    handleReactQueryError,
    clearErrorBoundary,
  }
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitor() {
  const startTime = useCallback(() => {
    return performance.now()
  }, [])

  const endTime = useCallback((startTime: number, operation: string, context?: Partial<ErrorContext>) => {
    const duration = performance.now() - startTime
    errorLogger.logPerformance(operation, duration, context)
    return duration
  }, [])

  const measureAsync = useCallback(async <T>(
    operation: string,
    asyncFn: () => Promise<T>,
    context?: Partial<ErrorContext>
  ): Promise<T> => {
    const start = performance.now()
    try {
      const result = await asyncFn()
      const duration = performance.now() - start
      errorLogger.logPerformance(operation, duration, context)
      return result
    } catch (error) {
      const duration = performance.now() - start
      errorLogger.logPerformance(`${operation} (failed)`, duration, {
        ...context,
        metadata: { ...context?.metadata, error: true },
      })
      throw error
    }
  }, [])

  return {
    startTime,
    endTime,
    measureAsync,
  }
}

/**
 * Hook for debugging React components
 */
export function useDebugLogger(componentName: string) {
  const logRender = useCallback((props?: Record<string, unknown>) => {
    errorLogger.logDebug(`${componentName} rendered`, {
      feature: 'react-debug',
      action: 'render',
      metadata: { componentName, props },
    })
  }, [componentName])

  const logMount = useCallback(() => {
    errorLogger.logDebug(`${componentName} mounted`, {
      feature: 'react-debug',
      action: 'mount',
      metadata: { componentName },
    })
  }, [componentName])

  const logUnmount = useCallback(() => {
    errorLogger.logDebug(`${componentName} unmounted`, {
      feature: 'react-debug',
      action: 'unmount',
      metadata: { componentName },
    })
  }, [componentName])

  const logStateChange = useCallback((stateName: string, oldValue: unknown, newValue: unknown) => {
    errorLogger.logDebug(`${componentName} state changed: ${stateName}`, {
      feature: 'react-debug',
      action: 'state-change',
      metadata: { componentName, stateName, oldValue, newValue },
    })
  }, [componentName])

  const logEffect = useCallback((effectName: string, dependencies?: unknown[]) => {
    errorLogger.logDebug(`${componentName} effect triggered: ${effectName}`, {
      feature: 'react-debug',
      action: 'effect',
      metadata: { componentName, effectName, dependencies },
    })
  }, [componentName])

  useEffect(() => {
    logMount()
    return () => logUnmount()
  }, [logMount, logUnmount])

  return {
    logRender,
    logMount,
    logUnmount,
    logStateChange,
    logEffect,
  }
}

/**
 * Hook for user interaction tracking
 */
export function useUserInteractionLogger() {
  const logClick = useCallback((elementId: string, context?: Partial<ErrorContext>) => {
    errorLogger.logInfo(`User clicked: ${elementId}`, {
      feature: 'user-interaction',
      action: 'click',
      metadata: { elementId },
      ...context,
    })
  }, [])

  const logNavigation = useCallback((from: string, to: string, context?: Partial<ErrorContext>) => {
    errorLogger.logInfo(`User navigated from ${from} to ${to}`, {
      feature: 'user-interaction',
      action: 'navigation',
      metadata: { from, to },
      ...context,
    })
  }, [])

  const logFormSubmission = useCallback((formName: string, success: boolean, context?: Partial<ErrorContext>) => {
    errorLogger.logInfo(`Form ${formName} ${success ? 'submitted successfully' : 'failed to submit'}`, {
      feature: 'user-interaction',
      action: 'form-submission',
      metadata: { formName, success },
      ...context,
    })
  }, [])

  const logSearch = useCallback((query: string, resultsCount: number, context?: Partial<ErrorContext>) => {
    errorLogger.logInfo(`User searched for: "${query}" (${resultsCount} results)`, {
      feature: 'user-interaction',
      action: 'search',
      metadata: { query, resultsCount },
      ...context,
    })
  }, [])

  return {
    logClick,
    logNavigation,
    logFormSubmission,
    logSearch,
  }
}

/**
 * Hook for A/B testing and feature flag logging
 */
export function useFeatureLogger() {
  const logFeatureUsage = useCallback((featureName: string, action: string, context?: Partial<ErrorContext>) => {
    errorLogger.logInfo(`Feature ${featureName}: ${action}`, {
      feature: 'feature-usage',
      action,
      metadata: { featureName },
      ...context,
    })
  }, [])

  const logExperiment = useCallback((experimentName: string, variant: string, context?: Partial<ErrorContext>) => {
    errorLogger.logInfo(`A/B Test: ${experimentName} - variant ${variant}`, {
      feature: 'ab-testing',
      action: 'experiment-view',
      metadata: { experimentName, variant },
      ...context,
    })
  }, [])

  return {
    logFeatureUsage,
    logExperiment,
  }
}