import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { Upload, FileText, FileSpreadsheet, Link, Database, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react'

interface ImportSource {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  fileTypes?: string[]
}

interface ImportResult {
  success: number
  failed: number
  duplicates: number
  errors: string[]
}

export default function ArticleImport() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedSource, setSelectedSource] = useState<string>('file')
  const [importing, setImporting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [manualEntry, setManualEntry] = useState({
    title: '',
    authors: '',
    journal: '',
    year: '',
    doi: '',
    abstract: ''
  })

  const importSources: ImportSource[] = [
    {
      id: 'file',
      name: 'File Upload',
      icon: <Upload className="w-5 h-5" />,
      description: 'Upload RIS, BibTeX, EndNote, or CSV files',
      fileTypes: ['.ris', '.bib', '.enw', '.csv', '.txt']
    },
    {
      id: 'database',
      name: 'Database Export',
      icon: <Database className="w-5 h-5" />,
      description: 'Import from PubMed, Scopus, or Web of Science exports'
    },
    {
      id: 'doi',
      name: 'DOI/PMID',
      icon: <Link className="w-5 h-5" />,
      description: 'Import articles using DOI or PubMed ID'
    },
    {
      id: 'manual',
      name: 'Manual Entry',
      icon: <FileText className="w-5 h-5" />,
      description: 'Manually enter article details'
    },
    {
      id: 'zotero',
      name: 'Reference Manager',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      description: 'Import from Zotero, Mendeley, or EndNote'
    }
  ]

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const parseRISFile = (content: string) => {
    const articles = []
    const entries = content.split('\nER  -')
    
    for (const entry of entries) {
      if (!entry.trim()) continue
      
      const article: any = {}
      const lines = entry.split('\n')
      
      for (const line of lines) {
        const match = line.match(/^(\w{2})\s+-\s+(.*)$/)
        if (match) {
          const [, tag, value] = match
          switch (tag) {
            case 'TI':
            case 'T1':
              article.title = value
              break
            case 'AU':
            case 'A1':
              if (!article.authors) article.authors = []
              article.authors.push(value)
              break
            case 'JO':
            case 'JF':
            case 'T2':
              article.journal = value
              break
            case 'PY':
            case 'Y1':
              article.publicationDate = value
              break
            case 'DO':
              article.doi = value
              break
            case 'AB':
              article.abstract = value
              break
            case 'PM':
              article.pmid = value
              break
          }
        }
      }
      
      if (article.title) {
        articles.push(article)
      }
    }
    
    return articles
  }

  const parseBibTeXFile = (content: string) => {
    const articles = []
    const entries = content.match(/@\w+\{[^@]+\}/g) || []
    
    for (const entry of entries) {
      const article: any = {}
      
      // Extract title
      const titleMatch = entry.match(/title\s*=\s*\{([^}]+)\}/)
      if (titleMatch) article.title = titleMatch[1]
      
      // Extract authors
      const authorMatch = entry.match(/author\s*=\s*\{([^}]+)\}/)
      if (authorMatch) {
        article.authors = authorMatch[1].split(' and ').map(a => a.trim())
      }
      
      // Extract journal
      const journalMatch = entry.match(/journal\s*=\s*\{([^}]+)\}/)
      if (journalMatch) article.journal = journalMatch[1]
      
      // Extract year
      const yearMatch = entry.match(/year\s*=\s*\{(\d{4})\}/)
      if (yearMatch) article.publicationDate = yearMatch[1]
      
      // Extract DOI
      const doiMatch = entry.match(/doi\s*=\s*\{([^}]+)\}/)
      if (doiMatch) article.doi = doiMatch[1]
      
      // Extract abstract
      const abstractMatch = entry.match(/abstract\s*=\s*\{([^}]+)\}/)
      if (abstractMatch) article.abstract = abstractMatch[1]
      
      if (article.title) {
        articles.push(article)
      }
    }
    
    return articles
  }

  const parseCSVFile = (content: string) => {
    const lines = content.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const articles = []
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      
      const values = lines[i].split(',')
      const article: any = {}
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim()
        if (!value) return
        
        if (header.includes('title')) {
          article.title = value
        } else if (header.includes('author')) {
          article.authors = value.split(';').map(a => a.trim())
        } else if (header.includes('journal')) {
          article.journal = value
        } else if (header.includes('year') || header.includes('date')) {
          article.publicationDate = value
        } else if (header.includes('doi')) {
          article.doi = value
        } else if (header.includes('abstract')) {
          article.abstract = value
        }
      })
      
      if (article.title) {
        articles.push(article)
      }
    }
    
    return articles
  }

  const handleImport = async () => {
    if (files.length === 0 && selectedSource === 'file') {
      alert('Please select files to import')
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const allArticles = []
      
      for (const file of files) {
        const content = await file.text()
        let articles = []
        
        if (file.name.endsWith('.ris')) {
          articles = parseRISFile(content)
        } else if (file.name.endsWith('.bib')) {
          articles = parseBibTeXFile(content)
        } else if (file.name.endsWith('.csv')) {
          articles = parseCSVFile(content)
        }
        
        allArticles.push(...articles)
      }

      // Import articles to database
      let success = 0
      let failed = 0
      let duplicates = 0
      const errors: string[] = []

      for (const article of allArticles) {
        try {
          // Check for duplicates
          const { data: existing } = await supabase
            .from('articles')
            .select('id')
            .eq('project_id', projectId)
            .eq('title', article.title)
            .single()

          if (existing) {
            duplicates++
            continue
          }

          // Insert article
          const { error } = await supabase
            .from('articles')
            .insert({
              project_id: projectId,
              title: article.title,
              authors: article.authors,
              journal: article.journal,
              publication_date: article.publicationDate,
              doi: article.doi,
              pmid: article.pmid,
              abstract: article.abstract,
              source: 'manual',
              status: 'pending'
            })

          if (error) {
            failed++
            errors.push(`Failed to import "${article.title}": ${error.message}`)
          } else {
            success++
          }
        } catch (err) {
          failed++
          errors.push(`Error importing "${article.title}"`)
        }
      }

      setImportResult({ success, failed, duplicates, errors })
    } catch (err) {
      console.error('Import error:', err)
      setImportResult({
        success: 0,
        failed: files.length,
        duplicates: 0,
        errors: ['Failed to parse import files']
      })
    } finally {
      setImporting(false)
    }
  }

  const handleManualImport = async () => {
    if (!manualEntry.title) {
      alert('Please enter at least a title')
      return
    }

    setImporting(true)
    try {
      const { error } = await supabase
        .from('articles')
        .insert({
          project_id: projectId,
          title: manualEntry.title,
          authors: manualEntry.authors.split(',').map(a => a.trim()).filter(a => a),
          journal: manualEntry.journal,
          publication_date: manualEntry.year,
          doi: manualEntry.doi,
          abstract: manualEntry.abstract,
          source: 'manual',
          status: 'pending'
        })

      if (error) throw error

      setImportResult({ success: 1, failed: 0, duplicates: 0, errors: [] })
      setManualEntry({ title: '', authors: '', journal: '', year: '', doi: '', abstract: '' })
    } catch (err) {
      console.error('Manual import error:', err)
      setImportResult({ success: 0, failed: 1, duplicates: 0, errors: ['Failed to import article'] })
    } finally {
      setImporting(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Articles</h1>
          <p className="text-gray-600">Import references from various sources</p>
        </div>

        {/* Import Source Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {importSources.map(source => (
            <button
              key={source.id}
              onClick={() => setSelectedSource(source.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedSource === source.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                {source.icon}
                <span className="font-medium text-sm mt-2">{source.name}</span>
                <span className="text-xs text-gray-500 mt-1">{source.description}</span>
              </div>
            </button>
          ))}
        </div>

        {/* File Upload Interface */}
        {selectedSource === 'file' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Upload Files</h2>
            
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports RIS, BibTeX, EndNote, and CSV formats
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".ris,.bib,.enw,.csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Select Files
              </button>
            </div>

            {files.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Selected Files:</h3>
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{file.name}</span>
                      <button
                        onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import Articles
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual Entry Form */}
        {selectedSource === 'manual' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Manual Entry</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={manualEntry.title}
                  onChange={(e) => setManualEntry({...manualEntry, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter article title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Authors (comma-separated)</label>
                <input
                  type="text"
                  value={manualEntry.authors}
                  onChange={(e) => setManualEntry({...manualEntry, authors: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Smith J, Doe A, Johnson K"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Journal</label>
                  <input
                    type="text"
                    value={manualEntry.journal}
                    onChange={(e) => setManualEntry({...manualEntry, journal: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="text"
                    value={manualEntry.year}
                    onChange={(e) => setManualEntry({...manualEntry, year: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="2024"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DOI</label>
                <input
                  type="text"
                  value={manualEntry.doi}
                  onChange={(e) => setManualEntry({...manualEntry, doi: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="10.1234/example"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Abstract</label>
                <textarea
                  value={manualEntry.abstract}
                  onChange={(e) => setManualEntry({...manualEntry, abstract: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                />
              </div>
              <button
                onClick={handleManualImport}
                disabled={importing}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {importing ? 'Adding...' : 'Add Article'}
              </button>
            </div>
          </div>
        )}

        {/* Other Import Methods - Placeholder */}
        {(selectedSource === 'database' || selectedSource === 'doi' || selectedSource === 'zotero') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600">
              {selectedSource === 'database' && 'Direct database import will be available soon'}
              {selectedSource === 'doi' && 'DOI/PMID lookup will be available soon'}
              {selectedSource === 'zotero' && 'Reference manager integration will be available soon'}
            </p>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className={`rounded-lg p-6 mb-6 ${
            importResult.failed > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
          }`}>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              {importResult.failed === 0 ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Import Successful
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  Import Completed with Issues
                </>
              )}
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                <p className="text-sm text-gray-600">Imported</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</p>
                <p className="text-sm text-gray-600">Duplicates</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="border-t pt-4">
                <p className="font-medium text-sm mb-2">Errors:</p>
                <ul className="space-y-1">
                  {importResult.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600">{error}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => navigate(`/projects/${projectId}/articles`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View Articles
              </button>
              <button
                onClick={() => {
                  setImportResult(null)
                  setFiles([])
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Import More
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}