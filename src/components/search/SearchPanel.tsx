/**
 * Search Panel Component
 * Comprehensive academic database search interface with QueryBuilder integration
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Database, 
  Plus,
  Loader2,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Clock,
  CheckCircle,
  X,
  Download,
  Eye,
  Users,
  Calendar
} from 'lucide-react'
import { QueryBuilder } from './QueryBuilder'
import { searchService, type SearchQuery, type SearchResult, type SearchResponse, type DatabaseCount } from '@/services/searchService'
import { studyService } from '@/services/studyService'
import { errorLogger } from '@/lib/error-logger'

interface SearchPanelProps {
  projectId: string
  protocolId?: string
  className?: string
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ 
  projectId,
  protocolId,
  className = ''
}) => {
  const [searchResponses, setSearchResponses] = useState<SearchResponse[]>([])
  const [selectedResults, setSelectedResults] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentQuery, setCurrentQuery] = useState<SearchQuery | null>(null)
  const [activeTab, setActiveTab] = useState('query-builder')

  const handleQueryExecute = async (query: SearchQuery, estimatedCounts: DatabaseCount[]) => {
    setIsSearching(true)
    setError(null)
    setCurrentQuery(query)

    try {
      errorLogger.logInfo('Starting database search', {
        feature: 'search-panel',
        action: 'execute-search',
        metadata: { 
          databases: query.databases.length,
          keywords: query.keywords.length,
          estimatedTotal: estimatedCounts.reduce((sum, c) => sum + Math.max(0, c.count), 0)
        }
      })

      // Search all selected databases concurrently
      const responses = await searchService.searchMultipleDatabases(
        query.databases, 
        query, 
        { limit: 50 } // Start with 50 results per database
      )

      setSearchResponses(responses)
      setActiveTab('results')

      const totalResults = responses.reduce((sum, r) => sum + r.results.length, 0)
      const totalCount = responses.reduce((sum, r) => sum + r.totalCount, 0)

      errorLogger.logInfo('Database search completed', {
        feature: 'search-panel',
        action: 'search-completed',
        metadata: { 
          databases: responses.length,
          retrievedResults: totalResults,
          totalAvailable: totalCount,
          avgSearchTime: responses.reduce((sum, r) => sum + r.searchTime, 0) / responses.length
        }
      })

    } catch (searchError) {
      const errorMessage = searchError instanceof Error ? searchError.message : 'Search failed'
      setError(errorMessage)
      
      errorLogger.logError('Database search failed', {
        feature: 'search-panel',
        action: 'search-error',
        metadata: { 
          databases: query.databases,
          error: errorMessage
        }
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleImportSelected = async () => {
    if (selectedResults.length === 0) {
      setError('Please select articles to import')
      return
    }

    setIsImporting(true)
    setError(null)

    try {
      // Get selected result objects
      const allResults = searchResponses.flatMap(response => response.results)
      const selectedResultObjects = allResults.filter(result => 
        selectedResults.includes(result.id)
      )

      errorLogger.logInfo(`Importing ${selectedResults.length} articles`, {
        feature: 'search-panel',
        action: 'import-articles',
        metadata: { 
          projectId,
          count: selectedResults.length,
          databases: [...new Set(selectedResultObjects.map(r => r.database))]
        }
      })

      // Import each selected result as a study
      const importPromises = selectedResultObjects.map(result => 
        studyService.createStudy(projectId, {
          title: result.title,
          authors: result.authors.join(', '),
          publication_year: result.publicationDate ? new Date(result.publicationDate).getFullYear() : undefined,
          journal: result.journal,
          doi: result.doi,
          pmid: result.pmid,
          url: result.url,
          study_type: result.studyType as any || 'article',
          abstract: result.abstract,
          keywords: result.keywords,
          citation: formatCitation(result)
        })
      )

      await Promise.all(importPromises)

      // Reset selection after successful import
      setSelectedResults([])
      
      errorLogger.logInfo('Articles imported successfully', {
        feature: 'search-panel',
        action: 'import-success',
        metadata: { 
          projectId,
          importedCount: selectedResults.length
        }
      })

      // Show success message
      setError(`✅ Successfully imported ${selectedResultObjects.length} articles to your project`)
      
      // Clear success message after 3 seconds
      setTimeout(() => setError(null), 3000)

    } catch (importError) {
      const errorMessage = importError instanceof Error ? importError.message : 'Import failed'
      setError(`Import failed: ${errorMessage}`)
      
      errorLogger.logError('Article import failed', {
        feature: 'search-panel',
        action: 'import-error',
        metadata: { 
          projectId,
          selectedCount: selectedResults.length,
          error: errorMessage
        }
      })
    } finally {
      setIsImporting(false)
    }
  }

  const formatCitation = (result: SearchResult): string => {
    const year = result.publicationDate ? new Date(result.publicationDate).getFullYear() : 'n.d.'
    const authors = result.authors.length > 0 ? result.authors.slice(0, 3).join(', ') : 'Unknown'
    const journal = result.journal ? `${result.journal}. ` : ''
    
    return `${authors} (${year}). ${result.title}. ${journal}${result.doi ? `https://doi.org/${result.doi}` : result.url || ''}`
  }

  const toggleResultSelection = (resultId: string) => {
    setSelectedResults(prev => 
      prev.includes(resultId)
        ? prev.filter(id => id !== resultId)
        : [...prev, resultId]
    )
  }

  const selectAllResults = () => {
    const allResultIds = searchResponses.flatMap(response => 
      response.results.map(result => result.id)
    )
    
    if (selectedResults.length === allResultIds.length) {
      setSelectedResults([])
    } else {
      setSelectedResults(allResultIds)
    }
  }

  const getTotalResults = () => {
    return searchResponses.reduce((sum, response) => sum + response.results.length, 0)
  }

  const getTotalAvailableResults = () => {
    return searchResponses.reduce((sum, response) => sum + response.totalCount, 0)
  }

  const getAverageSearchTime = () => {
    if (searchResponses.length === 0) return 0
    return searchResponses.reduce((sum, response) => sum + response.searchTime, 0) / searchResponses.length
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Academic Database Search</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getTotalResults() > 0 && (
              <Badge variant="secondary" className="text-xs">
                {getTotalResults()} of {getTotalAvailableResults().toLocaleString()} results
              </Badge>
            )}
            {currentQuery && (
              <Badge variant="outline" className="text-xs">
                {currentQuery.databases.length} database{currentQuery.databases.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {error && (
          <div className={`text-sm p-3 rounded-lg flex items-start gap-2 ${
            error.startsWith('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {error.startsWith('✅') ? (
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            <span className="flex-1">{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="h-6 w-6 p-0 hover:bg-transparent"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-4 pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="query-builder">Query Builder</TabsTrigger>
            <TabsTrigger value="results" disabled={searchResponses.length === 0}>
              Results ({getTotalResults()})
            </TabsTrigger>
          </TabsList>

          {/* Query Builder Tab */}
          <TabsContent value="query-builder" className="flex-1 mt-4">
            <QueryBuilder 
              projectId={projectId}
              protocolId={protocolId}
              onQueryExecute={handleQueryExecute}
              className="h-full"
            />
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="flex-1 mt-4 flex flex-col">
            {isSearching ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <div>
                    <h3 className="font-medium">Searching databases...</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentQuery?.databases.join(', ')} • {currentQuery?.keywords.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            ) : searchResponses.length > 0 ? (
              <>
                {/* Search Summary */}
                <div className="bg-muted/30 rounded-lg p-4 mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Search Results Summary</h3>
                    <Badge variant="secondary">
                      Query: {currentQuery?.keywords.join(` ${currentQuery.booleanOperator} `)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Total Retrieved</div>
                      <div className="font-medium">{getTotalResults().toLocaleString()} articles</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Available</div>
                      <div className="font-medium">{getTotalAvailableResults().toLocaleString()} total</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Search Time</div>
                      <div className="font-medium">{Math.round(getAverageSearchTime())}ms avg</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {searchResponses.map(response => (
                      <Badge key={response.database} variant="outline" className="text-xs">
                        {response.database}: {response.results.length}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center justify-between mb-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllResults}
                      disabled={isImporting}
                    >
                      {selectedResults.length === getTotalResults() ? 'Deselect All' : 'Select All'}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedResults.length} of {getTotalResults()} selected
                    </span>
                  </div>
                  
                  {selectedResults.length > 0 && (
                    <Button
                      size="sm"
                      onClick={handleImportSelected}
                      disabled={isImporting}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Import Selected ({selectedResults.length})
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Results by Database */}
                <ScrollArea className="flex-1">
                  <div className="space-y-6">
                    {searchResponses.map((response) => (
                      <div key={response.database} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            {response.database}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{response.results.length} of {response.totalCount.toLocaleString()}</span>
                            <span>•</span>
                            <span>{Math.round(response.searchTime)}ms</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {response.results.map((result) => (
                            <div 
                              key={result.id}
                              className={`border rounded-lg p-4 space-y-3 transition-colors ${
                                selectedResults.includes(result.id) 
                                  ? 'bg-primary/5 border-primary/30' 
                                  : 'hover:bg-muted/30'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedResults.includes(result.id)}
                                  onChange={() => toggleResultSelection(result.id)}
                                  className="mt-1 flex-shrink-0"
                                  disabled={isImporting}
                                />
                                
                                <div className="flex-1 space-y-2 min-w-0">
                                  <h5 className="font-medium text-sm leading-tight">
                                    {result.title}
                                  </h5>
                                  
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    {result.authors.length > 0 && (
                                      <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3 flex-shrink-0" />
                                        {result.authors.slice(0, 3).join(', ')}
                                        {result.authors.length > 3 && ` +${result.authors.length - 3} more`}
                                      </span>
                                    )}
                                    
                                    {result.journal && (
                                      <span className="flex items-center gap-1">
                                        <BookOpen className="h-3 w-3 flex-shrink-0" />
                                        {result.journal}
                                      </span>
                                    )}
                                    
                                    {result.publicationDate && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3 flex-shrink-0" />
                                        {new Date(result.publicationDate).getFullYear()}
                                      </span>
                                    )}

                                    {result.citationCount && (
                                      <span className="flex items-center gap-1">
                                        📖 {result.citationCount} citations
                                      </span>
                                    )}
                                  </div>

                                  {result.abstract && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {result.abstract}
                                    </p>
                                  )}

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="secondary" className="text-xs">
                                        {result.database}
                                      </Badge>
                                      
                                      {result.doi && (
                                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                          DOI: {result.doi}
                                        </span>
                                      )}
                                      
                                      {result.pmid && (
                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                                          PMID: {result.pmid}
                                        </span>
                                      )}

                                      {result.studyType && (
                                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                                          {result.studyType}
                                        </span>
                                      )}
                                    </div>

                                    {result.url && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
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
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Search className="h-8 w-8 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="font-medium">No search results yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Use the Query Builder to search academic databases
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default SearchPanel