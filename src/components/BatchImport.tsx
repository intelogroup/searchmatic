import React, { useState, useRef } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { pubmedAPI } from '../services/pubmedApi'
import { BatchImportJob, ImportedArticle } from '../types/articles'
import { 
  Upload, 
  File, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  RefreshCw,
  Trash2,
  Play,
  Pause,
  X
} from 'lucide-react'

interface BatchImportProps {
  projectId: string
  onImportComplete?: (count: number) => void
}

interface ImportSource {
  type: 'file' | 'pmid_list' | 'doi_list' | 'csv'
  data: any
  fileName?: string
  preview?: ImportedArticle[]
}

interface ImportSettings {
  enableDuplicateDetection: boolean
  duplicateThreshold: number
  importChunkSize: number
  delayBetweenRequests: number
}

const DEFAULT_SETTINGS: ImportSettings = {
  enableDuplicateDetection: true,
  duplicateThreshold: 0.85,
  importChunkSize: 10,
  delayBetweenRequests: 1000
}

export function BatchImport({ projectId, onImportComplete }: BatchImportProps) {
  const [importSource, setImportSource] = useState<ImportSource | null>(null)
  const [settings, setSettings] = useState<ImportSettings>(DEFAULT_SETTINGS)
  const [currentJob, setCurrentJob] = useState<BatchImportJob | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const processingRef = useRef(false)
  const supabase = useSupabaseClient()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    
    try {
      const text = await file.text()
      const fileName = file.name.toLowerCase()
      
      if (fileName.endsWith('.txt')) {
        // Plain text file with PMIDs or DOIs
        const lines = text.split('\n').filter(line => line.trim())
        if (lines[0]?.match(/^\d+$/)) {
          // Looks like PMIDs
          setImportSource({
            type: 'pmid_list',
            data: lines,
            fileName: file.name
          })
        } else if (lines[0]?.match(/^10\./)) {
          // Looks like DOIs
          setImportSource({
            type: 'doi_list',
            data: lines,
            fileName: file.name
          })
        } else {
          throw new Error('File format not recognized. Expected PMIDs or DOIs.')
        }
      } else if (fileName.endsWith('.csv')) {
        // CSV file parsing
        const preview = parseCSVFile(text)
        setImportSource({
          type: 'csv',
          data: text,
          fileName: file.name,
          preview: preview.slice(0, 5) // Show first 5 rows
        })
      } else {
        throw new Error('Supported file formats: .txt (PMIDs/DOIs), .csv')
      }
      
      addLog(`Loaded file: ${file.name}`)
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to read file')
    }
  }

  const parseCSVFile = (csvText: string): ImportedArticle[] => {
    const lines = csvText.trim().split('\n')
    const headers = lines[0].toLowerCase().split(',')
    
    // Map common column names to our fields
    const fieldMapping: Record<string, string> = {
      'pmid': 'pmid',
      'doi': 'doi',
      'title': 'title',
      'abstract': 'abstract',
      'authors': 'authors',
      'journal': 'journal',
      'year': 'publicationDate',
      'publication_year': 'publicationDate',
      'date': 'publicationDate'
    }
    
    const articles: ImportedArticle[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',')
      const article: Partial<ImportedArticle> = {
        externalId: '',
        source: 'manual',
        title: '',
        authors: [],
        metadata: {
          importedAt: new Date().toISOString(),
          source: 'csv_import'
        }
      }
      
      // Map CSV columns to article fields
      headers.forEach((header, index) => {
        const field = fieldMapping[header.trim()]
        const value = values[index]?.trim().replace(/"/g, '')
        
        if (field && value) {
          switch (field) {
            case 'authors':
              article.authors = value.split(';').map(a => a.trim())
              break
            case 'publicationDate':
              article.publicationDate = new Date(value)
              break
            default:
              (article as any)[field] = value
          }
        }
      })
      
      // Use PMID or DOI as external ID
      article.externalId = article.pmid || article.doi || `csv_${i}`
      
      if (article.title) {
        articles.push(article as ImportedArticle)
      }
    }
    
    return articles
  }

  const handlePMIDListImport = (pmidText: string) => {
    const pmids = pmidText.split('\n')
      .map(line => line.trim())
      .filter(line => line && /^\d+$/.test(line))
    
    setImportSource({
      type: 'pmid_list',
      data: pmids
    })
  }

  const startBatchImport = async () => {
    if (!importSource) return

    setIsProcessing(true)
    processingRef.current = true
    setIsPaused(false)
    setError(null)
    
    // Create batch import job
    const job: BatchImportJob = {
      id: crypto.randomUUID(),
      projectId,
      userId: 'current-user', // Would get from auth
      source: importSource.type === 'pmid_list' ? 'pubmed' : 'file',
      status: 'processing',
      totalItems: Array.isArray(importSource.data) ? importSource.data.length : 
                  importSource.preview?.length || 0,
      processedItems: 0,
      successfulImports: 0,
      failedImports: 0,
      errors: [],
      startedAt: new Date().toISOString()
    }
    
    setCurrentJob(job)
    addLog(`Starting batch import of ${job.totalItems} items`)
    
    try {
      if (importSource.type === 'pmid_list') {
        await processPMIDList(importSource.data, job)
      } else if (importSource.type === 'csv') {
        await processCSVData(importSource.preview || [], job)
      }
      
      job.status = 'completed'
      job.completedAt = new Date().toISOString()
      addLog(`Batch import completed: ${job.successfulImports} successful, ${job.failedImports} failed`)
      
    } catch (error) {
      job.status = 'failed'
      job.completedAt = new Date().toISOString()
      setError(error instanceof Error ? error.message : 'Import failed')
      addLog(`Batch import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setCurrentJob(job)
    setIsProcessing(false)
    processingRef.current = false
    onImportComplete?.(job.successfulImports)
  }

  const processPMIDList = async (pmids: string[], job: BatchImportJob) => {
    const chunks = chunkArray(pmids, settings.importChunkSize)
    
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      if (!processingRef.current) break
      
      // Handle pause
      while (isPaused && processingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      const chunk = chunks[chunkIndex]
      addLog(`Processing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} PMIDs)`)
      
      try {
        // Fetch articles from PubMed
        const articles = []
        for (const pmid of chunk) {
          try {
            const article = await pubmedAPI.getArticleById(pmid)
            if (article) {
              articles.push(article)
              job.successfulImports++
            } else {
              job.failedImports++
              job.errors?.push(`PMID ${pmid}: Not found`)
            }
            job.processedItems++
          } catch (error) {
            job.failedImports++
            job.errors?.push(`PMID ${pmid}: ${error instanceof Error ? error.message : 'Error'}`)
            job.processedItems++
          }
          
          setCurrentJob({ ...job })
          
          // Rate limiting delay
          if (settings.delayBetweenRequests > 0) {
            await new Promise(resolve => setTimeout(resolve, settings.delayBetweenRequests))
          }
        }
        
        // Import to database
        if (articles.length > 0) {
          await importArticlesToDatabase(articles, job)
        }
        
      } catch (error) {
        addLog(`Chunk ${chunkIndex + 1} failed: ${error instanceof Error ? error.message : 'Error'}`)
        job.failedImports += chunk.length
        job.processedItems += chunk.length
      }
    }
  }

  const processCSVData = async (articles: ImportedArticle[], job: BatchImportJob) => {
    const chunks = chunkArray(articles, settings.importChunkSize)
    
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      if (!processingRef.current) break
      
      while (isPaused && processingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      const chunk = chunks[chunkIndex]
      addLog(`Processing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} articles)`)
      
      try {
        await importArticlesToDatabase(chunk, job)
        job.processedItems += chunk.length
        setCurrentJob({ ...job })
      } catch (error) {
        addLog(`Chunk ${chunkIndex + 1} failed: ${error instanceof Error ? error.message : 'Error'}`)
        job.failedImports += chunk.length
        job.processedItems += chunk.length
      }
    }
  }

  const importArticlesToDatabase = async (articles: any[], job: BatchImportJob) => {
    for (const article of articles) {
      try {
        // Check for duplicates if enabled
        if (settings.enableDuplicateDetection) {
          const { data: existing } = await supabase
            .from('articles')
            .select('id')
            .eq('project_id', projectId)
            .or(`pmid.eq.${article.pmid},doi.eq.${article.doi},title.ilike.%${article.title}%`)
            .limit(1)

          if (existing && existing.length > 0) {
            addLog(`Duplicate detected: ${article.title?.substring(0, 50)}...`)
            job.failedImports++
            continue
          }
        }
        
        // Convert to our article format
        const importedArticle = pubmedAPI.convertToImportedArticle 
          ? pubmedAPI.convertToImportedArticle(article, projectId)
          : {
              externalId: article.pmid || article.doi || article.externalId,
              source: 'manual' as const,
              title: article.title,
              authors: Array.isArray(article.authors) ? article.authors : [article.authors].filter(Boolean),
              abstract: article.abstract,
              publicationDate: article.publicationDate,
              journal: article.journal,
              doi: article.doi,
              pmid: article.pmid,
              url: article.url,
              metadata: {
                ...article.metadata,
                importedAt: new Date().toISOString(),
                batchJobId: job.id
              }
            }
        
        // Insert into database
        const { error } = await supabase
          .from('articles')
          .insert({
            project_id: projectId,
            external_id: importedArticle.externalId,
            source: importedArticle.source,
            title: importedArticle.title,
            authors: importedArticle.authors,
            abstract: importedArticle.abstract,
            publication_date: importedArticle.publicationDate?.toISOString()?.split('T')[0],
            journal: importedArticle.journal,
            doi: importedArticle.doi,
            pmid: importedArticle.pmid,
            url: importedArticle.url,
            status: 'pending',
            metadata: importedArticle.metadata
          })

        if (error) {
          throw error
        }
        
        job.successfulImports++
        addLog(`Imported: ${article.title?.substring(0, 50)}...`)
        
      } catch (error) {
        job.failedImports++
        job.errors?.push(`${article.title}: ${error instanceof Error ? error.message : 'Error'}`)
        addLog(`Failed to import: ${article.title?.substring(0, 50)}...`)
      }
    }
  }

  const pauseImport = () => {
    setIsPaused(true)
    addLog('Import paused')
  }

  const resumeImport = () => {
    setIsPaused(false)
    addLog('Import resumed')
  }

  const cancelImport = () => {
    processingRef.current = false
    setIsProcessing(false)
    setIsPaused(false)
    setCurrentJob(prev => prev ? { ...prev, status: 'cancelled' } : null)
    addLog('Import cancelled')
  }

  const clearSource = () => {
    setImportSource(null)
    setCurrentJob(null)
    setLogs([])
    setError(null)
  }

  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Batch Import</h2>
        <p className="text-gray-600">Import articles in bulk from various sources</p>
      </div>

      {/* Import Source Selection */}
      {!importSource && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* File Upload */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload File</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload a CSV file or text file with PMIDs/DOIs
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Upload className="h-4 w-4 mr-2 inline" />
                Choose File
              </button>
            </div>
          </div>

          {/* PMID List */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-green-600 font-semibold">PMID</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">PMID List</h3>
              <p className="text-sm text-gray-600 mb-4">
                Paste a list of PubMed IDs, one per line
              </p>
              <PMIDListInput onSubmit={handlePMIDListImport} />
            </div>
          </div>

          {/* Future: Other sources */}
          <div className="bg-white shadow rounded-lg p-6 opacity-50">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-gray-400 text-xs">DOI</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">DOI List</h3>
              <p className="text-sm text-gray-600 mb-4">
                Coming soon: Import by DOI list
              </p>
              <button disabled className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md">
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Preview and Settings */}
      {importSource && !isProcessing && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Import Preview</h3>
              <p className="text-sm text-gray-600">
                {importSource.fileName && `File: ${importSource.fileName} • `}
                {Array.isArray(importSource.data) ? importSource.data.length : 
                 importSource.preview?.length || 0} items
              </p>
            </div>
            <button
              onClick={clearSource}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Preview */}
          {importSource.preview && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Preview (first 5 items)</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {importSource.preview.map((article, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium">{article.title}</div>
                    <div className="text-gray-600">
                      {article.authors.join(', ')} • {article.journal}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableDuplicateDetection}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    enableDuplicateDetection: e.target.checked
                  }))}
                  className="mr-2 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">Enable duplicate detection</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Batch size
              </label>
              <select
                value={settings.importChunkSize}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  importChunkSize: parseInt(e.target.value)
                }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value={5}>5 items</option>
                <option value={10}>10 items</option>
                <option value={25}>25 items</option>
                <option value={50}>50 items</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={clearSource}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={startBatchImport}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Import
            </button>
          </div>
        </div>
      )}

      {/* Import Progress */}
      {currentJob && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Import Progress</h3>
            <div className="flex items-center space-x-2">
              {isProcessing && !isPaused && (
                <button
                  onClick={pauseImport}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                >
                  <Pause className="h-4 w-4" />
                </button>
              )}
              {isProcessing && isPaused && (
                <button
                  onClick={resumeImport}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  <Play className="h-4 w-4" />
                </button>
              )}
              {isProcessing && (
                <button
                  onClick={cancelImport}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{currentJob.processedItems}</div>
              <div className="text-sm text-gray-600">Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{currentJob.successfulImports}</div>
              <div className="text-sm text-gray-600">Success</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{currentJob.failedImports}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{currentJob.totalItems}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${(currentJob.processedItems / currentJob.totalItems) * 100}%`
              }}
            />
          </div>

          {/* Status */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            {isProcessing && !isPaused && <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />}
            {isPaused && <Pause className="h-4 w-4 text-yellow-600" />}
            {currentJob.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
            {currentJob.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
            <span className="text-sm text-gray-700 capitalize">{currentJob.status}</span>
          </div>
        </div>
      )}

      {/* Import Logs */}
      {logs.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Import Log</h3>
            <button
              onClick={() => setLogs([])}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          </div>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-48 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Import Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface PMIDListInputProps {
  onSubmit: (pmidText: string) => void
}

function PMIDListInput({ onSubmit }: PMIDListInputProps) {
  const [pmidText, setPmidText] = useState('')

  const handleSubmit = () => {
    if (pmidText.trim()) {
      onSubmit(pmidText)
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={pmidText}
        onChange={(e) => setPmidText(e.target.value)}
        placeholder="Enter PMIDs, one per line:&#10;12345678&#10;87654321&#10;11223344"
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <button
        onClick={handleSubmit}
        disabled={!pmidText.trim()}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
      >
        Import PMIDs
      </button>
    </div>
  )
}