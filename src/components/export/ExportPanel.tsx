import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Download, 
  FileText, 
  FileSpreadsheet,
  FileCode,
  File,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface ExportPanelProps {
  projectId: string
  className?: string
}

interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json' | 'bibtex' | 'ris' | 'prisma_checklist'
  includeFields: {
    title: boolean
    authors: boolean
    journal: boolean
    year: boolean
    doi: boolean
    pmid: boolean
    abstract: boolean
    keywords: boolean
    status: boolean
    notes: boolean
    extraction_data: boolean
  }
  filterStatus: 'all' | 'included' | 'excluded' | 'pending' | 'screening'
}

interface ExportJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  format: string
  createdAt: string
  downloadUrl?: string
  error?: string
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ 
  className = ''
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeFields: {
      title: true,
      authors: true,
      journal: true,
      year: true,
      doi: true,
      pmid: false,
      abstract: false,
      keywords: false,
      status: true,
      notes: false,
      extraction_data: false
    },
    filterStatus: 'all'
  })

  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatOptions = [
    { value: 'csv', label: 'CSV File', icon: FileSpreadsheet, description: 'Comma-separated values for Excel' },
    { value: 'xlsx', label: 'Excel File', icon: FileSpreadsheet, description: 'Microsoft Excel format' },
    { value: 'json', label: 'JSON File', icon: FileCode, description: 'Machine-readable data format' },
    { value: 'bibtex', label: 'BibTeX', icon: FileText, description: 'For LaTeX citations' },
    { value: 'ris', label: 'RIS Format', icon: FileText, description: 'Research Information Systems' },
    { value: 'prisma_checklist', label: 'PRISMA Checklist', icon: File, description: 'Systematic review checklist' }
  ]

  const fieldOptions = [
    { key: 'title', label: 'Title', required: true },
    { key: 'authors', label: 'Authors' },
    { key: 'journal', label: 'Journal' },
    { key: 'year', label: 'Publication Year' },
    { key: 'doi', label: 'DOI' },
    { key: 'pmid', label: 'PMID' },
    { key: 'abstract', label: 'Abstract' },
    { key: 'keywords', label: 'Keywords' },
    { key: 'status', label: 'Review Status' },
    { key: 'notes', label: 'Screening Notes' },
    { key: 'extraction_data', label: 'Extracted Data' }
  ]

  const handleExport = async () => {

    setIsExporting(true)
    setError(null)

    try {
      // Simulate export process
      const newJob: ExportJob = {
        id: `export-${Date.now()}`,
        status: 'processing',
        format: exportOptions.format,
        createdAt: new Date().toISOString()
      }

      setExportJobs(prev => [newJob, ...prev])

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulate success
      const completedJob: ExportJob = {
        ...newJob,
        status: 'completed',
        downloadUrl: `#download-${newJob.id}` // In real app, this would be a signed URL
      }

      setExportJobs(prev => prev.map(job => 
        job.id === newJob.id ? completedJob : job
      ))

    } catch (err) {
      const failedJob = exportJobs.find(job => job.status === 'processing')
      if (failedJob) {
        setExportJobs(prev => prev.map(job => 
          job.id === failedJob.id 
            ? { ...job, status: 'failed', error: 'Export failed' }
            : job
        ))
      }
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const handleFieldChange = (field: keyof ExportOptions['includeFields'], checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      includeFields: {
        ...prev.includeFields,
        [field]: checked
      }
    }))
  }

  const getFormatIcon = (format: string) => {
    const option = formatOptions.find(opt => opt.value === format)
    return option ? option.icon : FileText
  }

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      default: return <Loader2 className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Export Data</CardTitle>
          </div>
          {exportJobs.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {exportJobs.length} exports
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

      <CardContent className="flex-1 flex flex-col gap-4 p-4 pt-0 overflow-y-auto">
        {/* Export Configuration */}
        <div className="space-y-4 pb-4 border-b">
          {/* Format Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Export Format</label>
            <div className="grid grid-cols-1 gap-2">
              {formatOptions.map((option) => {
                const Icon = option.icon
                return (
                  <div
                    key={option.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      exportOptions.format === option.value 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/30'
                    }`}
                    onClick={() => setExportOptions(prev => ({ ...prev, format: option.value as any }))}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{option.label}</span>
                          {exportOptions.format === option.value && (
                            <Badge variant="secondary" className="text-xs">Selected</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Filter by Status</label>
            <Select
              value={exportOptions.filterStatus}
              onValueChange={(value) => setExportOptions(prev => ({ 
                ...prev, 
                filterStatus: value as ExportOptions['filterStatus']
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Studies</SelectItem>
                <SelectItem value="included">Included Only</SelectItem>
                <SelectItem value="excluded">Excluded Only</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="screening">In Screening</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Include Fields</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {fieldOptions.map((field) => (
                <div key={field.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.key}
                    checked={exportOptions.includeFields[field.key as keyof ExportOptions['includeFields']]}
                    onCheckedChange={(checked) => 
                      handleFieldChange(field.key as keyof ExportOptions['includeFields'], checked as boolean)
                    }
                    disabled={field.required}
                  />
                  <label
                    htmlFor={field.key}
                    className={`text-sm ${field.required ? 'text-muted-foreground' : 'cursor-pointer'}`}
                  >
                    {field.label}
                    {field.required && <span className="text-xs ml-1">(required)</span>}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Export...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Export
              </>
            )}
          </Button>
        </div>

        {/* Export History */}
        {exportJobs.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Recent Exports</h3>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {exportJobs.map((job) => {
                const Icon = getFormatIcon(job.format)
                
                return (
                  <div 
                    key={job.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {job.format.toUpperCase()} Export
                        </span>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(job.status)}
                          <Badge className={getStatusColor(job.status)} variant="secondary">
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.createdAt).toLocaleString()}
                      </p>
                      {job.error && (
                        <p className="text-xs text-red-600 mt-1">{job.error}</p>
                      )}
                    </div>

                    {job.status === 'completed' && job.downloadUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // In real app, this would trigger actual download
                          console.log('Download:', job.downloadUrl)
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {exportJobs.length === 0 && !isExporting && (
          <div className="flex-1 flex items-center justify-center text-center">
            <div className="space-y-4">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Download className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Export Your Data</h3>
                <p className="text-sm text-muted-foreground max-w-[300px]">
                  Export your systematic review data in various formats including 
                  CSV, Excel, BibTeX, and PRISMA checklists.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ExportPanel