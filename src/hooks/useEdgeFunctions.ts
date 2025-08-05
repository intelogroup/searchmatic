/**
 * Edge Functions React Hook
 * Provides React integration for edge function calls with state management
 */

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  analyzeLiterature, 
  testConnection, 
  batchAnalyzeLiterature,
  checkEdgeFunctionHealth,
  getAnalysisTypes,
  type AnalysisRequest,
  type AnalysisResponse 
} from '@/services/edgeFunctionService'
import { errorLogger } from '@/lib/error-logger'

/**
 * Hook for testing edge function connectivity
 */
export function useEdgeFunctionTest() {
  return useQuery({
    queryKey: ['edge-functions', 'test'],
    queryFn: testConnection,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for checking edge function health
 */
export function useEdgeFunctionHealth() {
  return useQuery({
    queryKey: ['edge-functions', 'health'],
    queryFn: checkEdgeFunctionHealth,
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false
  })
}

/**
 * Hook for literature analysis
 */
export function useLiteratureAnalysis() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: analyzeLiterature,
    onSuccess: (data, variables) => {
      // Cache the analysis result
      queryClient.setQueryData(
        ['analysis', variables.projectId, variables.analysisType], 
        data
      )
      
      errorLogger.logInfo('Literature analysis completed successfully', {
        feature: 'useLiteratureAnalysis',
        metadata: {
          analysisType: variables.analysisType,
          projectId: variables.projectId
        }
      })
    },
    onError: (error, variables) => {
      errorLogger.logError((error as Error).message, {
        feature: 'useLiteratureAnalysis',
        metadata: {
          analysisType: variables.analysisType,
          projectId: variables.projectId
        }
      })
    }
  })
}

/**
 * Hook for batch literature analysis with progress tracking
 */
export function useBatchLiteratureAnalysis() {
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: async (params: {
      articles: Array<{ id: string; text: string }>
      analysisType: AnalysisRequest['analysisType']
      projectId: string
    }) => {
      setProgress({ completed: 0, total: params.articles.length })
      
      const results = await batchAnalyzeLiterature(
        params.articles,
        params.analysisType,
        params.projectId,
        (completed, total) => {
          setProgress({ completed, total })
        }
      )
      
      return results
    },
    onSuccess: (data, variables) => {
      // Cache successful analyses
      data.forEach(result => {
        if (result.analysis) {
          queryClient.setQueryData(
            ['analysis', variables.projectId, result.id], 
            result.analysis
          )
        }
      })
      
      errorLogger.logInfo('Batch analysis completed', {
        feature: 'useBatchLiteratureAnalysis',
        metadata: {
          total: data.length,
          successful: data.filter(r => r.analysis).length,
          failed: data.filter(r => r.error).length
        }
      })
    },
    onError: (error) => {
      errorLogger.logError((error as Error).message, { feature: 'useBatchLiteratureAnalysis' })
    }
  })
  
  return {
    ...mutation,
    progress,
    isAnalyzing: mutation.isPending
  }
}

/**
 * Hook for getting cached analysis results
 */
export function useAnalysisResults(projectId: string, analysisType?: string) {
  return useQuery({
    queryKey: ['analysis', projectId, analysisType],
    queryFn: () => null, // This hook only returns cached data
    enabled: false,
    staleTime: Infinity
  })
}

/**
 * Hook for managing analysis workflows
 */
export function useAnalysisWorkflow(projectId: string) {
  const [currentStep, setCurrentStep] = useState<'idle' | 'analyzing' | 'completed' | 'error'>('idle')
  const [analysisResults, setAnalysisResults] = useState<Record<string, AnalysisResponse>>({})
  
  const analysisMutation = useLiteratureAnalysis()
  const batchMutation = useBatchLiteratureAnalysis()
  
  const analyzeText = useCallback(async (
    text: string, 
    analysisType: AnalysisRequest['analysisType'],
    extractionTemplate?: any
  ) => {
    try {
      setCurrentStep('analyzing')
      
      const result = await analysisMutation.mutateAsync({
        articleText: text,
        analysisType,
        projectId,
        extractionTemplate
      })
      
      setAnalysisResults(prev => ({
        ...prev,
        [analysisType]: result
      }))
      
      setCurrentStep('completed')
      return result
    } catch (error) {
      setCurrentStep('error')
      throw error
    }
  }, [projectId, analysisMutation])
  
  const analyzeBatch = useCallback(async (
    articles: Array<{ id: string; text: string }>,
    analysisType: AnalysisRequest['analysisType']
  ) => {
    try {
      setCurrentStep('analyzing')
      
      const results = await batchMutation.mutateAsync({
        articles,
        analysisType,
        projectId
      })
      
      // Store successful results
      results.forEach(result => {
        if (result.analysis) {
          setAnalysisResults(prev => ({
            ...prev,
            [`${result.id}_${analysisType}`]: result.analysis!
          }))
        }
      })
      
      setCurrentStep('completed')
      return results
    } catch (error) {
      setCurrentStep('error')
      throw error
    }
  }, [projectId, batchMutation])
  
  const resetWorkflow = useCallback(() => {
    setCurrentStep('idle')
    setAnalysisResults({})
  }, [])
  
  return {
    currentStep,
    analysisResults,
    analyzeText,
    analyzeBatch,
    resetWorkflow,
    progress: batchMutation.progress,
    isAnalyzing: currentStep === 'analyzing'
  }
}

/**
 * Utility hook for analysis types
 */
export function useAnalysisTypes() {
  return getAnalysisTypes()
}