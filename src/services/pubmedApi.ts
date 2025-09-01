import { ArticleSearchResult, SearchFilters, PubMedArticle, ImportedArticle } from '../types/articles'

const PUBMED_API_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const PUBMED_API_KEY = process.env.VITE_PUBMED_API_KEY // Optional but recommended for higher rate limits

interface ESearchResult {
  esearchresult: {
    idlist: string[]
    count: string
    retmax: string
    retstart: string
    querykey: string
    webenv: string
  }
}

interface ESummaryResult {
  result: {
    [id: string]: {
      uid: string
      title: string
      authors: Array<{ name: string }>
      journal: string
      pubdate: string
      pmid: string
      doi?: string
      abstract?: string
      pmc?: string
    }
  }
}

interface EFetchResult {
  PubmedArticleSet: {
    PubmedArticle: Array<{
      MedlineCitation: {
        PMID: { _text: string }
        Article: {
          ArticleTitle: { _text: string }
          Abstract?: {
            AbstractText: Array<{ _text: string }> | { _text: string }
          }
          AuthorList?: {
            Author: Array<{
              LastName?: { _text: string }
              ForeName?: { _text: string }
              Initials?: { _text: string }
            }>
          }
          Journal: {
            Title: { _text: string }
            ISOAbbreviation?: { _text: string }
          }
          ArticleDate?: Array<{
            Year: { _text: string }
            Month: { _text: string }
            Day: { _text: string }
          }>
          ELocationID?: Array<{
            _attributes: { EIdType: string }
            _text: string
          }>
        }
      }
      PubmedData?: {
        ArticleIdList?: {
          ArticleId: Array<{
            _attributes: { IdType: string }
            _text: string
          }>
        }
      }
    }>
  }
}

export class PubMedAPIService {
  private baseURL = PUBMED_API_BASE
  private apiKey = PUBMED_API_KEY
  private rateLimitDelay = 334 // ~3 requests per second (NCBI limit)

  constructor() {
    if (!this.apiKey) {
      console.warn('PubMed API key not configured. Using public rate limits.')
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private buildSearchQuery(filters: SearchFilters): string {
    const queryParts: string[] = []

    // Main search terms
    if (filters.query) {
      queryParts.push(`(${filters.query})`)
    }

    // PICO components
    if (filters.population) {
      queryParts.push(`(${filters.population}[MeSH Terms] OR ${filters.population}[All Fields])`)
    }
    if (filters.intervention) {
      queryParts.push(`(${filters.intervention}[MeSH Terms] OR ${filters.intervention}[All Fields])`)
    }
    if (filters.comparison) {
      queryParts.push(`(${filters.comparison}[MeSH Terms] OR ${filters.comparison}[All Fields])`)
    }
    if (filters.outcome) {
      queryParts.push(`(${filters.outcome}[MeSH Terms] OR ${filters.outcome}[All Fields])`)
    }

    // Date range
    if (filters.startYear || filters.endYear) {
      const startYear = filters.startYear || '1900'
      const endYear = filters.endYear || new Date().getFullYear().toString()
      queryParts.push(`("${startYear}"[Date - Publication] : "${endYear}"[Date - Publication])`)
    }

    // Publication types
    if (filters.publicationTypes && filters.publicationTypes.length > 0) {
      const pubTypes = filters.publicationTypes.map(type => `"${type}"[Publication Type]`)
      queryParts.push(`(${pubTypes.join(' OR ')})`)
    }

    // Language
    if (filters.languages && filters.languages.length > 0) {
      const languages = filters.languages.map(lang => `"${lang}"[Language]`)
      queryParts.push(`(${languages.join(' OR ')})`)
    }

    // Study types
    if (filters.studyTypes && filters.studyTypes.length > 0) {
      const studyFilters = filters.studyTypes.map(type => {
        switch (type) {
          case 'randomized_controlled_trial':
            return '"Randomized Controlled Trial"[Publication Type]'
          case 'systematic_review':
            return '"Systematic Review"[Publication Type]'
          case 'meta_analysis':
            return '"Meta-Analysis"[Publication Type]'
          case 'clinical_trial':
            return '"Clinical Trial"[Publication Type]'
          case 'case_control':
            return '"Case-Control Studies"[MeSH Terms]'
          case 'cohort':
            return '"Cohort Studies"[MeSH Terms]'
          default:
            return `"${type}"[All Fields]`
        }
      })
      queryParts.push(`(${studyFilters.join(' OR ')})`)
    }

    // Journal filters
    if (filters.journals && filters.journals.length > 0) {
      const journalFilters = filters.journals.map(journal => `"${journal}"[Journal]`)
      queryParts.push(`(${journalFilters.join(' OR ')})`)
    }

    return queryParts.join(' AND ')
  }

  async searchArticles(filters: SearchFilters): Promise<ArticleSearchResult> {
    try {
      const query = this.buildSearchQuery(filters)
      const retmax = Math.min(filters.maxResults || 100, 10000) // PubMed limit
      const retstart = filters.offset || 0

      // Step 1: Search for article IDs
      const searchParams = new URLSearchParams({
        db: 'pubmed',
        term: query,
        retmax: retmax.toString(),
        retstart: retstart.toString(),
        retmode: 'json',
        usehistory: 'y',
        sort: filters.sortBy || 'relevance'
      })

      if (this.apiKey) {
        searchParams.append('api_key', this.apiKey)
      }

      const searchResponse = await fetch(`${this.baseURL}/esearch.fcgi?${searchParams}`)
      
      if (!searchResponse.ok) {
        throw new Error(`PubMed search failed: ${searchResponse.statusText}`)
      }

      const searchResult: ESearchResult = await searchResponse.json()
      const { idlist, count, querykey, webenv } = searchResult.esearchresult

      if (idlist.length === 0) {
        return {
          articles: [],
          totalCount: 0,
          hasMore: false,
          nextOffset: 0,
          query,
          searchTime: Date.now()
        }
      }

      // Add rate limiting delay
      await this.delay(this.rateLimitDelay)

      // Step 2: Fetch detailed article information
      const articles = await this.fetchArticleDetails(idlist, querykey, webenv)

      return {
        articles,
        totalCount: parseInt(count),
        hasMore: retstart + idlist.length < parseInt(count),
        nextOffset: retstart + idlist.length,
        query,
        searchTime: Date.now()
      }

    } catch (error) {
      console.error('PubMed API search error:', error)
      throw new Error(`Failed to search PubMed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async fetchArticleDetails(ids: string[], querykey?: string, webenv?: string): Promise<PubMedArticle[]> {
    try {
      // Use EFetch for detailed XML data
      const fetchParams = new URLSearchParams({
        db: 'pubmed',
        rettype: 'abstract',
        retmode: 'json'
      })

      if (querykey && webenv) {
        fetchParams.append('query_key', querykey)
        fetchParams.append('WebEnv', webenv)
      } else {
        fetchParams.append('id', ids.join(','))
      }

      if (this.apiKey) {
        fetchParams.append('api_key', this.apiKey)
      }

      const response = await fetch(`${this.baseURL}/efetch.fcgi?${fetchParams}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch article details: ${response.statusText}`)
      }

      const data = await response.text()
      
      // Parse the response (PubMed returns XML, we need to handle it)
      return await this.parseArticleXML(data, ids)

    } catch (error) {
      console.error('Error fetching article details:', error)
      // Fallback to ESummary if EFetch fails
      return await this.fetchArticleSummaries(ids)
    }
  }

  private async fetchArticleSummaries(ids: string[]): Promise<PubMedArticle[]> {
    const summaryParams = new URLSearchParams({
      db: 'pubmed',
      id: ids.join(','),
      retmode: 'json'
    })

    if (this.apiKey) {
      summaryParams.append('api_key', this.apiKey)
    }

    const response = await fetch(`${this.baseURL}/esummary.fcgi?${summaryParams}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch summaries: ${response.statusText}`)
    }

    const data: ESummaryResult = await response.json()
    
    return Object.values(data.result)
      .filter(item => item.uid) // Filter out metadata objects
      .map(item => this.convertSummaryToArticle(item))
  }

  private async parseArticleXML(xmlData: string, ids: string[]): Promise<PubMedArticle[]> {
    // For now, fall back to summaries since XML parsing is complex
    // In production, you'd want to use a proper XML parser
    return await this.fetchArticleSummaries(ids)
  }

  private convertSummaryToArticle(summary: any): PubMedArticle {
    return {
      pmid: summary.uid,
      title: summary.title || 'No title available',
      authors: summary.authors?.map((author: any) => author.name) || [],
      abstract: summary.abstract || '',
      journal: summary.journal || 'Unknown journal',
      publicationDate: summary.pubdate || '',
      doi: summary.doi || undefined,
      pmcId: summary.pmc || undefined,
      publicationType: [],
      meshTerms: [],
      keywords: [],
      language: 'eng', // Default, would need additional API call to get actual language
      source: 'pubmed' as const,
      url: `https://pubmed.ncbi.nlm.nih.gov/${summary.uid}/`,
      relevanceScore: 0,
      isOpenAccess: !!summary.pmc
    }
  }

  async getArticleById(pmid: string): Promise<PubMedArticle | null> {
    try {
      const articles = await this.fetchArticleSummaries([pmid])
      return articles[0] || null
    } catch (error) {
      console.error(`Error fetching article ${pmid}:`, error)
      return null
    }
  }

  async getRelatedArticles(pmid: string, maxResults = 20): Promise<PubMedArticle[]> {
    try {
      const linkParams = new URLSearchParams({
        dbfrom: 'pubmed',
        db: 'pubmed',
        id: pmid,
        cmd: 'neighbor',
        retmax: maxResults.toString()
      })

      if (this.apiKey) {
        linkParams.append('api_key', this.apiKey)
      }

      const response = await fetch(`${this.baseURL}/elink.fcgi?${linkParams}`)
      
      if (!response.ok) {
        throw new Error(`Failed to get related articles: ${response.statusText}`)
      }

      // Parse elink response (XML format) - simplified for now
      const data = await response.text()
      
      // Extract related PMIDs from XML (would need proper XML parsing)
      const pmidMatches = data.match(/<Id>(\d+)<\/Id>/g)
      if (!pmidMatches) {
        return []
      }

      const relatedPmids = pmidMatches
        .map(match => match.replace(/<\/?Id>/g, ''))
        .filter(id => id !== pmid)
        .slice(0, maxResults)

      await this.delay(this.rateLimitDelay)
      
      return await this.fetchArticleSummaries(relatedPmids)

    } catch (error) {
      console.error(`Error fetching related articles for ${pmid}:`, error)
      return []
    }
  }

  async validateQuery(query: string): Promise<{ isValid: boolean; suggestion?: string; estimatedResults?: number }> {
    try {
      const testParams = new URLSearchParams({
        db: 'pubmed',
        term: query,
        retmax: '1',
        retmode: 'json'
      })

      if (this.apiKey) {
        testParams.append('api_key', this.apiKey)
      }

      const response = await fetch(`${this.baseURL}/esearch.fcgi?${testParams}`)
      const result: ESearchResult = await response.json()
      
      const count = parseInt(result.esearchresult.count)
      
      return {
        isValid: count > 0,
        estimatedResults: count,
        suggestion: count === 0 ? 'Try broader search terms or check spelling' : undefined
      }

    } catch (error) {
      return {
        isValid: false,
        suggestion: 'Query validation failed - please check your search terms'
      }
    }
  }

  // Convert PubMed article to our internal article format for database storage
  convertToImportedArticle(pubmedArticle: PubMedArticle, projectId: string): ImportedArticle {
    return {
      externalId: pubmedArticle.pmid,
      source: 'pubmed',
      title: pubmedArticle.title,
      authors: pubmedArticle.authors,
      abstract: pubmedArticle.abstract,
      publicationDate: this.parsePublicationDate(pubmedArticle.publicationDate),
      journal: pubmedArticle.journal,
      doi: pubmedArticle.doi,
      pmid: pubmedArticle.pmid,
      url: pubmedArticle.url,
      metadata: {
        pmcId: pubmedArticle.pmcId,
        publicationType: pubmedArticle.publicationType,
        meshTerms: pubmedArticle.meshTerms,
        keywords: pubmedArticle.keywords,
        language: pubmedArticle.language,
        isOpenAccess: pubmedArticle.isOpenAccess,
        relevanceScore: pubmedArticle.relevanceScore,
        importedAt: new Date().toISOString(),
        searchQuery: undefined // Will be set by the importing function
      }
    }
  }

  private parsePublicationDate(dateString: string): Date | null {
    if (!dateString) return null
    
    try {
      // Handle various PubMed date formats
      const cleanDate = dateString.replace(/\s+/g, ' ').trim()
      
      // Try parsing common formats
      const formats = [
        /(\d{4})\s+(\w+)\s+(\d{1,2})/, // "2023 Jan 15"
        /(\d{4})\s+(\w+)/, // "2023 Jan"
        /(\d{4})/, // "2023"
      ]
      
      for (const format of formats) {
        const match = cleanDate.match(format)
        if (match) {
          if (match[3]) {
            // Full date
            return new Date(`${match[2]} ${match[3]}, ${match[1]}`)
          } else if (match[2]) {
            // Year and month
            return new Date(`${match[2]} 1, ${match[1]}`)
          } else {
            // Year only
            return new Date(`January 1, ${match[1]}`)
          }
        }
      }
      
      // Fallback - try direct parsing
      return new Date(dateString)
      
    } catch (error) {
      console.warn(`Failed to parse publication date: ${dateString}`)
      return null
    }
  }
}

// Create singleton instance
export const pubmedAPI = new PubMedAPIService()