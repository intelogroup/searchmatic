/**
 * Academic Database Search Service
 * Unified interface for searching PubMed, CrossRef, arXiv, and DOAJ
 */

import { baseSupabaseClient as supabase } from '@/lib/supabase'
import { errorLogger } from '@/lib/error-logger'

export interface SearchQuery {
  keywords: string[]
  databases: string[]
  filters: {
    dateRange?: { start: string; end: string }
    studyTypes?: string[]
    languages?: string[]
    journals?: string[]
  }
  booleanOperator: 'AND' | 'OR'
  fieldSearch?: {
    title?: string
    abstract?: string
    author?: string
    journal?: string
  }
}

export interface SearchResult {
  id: string
  database: string
  title: string
  authors: string[]
  journal?: string
  publicationDate: string
  doi?: string
  pmid?: string
  abstract?: string
  url: string
  studyType?: string
  keywords?: string[]
  citationCount?: number
}

export interface SearchResponse {
  results: SearchResult[]
  totalCount: number
  database: string
  query: string
  searchTime: number
  nextPageToken?: string
}

export interface DatabaseCount {
  database: string
  count: number
  estimatedTime: number
}

class SearchService {
  private readonly API_BASE = '/api/search' // Supabase Edge Function endpoint
  private readonly CROSSREF_BASE = 'https://api.crossref.org/works'

  /**
   * Get estimated result counts from all databases before full search
   */
  async getResultCounts(query: SearchQuery): Promise<DatabaseCount[]> {
    const startTime = performance.now()
    
    errorLogger.logInfo('Getting result counts for databases', {
      feature: 'search',
      action: 'get-result-counts',
      metadata: { 
        databases: query.databases,
        keywords: query.keywords.length,
        hasFilters: Object.keys(query.filters).length > 0
      }
    })

    try {
      const counts: DatabaseCount[] = []
      
      for (const database of query.databases) {
        try {
          const count = await this.getCountForDatabase(database, query)
          counts.push(count)
        } catch (error) {
          errorLogger.logError(`Failed to get count for ${database}`, {
            feature: 'search',
            action: 'get-database-count-error',
            metadata: { database, error: (error as Error).message }
          })
          
          // Add with error state but don't fail entire operation
          counts.push({
            database,
            count: -1, // -1 indicates error
            estimatedTime: 0
          })
        }
      }

      const duration = performance.now() - startTime
      errorLogger.logInfo(`Retrieved counts for ${counts.length} databases`, {
        feature: 'search',
        action: 'get-result-counts-success',
        metadata: { 
          duration: Math.round(duration),
          totalResults: counts.reduce((sum, c) => sum + Math.max(0, c.count), 0)
        }
      })

      return counts
    } catch (error) {
      errorLogger.logError('Failed to get result counts', {
        feature: 'search',
        action: 'get-result-counts-error',
        metadata: { 
          databases: query.databases,
          error: (error as Error).message 
        }
      })
      throw error
    }
  }

  /**
   * Search a single database
   */
  async searchDatabase(database: string, query: SearchQuery, options?: {
    limit?: number
    offset?: number
    pageToken?: string
  }): Promise<SearchResponse> {
    const startTime = performance.now()
    
    errorLogger.logInfo(`Searching ${database}`, {
      feature: 'search',
      action: 'search-database',
      metadata: { 
        database,
        keywords: query.keywords.length,
        limit: options?.limit || 20
      }
    })

    try {
      let response: SearchResponse

      switch (database.toLowerCase()) {
        case 'crossref':
          response = await this.searchCrossRef(query, options)
          break
        case 'pubmed':
          response = await this.searchPubMed(query, options)
          break
        case 'arxiv':
          response = await this.searchArXiv(query, options)
          break
        case 'doaj':
          response = await this.searchDOAJ(query, options)
          break
        default:
          throw new Error(`Unsupported database: ${database}`)
      }

      const duration = performance.now() - startTime
      response.searchTime = duration

      errorLogger.logInfo(`Search completed for ${database}`, {
        feature: 'search',
        action: 'search-database-success',
        metadata: { 
          database,
          resultCount: response.results.length,
          totalCount: response.totalCount,
          searchTime: Math.round(duration)
        }
      })

      // Save search query to database
      await this.saveSearchQuery(database, query, response.totalCount)

      return response
    } catch (error) {
      const duration = performance.now() - startTime
      
      errorLogger.logError(`Search failed for ${database}`, {
        feature: 'search',
        action: 'search-database-error',
        metadata: { 
          database,
          searchTime: Math.round(duration),
          error: (error as Error).message 
        }
      })
      
      throw error
    }
  }

  /**
   * Search multiple databases concurrently
   */
  async searchMultipleDatabases(
    databases: string[], 
    query: SearchQuery, 
    options?: { limit?: number }
  ): Promise<SearchResponse[]> {
    const startTime = performance.now()
    
    errorLogger.logInfo(`Searching ${databases.length} databases concurrently`, {
      feature: 'search',
      action: 'search-multiple-databases',
      metadata: { 
        databases,
        keywords: query.keywords.length,
        limit: options?.limit || 20
      }
    })

    try {
      const searchPromises = databases.map(database => 
        this.searchDatabase(database, query, options)
          .catch(error => {
            errorLogger.logError(`Database ${database} search failed in concurrent search`, {
              feature: 'search',
              action: 'concurrent-search-partial-error',
              metadata: { database, error: error.message }
            })
            // Return empty result instead of failing entire search
            return {
              results: [],
              totalCount: 0,
              database,
              query: this.buildQueryString(query),
              searchTime: 0
            } as SearchResponse
          })
      )

      const responses = await Promise.all(searchPromises)
      const duration = performance.now() - startTime

      const successfulSearches = responses.filter(r => r.results.length > 0 || r.totalCount > 0)
      const totalResults = responses.reduce((sum, r) => sum + r.totalCount, 0)

      errorLogger.logInfo(`Concurrent search completed`, {
        feature: 'search',
        action: 'search-multiple-databases-success',
        metadata: { 
          requestedDatabases: databases.length,
          successfulSearches: successfulSearches.length,
          totalResults,
          searchTime: Math.round(duration)
        }
      })

      return responses
    } catch (error) {
      const duration = performance.now() - startTime
      
      errorLogger.logError('Concurrent database search failed', {
        feature: 'search',
        action: 'search-multiple-databases-error',
        metadata: { 
          databases,
          searchTime: Math.round(duration),
          error: (error as Error).message 
        }
      })
      
      throw error
    }
  }

  /**
   * Search CrossRef (direct API, CORS enabled)
   */
  private async searchCrossRef(query: SearchQuery, options?: {
    limit?: number
    offset?: number
  }): Promise<SearchResponse> {
    const limit = options?.limit || 20
    const offset = options?.offset || 0
    
    const queryString = this.buildCrossRefQuery(query)
    const url = new URL(this.CROSSREF_BASE)
    
    url.searchParams.set('query', queryString)
    url.searchParams.set('rows', limit.toString())
    url.searchParams.set('offset', offset.toString())
    url.searchParams.set('select', 'DOI,title,author,published-print,published-online,container-title,abstract,URL,type,is-referenced-by-count')
    
    if (query.filters.dateRange) {
      url.searchParams.set('filter', `from-pub-date:${query.filters.dateRange.start},until-pub-date:${query.filters.dateRange.end}`)
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Searchmatic/1.0 (mailto:support@searchmatic.ai) - Academic Literature Review Tool'
        }
      })

      if (!response.ok) {
        throw new Error(`CrossRef API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        results: this.formatCrossRefResults(data.message.items || []),
        totalCount: data.message['total-results'] || 0,
        database: 'CrossRef',
        query: queryString,
        searchTime: 0 // Will be set by calling method
      }
    } catch (error) {
      errorLogger.logError('CrossRef search failed', {
        feature: 'search',
        action: 'crossref-search-error',
        metadata: { query: queryString, error: (error as Error).message }
      })
      throw error
    }
  }

  /**
   * Search PubMed via Supabase Edge Function (proxy for CORS)
   */
  private async searchPubMed(query: SearchQuery, options?: {
    limit?: number
    offset?: number
  }): Promise<SearchResponse> {
    const limit = options?.limit || 20
    const offset = options?.offset || 0
    
    const queryString = this.buildPubMedQuery(query)
    
    try {
      const { data, error } = await supabase.functions.invoke('search-pubmed', {
        body: {
          query: queryString,
          retmax: limit,
          retstart: offset,
          filters: query.filters
        }
      })

      if (error) {
        throw new Error(`PubMed search error: ${error.message}`)
      }

      return {
        results: this.formatPubMedResults(data.articles || []),
        totalCount: data.totalCount || 0,
        database: 'PubMed',
        query: queryString,
        searchTime: 0
      }
    } catch (error) {
      errorLogger.logError('PubMed search failed', {
        feature: 'search',
        action: 'pubmed-search-error',
        metadata: { query: queryString, error: (error as Error).message }
      })
      throw error
    }
  }

  /**
   * Search arXiv via Supabase Edge Function
   */
  private async searchArXiv(query: SearchQuery, options?: {
    limit?: number
    offset?: number
  }): Promise<SearchResponse> {
    const limit = options?.limit || 20
    const offset = options?.offset || 0
    
    const queryString = this.buildArXivQuery(query)
    
    try {
      const { data, error } = await supabase.functions.invoke('search-arxiv', {
        body: {
          query: queryString,
          maxResults: limit,
          startIndex: offset
        }
      })

      if (error) {
        throw new Error(`arXiv search error: ${error.message}`)
      }

      return {
        results: this.formatArXivResults(data.entries || []),
        totalCount: data.totalCount || 0,
        database: 'arXiv',
        query: queryString,
        searchTime: 0
      }
    } catch (error) {
      errorLogger.logError('arXiv search failed', {
        feature: 'search',
        action: 'arxiv-search-error',
        metadata: { query: queryString, error: (error as Error).message }
      })
      throw error
    }
  }

  /**
   * Search DOAJ via Supabase Edge Function
   */
  private async searchDOAJ(query: SearchQuery, options?: {
    limit?: number
    offset?: number
  }): Promise<SearchResponse> {
    const limit = options?.limit || 20
    const offset = options?.offset || 0
    
    const queryString = this.buildDOAJQuery(query)
    
    try {
      const { data, error } = await supabase.functions.invoke('search-doaj', {
        body: {
          query: queryString,
          pageSize: limit,
          page: Math.floor(offset / limit) + 1
        }
      })

      if (error) {
        throw new Error(`DOAJ search error: ${error.message}`)
      }

      return {
        results: this.formatDOAJResults(data.results || []),
        totalCount: data.total || 0,
        database: 'DOAJ',
        query: queryString,
        searchTime: 0
      }
    } catch (error) {
      errorLogger.logError('DOAJ search failed', {
        feature: 'search',
        action: 'doaj-search-error',
        metadata: { query: queryString, error: (error as Error).message }
      })
      throw error
    }
  }

  /**
   * Get count for a specific database
   */
  private async getCountForDatabase(database: string, query: SearchQuery): Promise<DatabaseCount> {
    const startTime = performance.now()
    
    try {
      let count = 0
      
      switch (database.toLowerCase()) {
        case 'crossref':
          count = await this.getCrossRefCount(query)
          break
        case 'pubmed':
          count = await this.getPubMedCount(query)
          break
        case 'arxiv':
          count = await this.getArXivCount(query)
          break
        case 'doaj':
          count = await this.getDOAJCount(query)
          break
        default:
          throw new Error(`Unsupported database: ${database}`)
      }

      const duration = performance.now() - startTime
      
      return {
        database,
        count,
        estimatedTime: this.estimateSearchTime(count, database)
      }
    } catch (error) {
      errorLogger.logError(`Failed to get count for ${database}`, {
        feature: 'search',
        action: 'get-database-count-error',
        metadata: { database, error: (error as Error).message }
      })
      throw error
    }
  }

  /**
   * Build query string for different databases
   */
  private buildQueryString(query: SearchQuery): string {
    const operator = ` ${query.booleanOperator} `
    return query.keywords.join(operator)
  }

  private buildCrossRefQuery(query: SearchQuery): string {
    let queryParts: string[] = []

    if (query.fieldSearch?.title) {
      queryParts.push(`title:(${query.fieldSearch.title})`)
    }
    
    if (query.fieldSearch?.abstract) {
      queryParts.push(`abstract:(${query.fieldSearch.abstract})`)
    }
    
    if (query.fieldSearch?.author) {
      queryParts.push(`author:(${query.fieldSearch.author})`)
    }

    if (query.keywords.length > 0) {
      const keywordQuery = query.keywords.join(` ${query.booleanOperator} `)
      queryParts.push(keywordQuery)
    }

    return queryParts.join(' AND ')
  }

  private buildPubMedQuery(query: SearchQuery): string {
    let queryParts: string[] = []

    if (query.fieldSearch?.title) {
      queryParts.push(`(${query.fieldSearch.title})[Title]`)
    }
    
    if (query.fieldSearch?.abstract) {
      queryParts.push(`(${query.fieldSearch.abstract})[Abstract]`)
    }
    
    if (query.fieldSearch?.author) {
      queryParts.push(`(${query.fieldSearch.author})[Author]`)
    }

    if (query.keywords.length > 0) {
      const keywordQuery = query.keywords.map(k => `"${k}"`).join(` ${query.booleanOperator} `)
      queryParts.push(keywordQuery)
    }

    return queryParts.join(' AND ')
  }

  private buildArXivQuery(query: SearchQuery): string {
    let queryParts: string[] = []

    if (query.fieldSearch?.title) {
      queryParts.push(`ti:"${query.fieldSearch.title}"`)
    }
    
    if (query.fieldSearch?.abstract) {
      queryParts.push(`abs:"${query.fieldSearch.abstract}"`)
    }
    
    if (query.fieldSearch?.author) {
      queryParts.push(`au:"${query.fieldSearch.author}"`)
    }

    if (query.keywords.length > 0) {
      const keywordQuery = query.keywords.map(k => `all:"${k}"`).join(` ${query.booleanOperator} `)
      queryParts.push(keywordQuery)
    }

    return queryParts.join(' AND ')
  }

  private buildDOAJQuery(query: SearchQuery): string {
    // DOAJ uses Elasticsearch query syntax
    const operator = query.booleanOperator.toLowerCase()
    return query.keywords.map(k => `"${k}"`).join(` ${operator} `)
  }

  /**
   * Format results from different databases into unified format
   */
  private formatCrossRefResults(items: any[]): SearchResult[] {
    return items.map(item => ({
      id: item.DOI || `crossref_${Date.now()}_${Math.random()}`,
      database: 'CrossRef',
      title: Array.isArray(item.title) ? item.title[0] : item.title || 'No title',
      authors: item.author ? item.author.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()) : [],
      journal: Array.isArray(item['container-title']) ? item['container-title'][0] : item['container-title'],
      publicationDate: this.extractPublicationDate(item),
      doi: item.DOI,
      abstract: item.abstract,
      url: item.URL || `https://doi.org/${item.DOI}`,
      studyType: item.type || 'article',
      citationCount: item['is-referenced-by-count']
    }))
  }

  private formatPubMedResults(items: any[]): SearchResult[] {
    return items.map(item => ({
      id: item.pmid || `pubmed_${Date.now()}_${Math.random()}`,
      database: 'PubMed',
      title: item.title || 'No title',
      authors: item.authors || [],
      journal: item.journal,
      publicationDate: item.publicationDate,
      doi: item.doi,
      pmid: item.pmid,
      abstract: item.abstract,
      url: item.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${item.pmid}` : '',
      studyType: 'article',
      keywords: item.keywords
    }))
  }

  private formatArXivResults(items: any[]): SearchResult[] {
    return items.map(item => ({
      id: item.id || `arxiv_${Date.now()}_${Math.random()}`,
      database: 'arXiv',
      title: item.title || 'No title',
      authors: item.authors || [],
      publicationDate: item.published,
      abstract: item.summary,
      url: item.link,
      studyType: 'preprint',
      keywords: item.categories
    }))
  }

  private formatDOAJResults(items: any[]): SearchResult[] {
    return items.map(item => ({
      id: item.id || `doaj_${Date.now()}_${Math.random()}`,
      database: 'DOAJ',
      title: item.bibjson?.title || 'No title',
      authors: item.bibjson?.author?.map((a: any) => a.name) || [],
      journal: item.bibjson?.journal?.title,
      publicationDate: item.bibjson?.year,
      doi: item.bibjson?.identifier?.find((i: any) => i.type === 'doi')?.id,
      abstract: item.bibjson?.abstract,
      url: item.bibjson?.link?.[0]?.url,
      studyType: 'article'
    }))
  }

  /**
   * Save search query to database for history
   */
  private async saveSearchQuery(database: string, query: SearchQuery, resultCount: number): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('search_queries')
        .insert({
          user_id: user.id,
          database,
          query_string: this.buildQueryString(query),
          query_parameters: query,
          result_count: resultCount
        })
    } catch (error) {
      errorLogger.logError('Failed to save search query', {
        feature: 'search',
        action: 'save-search-query-error',
        metadata: { database, error: (error as Error).message }
      })
      // Don't throw - this is not critical for search functionality
    }
  }

  /**
   * Helper methods
   */
  private extractPublicationDate(item: any): string {
    const publishedPrint = item['published-print']
    const publishedOnline = item['published-online']
    
    if (publishedPrint?.['date-parts']?.[0]) {
      const parts = publishedPrint['date-parts'][0]
      return `${parts[0]}-${String(parts[1] || 1).padStart(2, '0')}-${String(parts[2] || 1).padStart(2, '0')}`
    }
    
    if (publishedOnline?.['date-parts']?.[0]) {
      const parts = publishedOnline['date-parts'][0]
      return `${parts[0]}-${String(parts[1] || 1).padStart(2, '0')}-${String(parts[2] || 1).padStart(2, '0')}`
    }
    
    return new Date().toISOString().split('T')[0] // fallback to today
  }

  private estimateSearchTime(count: number, database: string): number {
    // Rough estimates based on typical API response times
    const baseTime = {
      'crossref': 500,
      'pubmed': 800,
      'arxiv': 600,
      'doaj': 700
    }[database.toLowerCase()] || 600

    // Add time based on result count
    const scalingFactor = Math.min(count / 1000, 5) // Cap at 5x
    return Math.round(baseTime + (scalingFactor * 200))
  }

  // Count methods (simplified versions that return counts only)
  private async getCrossRefCount(query: SearchQuery): Promise<number> {
    const url = new URL(this.CROSSREF_BASE)
    url.searchParams.set('query', this.buildCrossRefQuery(query))
    url.searchParams.set('rows', '0') // Only get count
    
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Searchmatic/1.0 (mailto:support@searchmatic.ai)'
      }
    })
    
    if (!response.ok) throw new Error(`CrossRef count error: ${response.status}`)
    
    const data = await response.json()
    return data.message['total-results'] || 0
  }

  private async getPubMedCount(query: SearchQuery): Promise<number> {
    const { data, error } = await supabase.functions.invoke('search-pubmed', {
      body: {
        query: this.buildPubMedQuery(query),
        retmax: 0, // Only get count
        countOnly: true
      }
    })

    if (error) throw new Error(`PubMed count error: ${error.message}`)
    return data.totalCount || 0
  }

  private async getArXivCount(query: SearchQuery): Promise<number> {
    const { data, error } = await supabase.functions.invoke('search-arxiv', {
      body: {
        query: this.buildArXivQuery(query),
        maxResults: 0, // Only get count
        countOnly: true
      }
    })

    if (error) throw new Error(`arXiv count error: ${error.message}`)
    return data.totalCount || 0
  }

  private async getDOAJCount(query: SearchQuery): Promise<number> {
    const { data, error } = await supabase.functions.invoke('search-doaj', {
      body: {
        query: this.buildDOAJQuery(query),
        pageSize: 0, // Only get count
        countOnly: true
      }
    })

    if (error) throw new Error(`DOAJ count error: ${error.message}`)
    return data.total || 0
  }
}

export const searchService = new SearchService()