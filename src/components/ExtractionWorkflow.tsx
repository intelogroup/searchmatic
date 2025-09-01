import React, { useState, useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Eye,
  RefreshCw,
  Filter,
  Search,
  ArrowRight,
  Zap,
  Database
} from 'lucide-react'

interface ExtractionWorkflowProps {
  projectId: string
}

interface WorkflowItem {
  id: string
  fileName: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  processType: string
  uploadedAt: string
  processedAt?: string
  extractedText?: string
  extractedData?: any
  error?: string
  pdfFileId?: string
  articleId: string
  queueId?: string
  processingAttempts?: number
}

interface WorkflowStats {
  total: number
  pending: number
  processing: number
  completed: number
  error: number
}

export function ExtractionWorkflow({ projectId }: ExtractionWorkflowProps) {
  const [items, setItems] = useState<WorkflowItem[]>([])
  const [stats, setStats] = useState<WorkflowStats>({ total: 0, pending: 0, processing: 0, completed: 0, error: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<WorkflowItem | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const supabase = useSupabaseClient()

  useEffect(() => {
    loadWorkflowItems()
    
    // Set up real-time subscription for updates
    const subscription = supabase
      .channel('workflow_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'articles',
        filter: `project_id=eq.${projectId}`
      }, () => {
        loadWorkflowItems()
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'pdf_files'
      }, () => {
        loadWorkflowItems()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [projectId, supabase])

  const loadWorkflowItems = async () => {
    try {
      setLoading(true)
      
      // Get articles with PDF file information
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          status,
          full_text,
          extracted_data,
          created_at,
          updated_at,
          metadata,
          pdf_files (
            id,
            file_name,
            processing_status,
            processing_error,
            processing_attempts,
            uploaded_at,
            processed_at
          )
        `)
        .eq('project_id', projectId)
        .eq('source', 'manual')
        .order('created_at', { ascending: false })

      if (articlesError) throw articlesError

      // Transform data for display
      const workflowItems: WorkflowItem[] = (articles || []).map(article => {
        const pdfFile = article.pdf_files?.[0]
        const metadata = article.metadata as any || {}
        
        return {
          id: article.id,
          articleId: article.id,
          fileName: pdfFile?.file_name || metadata.fileName || article.title || 'Untitled',
          status: article.status as any,
          processType: metadata.processType || 'text_extraction',
          uploadedAt: pdfFile?.uploaded_at || article.created_at,
          processedAt: pdfFile?.processed_at || article.updated_at,
          extractedText: article.full_text,
          extractedData: article.extracted_data,
          error: pdfFile?.processing_error,
          pdfFileId: pdfFile?.id,
          processingAttempts: pdfFile?.processing_attempts || 0
        }
      })

      setItems(workflowItems)

      // Calculate stats
      const newStats = workflowItems.reduce(
        (acc, item) => {
          acc.total++
          acc[item.status as keyof Omit<WorkflowStats, 'total'>]++
          return acc
        },
        { total: 0, pending: 0, processing: 0, completed: 0, error: 0 }
      )
      setStats(newStats)

    } catch (err) {
      console.error('Error loading workflow items:', err)
      setError(err instanceof Error ? err.message : 'Failed to load workflow data')
    } finally {
      setLoading(false)
    }
  }

  const retryProcessing = async (item: WorkflowItem) => {
    if (!item.pdfFileId) return

    try {
      // Get JWT token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Authentication required')
      }

      // Reset status to processing
      await supabase
        .from('articles')
        .update({ status: 'processing' })
        .eq('id', item.articleId)

      await supabase
        .from('pdf_files')
        .update({ 
          processing_status: 'processing',
          processing_error: null
        })
        .eq('id', item.pdfFileId)

      // Trigger reprocessing via edge function
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          fileName: item.fileName,
          pdfFileId: item.pdfFileId,
          processType: item.processType,
          retry: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Retry failed')
      }

      await loadWorkflowItems()
    } catch (err) {
      console.error('Error retrying processing:', err)
      setError(err instanceof Error ? err.message : 'Retry failed')
    }
  }

  const downloadExtractedData = (item: WorkflowItem) => {
    const data = {
      fileName: item.fileName,
      processType: item.processType,
      processedAt: item.processedAt,
      extractedText: item.extractedText,
      extractedData: item.extractedData
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.fileName.replace(/\.[^/.]+$/, '')}_extracted.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredItems = items
    .filter(item => statusFilter === 'all' || item.status === statusFilter)
    .filter(item => 
      searchQuery === '' || 
      item.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Database className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Zap className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Processing</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.processing}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.completed}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Errors</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.error}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                  Search
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search by filename..."
                  />
                </div>
              </div>
            </div>

            <button
              onClick={loadWorkflowItems}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Workflow Items */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredItems.length === 0 ? (
            <li className="px-6 py-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Upload some documents to get started'}
              </p>
            </li>
          ) : (
            filteredItems.map((item) => (
              <li key={item.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(item.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.fileName}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {item.processType.replace('_', ' ')} • 
                          Uploaded {new Date(item.uploadedAt).toLocaleDateString()} • 
                          {item.processedAt && `Processed ${new Date(item.processedAt).toLocaleDateString()}`}
                        </p>
                        {item.error && (
                          <p className="text-sm text-red-600 mt-1">
                            Error: {item.error}
                            {item.processingAttempts && item.processingAttempts > 1 && 
                              ` (Attempt ${item.processingAttempts})`
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.status === 'completed' && (
                        <>
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => downloadExtractedData(item)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </button>
                        </>
                      )}
                      
                      {item.status === 'error' && (
                        <button
                          onClick={() => retryProcessing(item)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Retry
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress indicators */}
                  {item.status === 'processing' && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Processing document...</span>
                        <span className="text-gray-500">
                          {item.processType === 'full_analysis' ? '60-90s' : '15-30s'} estimated
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full animate-pulse"
                            style={{ width: '60%' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick preview for completed items */}
                  {item.status === 'completed' && item.extractedText && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {item.extractedText.slice(0, 200)}...
                      </p>
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        View full content <ArrowRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}

interface ItemDetailModalProps {
  item: WorkflowItem
  onClose: () => void
}

function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'data'>('text')

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              {item.fileName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
            <span>Process Type: {item.processType.replace('_', ' ')}</span>
            <span>•</span>
            <span>Processed: {item.processedAt && new Date(item.processedAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-2 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('text')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'text'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Extracted Text
            </button>
            {item.extractedData && (
              <button
                onClick={() => setActiveTab('data')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'data'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Extracted Data
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'text' && (
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-md">
                {item.extractedText || 'No text extracted'}
              </pre>
            </div>
          )}

          {activeTab === 'data' && item.extractedData && (
            <div>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-md">
                {JSON.stringify(item.extractedData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}