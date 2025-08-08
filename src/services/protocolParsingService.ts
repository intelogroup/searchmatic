import type { Database } from '@/types/database'

type Protocol = Database['public']['Tables']['protocols']['Row']
type ProtocolInsert = Database['public']['Tables']['protocols']['Insert']
type ProtocolUpdate = Database['public']['Tables']['protocols']['Update']

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

/**
 * Service for parsing AI guidance text into structured protocol components
 * Handles text extraction and formatting for protocol data
 */
export class ProtocolParsingService {
  /**
   * Parse AI guidance text into protocol components
   */
  async parseAIGuidance(guidance: string, frameworkType: 'pico' | 'spider' | 'other'): Promise<Partial<ProtocolInsert>> {
    // This is a simplified parser - in a real implementation, you might use more sophisticated NLP
    // or prompt the AI to return structured JSON
    
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
  }

  /**
   * Parse AI refinements based on focus area
   */
  async parseAIRefinements(
    guidance: string,
    focusArea: string,
    existingProtocol: Protocol
  ): Promise<Partial<ProtocolUpdate>> {
    // Parse refinements based on focus area
    const updates: Partial<ProtocolUpdate> = {}

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
          const strategy = { ...((existingProtocol.search_strategy as Record<string, unknown>) || {}) }
          
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

    return updates
  }

  /**
   * Check if an update contains significant changes that require version increment
   */
  isSignificantUpdate(updates: ProtocolUpdate): boolean {
    const significantFields = [
      'research_question',
      'framework_type',
      'inclusion_criteria',
      'exclusion_criteria',
      'search_strategy'
    ]
    
    return significantFields.some(field => updates[field as keyof ProtocolUpdate] !== undefined)
  }
}

export const protocolParsingService = new ProtocolParsingService()