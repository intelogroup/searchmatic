import { baseSupabaseClient as supabase } from '@/lib/supabase'
import { openAIService } from './openai'
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

export interface ProtocolFramework {
  // PICO Framework
  population?: string
  intervention?: string
  comparison?: string
  outcome?: string
  
  // SPIDER Framework  
  sample?: string
  phenomenon?: string
  design?: string
  evaluation?: string
  research_type?: string
}

export interface ProtocolSearchStrategy {
  keywords: string[]
  databases: string[]
  searchTerms: Record<string, string[]>
  booleanOperators: string[]
  filters: {
    dateRange?: { start: string; end: string }
    studyTypes?: string[]
    languages?: string[]
    publicationTypes?: string[]
  }
}

export interface AIGuidanceRequest {
  research_question: string
  current_protocol?: Partial<Protocol>
  focus_area?: 'framework' | 'inclusion' | 'exclusion' | 'search_strategy' | 'general'
  additional_context?: string
}

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
        if (this.isSignificantUpdate(updates)) {
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

  // AI-Guided Protocol Creation
  async getAIGuidance(request: AIGuidanceRequest): Promise<string> {
    return this.execute(
      'get-ai-guidance',
      async () => {
        const focusAreaMap: Record<string, 'pico' | 'spider' | 'inclusion' | 'exclusion' | 'search_strategy'> = {
          'framework': 'pico',
          'inclusion': 'inclusion',
          'exclusion': 'exclusion', 
          'search_strategy': 'search_strategy',
          'general': 'pico'
        }

        const response = await openAIService.getProtocolGuidance(
          request.research_question,
          request.current_protocol as Protocol | undefined,
          { focusArea: focusAreaMap[request.focus_area || 'general'] }
        )

        return response.content
      },
      { request }
    )
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
        const aiGuidance = await this.getAIGuidance({
          research_question: researchQuestion,
          focus_area: 'general'
        })

        // Parse AI response to extract protocol components
        const protocolComponents = await this.parseAIGuidance(aiGuidance, frameworkType)

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
          ai_guidance_used: {
            timestamp: new Date().toISOString(),
            guidance: aiGuidance,
            framework_type: frameworkType
          }
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
    try {
      const existingProtocol = await this.getProtocol(protocolId)
      if (!existingProtocol) throw new Error('Protocol not found')

      if (existingProtocol.is_locked) {
        throw new Error('Cannot modify locked protocol')
      }

      // Get AI guidance for refinement
      const aiGuidance = await this.getAIGuidance({
        research_question: existingProtocol.research_question,
        current_protocol: existingProtocol,
        focus_area: focusArea,
        additional_context: additionalContext
      })

      // Parse AI response and update relevant sections
      const refinements = await this.parseAIRefinements(aiGuidance, focusArea, existingProtocol)

      // Update protocol with refinements
      const updatedProtocol = await this.updateProtocol(protocolId, {
        ...refinements,
        ai_guidance_used: {
          ...((existingProtocol.ai_guidance_used as { [key: string]: any }) || {}),
          [focusArea]: {
            timestamp: new Date().toISOString(),
            guidance: aiGuidance,
            additional_context: additionalContext
          }
        }
      })

      return updatedProtocol
    } catch (error) {
      errorLogger.logError((error as Error).message, {
        action: 'Refine Protocol With AI',
        metadata: { protocolId, focusArea, additionalContext }
      })
      throw error
    }
  }

  // Helper methods
  private isSignificantUpdate(updates: ProtocolUpdate): boolean {
    const significantFields = [
      'research_question',
      'framework_type',
      'inclusion_criteria',
      'exclusion_criteria',
      'search_strategy'
    ]
    
    return significantFields.some(field => updates[field as keyof ProtocolUpdate] !== undefined)
  }

  private async parseAIGuidance(guidance: string, frameworkType: 'pico' | 'spider' | 'other'): Promise<Partial<ProtocolInsert>> {
    // This is a simplified parser - in a real implementation, you might use more sophisticated NLP
    // or prompt the AI to return structured JSON
    
    try {
      // Try to extract structured information from the AI guidance
      const components: Partial<ProtocolInsert> = {}

      if (frameworkType === 'pico') {
        // Extract PICO components using regex or keywords
        const populationMatch = guidance.match(/Population[:\-\s]*(.*?)(?=\n|Intervention|$)/i)
        const interventionMatch = guidance.match(/Intervention[:\-\s]*(.*?)(?=\n|Comparison|$)/i)
        const comparisonMatch = guidance.match(/Comparison[:\-\s]*(.*?)(?=\n|Outcome|$)/i)
        const outcomeMatch = guidance.match(/Outcome[:\-\s]*(.*?)(?=\n|$)/i)

        if (populationMatch) components.population = populationMatch[1].trim()
        if (interventionMatch) components.intervention = interventionMatch[1].trim()
        if (comparisonMatch) components.comparison = comparisonMatch[1].trim()
        if (outcomeMatch) components.outcome = outcomeMatch[1].trim()
      }

      // Extract inclusion/exclusion criteria
      const inclusionMatch = guidance.match(/Inclusion Criteria[:-\s]*([\s\S]*?)(?=Exclusion Criteria|Search Strategy|$)/i)
      const exclusionMatch = guidance.match(/Exclusion Criteria[:-\s]*([\s\S]*?)(?=Search Strategy|$)/i)

      if (inclusionMatch) {
        components.inclusion_criteria = inclusionMatch[1]
          .split(/\n|\*|-/)
          .map(item => item.trim())
          .filter(item => item.length > 0)
      }

      if (exclusionMatch) {
        components.exclusion_criteria = exclusionMatch[1]
          .split(/\n|\*|-/)
          .map(item => item.trim())
          .filter(item => item.length > 0)
      }

      // Extract keywords
      const keywordsMatch = guidance.match(/Keywords?[:\-\s]*(.*?)(?=\n|Database|$)/i)
      if (keywordsMatch) {
        components.keywords = keywordsMatch[1]
          .split(/,|;|\n/)
          .map(keyword => keyword.trim())
          .filter(keyword => keyword.length > 0)
      }

      // Extract databases
      const databasesMatch = guidance.match(/Databases?[:\-\s]*(.*?)(?=\n|$)/i)
      if (databasesMatch) {
        components.databases = databasesMatch[1]
          .split(/,|;|\n/)
          .map(db => db.trim())
          .filter(db => db.length > 0)
      }

      return components
    } catch (error) {
      // Use this.execute for consistent error handling
      throw error
    }
  }

  private async parseAIRefinements(
    guidance: string,
    focusArea: string,
    existingProtocol: Protocol
  ): Promise<Partial<ProtocolUpdate>> {
    // Parse refinements based on focus area
    const updates: Partial<ProtocolUpdate> = {}

    try {
      switch (focusArea) {
        case 'inclusion': {
          const inclusionMatch = guidance.match(/(?:Inclusion|Include)[:-\s]*([\s\S]*?)(?=Exclusion|$)/i)
          if (inclusionMatch) {
            updates.inclusion_criteria = inclusionMatch[1]
              .split(/\n|\*|-/)
              .map(item => item.trim())
              .filter(item => item.length > 0)
          }
          break
        }

        case 'exclusion': {
          const exclusionMatch = guidance.match(/(?:Exclusion|Exclude)[:-\s]*([\s\S]*?)$/i)
          if (exclusionMatch) {
            updates.exclusion_criteria = exclusionMatch[1]
              .split(/\n|\*|-/)
              .map(item => item.trim())
              .filter(item => item.length > 0)
          }
          break
        }

        case 'search_strategy': {
          // Extract search strategy components
          const strategy = { ...((existingProtocol.search_strategy as { [key: string]: any }) || {}) }
          
          const keywordsMatch = guidance.match(/Keywords?[:-\s]*(.*?)(?=\n|Database|$)/i)
          if (keywordsMatch) {
            updates.keywords = keywordsMatch[1]
              .split(/,|;/)
              .map(keyword => keyword.trim())
              .filter(keyword => keyword.length > 0)
          }

          const databasesMatch = guidance.match(/Databases?[:-\s]*(.*?)(?=\n|$)/i)
          if (databasesMatch) {
            updates.databases = databasesMatch[1]
              .split(/,|;/)
              .map(db => db.trim())
              .filter(db => db.length > 0)
          }

          updates.search_strategy = strategy
          break
        }

        case 'framework': {
          // Update framework-specific fields based on protocol type
          if (existingProtocol.framework_type === 'pico') {
            const populationMatch = guidance.match(/Population[:-\s]*(.*?)(?=\n|Intervention|$)/i)
            const interventionMatch = guidance.match(/Intervention[:-\s]*(.*?)(?=\n|Comparison|$)/i)
            const comparisonMatch = guidance.match(/Comparison[:-\s]*(.*?)(?=\n|Outcome|$)/i)
            const outcomeMatch = guidance.match(/Outcome[:-\s]*(.*?)(?=\n|$)/i)

            if (populationMatch) updates.population = populationMatch[1].trim()
            if (interventionMatch) updates.intervention = interventionMatch[1].trim()
            if (comparisonMatch) updates.comparison = comparisonMatch[1].trim()
            if (outcomeMatch) updates.outcome = outcomeMatch[1].trim()
          }
          break
        }
      }
    } catch (error) {
      // Use this.execute for consistent error handling
      throw error
    }

    return updates
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