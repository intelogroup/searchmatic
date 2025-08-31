import React, { useState, useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { pubmedAPI } from '../services/pubmedApi'
import { SearchFilters, PubMedArticle, ArticleSearchResult, PublicationType, StudyType } from '../types/articles'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Plus, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Settings,
  Database,
  FileText
} from 'lucide-react'

interface ArticleSearchProps {
  projectId: string
  protocolId?: string
  onImportComplete?: (count: number) => void
}

interface SearchState {
  isSearching: boolean
  results: ArticleSearchResult | null
  error: string | null
  selectedArticles: Set<string>
  importStatus: Record<string, 'pending' | 'importing' | 'completed' | 'error'>
}

const PUBLICATION_TYPES: PublicationType[] = [
  'Journal Article',
  'Randomized Controlled Trial',
  'Clinical Trial',
  'Systematic Review',
  'Meta-Analysis',
  'Review',
  'Case Reports',
  'Comparative Study'
]

const STUDY_TYPES: StudyType[] = [
  'randomized_controlled_trial',
  'systematic_review',
  'meta_analysis',
  'clinical_trial',
  'case_control',
  'cohort',
  'cross_sectional'
]

export function ArticleSearch({ projectId, protocolId, onImportComplete }: ArticleSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    maxResults: 50,
    sortBy: 'relevance'
  })
  const [searchState, setSearchState] = useState<SearchState>({
    isSearching: false,
    results: null,
    error: null,
    selectedArticles: new Set(),
    importStatus: {}
  })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [protocol, setProtocol] = useState<any>(null)
  const supabase = useSupabaseClient()

  useEffect(() => {
    if (protocolId) {
      loadProtocol()
    }
  }, [protocolId])

  const loadProtocol = async () => {
    try {
      const { data, error } = await supabase
        .from('protocols')
        .select('*')
        .eq('id', protocolId)
        .single()

      if (error) throw error

      setProtocol(data)
      
      // Pre-fill search filters from protocol PICO components
      if (data) {
        setFilters(prev => ({
          ...prev,
          population: data.population || prev.population,
          intervention: data.intervention || prev.intervention,
          comparison: data.comparison || prev.comparison,
          outcome: data.outcome || prev.outcome,
          query: data.keywords?.join(' AND ') || prev.query
        }))
      }
    } catch (error) {
      console.error('Error loading protocol:', error)
    }
  }

  const handleSearch = async () => {
    if (!filters.query && !filters.population && !filters.intervention) {
      setSearchState(prev => ({
        ...prev,
        error: 'Please enter search terms or PICO components'
      }))
      return
    }

    setSearchState(prev => ({
      ...prev,
      isSearching: true,
      error: null,
      results: null
    }))

    try {
      const results = await pubmedAPI.searchArticles(filters)
      
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        results,
        selectedArticles: new Set()
      }))

      // Save search history
      await saveSearchHistory(results)

    } catch (error) {
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        error: error instanceof Error ? error.message : 'Search failed'
      }))
    }
  }

  const saveSearchHistory = async (results: ArticleSearchResult) => {
    try {
      await supabase
        .from('search_queries')
        .insert({
          project_id: projectId,
          database_name: 'pubmed',
          query_string: results.query,
          result_count: results.totalCount,
          executed_at: new Date().toISOString()
        })
    } catch (error) {
      console.warn('Failed to save search history:', error)
    }
  }

  const handleSelectArticle = (pmid: string) => {
    setSearchState(prev => {
      const newSelected = new Set(prev.selectedArticles)
      if (newSelected.has(pmid)) {
        newSelected.delete(pmid)
      } else {
        newSelected.add(pmid)
      }
      return {
        ...prev,
        selectedArticles: newSelected
      }
    })
  }

  const handleSelectAll = () => {
    if (!searchState.results) return

    setSearchState(prev => {
      const allPmids = searchState.results!.articles.map(a => a.pmid)
      const newSelected = prev.selectedArticles.size === allPmids.length 
        ? new Set() 
        : new Set(allPmids)
      
      return {
        ...prev,
        selectedArticles: newSelected
      }
    })
  }

  const importSelectedArticles = async () => {
    if (!searchState.results || searchState.selectedArticles.size === 0) return

    const selectedPmids = Array.from(searchState.selectedArticles)
    const selectedArticles = searchState.results.articles.filter(a => 
      selectedPmids.includes(a.pmid)
    )

    // Set all selected articles to importing status
    setSearchState(prev => ({
      ...prev,
      importStatus: {
        ...prev.importStatus,
        ...Object.fromEntries(selectedPmids.map(pmid => [pmid, 'importing' as const]))
      }
    }))

    let successCount = 0
    let errorCount = 0

    for (const article of selectedArticles) {
      try {
        const importedArticle = pubmedAPI.convertToImportedArticle(article, projectId)
        
        // Check for existing article
        const { data: existing } = await supabase
          .from('articles')
          .select('id')
          .eq('pmid', article.pmid)
          .eq('project_id', projectId)
          .single()

        if (existing) {
          setSearchState(prev => ({
            ...prev,
            importStatus: {
              ...prev.importStatus,
              [article.pmid]: 'error'
            }
          }))
          errorCount++
          continue
        }

        // Import article
        const { error: insertError } = await supabase
          .from('articles')
          .insert({
            project_id: projectId,
            external_id: importedArticle.externalId,
            source: importedArticle.source,
            title: importedArticle.title,
            authors: importedArticle.authors,
            abstract: importedArticle.abstract,
            publication_date: importedArticle.publicationDate?.toISOString().split('T')[0],
            journal: importedArticle.journal,
            doi: importedArticle.doi,
            pmid: importedArticle.pmid,
            url: importedArticle.url,
            status: 'pending',
            metadata: {
              ...importedArticle.metadata,
              searchQuery: searchState.results.query
            }
          })

        if (insertError) {
          throw insertError
        }

        setSearchState(prev => ({
          ...prev,
          importStatus: {
            ...prev.importStatus,
            [article.pmid]: 'completed'
          }
        }))
        successCount++

      } catch (error) {
        console.error(`Error importing article ${article.pmid}:`, error)
        setSearchState(prev => ({
          ...prev,
          importStatus: {
            ...prev.importStatus,
            [article.pmid]: 'error'
          }
        }))
        errorCount++
      }
    }

    onImportComplete?.(successCount)
    
    // Clear selection after import
    setTimeout(() => {
      setSearchState(prev => ({
        ...prev,
        selectedArticles: new Set()
      }))
    }, 2000)
  }

  const getImportButtonText = () => {
    const count = searchState.selectedArticles.size
    if (count === 0) return 'Select articles to import'
    
    const importing = Array.from(searchState.selectedArticles).some(pmid => 
      searchState.importStatus[pmid] === 'importing'
    )
    
    if (importing) return 'Importing...'
    return `Import ${count} article${count === 1 ? '' : 's'}`
  }

  const formatAuthors = (authors: string[], maxShow = 3) => {
    if (authors.length <= maxShow) {
      return authors.join(', ')
    }
    return `${authors.slice(0, maxShow).join(', ')}, et al.`
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Article Search & Import
          </h2>
          {protocol && (
            <div className="text-sm text-gray-500">
              Using protocol: <span className="font-medium">{protocol.title}</span>
            </div>
          )}
        </div>

        {/* Main Search */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-grow">
              <input
                type="text"
                value={filters.query || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                placeholder="Enter search terms, keywords, or research question..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button
              onClick={handleSearch}
              disabled={searchState.isSearching}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {searchState.isSearching ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </button>
          </div>

          {/* PICO Components */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Population</label>
              <input
                type="text"
                value={filters.population || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, population: e.target.value }))}
                placeholder="Study population"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Intervention</label>
              <input
                type="text"
                value={filters.intervention || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, intervention: e.target.value }))}
                placeholder="Intervention"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Comparison</label>
              <input
                type="text"
                value={filters.comparison || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, comparison: e.target.value }))}
                placeholder="Comparison/control"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Outcome</label>
              <input
                type="text"
                value={filters.outcome || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, outcome: e.target.value }))}
                placeholder="Primary outcome"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Year</label>
                <input
                  type="number"
                  value={filters.startYear || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, startYear: e.target.value }))}
                  placeholder="e.g. 2020"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Year</label>
                <input
                  type="number"
                  value={filters.endYear || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, endYear: e.target.value }))}
                  placeholder="e.g. 2024"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Results</label>
                <select
                  value={filters.maxResults || 50}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sort By</label>
                <select
                  value={filters.sortBy || 'relevance'}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Publication Date</option>
                  <option value="first_author">First Author</option>
                  <option value="journal">Journal</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Publication Types</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {PUBLICATION_TYPES.map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.publicationTypes?.includes(type) || false}
                        onChange={(e) => {
                          setFilters(prev => {
                            const types = prev.publicationTypes || []
                            if (e.target.checked) {
                              return { ...prev, publicationTypes: [...types, type] }
                            } else {
                              return { ...prev, publicationTypes: types.filter(t => t !== type) }
                            }
                          })
                        }}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Study Types</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {STUDY_TYPES.map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.studyTypes?.includes(type) || false}
                        onChange={(e) => {
                          setFilters(prev => {
                            const types = prev.studyTypes || []
                            if (e.target.checked) {
                              return { ...prev, studyTypes: [...types, type] }
                            } else {
                              return { ...prev, studyTypes: types.filter(t => t !== type) }
                            }
                          })
                        }}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {searchState.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Search Error</h3>
              <div className="mt-2 text-sm text-red-700">{searchState.error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchState.results && (
        <div className="bg-white shadow rounded-lg">
          {/* Results Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Search Results
                </h3>
                <div className="text-sm text-gray-500">
                  {searchState.results.totalCount.toLocaleString()} articles found
                  {searchState.results.hasMore && ` (showing first ${searchState.results.articles.length})`}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600">
                  {searchState.selectedArticles.size} selected
                </div>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {searchState.selectedArticles.size === searchState.results.articles.length 
                    ? 'Deselect All' 
                    : 'Select All'
                  }
                </button>
                <button
                  onClick={importSelectedArticles}
                  disabled={searchState.selectedArticles.size === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center text-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {getImportButtonText()}
                </button>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="divide-y divide-gray-200">
            {searchState.results.articles.map((article) => (
              <ArticleResultItem
                key={article.pmid}
                article={article}
                isSelected={searchState.selectedArticles.has(article.pmid)}
                onSelect={() => handleSelectArticle(article.pmid)}
                importStatus={searchState.importStatus[article.pmid]}
              />
            ))}
          </div>

          {/* Load More */}
          {searchState.results.hasMore && (
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setFilters(prev => ({
                    ...prev,
                    offset: searchState.results!.nextOffset
                  }))
                  handleSearch()
                }}
                className="w-full py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Load More Results
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ArticleResultItemProps {
  article: PubMedArticle
  isSelected: boolean
  onSelect: () => void
  importStatus?: 'pending' | 'importing' | 'completed' | 'error'
}

function ArticleResultItem({ article, isSelected, onSelect, importStatus }: ArticleResultItemProps) {
  const getStatusIcon = () => {
    switch (importStatus) {
      case 'importing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const formatAuthors = (authors: string[]) => {
    if (authors.length <= 3) {
      return authors.join(', ')
    }
    return `${authors.slice(0, 3).join(', ')}, et al.`
  }

  return (
    <div className={`p-6 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          disabled={importStatus === 'importing'}
          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {article.title}
            </h4>
            <div className="flex items-center space-x-2 ml-4">
              {getStatusIcon()}
              <button
                onClick={() => window.open(article.url, '_blank')}
                className="text-gray-400 hover:text-gray-600"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div>
              <strong>Authors:</strong> {formatAuthors(article.authors)}
            </div>
            <div className="flex items-center space-x-4">
              <span><strong>Journal:</strong> {article.journal}</span>
              <span><strong>Date:</strong> {article.publicationDate}</span>
              {article.doi && (
                <span><strong>DOI:</strong> {article.doi}</span>
              )}
              <span><strong>PMID:</strong> {article.pmid}</span>
            </div>
          </div>

          {article.abstract && (
            <div className="mt-3">
              <p className="text-sm text-gray-700 line-clamp-3">
                {article.abstract}
              </p>
            </div>
          )}

          {article.isOpenAccess && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Open Access
              </span>
            </div>
          )}

          {importStatus === 'error' && (
            <div className="mt-2 text-sm text-red-600">
              Import failed - article may already exist in project
            </div>
          )}
        </div>
      </div>
    </div>
  )
}