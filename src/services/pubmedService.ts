/**
 * PubMed Search Service
 * Integrates with the search-articles edge function for PubMed API access
 */

import { supabase, baseSupabaseClient } from '@/lib/supabase'
import { BaseService } from '@/lib/service-wrapper'

export interface PubMedSearchRequest {
  projectId: string
  query: string
  maxResults?: number
  filters?: {
    dateRange?: {
      from?: string
      to?: string
    }
    studyTypes?: string[]
    languages?: string[]
    journals?: string[]
  }
}

export interface PubMedArticle {
  pmid: string
  title: string
  authors: string[]
  abstract: string
  publication_year: number | null
  journal: string
  doi?: string
  pdf_url: string
  metadata: {
    meshTerms: string[]
    publicationType: string[]
    language: string
    journal_details: any
    pubmed_url: string
  }
}

export interface PubMedSearchResponse {
  success: boolean
  articles: PubMedArticle[]
  searchQuery: string
  totalResults: number
  importedCount: number
  duplicatesSkipped: number
  errors?: string[]
  timestamp: string
}

class PubMedService extends BaseService {
  constructor() {
    super('pubmed-service')
  }

  /**
   * Search PubMed and import articles to project
   */
  async searchAndImportArticles(request: PubMedSearchRequest): Promise<PubMedSearchResponse> {
    return this.execute(
      'search-and-import-articles',
      async () => {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          throw new Error('Authentication required')
        }

        // Validate request
        if (!request.projectId || !request.query) {
          throw new Error('Missing required fields: projectId or query')
        }

        const { data, error } = await baseSupabaseClient.functions.invoke('search-articles', {
          body: {
            ...request,
            maxResults: request.maxResults || 20
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        })

        if (error) throw error

        if (!data.success) {
          const errorMsg = data.error || 'PubMed search failed'
          throw new Error(errorMsg)
        }

        return data
      },
      {
        projectId: request.projectId,
        query: request.query,
        maxResults: request.maxResults || 20
      }
    )
  }

  /**
   * Get articles for a project (for screening)
   */
  async getProjectArticles(
    projectId: string,
    options: {
      status?: 'pending' | 'included' | 'excluded' | 'maybe'
      limit?: number
      offset?: number
    } = {}
  ): Promise<{
    articles: PubMedArticle[]
    totalCount: number
    statistics: {
      pending: number
      included: number
      excluded: number
      maybe: number
    }
  }> {
    return this.execute(
      'get-project-articles',
      async () => {
        let query = supabase
          .from('articles')
          .select('*', { count: 'exact' })
          .eq('project_id', projectId)

        if (options.status) {
          query = query.eq('status', options.status)
        }

        if (options.limit) {
          query = query.limit(options.limit)
        }

        if (options.offset) {
          query = query.range(options.offset, (options.offset || 0) + (options.limit || 10) - 1)
        }

        const { data: articles, error, count } = await query

        if (error) throw error

        // Get statistics
        const { data: stats } = await supabase
          .from('articles')
          .select('status')
          .eq('project_id', projectId)

        const statistics = {
          pending: stats?.filter(a => a.status === 'pending').length || 0,
          included: stats?.filter(a => a.status === 'included').length || 0,
          excluded: stats?.filter(a => a.status === 'excluded').length || 0,
          maybe: stats?.filter(a => a.status === 'maybe').length || 0
        }

        return {
          articles: articles || [],
          totalCount: count || 0,
          statistics
        }
      },
      {
        projectId,
        status: options.status,
        limit: options.limit
      }
    )
  }

  /**
   * Update article screening decision
   */
  async updateArticleScreening(
    articleId: string,
    decision: 'include' | 'exclude' | 'maybe',
    notes?: string
  ): Promise<void> {
    return this.execute(
      'update-article-screening',
      async () => {
        const { error } = await supabase
          .from('articles')
          .update({
            screening_decision: decision,
            screening_notes: notes?.trim() || null,
            status: decision === 'include' ? 'included' : decision === 'exclude' ? 'excluded' : 'maybe'
          })
          .eq('id', articleId)

        if (error) throw error
      },
      {
        articleId,
        decision,
        hasNotes: !!notes
      }
    )
  }

  /**
   * Get article details by ID
   */
  async getArticleById(articleId: string): Promise<PubMedArticle | null> {
    return this.execute(
      'get-article-by-id',
      async () => {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('id', articleId)
          .single()

        if (error) {
          if (error.code === 'PGRST116') return null // Not found
          throw error
        }

        return data
      },
      { articleId }
    )
  }

  /**
   * Batch update multiple article screening decisions
   */
  async batchUpdateScreening(
    updates: Array<{
      articleId: string
      decision: 'include' | 'exclude' | 'maybe'
      notes?: string
    }>
  ): Promise<void> {
    return this.execute(
      'batch-update-screening',
      async () => {
        const { error } = await supabase.rpc('batch_update_articles', {
          updates: updates.map(u => ({
            id: u.articleId,
            screening_decision: u.decision,
            screening_notes: u.notes?.trim() || null,
            status: u.decision === 'include' ? 'included' : u.decision === 'exclude' ? 'excluded' : 'maybe'
          }))
        })

        if (error) throw error
      },
      {
        updateCount: updates.length
      }
    )
  }

  /**
   * Get search history for a project
   */
  async getSearchHistory(projectId: string): Promise<Array<{
    id: string
    query: string
    results_count: number
    created_at: string
    filters: any
  }>> {
    return this.execute(
      'get-search-history',
      async () => {
        const { data, error } = await supabase
          .from('search_queries')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
      },
      { projectId }
    )
  }
}

// Create service instance
const pubmedService = new PubMedService()

// Export individual methods for convenience
export const searchAndImportArticles = (request: PubMedSearchRequest) => 
  pubmedService.searchAndImportArticles(request)

export const getProjectArticles = (
  projectId: string,
  options?: {
    status?: 'pending' | 'included' | 'excluded' | 'maybe'
    limit?: number
    offset?: number
  }
) => pubmedService.getProjectArticles(projectId, options)

export const updateArticleScreening = (
  articleId: string,
  decision: 'include' | 'exclude' | 'maybe',
  notes?: string
) => pubmedService.updateArticleScreening(articleId, decision, notes)

export const getArticleById = (articleId: string) => pubmedService.getArticleById(articleId)

export const batchUpdateScreening = (
  updates: Array<{
    articleId: string
    decision: 'include' | 'exclude' | 'maybe'
    notes?: string
  }>
) => pubmedService.batchUpdateScreening(updates)

export const getSearchHistory = (projectId: string) => pubmedService.getSearchHistory(projectId)

export default pubmedService