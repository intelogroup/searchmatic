import { baseSupabaseClient as supabase } from '@/lib/supabase'
import { protocolAIService } from './protocolAIService'
import { protocolParsingService } from './protocolParsingService'
import type { Database } from '@/types/database'
import { BaseService } from '@/lib/service-wrapper'
import { ensureAuthenticated, type AuthenticatedUser } from '@/lib/auth-utils'

type Protocol = Database['public']['Tables']['protocols']['Row']
type ProtocolInsert = Database['public']['Tables']['protocols']['Insert']
type ProtocolUpdate = Database['public']['Tables']['protocols']['Update']

export interface CreateProtocolData {
  project_id: string
  title: string
  description?: string
  research_question: string
  framework_type: 'pico' | 'spider' | 'other'
}

// Re-export types from parsing service for backward compatibility
export type { 
  ProtocolFramework, 
  ProtocolSearchStrategy 
} from './protocolParsingService'

export type { AIGuidanceRequest } from './protocolAIService'

class ProtocolService extends BaseService {
  constructor() {
    super('protocol')
  }
  // Protocol CRUD operations
  async createProtocol(data: CreateProtocolData): Promise<Protocol> {
    return this.executeAuthenticatedSupabase(
      'create-protocol',
      async (user: AuthenticatedUser) => {
        const protocolData: ProtocolInsert = {
          project_id: data.project_id,
          user_id: user.id,
          title: data.title,
          description: data.description,
          research_question: data.research_question,
          framework_type: data.framework_type,
          inclusion_criteria: [],
          exclusion_criteria: [],
          search_strategy: {},
          databases: [],
          keywords: [],
          study_types: [],
          status: 'draft',
          is_locked: false,
          version: 1,
          ai_generated: false
        }

        return supabase
          .from('protocols')
          .insert([protocolData])
          .select()
          .single()
      },
      'protocols',
      { data }
    )
  }

  async getProtocols(projectId: string): Promise<Protocol[]> {
    return this.executeAuthenticatedSupabase(
      'get-protocols',
      async (user: AuthenticatedUser) => {
        return supabase
          .from('protocols')
          .select('*')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
      },
      'protocols',
      { projectId }
    ).then(data => data || [])
  }

  async getProtocol(id: string): Promise<Protocol | null> {
    return this.executeAuthenticated(
      'get-protocol',
      async (user: AuthenticatedUser) => {
        const { data: protocol, error } = await supabase
          .from('protocols')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (error) {
          if (error.code === 'PGRST116') return null // Not found
          throw error
        }
        
        return protocol
      },
      { id }
    )
  }

  async updateProtocol(id: string, updates: ProtocolUpdate): Promise<Protocol> {
    return this.executeAuthenticatedSupabase(
      'update-protocol',
      async (user: AuthenticatedUser) => {
        // Check if protocol is locked
        const existingProtocol = await this.getProtocol(id)
        if (existingProtocol?.is_locked) {
          throw new Error('Cannot update locked protocol')
        }

        const updateData: ProtocolUpdate = {
          ...updates,
          updated_at: new Date().toISOString()
        }

        // Increment version if significant changes
        if (protocolParsingService.isSignificantUpdate(updates)) {
          updateData.version = (existingProtocol?.version || 1) + 1
        }

        return supabase
          .from('protocols')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single()
      },
      'protocols',
      { id, updates }
    )
  }

  async deleteProtocol(id: string): Promise<void> {
    await this.executeAuthenticated(
      'delete-protocol',
      async (user: AuthenticatedUser) => {
        // Check if protocol is locked
        const existingProtocol = await this.getProtocol(id)
        if (existingProtocol?.is_locked) {
          throw new Error('Cannot delete locked protocol')
        }

        const { error } = await supabase
          .from('protocols')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)

        if (error) throw error
      },
      { id }
    )
  }

  async lockProtocol(id: string): Promise<Protocol> {
    return this.executeAuthenticatedSupabase(
      'lock-protocol',
      async (user: AuthenticatedUser) => {
        return supabase
          .from('protocols')
          .update({
            is_locked: true,
            locked_at: new Date().toISOString(),
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single()
      },
      'protocols',
      { id }
    )
  }

  async unlockProtocol(id: string): Promise<Protocol> {
    return this.executeAuthenticatedSupabase(
      'unlock-protocol',
      async (user: AuthenticatedUser) => {
        return supabase
          .from('protocols')
          .update({
            is_locked: false,
            locked_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single()
      },
      'protocols',
      { id }
    )
  }

  // AI-Related Methods (delegated to protocolAIService)
  async getAIGuidance(request: import('./protocolAIService').AIGuidanceRequest): Promise<string> {
    return protocolAIService.getAIGuidance(request)
  }

  async generateProtocolFromAI(
    projectId: string,
    researchQuestion: string,
    frameworkType: 'pico' | 'spider' | 'other' = 'pico'
  ): Promise<Protocol> {
    return this.executeAuthenticatedSupabase(
      'generate-protocol-from-ai',
      async (user: AuthenticatedUser) => {
        // Get AI guidance for initial protocol
        const { components: protocolComponents, aiGuidance } = await protocolAIService.generateProtocolComponents(
          researchQuestion,
          frameworkType
        )

        // Create protocol with AI-generated content
        const protocolData: ProtocolInsert = {
          project_id: projectId,
          user_id: user.id,
          title: `AI-Generated Protocol: ${researchQuestion.substring(0, 50)}...`,
          description: 'This protocol was generated with AI assistance based on the research question.',
          research_question: researchQuestion,
          framework_type: frameworkType,
          ...protocolComponents,
          inclusion_criteria: protocolComponents.inclusion_criteria || [],
          exclusion_criteria: protocolComponents.exclusion_criteria || [],
          search_strategy: protocolComponents.search_strategy || {},
          databases: protocolComponents.databases || [],
          keywords: protocolComponents.keywords || [],
          study_types: protocolComponents.study_types || [],
          status: 'draft',
          is_locked: false,
          version: 1,
          ai_generated: true,
          ai_guidance_used: protocolAIService.createAIGuidanceMetadata(aiGuidance, frameworkType)
        }

        return supabase
          .from('protocols')
          .insert([protocolData])
          .select()
          .single()
      },
      'protocols',
      { projectId, researchQuestion, frameworkType }
    )
  }

  async refineProtocolWithAI(
    protocolId: string,
    focusArea: 'framework' | 'inclusion' | 'exclusion' | 'search_strategy',
    additionalContext?: string
  ): Promise<Protocol> {
    return this.execute(
      'refine-protocol-with-ai',
      async () => {
        const existingProtocol = await this.getProtocol(protocolId)
        if (!existingProtocol) throw new Error('Protocol not found')

        const { updates: refinements, aiGuidance } = await protocolAIService.generateRefinements(
          existingProtocol,
          focusArea,
          additionalContext
        )

        // Update protocol with refinements
        const updatedProtocol = await this.updateProtocol(protocolId, {
          ...refinements,
          ai_guidance_used: protocolAIService.mergeAIGuidanceMetadata(
            existingProtocol.ai_guidance_used,
            protocolAIService.createAIGuidanceMetadata(aiGuidance, existingProtocol.framework_type, focusArea, additionalContext)
          )
        })

        return updatedProtocol
      },
      { protocolId, focusArea, additionalContext }
    )
  }

  // Helper methods (delegated to parsing service)
  private isSignificantUpdate(updates: ProtocolUpdate): boolean {
    return protocolParsingService.isSignificantUpdate(updates)
  }

  // Bulk operations
  async duplicateProtocol(id: string, newTitle?: string): Promise<Protocol> {
    return this.executeAuthenticatedSupabase(
      'duplicate-protocol',
      async (user: AuthenticatedUser) => {
        const existingProtocol = await this.getProtocol(id)
        if (!existingProtocol) throw new Error('Protocol not found')

        const duplicateData: ProtocolInsert = {
          ...existingProtocol,
          id: undefined,
          title: newTitle || `Copy of ${existingProtocol.title}`,
          is_locked: false,
          locked_at: null,
          version: 1,
          created_at: undefined,
          updated_at: undefined
        }

        return supabase
          .from('protocols')
          .insert([duplicateData])
          .select()
          .single()
      },
      'protocols',
      { id, newTitle }
    )
  }

  async getProtocolHistory(id: string): Promise<Protocol[]> {
    return this.executeAuthenticated(
      'get-protocol-history',
      async (user: AuthenticatedUser) => {
        // This would require a separate protocol_versions table in a real implementation
        // For now, just return the current protocol
        const protocol = await this.getProtocol(id)
        return protocol ? [protocol] : []
      },
      { id }
    )
  }
}

export const protocolService = new ProtocolService()