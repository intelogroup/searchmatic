/**
 * PubMed Search Service
 * Integrates with the search-articles edge function for PubMed API access
 */

import { supabase, baseSupabaseClient } from '@/lib/supabase'
import { BaseService } from '@/lib/service-wrapper'
import { searchResultsCache, articleCache, cacheKeys, withCache } from '@/lib/cache'

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
   * Search PubMed and import articles to project (with caching)
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

        // Create cache key for this search
        const cacheKey = cacheKeys.searchResults(request.query, request.projectId, request.filters)

        // Use cached result if available (only for read-only searches)
        return withCache(
          searchResultsCache,
          cacheKey,
          async () => {
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
          10 * 60 * 1000 // Cache for 10 minutes
        )
      },
      {
        projectId: request.projectId,
        query: request.query,
        maxResults: request.maxResults || 20
      }
    )
  }

  /**
   * Get articles for a project (for screening) with pagination and caching
   */
  async getProjectArticles(
    projectId: string,
    options: {
      status?: 'pending' | 'included' | 'excluded' | 'maybe'
      limit?: number
      offset?: number
      page?: number
    } = {}
  ): Promise<{
    articles: PubMedArticle[]
    totalCount: number
    currentPage: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
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
        const limit = options.limit || 20
        const page = options.page || 1
        const offset = options.offset || (page - 1) * limit

        // Create cache key for this query
        const cacheKey = cacheKeys.projectArticles(projectId, options.status, page)

        return withCache(
          articleCache,
          cacheKey,
          async () => {
            // Get articles with pagination
            let query = supabase
              .from('articles')
              .select('*', { count: 'exact' })
              .eq('project_id', projectId)
              .order('created_at', { ascending: false })

            if (options.status) {
              query = query.eq('status', options.status)
            }

            // Apply pagination
            query = query.range(offset, offset + limit - 1)

            const { data: articles, error, count } = await query

            if (error) throw error

            // Get statistics (cache separately)
            const statsKey = cacheKeys.projectStats(projectId)
            const statistics = await withCache(
              articleCache,
              statsKey,
              async () => {
                // Use optimized aggregation query
                const { data: statsData, error: statsError } = await supabase
                  .rpc('get_article_stats', { project_id: projectId })

                if (statsError) {
                  // Fallback to manual counting if RPC doesn't exist
                  const { data: fallbackStats } = await supabase
                    .from('articles')
                    .select('status')
                    .eq('project_id', projectId)

                  return {
                    pending: fallbackStats?.filter(a => a.status === 'pending').length || 0,
                    included: fallbackStats?.filter(a => a.status === 'included').length || 0,
                    excluded: fallbackStats?.filter(a => a.status === 'excluded').length || 0,
                    maybe: fallbackStats?.filter(a => a.status === 'maybe').length || 0
                  }
                }

                return statsData || {
                  pending: 0,
                  included: 0,
                  excluded: 0,
                  maybe: 0
                }
              },
              5 * 60 * 1000 // Cache stats for 5 minutes
            )

            const totalCount = count || 0
            const totalPages = Math.ceil(totalCount / limit)

            return {
              articles: articles || [],
              totalCount,
              currentPage: page,
              totalPages,
              hasNextPage: page < totalPages,
              hasPreviousPage: page > 1,
              statistics
            }
          },
          2 * 60 * 1000 // Cache for 2 minutes
        )
      },
      {
        projectId,
        status: options.status,
        limit,
        page
      }
    )
  }

  /**
   * Update article screening decision with cache invalidation
   */
  async updateArticleScreening(
    articleId: string,
    decision: 'include' | 'exclude' | 'maybe',
    notes?: string,
    projectId?: string
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

        // Invalidate relevant caches
        if (projectId) {
          // Clear project statistics cache
          articleCache.delete(cacheKeys.projectStats(projectId))
          
          // Clear all article list caches for this project
          const cacheKeysToDelete = [
            cacheKeys.projectArticles(projectId, 'pending'),
            cacheKeys.projectArticles(projectId, 'included'),
            cacheKeys.projectArticles(projectId, 'excluded'),
            cacheKeys.projectArticles(projectId, 'maybe'),
            cacheKeys.projectArticles(projectId, undefined) // All articles
          ]
          
          cacheKeysToDelete.forEach(key => {
            // Delete all pages for this filter
            for (let page = 1; page <= 10; page++) {
              articleCache.delete(`${key}:${page}`)
            }
          })
        }
      },
      {
        articleId,
        decision,
        hasNotes: !!notes,
        projectId
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