import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Database, 
  Plus,
  Loader2,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Clock
} from 'lucide-react'

interface SearchPanelProps {
  projectId: string
  className?: string
}

interface SearchQuery {
  keywords: string
  database: 'pubmed' | 'scopus' | 'web_of_science' | 'cochrane' | 'all'
  yearFrom: string
  yearTo: string
  studyTypes: string[]
  limitResults: number
}

interface SearchResult {
  id: string
  title: string
  authors: string
  journal: string
  year: number
  abstract: string
  doi?: string
  pmid?: string
  url?: string
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ 
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({
    keywords: '',
    database: 'pubmed',
    yearFrom: '',
    yearTo: '',
    studyTypes: ['article'],
    limitResults: 100
  })

  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedResults, setSelectedResults] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.keywords.trim()) {
      setError('Please enter search keywords')
      return
    }

    setIsSearching(true)
    setError(null)
    setHasSearched(false)

    try {
      // For MVP, we'll simulate a search with demo data
      // In production, this would call external APIs like PubMed, Scopus, etc.
      
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API delay
      
      const mockResults: SearchResult[] = [
        {
          id: 'mock-1',
          title: 'Systematic review methodology in medical research: A comprehensive overview',
          authors: 'Smith, J.A., Johnson, B.C., Williams, D.E.',
          journal: 'Medical Research Methods',
          year: 2023,
          abstract: 'This systematic review provides a comprehensive overview of methodology best practices in medical research. The study examines various approaches to systematic literature review and meta-analysis...',
          doi: '10.1001/example.2023.001',
          pmid: '12345678',
          url: 'https://example.com/article/1'
        },
        {
          id: 'mock-2', 
          title: 'Evidence-based approaches to literature synthesis in healthcare',
          authors: 'Brown, K.L., Davis, M.R.',
          journal: 'Healthcare Evidence Review',
          year: 2022,
          abstract: 'An examination of evidence-based methodologies for conducting comprehensive literature synthesis in healthcare research domains...',
          doi: '10.1002/example.2022.002',
          url: 'https://example.com/article/2'
        },
        {
          id: 'mock-3',
          title: 'Quality assessment frameworks for systematic reviews',
          authors: 'Wilson, A.B., Taylor, C.D., Anderson, F.G.',
          journal: 'Review Methodology Quarterly',
          year: 2023,
          abstract: 'This paper presents comprehensive quality assessment frameworks specifically designed for systematic review evaluation...',
          pmid: '87654321'
        }
      ]

      setSearchResults(mockResults)
      setHasSearched(true)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const handleImportSelected = async () => {
    if (selectedResults.length === 0) {
      setError('Please select articles to import')
      return
    }

    // TODO: Implement actual import functionality
    // This would create studies in the project using the study service
    console.log('Importing articles:', selectedResults)
    
    // Reset selection after import
    setSelectedResults([])
  }

  const toggleResultSelection = (resultId: string) => {
    setSelectedResults(prev => 
      prev.includes(resultId)
        ? prev.filter(id => id !== resultId)
        : [...prev, resultId]
    )
  }

  const selectAllResults = () => {
    if (selectedResults.length === searchResults.length) {
      setSelectedResults([])
    } else {
      setSelectedResults(searchResults.map(r => r.id))
    }
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Database Search</CardTitle>
          </div>
          {searchResults.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {searchResults.length} results
            </Badge>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-2 rounded flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="ml-auto h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4 pt-0">
        {/* Search Form */}
        <div className="space-y-4 pb-4 border-b">
          <div>
            <label className="text-sm font-medium mb-2 block">Keywords *</label>
            <Textarea
              value={searchQuery.keywords}
              onChange={(e) => setSearchQuery(prev => ({ ...prev, keywords: e.target.value }))}
              placeholder="Enter search terms (e.g., systematic review AND methodology)"
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Database</label>
              <Select
                value={searchQuery.database}
                onValueChange={(value) => setSearchQuery(prev => ({ 
                  ...prev, 
                  database: value as SearchQuery['database'] 
                }))}
              >
                <SelectTrigger>
                  <Database className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pubmed">PubMed</SelectItem>
                  <SelectItem value="scopus">Scopus</SelectItem>
                  <SelectItem value="web_of_science">Web of Science</SelectItem>
                  <SelectItem value="cochrane">Cochrane Library</SelectItem>
                  <SelectItem value="all">All Databases</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Limit Results</label>
              <Select
                value={searchQuery.limitResults.toString()}
                onValueChange={(value) => setSearchQuery(prev => ({ 
                  ...prev, 
                  limitResults: parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 results</SelectItem>
                  <SelectItem value="100">100 results</SelectItem>
                  <SelectItem value="250">250 results</SelectItem>
                  <SelectItem value="500">500 results</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Year From</label>
              <Input
                type="number"
                value={searchQuery.yearFrom}
                onChange={(e) => setSearchQuery(prev => ({ ...prev, yearFrom: e.target.value }))}
                placeholder="2020"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Year To</label>
              <Input
                type="number"
                value={searchQuery.yearTo}
                onChange={(e) => setSearchQuery(prev => ({ ...prev, yearTo: e.target.value }))}
                placeholder="2024"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.keywords.trim()}
            className="w-full"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching {searchQuery.database}...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search Database
              </>
            )}
          </Button>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="flex-1 flex flex-col">
            {searchResults.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div className="space-y-2">
                  <Search className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No results found</p>
                  <p className="text-xs text-muted-foreground">Try different keywords or adjust filters</p>
                </div>
              </div>
            ) : (
              <>
                {/* Bulk Actions */}
                <div className="flex items-center justify-between mb-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllResults}
                    >
                      {selectedResults.length === searchResults.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedResults.length} of {searchResults.length} selected
                    </span>
                  </div>
                  
                  {selectedResults.length > 0 && (
                    <Button
                      size="sm"
                      onClick={handleImportSelected}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Import Selected
                    </Button>
                  )}
                </div>

                {/* Results List */}
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {searchResults.map((result) => (
                    <div 
                      key={result.id}
                      className={`border rounded-lg p-4 space-y-2 transition-colors ${
                        selectedResults.includes(result.id) ? 'bg-primary/5 border-primary' : 'hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedResults.includes(result.id)}
                          onChange={() => toggleResultSelection(result.id)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1 space-y-2">
                          <h4 className="font-medium text-sm leading-tight">{result.title}</h4>
                          
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>{result.authors}</p>
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {result.journal}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {result.year}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {result.abstract}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {result.doi && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                  DOI: {result.doi}
                                </span>
                              )}
                              {result.pmid && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                  PMID: {result.pmid}
                                </span>
                              )}
                            </div>

                            {result.url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => window.open(result.url, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Empty State for No Search */}
        {!hasSearched && !isSearching && searchResults.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-center">
            <div className="space-y-4">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Search Academic Databases</h3>
                <p className="text-sm text-muted-foreground max-w-[300px]">
                  Search PubMed, Scopus, and other databases to find relevant articles 
                  for your systematic review.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SearchPanel