/**
 * Edge Function Service
 * Provides frontend integration with deployed Supabase edge functions
 */

import { supabase, baseSupabaseClient } from '@/lib/supabase'
import type { Json } from '@/types/database'
import { BaseService } from '@/lib/service-wrapper'

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

class EdgeFunctionService extends BaseService {
  constructor() {
    super('edge-function')
  }

  /**
   * Call the hello-world edge function for testing connectivity
   */
  async testConnection(): Promise<{ message: string; timestamp: string; user_id?: string }> {
    return this.execute(
      'test-connection',
      async () => {
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

        if (error) throw error
        return data
      }
    )
  }

  /**
   * Analyze literature using AI-powered edge function
   */
  async analyzeLiterature(request: AnalysisRequest): Promise<AnalysisResponse> {
    return this.execute(
      'analyze-literature',
      async () => {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          throw new Error('Authentication required')
        }

        // Validate request
        if (!request.articleText || !request.analysisType || !request.projectId) {
          throw new Error('Missing required fields: articleText, analysisType, or projectId')
        }

        const { data, error } = await baseSupabaseClient.functions.invoke('analyze-literature', {
          body: request,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        })

        if (error) throw error

        if (!data.success) {
          const errorMsg = data.error || 'Analysis failed'
          throw new Error(errorMsg)
        }

        return data
      },
      {
        analysisType: request.analysisType,
        projectId: request.projectId,
        textLength: request.articleText.length
      }
    )
  }

  /**
   * Batch analyze multiple articles
   */
  async batchAnalyzeLiterature(
    articles: Array<{ id: string; text: string }>,
    analysisType: AnalysisRequest['analysisType'],
    projectId: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<Array<{ id: string; analysis: AnalysisResponse | null; error?: string }>> {
    return this.execute(
      'batch-analyze-literature',
      async () => {
        const results = []
        
        for (let i = 0; i < articles.length; i++) {
          const article = articles[i]
          
          try {
            const analysis = await this.analyzeLiterature({
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
      },
      {
        articleCount: articles.length,
        analysisType,
        projectId
      }
    )
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
  async checkEdgeFunctionHealth(): Promise<{
    available: boolean
    functions: Array<{ name: string; status: 'available' | 'error' }>
  }> {
    return this.execute(
      'check-edge-function-health',
      async () => {
        const functions: Array<{ name: string; status: 'available' | 'error' }> = [
          { name: 'hello-world', status: 'error' },
          { name: 'analyze-literature', status: 'error' }
        ]
        
        try {
          // Test hello-world function
          await this.testConnection()
          functions[0].status = 'available'
        } catch (error) {
          // Error already logged by testConnection
        }
        
        // analyze-literature requires actual content, so we'll assume it's available if hello-world works
        if (functions[0].status === 'available') {
          functions[1].status = 'available'
        }
        
        const available = functions.every(f => f.status === 'available')
        
        return { available, functions }
      }
    )
  }
}

// Create service instance
const edgeFunctionService = new EdgeFunctionService()

// Export individual methods for backward compatibility
export const testConnection = () => edgeFunctionService.testConnection()
export const analyzeLiterature = (request: AnalysisRequest) => edgeFunctionService.analyzeLiterature(request)
export const batchAnalyzeLiterature = (
  articles: Array<{ id: string; text: string }>,
  analysisType: AnalysisRequest['analysisType'],
  projectId: string,
  onProgress?: (completed: number, total: number) => void
) => edgeFunctionService.batchAnalyzeLiterature(articles, analysisType, projectId, onProgress)
export const checkEdgeFunctionHealth = () => edgeFunctionService.checkEdgeFunctionHealth()