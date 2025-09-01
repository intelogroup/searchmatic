import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Download, FileText, FileSpreadsheet, FileJson, BarChart3, PieChart, TrendingUp, Filter, Calendar, CheckCircle } from 'lucide-react'

interface ExportFormat {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  extension: string
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
}

interface ProjectStats {
  totalArticles: number
  screenedArticles: number
  includedArticles: number
  excludedArticles: number
  extractedData: number
  lastUpdated: string
}

export default function ExportReports() {
  const { projectId } = useParams()
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [stats, setStats] = useState<ProjectStats>({
    totalArticles: 0,
    screenedArticles: 0,
    includedArticles: 0,
    excludedArticles: 0,
    extractedData: 0,
    lastUpdated: new Date().toISOString()
  })
  const [selectedFormat, setSelectedFormat] = useState<string>('csv')
  const [selectedData, setSelectedData] = useState<Set<string>>(new Set(['articles', 'screening', 'extraction']))
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const exportFormats: ExportFormat[] = [
    { id: 'csv', name: 'CSV', icon: <FileSpreadsheet className="w-5 h-5" />, description: 'Comma-separated values', extension: '.csv' },
    { id: 'excel', name: 'Excel', icon: <FileSpreadsheet className="w-5 h-5" />, description: 'Microsoft Excel', extension: '.xlsx' },
    { id: 'json', name: 'JSON', icon: <FileJson className="w-5 h-5" />, description: 'JavaScript Object Notation', extension: '.json' },
    { id: 'ris', name: 'RIS', icon: <FileText className="w-5 h-5" />, description: 'Research Information Systems', extension: '.ris' },
    { id: 'bibtex', name: 'BibTeX', icon: <FileText className="w-5 h-5" />, description: 'Bibliography format', extension: '.bib' },
    { id: 'pdf', name: 'PDF Report', icon: <FileText className="w-5 h-5" />, description: 'Full report with charts', extension: '.pdf' }
  ]

  const reportTemplates: ReportTemplate[] = [
    { id: 'prisma', name: 'PRISMA Flow Diagram', description: 'Generate PRISMA 2020 flow diagram', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'summary', name: 'Executive Summary', description: 'High-level overview of findings', icon: <FileText className="w-5 h-5" /> },
    { id: 'statistics', name: 'Statistical Analysis', description: 'Detailed statistical report', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'quality', name: 'Quality Assessment', description: 'Risk of bias and quality scores', icon: <PieChart className="w-5 h-5" /> },
    { id: 'forest', name: 'Forest Plot', description: 'Meta-analysis forest plot', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'characteristics', name: 'Study Characteristics', description: 'Table of study characteristics', icon: <FileSpreadsheet className="w-5 h-5" /> }
  ]

  const dataTypes = [
    { id: 'articles', name: 'All Articles', description: 'Complete article database' },
    { id: 'screening', name: 'Screening Decisions', description: 'Include/exclude decisions with notes' },
    { id: 'extraction', name: 'Extracted Data', description: 'Data extraction results' },
    { id: 'protocol', name: 'Protocol', description: 'Study protocol and criteria' },
    { id: 'search', name: 'Search Strategy', description: 'Database searches and queries' },
    { id: 'duplicates', name: 'Duplicate Detection', description: 'Identified duplicate articles' }
  ]

  useEffect(() => {
    if (projectId) {
      fetchProjectStats()
    }
  }, [projectId])

  const fetchProjectStats = async () => {
    try {
      setLoading(true)

      const { data: articles, error } = await supabase
        .from('articles')
        .select('*')
        .eq('project_id', projectId)

      if (error) throw error

      const screened = articles?.filter(a => a.screening_decision !== null) || []
      const included = screened.filter(a => a.screening_decision === 'include')
      const excluded = screened.filter(a => a.screening_decision === 'exclude')
      const extracted = articles?.filter(a => a.extracted_data !== null) || []

      setStats({
        totalArticles: articles?.length || 0,
        screenedArticles: screened.length,
        includedArticles: included.length,
        excludedArticles: excluded.length,
        extractedData: extracted.length,
        lastUpdated: new Date().toISOString()
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      // Fetch data based on selection
      const dataToExport: any = {}

      if (selectedData.has('articles')) {
        const { data } = await supabase
          .from('articles')
          .select('*')
          .eq('project_id', projectId)
        dataToExport.articles = data
      }

      if (selectedData.has('screening')) {
        const { data } = await supabase
          .from('articles')
          .select('id, title, screening_decision, screening_notes')
          .eq('project_id', projectId)
          .not('screening_decision', 'is', null)
        dataToExport.screening = data
      }

      if (selectedData.has('extraction')) {
        const { data } = await supabase
          .from('articles')
          .select('id, title, extracted_data')
          .eq('project_id', projectId)
          .not('extracted_data', 'is', null)
        dataToExport.extraction = data
      }

      // Convert to selected format
      let exportContent = ''
      let mimeType = ''
      let filename = `export-${new Date().toISOString()}`

      switch (selectedFormat) {
        case 'csv':
          exportContent = convertToCSV(dataToExport)
          mimeType = 'text/csv'
          filename += '.csv'
          break
        case 'json':
          exportContent = JSON.stringify(dataToExport, null, 2)
          mimeType = 'application/json'
          filename += '.json'
          break
        case 'ris':
          exportContent = convertToRIS(dataToExport.articles || [])
          mimeType = 'application/x-research-info-systems'
          filename += '.ris'
          break
        default:
          exportContent = convertToCSV(dataToExport)
          mimeType = 'text/csv'
          filename += '.csv'
      }

      // Download file
      const blob = new Blob([exportContent], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()

      // Log export
      await supabase.from('export_logs').insert({
        project_id: projectId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        file_path: filename,
        format: selectedFormat,
        filters: { dataTypes: Array.from(selectedData), dateRange }
      })
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  const convertToCSV = (data: any) => {
    const articles = data.articles || []
    if (articles.length === 0) return ''

    const headers = ['Title', 'Authors', 'Journal', 'Year', 'DOI', 'Status', 'Decision', 'Notes']
    const rows = articles.map((a: any) => [
      a.title,
      a.authors?.join('; '),
      a.journal,
      a.publication_date,
      a.doi,
      a.status,
      a.screening_decision || '',
      a.screening_notes || ''
    ])

    return [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n')
  }

  const convertToRIS = (articles: any[]) => {
    return articles.map(article => {
      const lines = []
      lines.push('TY  - JOUR')
      lines.push(`TI  - ${article.title}`)
      article.authors?.forEach((author: string) => {
        lines.push(`AU  - ${author}`)
      })
      lines.push(`JO  - ${article.journal || ''}`)
      lines.push(`PY  - ${new Date(article.publication_date).getFullYear()}`)
      if (article.doi) lines.push(`DO  - ${article.doi}`)
      if (article.abstract) lines.push(`AB  - ${article.abstract}`)
      lines.push('ER  -')
      return lines.join('\n')
    }).join('\n\n')
  }

  const generateReport = async (templateId: string) => {
    setExporting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Call edge function to generate report
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          projectId,
          templateId,
          format: 'pdf'
        }
      })

      if (error) throw error

      // Mock success message
      alert(`${reportTemplates.find(t => t.id === templateId)?.name} generated successfully!`)
    } catch (err) {
      console.error('Report generation error:', err)
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Export & Reports</h1>
          <p className="text-gray-600 mt-1">Export your data and generate comprehensive reports</p>
        </div>

        {/* Project Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Articles</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Screened</p>
            <p className="text-2xl font-bold text-blue-600">{stats.screenedArticles}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Included</p>
            <p className="text-2xl font-bold text-green-600">{stats.includedArticles}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Excluded</p>
            <p className="text-2xl font-bold text-red-600">{stats.excludedArticles}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Extracted</p>
            <p className="text-2xl font-bold text-purple-600">{stats.extractedData}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Completion</p>
            <p className="text-2xl font-bold text-yellow-600">
              {stats.totalArticles > 0 ? Math.round((stats.extractedData / stats.includedArticles) * 100) : 0}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Data Export */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Export</h2>
            
            {/* Export Format */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
              <h3 className="font-medium text-gray-900 mb-4">Export Format</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {exportFormats.map(format => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedFormat === format.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      {format.icon}
                      <span className="text-sm font-medium mt-1">{format.name}</span>
                      <span className="text-xs text-gray-500">{format.extension}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Data Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
              <h3 className="font-medium text-gray-900 mb-4">Data to Export</h3>
              <div className="space-y-3">
                {dataTypes.map(type => (
                  <label key={type.id} className="flex items-start">
                    <input
                      type="checkbox"
                      checked={selectedData.has(type.id)}
                      onChange={(e) => {
                        const newSelection = new Set(selectedData)
                        if (e.target.checked) {
                          newSelection.add(type.id)
                        } else {
                          newSelection.delete(type.id)
                        }
                        setSelectedData(newSelection)
                      }}
                      className="mt-1 rounded border-gray-300"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-sm text-gray-900">{type.name}</p>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
              <h3 className="font-medium text-gray-900 mb-4">Date Range (Optional)</h3>
              <div className="flex gap-3">
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span className="self-center text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={exporting || selectedData.size === 0}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {exporting ? (
                <>
                  <LoadingSpinner size="small" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Export Data
                </>
              )}
            </button>
          </div>

          {/* Report Generation */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Reports</h2>
            
            <div className="space-y-4">
              {reportTemplates.map(template => (
                <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {template.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => generateReport(template.id)}
                      disabled={exporting}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Exports */}
            <div className="mt-8">
              <h3 className="font-medium text-gray-900 mb-4">Recent Exports</h3>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 text-center text-gray-500 text-sm">
                  <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  No recent exports
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}