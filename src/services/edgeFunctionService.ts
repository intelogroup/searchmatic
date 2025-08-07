/**
 * Edge Function Service
 * Provides frontend integration with deployed Supabase edge functions
 */

import { supabase, baseSupabaseClient } from '@/lib/supabase'
import { errorLogger } from '@/lib/error-logger'
import type { Json } from '@/types/database'

export interface AnalysisRequest {
  articleText: string
  analysisType: 'summary' | 'extraction' | 'quality' | 'bias'
  projectId: string
  extractionTemplate?: Json
}

export interface AnalysisResponse {
  success: boolean
  analysis: string
  analysisType: string
  timestamp: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface EdgeFunctionError {
  error: string
  details?: string
}

/**
 * Call the hello-world edge function for testing connectivity
 */
export async function testConnection(): Promise<{ message: string; timestamp: string; user_id?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Authentication required')
    }

    const { data, error } = await baseSupabaseClient.functions.invoke('hello-world', {
      body: { name: 'Frontend Test' },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      }
    })

    if (error) {
      errorLogger.logError(error.message, { feature: 'testConnection', action: 'hello-world' })
      throw error
    }

    errorLogger.logInfo('Edge function test successful', { feature: 'hello-world', metadata: { data } })

    return data
  } catch (error) {
    errorLogger.logError((error as Error).message, { feature: 'testConnection' })
    throw error
  }
}

/**
 * Analyze literature using AI-powered edge function
 */
export async function analyzeLiterature(request: AnalysisRequest): Promise<AnalysisResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Authentication required')
    }

    // Validate request
    if (!request.articleText || !request.analysisType || !request.projectId) {
      throw new Error('Missing required fields: articleText, analysisType, or projectId')
    }

    errorLogger.logInfo('Starting literature analysis', { 
      feature: 'analyzeLiterature',
      metadata: {
        analysisType: request.analysisType,
        projectId: request.projectId,
        textLength: request.articleText.length
      }
    })

    const { data, error } = await baseSupabaseClient.functions.invoke('analyze-literature', {
      body: request,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      }
    })

    if (error) {
      errorLogger.logError(error.message, { 
        feature: 'analyzeLiterature', 
        action: 'analyze-literature',
        metadata: { request: { ...request, articleText: '[REDACTED]' } } // Don't log full text
      })
      throw error
    }

    if (!data.success) {
      const errorMsg = data.error || 'Analysis failed'
      errorLogger.logError(errorMsg, { 
        feature: 'analyzeLiterature',
        metadata: { response: data }
      })
      throw new Error(errorMsg)
    }

    errorLogger.logInfo('Literature analysis completed', { 
      feature: 'analyzeLiterature',
      metadata: {
        analysisType: request.analysisType,
        projectId: request.projectId,
        usage: data.usage
      }
    })

    return data
  } catch (error) {
    errorLogger.logError((error as Error).message, { 
      feature: 'analyzeLiterature',
      metadata: { request: { ...request, articleText: '[REDACTED]' } }
    })
    throw error
  }
}

/**
 * Batch analyze multiple articles
 */
export async function batchAnalyzeLiterature(
  articles: Array<{ id: string; text: string }>,
  analysisType: AnalysisRequest['analysisType'],
  projectId: string,
  onProgress?: (completed: number, total: number) => void
): Promise<Array<{ id: string; analysis: AnalysisResponse | null; error?: string }>> {
  const results = []
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]
    
    try {
      const analysis = await analyzeLiterature({
        articleText: article.text,
        analysisType,
        projectId
      })
      
      results.push({ id: article.id, analysis })
      
      if (onProgress) {
        onProgress(i + 1, articles.length)
      }
      
      // Rate limiting - wait 1 second between requests
      if (i < articles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (error) {
      errorLogger.logError((error as Error).message, { 
        feature: 'batchAnalyzeLiterature',
        metadata: { articleId: article.id }
      })
      
      results.push({ 
        id: article.id, 
        analysis: null, 
        error: (error as Error).message 
      })
      
      if (onProgress) {
        onProgress(i + 1, articles.length)
      }
    }
  }
  
  return results
}

/**
 * Get available analysis types with descriptions
 */
export function getAnalysisTypes(): Array<{
  value: AnalysisRequest['analysisType']
  label: string
  description: string
}> {
  return [
    {
      value: 'summary',
      label: 'Article Summary',
      description: 'Generate a structured summary with key findings, methodology, and conclusions'
    },
    {
      value: 'extraction',
      label: 'Data Extraction',
      description: 'Extract specific data points according to your extraction template'
    },
    {
      value: 'quality',
      label: 'Quality Assessment',
      description: 'Evaluate methodological quality and study design rigor'
    },
    {
      value: 'bias',
      label: 'Bias Detection',
      description: 'Identify potential sources of bias and methodological concerns'
    }
  ]
}

/**
 * Check if edge functions are available
 */
export async function checkEdgeFunctionHealth(): Promise<{
  available: boolean
  functions: Array<{ name: string; status: 'available' | 'error' }>
}> {
  const functions: Array<{ name: string; status: 'available' | 'error' }> = [
    { name: 'hello-world', status: 'error' },
    { name: 'analyze-literature', status: 'error' }
  ]
  
  try {
    // Test hello-world function
    await testConnection()
    functions[0].status = 'available'
  } catch (error) {
    errorLogger.logError((error as Error).message, { 
      feature: 'checkEdgeFunctionHealth', 
      action: 'hello-world' 
    })
  }
  
  // analyze-literature requires actual content, so we'll assume it's available if hello-world works
  if (functions[0].status === 'available') {
    functions[1].status = 'available'
  }
  
  const available = functions.every(f => f.status === 'available')
  
  return { available, functions }
}