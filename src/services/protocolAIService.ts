import { openAIService } from './openai'
import { protocolParsingService } from './protocolParsingService'
import { BaseService } from '@/lib/service-wrapper'
import type { Database } from '@/types/database'

type Protocol = Database['public']['Tables']['protocols']['Row']
type ProtocolUpdate = Database['public']['Tables']['protocols']['Update']

export interface AIGuidanceRequest {
  research_question: string
  current_protocol?: Partial<Protocol>
  focus_area?: 'framework' | 'inclusion' | 'exclusion' | 'search_strategy' | 'general'
  additional_context?: string
}

/**
 * Service for AI-assisted protocol creation and refinement
 * Handles all AI interactions for protocol development
 */
export class ProtocolAIService extends BaseService {
  constructor() {
    super('protocol-ai')
  }

  /**
   * Get AI guidance for protocol development
   */
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

  /**
   * Generate protocol components from AI guidance
   */
  async generateProtocolComponents(
    researchQuestion: string,
    frameworkType: 'pico' | 'spider' | 'other' = 'pico'
  ) {
    return this.execute(
      'generate-protocol-components',
      async () => {
        // Get AI guidance for initial protocol
        const aiGuidance = await this.getAIGuidance({
          research_question: researchQuestion,
          focus_area: 'general'
        })

        // Parse AI response to extract protocol components
        const protocolComponents = await protocolParsingService.parseAIGuidance(aiGuidance, frameworkType)

        return {
          components: protocolComponents,
          aiGuidance,
          frameworkType
        }
      },
      { researchQuestion, frameworkType }
    )
  }

  /**
   * Generate AI refinements for existing protocol
   */
  async generateRefinements(
    existingProtocol: Protocol,
    focusArea: 'framework' | 'inclusion' | 'exclusion' | 'search_strategy',
    additionalContext?: string
  ): Promise<{ updates: Partial<ProtocolUpdate>; aiGuidance: string }> {
    return this.execute(
      'generate-refinements',
      async () => {
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
        const refinements = await protocolParsingService.parseAIRefinements(
          aiGuidance, 
          focusArea, 
          existingProtocol
        )

        return {
          updates: refinements,
          aiGuidance
        }
      },
      { protocolId: existingProtocol.id, focusArea, additionalContext }
    )
  }

  /**
   * Create AI guidance metadata for storing with protocol
   */
  createAIGuidanceMetadata(
    aiGuidance: string,
    frameworkType: string,
    focusArea?: string,
    additionalContext?: string
  ) {
    const baseMetadata = {
      timestamp: new Date().toISOString(),
      guidance: aiGuidance,
      framework_type: frameworkType
    }

    if (focusArea) {
      return {
        [focusArea]: {
          ...baseMetadata,
          additional_context: additionalContext
        }
      }
    }

    return baseMetadata
  }

  /**
   * Merge AI guidance metadata with existing metadata
   */
  mergeAIGuidanceMetadata(
    existingMetadata: Record<string, unknown>,
    newMetadata: Record<string, unknown>
  ) {
    return {
      ...(existingMetadata || {}),
      ...newMetadata
    }
  }

  /**
   * Validate protocol before AI processing
   */
  validateProtocolForAI(protocol: Protocol | Partial<Protocol>): void {
    if (!protocol.research_question || protocol.research_question.trim().length === 0) {
      throw new Error('Research question is required for AI assistance')
    }

    if (protocol.research_question && protocol.research_question.length > 1000) {
      throw new Error('Research question is too long for AI processing')
    }
  }

  /**
   * Extract key terms from research question for AI context
   */
  extractKeyTerms(researchQuestion: string): string[] {
    // Simple extraction - in production, you might use more sophisticated NLP
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'when', 'where', 'why', 'which']
    
    return researchQuestion
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10) // Limit to top 10 terms
  }

  /**
   * Format AI guidance for display
   */
  formatAIGuidance(guidance: string): string {
    // Clean up and format the AI guidance for better readability
    return guidance
      .trim()
      .replace(/\n{3,}/g, '\n\n') // Reduce excessive newlines
      .replace(/^\s+/gm, '') // Remove leading whitespace from lines
  }
}

export const protocolAIService = new ProtocolAIService()