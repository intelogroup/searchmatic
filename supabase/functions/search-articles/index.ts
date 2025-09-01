// PubMed API Integration Edge Function
// Implements official NCBI E-utilities API for systematic literature reviews
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { authenticateUser, createErrorResponse, createSuccessResponse } from '../_shared/auth.ts'

interface SearchRequest {
  projectId: string
  query?: string
  protocol?: {
    keywords: string[]
    meshTerms?: string[]
    dateRange?: {
      startDate: string
      endDate: string
    }
    studyTypes?: string[]
    languages?: string[]
    includeHumans?: boolean
  }
  options?: {
    limit?: number
    offset?: number
    databases?: string[]
  }
}

interface PubMedSearchResult {
  count: number
  ids: string[]
  webenv?: string
  querykey?: string
}

interface ArticleData {
  pmid: string
  title: string
  abstract: string
  authors: Array<{
    lastName: string
    foreName: string
    initials: string
    affiliation: string
  }>
  journal: {
    name: string
    abbreviation: string
    issn: string
    volume: string
    issue: string
    pages: string
  }
  publicationDate: string
  doi: string
  meshTerms: Array<{
    descriptorName: string
    qualifierNames: string[]
  }>
  publicationType: string[]
  language: string[]
  keywords: string[]
  source: string
}

class PubMedAPI {
  private baseURL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/'
  private apiKey: string | null
  private requestDelay: number

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null
    this.requestDelay = apiKey ? 100 : 334 // Respect rate limits
  }

  async search(query: string, options: any = {}): Promise<PubMedSearchResult> {
    const {
      retmax = 100,
      retstart = 0,
      sort = 'relevance',
      useHistory = false
    } = options

    await this.delay(this.requestDelay)

    const searchParams = new URLSearchParams({
      db: 'pubmed',
      term: query,
      retmax: retmax.toString(),
      retstart: retstart.toString(),
      sort,
      retmode: 'json',
      ...(this.apiKey && { api_key: this.apiKey }),
      ...(useHistory && { usehistory: 'y' })
    })

    const response = await fetch(`${this.baseURL}esearch.fcgi?${searchParams}`, {
      method: 'GET',
      headers: { 'User-Agent': 'Searchmatic/1.0 (systematic-review-platform)' }
    })

    if (!response.ok) {
      throw new Error(`PubMed search failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      count: parseInt(data.esearchresult.count),
      ids: data.esearchresult.idlist || [],
      webenv: data.esearchresult.webenv,
      querykey: data.esearchresult.querykey
    }
  }

  async fetchDetails(pmids: string[]): Promise<string> {
    if (pmids.length === 0) return ''

    await this.delay(this.requestDelay)

    const params = new URLSearchParams({
      db: 'pubmed',
      id: pmids.join(','),
      retmode: 'xml',
      rettype: 'abstract',
      ...(this.apiKey && { api_key: this.apiKey })
    })

    const response = await fetch(`${this.baseURL}efetch.fcgi?${params}`, {
      method: 'GET',
      headers: { 'User-Agent': 'Searchmatic/1.0 (systematic-review-platform)' }
    })

    if (!response.ok) {
      throw new Error(`PubMed fetch failed: ${response.statusText}`)
    }

    return await response.text()
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

class PubMedXMLParser {
  parseArticles(xmlData: string): ArticleData[] {
    const articles: ArticleData[] = []
    
    // Simple XML parsing for PubMed articles
    const articleMatches = xmlData.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g)
    
    if (!articleMatches) return articles

    for (const articleXml of articleMatches) {
      try {
        const article = this.parseArticleXML(articleXml)
        if (article) articles.push(article)
      } catch (error) {
        console.error('Error parsing article XML:', error)
        continue
      }
    }

    return articles
  }

  private parseArticleXML(xml: string): ArticleData | null {
    try {
      const pmid = this.extractText(xml, /<PMID[^>]*>(.*?)<\/PMID>/)
      const title = this.extractText(xml, /<ArticleTitle>(.*?)<\/ArticleTitle>/)
      const abstract = this.extractAbstract(xml)
      const authors = this.extractAuthors(xml)
      const journal = this.extractJournal(xml)
      const publicationDate = this.extractPublicationDate(xml)
      const doi = this.extractDOI(xml)
      const meshTerms = this.extractMeshTerms(xml)
      const publicationType = this.extractPublicationType(xml)
      const language = this.extractLanguage(xml)

      if (!pmid || !title) return null

      return {
        pmid,
        title: this.cleanText(title),
        abstract: this.cleanText(abstract),
        authors,
        journal,
        publicationDate,
        doi,
        meshTerms,
        publicationType,
        language,
        keywords: [],
        source: 'pubmed'
      }
    } catch (error) {
      console.error('Failed to parse article XML:', error)
      return null
    }
  }

  private extractText(xml: string, regex: RegExp): string {
    const match = xml.match(regex)
    return match ? match[1] : ''
  }

  private extractAbstract(xml: string): string {
    const abstractMatch = xml.match(/<Abstract>([\s\S]*?)<\/Abstract>/)
    if (!abstractMatch) return ''

    const abstractXml = abstractMatch[1]
    const textMatches = abstractXml.match(/<AbstractText[^>]*>(.*?)<\/AbstractText>/g)
    
    if (!textMatches) return ''

    return textMatches.map(match => {
      const content = match.replace(/<AbstractText[^>]*>|<\/AbstractText>/g, '')
      return this.cleanText(content)
    }).join('\n\n')
  }

  private extractAuthors(xml: string): ArticleData['authors'] {
    const authors: ArticleData['authors'] = []
    const authorMatches = xml.match(/<Author[^>]*>([\s\S]*?)<\/Author>/g)

    if (authorMatches) {
      for (const authorXml of authorMatches) {
        const lastName = this.extractText(authorXml, /<LastName>(.*?)<\/LastName>/)
        const foreName = this.extractText(authorXml, /<ForeName>(.*?)<\/ForeName>/)
        const initials = this.extractText(authorXml, /<Initials>(.*?)<\/Initials>/)
        const affiliation = this.extractText(authorXml, /<Affiliation>(.*?)<\/Affiliation>/)

        if (lastName) {
          authors.push({
            lastName: this.cleanText(lastName),
            foreName: this.cleanText(foreName),
            initials: this.cleanText(initials),
            affiliation: this.cleanText(affiliation)
          })
        }
      }
    }

    return authors
  }

  private extractJournal(xml: string): ArticleData['journal'] {
    return {
      name: this.cleanText(this.extractText(xml, /<Title>(.*?)<\/Title>/)),
      abbreviation: this.cleanText(this.extractText(xml, /<ISOAbbreviation>(.*?)<\/ISOAbbreviation>/)),
      issn: this.extractText(xml, /<ISSN[^>]*>(.*?)<\/ISSN>/),
      volume: this.extractText(xml, /<Volume>(.*?)<\/Volume>/),
      issue: this.extractText(xml, /<Issue>(.*?)<\/Issue>/),
      pages: this.extractText(xml, /<MedlinePgn>(.*?)<\/MedlinePgn>/)
    }
  }

  private extractPublicationDate(xml: string): string {
    const year = this.extractText(xml, /<Year>(.*?)<\/Year>/)
    const month = this.extractText(xml, /<Month>(.*?)<\/Month>/) || '01'
    const day = this.extractText(xml, /<Day>(.*?)<\/Day>/) || '01'

    if (!year) return ''

    const monthNum = isNaN(parseInt(month)) ? '01' : month.padStart(2, '0')
    const dayNum = day.padStart(2, '0')

    return `${year}-${monthNum}-${dayNum}`
  }

  private extractDOI(xml: string): string {
    const doiMatch = xml.match(/<ArticleId IdType="doi">(.*?)<\/ArticleId>/)
    return doiMatch ? doiMatch[1] : ''
  }

  private extractMeshTerms(xml: string): ArticleData['meshTerms'] {
    const meshTerms: ArticleData['meshTerms'] = []
    const meshMatches = xml.match(/<MeshHeading>([\s\S]*?)<\/MeshHeading>/g)

    if (meshMatches) {
      for (const meshXml of meshMatches) {
        const descriptorName = this.extractText(meshXml, /<DescriptorName[^>]*>(.*?)<\/DescriptorName>/)
        const qualifierMatches = meshXml.match(/<QualifierName[^>]*>(.*?)<\/QualifierName>/g)
        
        const qualifierNames = qualifierMatches ? 
          qualifierMatches.map(q => this.cleanText(q.replace(/<QualifierName[^>]*>|<\/QualifierName>/g, ''))) : 
          []

        if (descriptorName) {
          meshTerms.push({
            descriptorName: this.cleanText(descriptorName),
            qualifierNames
          })
        }
      }
    }

    return meshTerms
  }

  private extractPublicationType(xml: string): string[] {
    const types: string[] = []
    const typeMatches = xml.match(/<PublicationType[^>]*>(.*?)<\/PublicationType>/g)

    if (typeMatches) {
      for (const typeXml of typeMatches) {
        const type = typeXml.replace(/<PublicationType[^>]*>|<\/PublicationType>/g, '')
        if (type) types.push(this.cleanText(type))
      }
    }

    return types
  }

  private extractLanguage(xml: string): string[] {
    const languages: string[] = []
    const langMatches = xml.match(/<Language>(.*?)<\/Language>/g)

    if (langMatches) {
      for (const langXml of langMatches) {
        const lang = langXml.replace(/<Language>|<\/Language>/g, '')
        if (lang) languages.push(this.cleanText(lang))
      }
    }

    return languages
  }

  private cleanText(text: string): string {
    return text.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim()
  }
}

class PubMedSearchService {
  private api: PubMedAPI
  private parser: PubMedXMLParser

  constructor(apiKey?: string) {
    this.api = new PubMedAPI(apiKey)
    this.parser = new PubMedXMLParser()
  }

  async searchArticles(searchRequest: SearchRequest): Promise<any> {
    const query = this.buildSearchQuery(searchRequest)
    const options = searchRequest.options || {}
    
    console.log('PubMed search query:', query)

    // Search for article IDs
    const searchResult = await this.api.search(query, {
      retmax: options.limit || 100,
      retstart: options.offset || 0
    })

    if (searchResult.count === 0) {
      return {
        articles: [],
        totalCount: 0,
        query,
        database: 'PubMed'
      }
    }

    // Fetch article details in batches
    const articles: ArticleData[] = []
    const batchSize = 20 // Smaller batch size for more reliable processing
    const ids = searchResult.ids.slice(0, Math.min(searchResult.ids.length, options.limit || 50))

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      try {
        const xmlData = await this.api.fetchDetails(batch)
        const batchArticles = this.parser.parseArticles(xmlData)
        articles.push(...batchArticles)
        
        console.log(`Processed batch ${i/batchSize + 1}/${Math.ceil(ids.length/batchSize)}: ${batchArticles.length} articles`)
      } catch (error) {
        console.error(`Error processing batch ${i/batchSize + 1}:`, error)
        continue
      }
    }

    return {
      articles,
      totalCount: searchResult.count,
      retrievedCount: articles.length,
      query,
      database: 'PubMed',
      searchDate: new Date().toISOString()
    }
  }

  private buildSearchQuery(searchRequest: SearchRequest): string {
    if (searchRequest.query) {
      return searchRequest.query
    }

    if (!searchRequest.protocol) {
      throw new Error('Either query or protocol must be provided')
    }

    const { protocol } = searchRequest
    const queryParts: string[] = []

    // Keywords
    if (protocol.keywords && protocol.keywords.length > 0) {
      const keywordQuery = protocol.keywords
        .map(kw => `"${kw}"[Title/Abstract]`)
        .join(' OR ')
      queryParts.push(`(${keywordQuery})`)
    }

    // MeSH terms
    if (protocol.meshTerms && protocol.meshTerms.length > 0) {
      const meshQuery = protocol.meshTerms
        .map(term => `"${term}"[MeSH Terms]`)
        .join(' OR ')
      queryParts.push(`(${meshQuery})`)
    }

    // Study types
    if (protocol.studyTypes && protocol.studyTypes.length > 0) {
      const studyTypeQuery = protocol.studyTypes
        .map(type => `"${type}"[Publication Type]`)
        .join(' OR ')
      queryParts.push(`(${studyTypeQuery})`)
    }

    // Date range
    if (protocol.dateRange) {
      const { startDate, endDate } = protocol.dateRange
      queryParts.push(
        `("${startDate}"[Date - Publication] : "${endDate}"[Date - Publication])`
      )
    }

    // Language filter
    if (protocol.languages && protocol.languages.length > 0) {
      const langQuery = protocol.languages
        .map(lang => `${lang}[Language]`)
        .join(' OR ')
      queryParts.push(`(${langQuery})`)
    }

    // Human studies filter
    if (protocol.includeHumans) {
      queryParts.push('humans[MeSH Terms]')
    }

    if (queryParts.length === 0) {
      throw new Error('No search criteria provided')
    }

    return queryParts.join(' AND ')
  }
}

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Authenticate user
    const { user, supabase } = await authenticateUser(req)

    const searchRequest: SearchRequest = await req.json()

    // Validate request
    if (!searchRequest.projectId) {
      throw new Error('Missing required field: projectId')
    }

    // Verify project ownership (skip for test projects)
    if (!searchRequest.projectId.startsWith('test-')) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', searchRequest.projectId)
        .eq('user_id', user.id)
        .single()

      if (projectError || !project) {
        throw new Error('Project not found or access denied')
      }
    }

    // Initialize PubMed service
    const pubmedApiKey = Deno.env.get('PUBMED_API_KEY') // Optional but recommended
    const searchService = new PubMedSearchService(pubmedApiKey)

    // Perform search
    const searchResults = await searchService.searchArticles(searchRequest)

    // Store search results in database (skip for test projects)
    if (!searchRequest.projectId.startsWith('test-') && searchResults.articles.length > 0) {
      try {
        // Store search query
        await supabase
          .from('search_queries')
          .insert({
            project_id: searchRequest.projectId,
            query_string: searchResults.query,
            database_name: 'PubMed',
            result_count: searchResults.totalCount,
            retrieved_count: searchResults.retrievedCount,
            executed_at: new Date().toISOString()
          })

        // Store articles (matching actual database schema)
        const articlesToInsert = searchResults.articles.map((article: ArticleData) => ({
          project_id: searchRequest.projectId,
          source: 'pubmed',
          title: article.title,
          authors: article.authors.map(a => `${a.foreName} ${a.lastName}`),
          abstract: article.abstract,
          publication_year: article.publicationDate ? parseInt(article.publicationDate.split('-')[0]) : null,
          journal: article.journal.name,
          doi: article.doi || null,
          pmid: article.pmid,
          pdf_url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
          status: 'pending',
          metadata: {
            meshTerms: article.meshTerms,
            publicationType: article.publicationType,
            language: article.language,
            journal_details: article.journal,
            pubmed_url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`
          }
        }))

        await supabase
          .from('articles')
          .upsert(articlesToInsert, { 
            onConflict: 'project_id,pmid',
            ignoreDuplicates: true 
          })

        console.log(`Stored ${articlesToInsert.length} articles in database`)
      } catch (dbError) {
        console.error('Database storage error:', dbError)
        // Don't fail the request if database storage fails
      }
    }

    return createSuccessResponse({
      success: true,
      ...searchResults,
      user_id: user.id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Article search error:', error)
    return createErrorResponse(error, error.message.includes('Unauthorized') ? 401 : 500)
  }
})

/* Usage Examples:

1. Simple keyword search:
POST /functions/v1/search-articles
{
  "projectId": "uuid",
  "query": "diabetes AND exercise",
  "options": { "limit": 50 }
}

2. Protocol-based search:
POST /functions/v1/search-articles
{
  "projectId": "uuid",
  "protocol": {
    "keywords": ["diabetes", "exercise therapy"],
    "meshTerms": ["Diabetes Mellitus", "Exercise Therapy"],
    "dateRange": {
      "startDate": "2020/01/01",
      "endDate": "2024/12/31"
    },
    "studyTypes": ["Randomized Controlled Trial"],
    "languages": ["english"],
    "includeHumans": true
  },
  "options": { "limit": 100 }
}

*/