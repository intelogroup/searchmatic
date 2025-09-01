import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Search, Database, Calendar, Filter, Download, ChevronRight, BookOpen, Users, FileText, ExternalLink } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  authors: string[]
  abstract: string
  journal: string
  publicationDate: string
  doi: string
  pmid?: string
  source: string
  selected: boolean
}

interface SearchFilters {
  dateFrom: string
  dateTo: string
  studyTypes: string[]
  languages: string[]
}

export default function SearchDatabase() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDatabase, setSelectedDatabase] = useState('pubmed')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    dateFrom: '',
    dateTo: '',
    studyTypes: [],
    languages: ['english']
  })

  const databases = [
    { id: 'pubmed', name: 'PubMed', icon: '🔬', description: 'Biomedical literature' },
    { id: 'scopus', name: 'Scopus', icon: '📚', description: 'Multidisciplinary abstracts' },
    { id: 'wos', name: 'Web of Science', icon: '🌐', description: 'Citation database' },
    { id: 'cochrane', name: 'Cochrane Library', icon: '⚕️', description: 'Systematic reviews' },
    { id: 'embase', name: 'Embase', icon: '💊', description: 'Pharmacological research' }
  ]

  const studyTypes = [
    'Randomized Controlled Trial',
    'Systematic Review',
    'Meta-Analysis',
    'Cohort Study',
    'Case-Control Study',
    'Cross-Sectional Study',
    'Case Report',
    'Clinical Trial'
  ]

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      // Call edge function to search database
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('search-articles', {
        body: {
          query: searchQuery,
          database: selectedDatabase,
          filters: filters,
          projectId: projectId
        }
      })

      if (error) throw error

      // Mock data for demonstration
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'Effectiveness of AI-assisted systematic reviews: A randomized controlled trial',
          authors: ['Smith J', 'Johnson K', 'Williams R'],
          abstract: 'Background: Systematic reviews are essential for evidence-based medicine but are time-consuming. This study evaluates the effectiveness of AI assistance in conducting systematic reviews. Methods: We conducted a randomized controlled trial...',
          journal: 'Journal of Medical Internet Research',
          publicationDate: '2024-03-15',
          doi: '10.2196/12345',
          pmid: '38476543',
          source: selectedDatabase,
          selected: false
        },
        {
          id: '2',
          title: 'Machine learning approaches for literature screening: A systematic review',
          authors: ['Chen L', 'Park S', 'Davis M'],
          abstract: 'Objective: To systematically review machine learning approaches used for title and abstract screening in systematic reviews. Design: Systematic review and meta-analysis...',
          journal: 'BMC Medical Research Methodology',
          publicationDate: '2024-02-28',
          doi: '10.1186/s12874-024-02156-6',
          source: selectedDatabase,
          selected: false
        },
        {
          id: '3',
          title: 'Natural language processing in healthcare: Applications and challenges',
          authors: ['Anderson T', 'Brown C', 'Miller D', 'Taylor E'],
          abstract: 'Natural language processing (NLP) has emerged as a powerful tool in healthcare, offering solutions for clinical documentation, literature review, and patient care...',
          journal: 'Nature Medicine',
          publicationDate: '2024-01-10',
          doi: '10.1038/s41591-023-02751-4',
          source: selectedDatabase,
          selected: false
        }
      ]

      setResults(mockResults)
      setTotalResults(156) // Mock total
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  const toggleResultSelection = (id: string) => {
    setResults(results.map(r => 
      r.id === id ? { ...r, selected: !r.selected } : r
    ))
  }

  const importSelected = async () => {
    const selectedResults = results.filter(r => r.selected)
    if (selectedResults.length === 0) {
      alert('Please select articles to import')
      return
    }

    try {
      // Import articles to the project
      for (const result of selectedResults) {
        await supabase.from('articles').insert({
          project_id: projectId,
          title: result.title,
          authors: result.authors,
          abstract: result.abstract,
          journal: result.journal,
          publication_date: result.publicationDate,
          doi: result.doi,
          pmid: result.pmid,
          source: result.source,
          status: 'pending'
        })
      }

      navigate(`/projects/${projectId}/articles`)
    } catch (error) {
      console.error('Import error:', error)
    }
  }

  const buildSearchString = () => {
    // Build advanced search string based on protocol
    return `(${searchQuery}) AND (systematic review OR meta-analysis)`
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Search</h1>
          <p className="text-gray-600">Search literature databases for your systematic review</p>
        </div>

        {/* Database Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Database</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {databases.map((db) => (
              <button
                key={db.id}
                onClick={() => setSelectedDatabase(db.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedDatabase === db.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{db.icon}</div>
                <div className="font-medium text-sm">{db.name}</div>
                <div className="text-xs text-gray-500 mt-1">{db.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Query
              </label>
              <div className="relative">
                <textarea
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter your search terms, e.g., (diabetes AND exercise) OR (physical activity AND glucose)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tip: Use Boolean operators (AND, OR, NOT) and parentheses for complex queries
              </p>
            </div>

            {/* Filters Toggle */}
            <div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide' : 'Show'} Advanced Filters
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Publication Date Range
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <span className="self-center">to</span>
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Study Types
                    </label>
                    <select
                      multiple
                      value={filters.studyTypes}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value)
                        setFilters({...filters, studyTypes: selected})
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      size={3}
                    >
                      {studyTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Search Button */}
            <div className="flex justify-between items-center">
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {searching ? (
                  <>
                    <LoadingSpinner size="small" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search {databases.find(d => d.id === selectedDatabase)?.name}
                  </>
                )}
              </button>

              {results.length > 0 && (
                <div className="text-sm text-gray-600">
                  Found {totalResults.toLocaleString()} results
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold">Search Results</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setResults(results.map(r => ({...r, selected: true})))}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Select All
                </button>
                <button
                  onClick={() => setResults(results.map(r => ({...r, selected: false})))}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Clear Selection
                </button>
                <button
                  onClick={importSelected}
                  disabled={!results.some(r => r.selected)}
                  className="px-4 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  Import Selected ({results.filter(r => r.selected).length})
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {results.map((result) => (
                <div key={result.id} className="p-4 hover:bg-gray-50">
                  <div className="flex gap-4">
                    <input
                      type="checkbox"
                      checked={result.selected}
                      onChange={() => toggleResultSelection(result.id)}
                      className="mt-1 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{result.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {result.authors.slice(0, 3).join(', ')}
                        {result.authors.length > 3 && ' et al.'}
                        {' • '}
                        {result.journal}
                        {' • '}
                        {result.publicationDate}
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-3">{result.abstract}</p>
                      <div className="flex gap-4 mt-2">
                        {result.doi && (
                          <a
                            href={`https://doi.org/${result.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            DOI <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {result.pmid && (
                          <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${result.pmid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            PubMed <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {results.length < totalResults && (
              <div className="p-4 border-t border-gray-200 text-center">
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Load More Results
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}