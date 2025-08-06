/**
 * Query Builder Component
 * Advanced search interface for building complex academic database queries
 */

import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Plus,
  X,
  Search,
  Loader2,
  Eye,
  Database,
  Filter,
  Calendar,
  Globe,
  BookOpen,
  AlertCircle,
  Lightbulb,
  RotateCcw
} from 'lucide-react'
import { searchService, type SearchQuery, type DatabaseCount } from '@/services/searchService'
import { protocolService } from '@/services/protocolService'
import { errorLogger } from '@/lib/error-logger'

const querySchema = z.object({
  keywords: z.array(z.string().min(1)).min(1, 'At least one keyword is required'),
  databases: z.array(z.string()).min(1, 'Select at least one database'),
  booleanOperator: z.enum(['AND', 'OR']),
  fieldSearch: z.object({
    title: z.string().optional(),
    abstract: z.string().optional(),
    author: z.string().optional(),
    journal: z.string().optional(),
  }).optional(),
  filters: z.object({
    dateRange: z.object({
      start: z.string(),
      end: z.string()
    }).optional(),
    studyTypes: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    journals: z.array(z.string()).optional()
  })
})

type QueryFormData = z.infer<typeof querySchema>

interface QueryBuilderProps {
  projectId: string
  protocolId?: string
  onQueryExecute: (query: SearchQuery, counts: DatabaseCount[]) => void
  className?: string
}

const AVAILABLE_DATABASES = [
  { 
    id: 'pubmed', 
    name: 'PubMed', 
    description: 'Biomedical and life sciences literature',
    icon: '🔬',
    free: true,
    coverage: '35M+ articles'
  },
  { 
    id: 'crossref', 
    name: 'CrossRef', 
    description: 'Scholarly publications with DOIs',
    icon: '📚',
    free: true,
    coverage: '140M+ works'
  },
  { 
    id: 'arxiv', 
    name: 'arXiv', 
    description: 'Preprints in physics, mathematics, CS',
    icon: '📄',
    free: true,
    coverage: '2.3M+ preprints'
  },
  { 
    id: 'doaj', 
    name: 'DOAJ', 
    description: 'Directory of Open Access Journals',
    icon: '🌐',
    free: true,
    coverage: '9M+ articles'
  },
  { 
    id: 'scopus', 
    name: 'Scopus', 
    description: 'Comprehensive research database',
    icon: '🎓',
    free: false,
    coverage: '87M+ records',
    requiresKey: true
  }
]

const STUDY_TYPES = [
  'Randomized Controlled Trial',
  'Systematic Review',
  'Meta-Analysis',
  'Observational Study',
  'Case Study',
  'Review Article',
  'Commentary',
  'Letter',
  'Conference Paper',
  'Thesis'
]

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' }
]

export const QueryBuilder: React.FC<QueryBuilderProps> = ({
  projectId,
  protocolId,
  onQueryExecute,
  className
}) => {
  const [isLoadingCounts, setIsLoadingCounts] = useState(false)
  const [databaseCounts, setDatabaseCounts] = useState<DatabaseCount[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [protocolData, setProtocolData] = useState<any>(null)

  const form = useForm<QueryFormData>({
    resolver: zodResolver(querySchema),
    defaultValues: {
      keywords: [''],
      databases: ['pubmed', 'crossref'],
      booleanOperator: 'AND',
      fieldSearch: {},
      filters: {}
    }
  })

  const { fields: keywordFields, append: addKeyword, remove: removeKeyword } = useFieldArray({
    control: form.control,
    name: 'keywords'
  })

  // Load protocol data if available
  useEffect(() => {
    if (protocolId) {
      loadProtocolData()
    }
  }, [protocolId])

  const loadProtocolData = async () => {
    try {
      const protocol = await protocolService.getProtocol(protocolId!)
      if (protocol) {
        setProtocolData(protocol)
        // Auto-populate from protocol keywords
        if (protocol.keywords && protocol.keywords.length > 0) {
          form.setValue('keywords', protocol.keywords)
        }
      }
    } catch (error) {
      errorLogger.logError('Failed to load protocol data', {
        feature: 'query-builder',
        action: 'load-protocol',
        metadata: { protocolId, error: (error as Error).message }
      })
    }
  }

  const handleGetCounts = async () => {
    const formData = form.getValues()
    const validKeywords = formData.keywords.filter(k => k.trim().length > 0)
    
    if (validKeywords.length === 0 || formData.databases.length === 0) {
      return
    }

    setIsLoadingCounts(true)
    
    try {
      const query: SearchQuery = {
        keywords: validKeywords,
        databases: formData.databases,
        booleanOperator: formData.booleanOperator,
        fieldSearch: formData.fieldSearch,
        filters: formData.filters
      }

      const counts = await searchService.getResultCounts(query)
      setDatabaseCounts(counts)

      errorLogger.logInfo('Database counts retrieved successfully', {
        feature: 'query-builder',
        action: 'get-counts-success',
        metadata: { 
          totalResults: counts.reduce((sum, c) => sum + Math.max(0, c.count), 0),
          databases: counts.map(c => c.database)
        }
      })
    } catch (error) {
      errorLogger.logError('Failed to get database counts', {
        feature: 'query-builder',
        action: 'get-counts-error',
        metadata: { error: (error as Error).message }
      })
    } finally {
      setIsLoadingCounts(false)
    }
  }

  const handleExecuteQuery = () => {
    const formData = form.getValues()
    const validKeywords = formData.keywords.filter(k => k.trim().length > 0)
    
    if (validKeywords.length === 0 || formData.databases.length === 0) {
      return
    }

    const query: SearchQuery = {
      keywords: validKeywords,
      databases: formData.databases,
      booleanOperator: formData.booleanOperator,
      fieldSearch: formData.fieldSearch,
      filters: formData.filters
    }

    onQueryExecute(query, databaseCounts)

    errorLogger.logInfo('Query execution initiated', {
      feature: 'query-builder',
      action: 'execute-query',
      metadata: { 
        keywords: validKeywords.length,
        databases: formData.databases.length,
        hasFilters: Object.keys(formData.filters).length > 0
      }
    })
  }

  const handleAddKeywordFromProtocol = () => {
    if (protocolData?.keywords) {
      const currentKeywords = form.getValues('keywords').filter(k => k.trim().length > 0)
      const newKeywords = [...currentKeywords, ...protocolData.keywords]
      const uniqueKeywords = Array.from(new Set(newKeywords))
      form.setValue('keywords', uniqueKeywords)
    }
  }

  const handleResetForm = () => {
    form.reset()
    setDatabaseCounts([])
  }

  const getTotalEstimatedResults = () => {
    return databaseCounts.reduce((sum, count) => sum + Math.max(0, count.count), 0)
  }

  const getEstimatedSearchTime = () => {
    const maxTime = Math.max(...databaseCounts.map(c => c.estimatedTime))
    return maxTime > 0 ? `~${Math.round(maxTime / 1000)}s` : '~1s'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Protocol Integration */}
      {protocolData && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Protocol Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Using protocol: <span className="font-medium">{protocolData.title}</span>
            </div>
            {protocolData.keywords && protocolData.keywords.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Keywords:</span>
                <div className="flex flex-wrap gap-1">
                  {protocolData.keywords.slice(0, 5).map((keyword: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                  {protocolData.keywords.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{protocolData.keywords.length - 5} more
                    </Badge>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleAddKeywordFromProtocol}
                  className="h-6 text-xs"
                >
                  Use Keywords
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Search</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="preview">Preview & Execute</TabsTrigger>
        </TabsList>

        {/* Basic Search Tab */}
        <TabsContent value="basic" className="space-y-4">
          {/* Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {keywordFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      {...form.register(`keywords.${index}`)}
                      placeholder="Enter search term or phrase"
                      className="flex-1"
                    />
                    {keywordFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeKeyword(index)}
                        className="px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addKeyword('')}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Term
                </Button>

                <div className="flex items-center gap-2">
                  <Label className="text-sm">Combine with:</Label>
                  <Select
                    value={form.watch('booleanOperator')}
                    onValueChange={(value) => form.setValue('booleanOperator', value as 'AND' | 'OR')}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                Select Databases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_DATABASES.map((db) => (
                  <div key={db.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={db.id}
                      checked={form.watch('databases').includes(db.id)}
                      onCheckedChange={(checked) => {
                        const current = form.getValues('databases')
                        if (checked) {
                          form.setValue('databases', [...current, db.id])
                        } else {
                          form.setValue('databases', current.filter(d => d !== db.id))
                        }
                      }}
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={db.id} className="text-sm font-medium cursor-pointer">
                          {db.icon} {db.name}
                        </Label>
                        {db.free && (
                          <Badge variant="secondary" className="text-xs">
                            Free
                          </Badge>
                        )}
                        {db.requiresKey && (
                          <Badge variant="outline" className="text-xs">
                            API Key Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{db.description}</p>
                      <p className="text-xs text-muted-foreground font-medium">{db.coverage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Search Tab */}
        <TabsContent value="advanced" className="space-y-4">
          {/* Field-Specific Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Field-Specific Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title-search">Title</Label>
                  <Input
                    id="title-search"
                    {...form.register('fieldSearch.title')}
                    placeholder="Search in titles only"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author-search">Author</Label>
                  <Input
                    id="author-search"
                    {...form.register('fieldSearch.author')}
                    placeholder="Author name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="journal-search">Journal</Label>
                  <Input
                    id="journal-search"
                    {...form.register('fieldSearch.journal')}
                    placeholder="Journal name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="abstract-search">Abstract</Label>
                <Textarea
                  id="abstract-search"
                  {...form.register('fieldSearch.abstract')}
                  placeholder="Search in abstracts only"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Publication Date Range
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input
                      type="date"
                      {...form.register('filters.dateRange.start')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      {...form.register('filters.dateRange.end')}
                    />
                  </div>
                </div>
              </div>

              {/* Study Types */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Study Types
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {STUDY_TYPES.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`study-type-${type}`}
                        checked={form.watch('filters.studyTypes')?.includes(type) || false}
                        onCheckedChange={(checked) => {
                          const current = form.getValues('filters.studyTypes') || []
                          if (checked) {
                            form.setValue('filters.studyTypes', [...current, type])
                          } else {
                            form.setValue('filters.studyTypes', current.filter(t => t !== type))
                          }
                        }}
                      />
                      <Label htmlFor={`study-type-${type}`} className="text-sm cursor-pointer">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Languages
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {LANGUAGES.map((lang) => (
                    <div key={lang.code} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lang-${lang.code}`}
                        checked={form.watch('filters.languages')?.includes(lang.code) || false}
                        onCheckedChange={(checked) => {
                          const current = form.getValues('filters.languages') || []
                          if (checked) {
                            form.setValue('filters.languages', [...current, lang.code])
                          } else {
                            form.setValue('filters.languages', current.filter(l => l !== lang.code))
                          }
                        }}
                      />
                      <Label htmlFor={`lang-${lang.code}`} className="text-sm cursor-pointer">
                        {lang.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview & Execute Tab */}
        <TabsContent value="preview" className="space-y-4">
          {/* Query Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Query Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                {form.watch('keywords').filter(k => k.trim()).join(` ${form.watch('booleanOperator')} `) || 'No search terms entered'}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Databases:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {form.watch('databases').map(db => (
                      <Badge key={db} variant="secondary" className="text-xs">
                        {AVAILABLE_DATABASES.find(d => d.id === db)?.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Boolean:</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {form.watch('booleanOperator')}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Filters:</span>
                  <span className="ml-2 text-xs">
                    {Object.values(form.watch('filters')).some(v => v && (Array.isArray(v) ? v.length > 0 : Object.keys(v).length > 0)) ? 'Applied' : 'None'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Result Counts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Estimated Results
                </div>
                <Button
                  onClick={handleGetCounts}
                  disabled={isLoadingCounts || form.watch('keywords').filter(k => k.trim()).length === 0}
                  size="sm"
                  variant="outline"
                >
                  {isLoadingCounts ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Get Counts
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {databaseCounts.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {databaseCounts.map((count) => (
                      <div key={count.database} className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{count.database}</span>
                          <Badge variant={count.count === -1 ? "destructive" : "secondary"}>
                            {count.count === -1 ? 'Error' : count.count.toLocaleString()}
                          </Badge>
                        </div>
                        {count.count > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Est. time: {Math.round(count.estimatedTime / 1000)}s
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {getTotalEstimatedResults() > 0 && (
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-primary">
                            Total: {getTotalEstimatedResults().toLocaleString()} results
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Estimated search time: {getEstimatedSearchTime()}
                          </div>
                        </div>
                        <Button onClick={handleExecuteQuery} className="ml-4">
                          <Search className="h-4 w-4 mr-2" />
                          Execute Search
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Click "Get Counts" to preview results before searching</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleResetForm}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Form
            </Button>

            {databaseCounts.length === 0 && (
              <Button
                onClick={handleGetCounts}
                disabled={isLoadingCounts || form.watch('keywords').filter(k => k.trim()).length === 0}
              >
                {isLoadingCounts ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting Counts...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Results
                  </>
                )}
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default QueryBuilder