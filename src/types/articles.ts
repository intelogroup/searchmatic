export interface SearchFilters {
  // Basic search
  query?: string
  
  // PICO components
  population?: string
  intervention?: string
  comparison?: string
  outcome?: string
  
  // Date filters
  startYear?: string
  endYear?: string
  
  // Publication filters
  publicationTypes?: PublicationType[]
  studyTypes?: StudyType[]
  languages?: string[]
  journals?: string[]
  
  // Advanced filters
  hasAbstract?: boolean
  hasFullText?: boolean
  isFreeFullText?: boolean
  isOpenAccess?: boolean
  
  // Pagination and sorting
  maxResults?: number
  offset?: number
  sortBy?: 'relevance' | 'date' | 'first_author' | 'last_author' | 'journal' | 'title'
}

export type PublicationType = 
  | 'Journal Article'
  | 'Randomized Controlled Trial' 
  | 'Clinical Trial'
  | 'Systematic Review'
  | 'Meta-Analysis'
  | 'Review'
  | 'Case Reports'
  | 'Comparative Study'
  | 'Editorial'
  | 'Letter'
  | 'Comment'

export type StudyType = 
  | 'randomized_controlled_trial'
  | 'systematic_review'
  | 'meta_analysis'
  | 'clinical_trial'
  | 'case_control'
  | 'cohort'
  | 'cross_sectional'
  | 'case_report'
  | 'qualitative'

export interface PubMedArticle {
  pmid: string
  title: string
  authors: string[]
  abstract: string
  journal: string
  publicationDate: string
  doi?: string
  pmcId?: string
  publicationType: PublicationType[]
  meshTerms: string[]
  keywords: string[]
  language: string
  source: 'pubmed'
  url: string
  relevanceScore: number
  isOpenAccess: boolean
}

export interface ArticleSearchResult {
  articles: PubMedArticle[]
  totalCount: number
  hasMore: boolean
  nextOffset: number
  query: string
  searchTime: number
}

export interface ImportedArticle {
  externalId: string
  source: 'pubmed' | 'scopus' | 'wos' | 'manual' | 'other'
  title: string
  authors: string[]
  abstract?: string
  publicationDate?: Date | null
  journal?: string
  doi?: string
  pmid?: string
  url?: string
  metadata: {
    pmcId?: string
    publicationType?: PublicationType[]
    meshTerms?: string[]
    keywords?: string[]
    language?: string
    isOpenAccess?: boolean
    relevanceScore?: number
    importedAt: string
    searchQuery?: string
    [key: string]: any
  }
}

export interface ArticleScreening {
  id: string
  articleId: string
  projectId: string
  screenerId: string
  decision: ScreeningDecision
  notes?: string
  criteria: {
    population?: ScreeningCriteria
    intervention?: ScreeningCriteria
    comparison?: ScreeningCriteria
    outcome?: ScreeningCriteria
    studyDesign?: ScreeningCriteria
    language?: ScreeningCriteria
    timeframe?: ScreeningCriteria
    accessibility?: ScreeningCriteria
  }
  conflictsWith?: string[] // Other screening IDs that conflict
  isResolved: boolean
  createdAt: string
  updatedAt: string
}

export type ScreeningDecision = 'include' | 'exclude' | 'maybe' | 'conflict'

export interface ScreeningCriteria {
  meets: boolean
  notes?: string
  reasoning?: string
}

export interface DuplicateDetection {
  id: string
  article1Id: string
  article2Id: string
  similarityScore: number
  matchedFields: DuplicateMatchField[]
  status: 'potential' | 'confirmed' | 'dismissed'
  reviewedBy?: string
  reviewedAt?: string
  notes?: string
}

export type DuplicateMatchField = 
  | 'title'
  | 'doi'
  | 'pmid'
  | 'authors'
  | 'journal'
  | 'publication_date'

export interface SearchHistory {
  id: string
  projectId: string
  userId: string
  query: string
  filters: SearchFilters
  source: 'pubmed' | 'scopus' | 'wos'
  resultsCount: number
  importedCount: number
  executedAt: string
  notes?: string
}

export interface BatchImportJob {
  id: string
  projectId: string
  userId: string
  source: 'pubmed' | 'scopus' | 'wos' | 'file'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  totalItems: number
  processedItems: number
  successfulImports: number
  failedImports: number
  errors?: string[]
  startedAt: string
  completedAt?: string
  estimatedCompletionAt?: string
}

export interface ArticleImportSettings {
  projectId: string
  enableDuplicateDetection: boolean
  duplicateThreshold: number
  autoScreening: {
    enabled: boolean
    rules: AutoScreeningRule[]
  }
  defaultScreener?: string
  importFields: string[]
  customFieldMappings: Record<string, string>
}

export interface AutoScreeningRule {
  id: string
  field: string
  operator: 'contains' | 'not_contains' | 'equals' | 'regex' | 'exists'
  value: string
  action: 'include' | 'exclude'
  priority: number
}