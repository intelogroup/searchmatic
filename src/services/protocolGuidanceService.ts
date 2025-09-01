/**
 * Protocol Guidance Service
 * Integrates with the protocol-guidance edge function for AI-powered protocol assistance
 */

import { supabase, baseSupabaseClient } from '@/lib/supabase'
import { BaseService } from '@/lib/service-wrapper'

export interface ProtocolGuidanceRequest {
  projectId?: string
  type: 'create' | 'validate' | 'improve' | 'framework'
  researchQuestion: string
  currentProtocol?: Record<string, any>
  focusArea?: 'pico' | 'spider' | 'inclusion' | 'exclusion' | 'search_strategy' | 'data_extraction' | 'quality_assessment'
  reviewType?: 'systematic_review' | 'meta_analysis' | 'scoping_review' | 'narrative_review' | 'umbrella_review'
}

export interface ProtocolGuidanceResponse {
  success: boolean
  guidance: any
  type: string
  focusArea?: string
  reviewType: string
  timestamp: string
  protocol?: any
  framework?: any
  validation?: any
  improvements?: any
}

export interface ProtocolFramework {
  type: 'pico' | 'spider' | 'other'
  elements: Record<string, {
    definition: string
    examples: string[]
    searchTerms: string[]
  }>
  inclusionCriteria: string[]
  exclusionCriteria: string[]
  searchStrategy?: {
    databases: string[]
    keywords: string[]
    syntax: string
  }
}

class ProtocolGuidanceService extends BaseService {
  constructor() {
    super('protocol-guidance-service')
  }

  /**
   * Create a new research protocol with AI assistance
   */
  async createProtocol(
    researchQuestion: string,
    reviewType: string = 'systematic_review',
    focusArea?: string,
    projectId?: string
  ): Promise<ProtocolGuidanceResponse> {
    return this.execute(
      'create-protocol',
      async () => {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          throw new Error('Authentication required')
        }

        const request: ProtocolGuidanceRequest = {
          type: 'create',
          researchQuestion,
          reviewType: reviewType as any,
          focusArea: focusArea as any,
          projectId
        }

        const { data, error } = await baseSupabaseClient.functions.invoke('protocol-guidance', {
          body: request,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        })

        if (error) throw error

        if (!data.success) {
          const errorMsg = data.error || 'Protocol creation failed'
          throw new Error(errorMsg)
        }

        return data
      },
      {
        researchQuestion: researchQuestion.substring(0, 100),
        reviewType,
        focusArea,
        hasProjectId: !!projectId
      }
    )
  }

  /**
   * Validate an existing protocol
   */
  async validateProtocol(
    currentProtocol: Record<string, any>,
    researchQuestion: string,
    reviewType: string = 'systematic_review',
    projectId?: string
  ): Promise<ProtocolGuidanceResponse> {
    return this.execute(
      'validate-protocol',
      async () => {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          throw new Error('Authentication required')
        }

        const request: ProtocolGuidanceRequest = {
          type: 'validate',
          researchQuestion,
          currentProtocol,
          reviewType: reviewType as any,
          projectId
        }

        const { data, error } = await baseSupabaseClient.functions.invoke('protocol-guidance', {
          body: request,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        })

        if (error) throw error

        if (!data.success) {
          const errorMsg = data.error || 'Protocol validation failed'
          throw new Error(errorMsg)
        }

        return data
      },
      {
        researchQuestion: researchQuestion.substring(0, 100),
        reviewType,
        protocolSize: JSON.stringify(currentProtocol).length,
        hasProjectId: !!projectId
      }
    )
  }

  /**
   * Improve an existing protocol
   */
  async improveProtocol(
    currentProtocol: Record<string, any>,
    researchQuestion: string,
    reviewType: string = 'systematic_review',
    focusArea?: string,
    projectId?: string
  ): Promise<ProtocolGuidanceResponse> {
    return this.execute(
      'improve-protocol',
      async () => {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          throw new Error('Authentication required')
        }

        const request: ProtocolGuidanceRequest = {
          type: 'improve',
          researchQuestion,
          currentProtocol,
          reviewType: reviewType as any,
          focusArea: focusArea as any,
          projectId
        }

        const { data, error } = await baseSupabaseClient.functions.invoke('protocol-guidance', {
          body: request,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        })

        if (error) throw error

        if (!data.success) {
          const errorMsg = data.error || 'Protocol improvement failed'
          throw new Error(errorMsg)
        }

        return data
      },
      {
        researchQuestion: researchQuestion.substring(0, 100),
        reviewType,
        focusArea,
        protocolSize: JSON.stringify(currentProtocol).length,
        hasProjectId: !!projectId
      }
    )
  }

  /**
   * Generate a specific framework (PICO/SPIDER)
   */
  async generateFramework(
    researchQuestion: string,
    focusArea: 'pico' | 'spider' | 'search_strategy' | 'data_extraction' | 'quality_assessment' = 'pico',
    reviewType: string = 'systematic_review',
    projectId?: string
  ): Promise<ProtocolGuidanceResponse> {
    return this.execute(
      'generate-framework',
      async () => {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          throw new Error('Authentication required')
        }

        const request: ProtocolGuidanceRequest = {
          type: 'framework',
          researchQuestion,
          focusArea,
          reviewType: reviewType as any,
          projectId
        }

        const { data, error } = await baseSupabaseClient.functions.invoke('protocol-guidance', {
          body: request,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        })

        if (error) throw error

        if (!data.success) {
          const errorMsg = data.error || 'Framework generation failed'
          throw new Error(errorMsg)
        }

        return data
      },
      {
        researchQuestion: researchQuestion.substring(0, 100),
        reviewType,
        focusArea,
        hasProjectId: !!projectId
      }
    )
  }

  /**
   * Save protocol to database
   */
  async saveProtocol(
    projectId: string,
    protocolData: Record<string, any>,
    aiGuidance?: string
  ): Promise<void> {
    return this.execute(
      'save-protocol',
      async () => {
        const { error } = await supabase
          .from('protocols')
          .upsert({
            project_id: projectId,
            protocol_data: protocolData,
            ai_guidance_used: aiGuidance || null,
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'project_id'
          })

        if (error) throw error
      },
      {
        projectId,
        protocolSize: JSON.stringify(protocolData).length,
        hasAiGuidance: !!aiGuidance
      }
    )
  }

  /**
   * Get protocol for project
   */
  async getProtocol(projectId: string): Promise<{
    id: string
    project_id: string
    protocol_data: Record<string, any>
    ai_guidance_used: string | null
    last_updated: string
    created_at: string
  } | null> {
    return this.execute(
      'get-protocol',
      async () => {
        const { data, error } = await supabase
          .from('protocols')
          .select('*')
          .eq('project_id', projectId)
          .single()

        if (error) {
          if (error.code === 'PGRST116') return null // Not found
          throw error
        }

        return data
      },
      { projectId }
    )
  }

  /**
   * Get available review types with descriptions
   */
  getReviewTypes(): Array<{
    value: string
    label: string
    description: string
  }> {
    return [
      {
        value: 'systematic_review',
        label: 'Systematic Review',
        description: 'Comprehensive review following PRISMA guidelines with structured methodology'
      },
      {
        value: 'meta_analysis',
        label: 'Meta-Analysis',
        description: 'Quantitative synthesis combining results from multiple studies'
      },
      {
        value: 'scoping_review',
        label: 'Scoping Review',
        description: 'Exploratory review to map research in a broader topic area'
      },
      {
        value: 'narrative_review',
        label: 'Narrative Review',
        description: 'Qualitative synthesis providing comprehensive overview of a topic'
      },
      {
        value: 'umbrella_review',
        label: 'Umbrella Review',
        description: 'Review of existing systematic reviews and meta-analyses'
      }
    ]
  }

  /**
   * Get available focus areas with descriptions
   */
  getFocusAreas(): Array<{
    value: string
    label: string
    description: string
  }> {
    return [
      {
        value: 'pico',
        label: 'PICO Framework',
        description: 'Population, Intervention, Comparison, Outcome framework for clinical questions'
      },
      {
        value: 'spider',
        label: 'SPIDER Framework',
        description: 'Sample, Phenomenon, Design, Evaluation, Research type for qualitative research'
      },
      {
        value: 'inclusion',
        label: 'Inclusion Criteria',
        description: 'Define specific criteria for including studies in the review'
      },
      {
        value: 'exclusion',
        label: 'Exclusion Criteria',
        description: 'Define specific criteria for excluding studies from the review'
      },
      {
        value: 'search_strategy',
        label: 'Search Strategy',
        description: 'Develop comprehensive search terms and database strategy'
      },
      {
        value: 'data_extraction',
        label: 'Data Extraction',
        description: 'Design systematic approach for extracting data from studies'
      },
      {
        value: 'quality_assessment',
        label: 'Quality Assessment',
        description: 'Select appropriate tools for evaluating study quality and bias risk'
      }
    ]
  }
}

// Create service instance
const protocolGuidanceService = new ProtocolGuidanceService()

// Export individual methods for convenience
export const createProtocol = (
  researchQuestion: string,
  reviewType?: string,
  focusArea?: string,
  projectId?: string
) => protocolGuidanceService.createProtocol(researchQuestion, reviewType, focusArea, projectId)

export const validateProtocol = (
  currentProtocol: Record<string, any>,
  researchQuestion: string,
  reviewType?: string,
  projectId?: string
) => protocolGuidanceService.validateProtocol(currentProtocol, researchQuestion, reviewType, projectId)

export const improveProtocol = (
  currentProtocol: Record<string, any>,
  researchQuestion: string,
  reviewType?: string,
  focusArea?: string,
  projectId?: string
) => protocolGuidanceService.improveProtocol(currentProtocol, researchQuestion, reviewType, focusArea, projectId)

export const generateFramework = (
  researchQuestion: string,
  focusArea?: 'pico' | 'spider' | 'search_strategy' | 'data_extraction' | 'quality_assessment',
  reviewType?: string,
  projectId?: string
) => protocolGuidanceService.generateFramework(researchQuestion, focusArea, reviewType, projectId)

export const saveProtocol = (
  projectId: string,
  protocolData: Record<string, any>,
  aiGuidance?: string
) => protocolGuidanceService.saveProtocol(projectId, protocolData, aiGuidance)

export const getProtocol = (projectId: string) => protocolGuidanceService.getProtocol(projectId)

export const getReviewTypes = () => protocolGuidanceService.getReviewTypes()
export const getFocusAreas = () => protocolGuidanceService.getFocusAreas()

export default protocolGuidanceService