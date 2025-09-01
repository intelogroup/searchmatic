import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { FileText, Upload, Download, Filter, Search, Trash2, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface Article {
  id: string
  title: string
  authors: string[]
  journal: string
  publicationDate: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  screeningDecision: 'include' | 'exclude' | 'maybe' | null
  source: string
  doi: string
  abstract: string
}

export default function Articles() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (projectId) {
      fetchArticles()
    }
  }, [projectId])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setArticles(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch articles')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = () => {
    navigate(`/projects/${projectId}/articles/import`)
  }

  const handleExport = async () => {
    const selected = articles.filter(a => selectedArticles.has(a.id))
    const dataToExport = selected.length > 0 ? selected : articles
    
    const csv = convertToCSV(dataToExport)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `articles-${new Date().toISOString()}.csv`
    a.click()
  }

  const convertToCSV = (data: Article[]) => {
    const headers = ['Title', 'Authors', 'Journal', 'Date', 'Status', 'Decision', 'DOI']
    const rows = data.map(a => [
      a.title,
      a.authors?.join('; '),
      a.journal,
      a.publicationDate,
      a.status,
      a.screeningDecision || '',
      a.doi
    ])
    return [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n')
  }

  const toggleArticleSelection = (id: string) => {
    const newSelection = new Set(selectedArticles)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedArticles(newSelection)
  }

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.authors?.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterStatus === 'all' || article.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      case 'processing': return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getDecisionBadge = (decision: string | null) => {
    switch (decision) {
      case 'include':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Include</span>
      case 'exclude':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Exclude</span>
      case 'maybe':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Maybe</span>
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">Pending</span>
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Article Management</h1>
          <p className="text-gray-600">Manage and review articles for your systematic review</p>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              {selectedArticles.size > 0 && (
                <button
                  onClick={() => setSelectedArticles(new Set())}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Clear Selection ({selectedArticles.size})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Articles Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedArticles.size === articles.length && articles.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedArticles(new Set(articles.map(a => a.id)))
                        } else {
                          setSelectedArticles(new Set())
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Authors
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Journal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Decision
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedArticles.has(article.id)}
                        onChange={() => toggleArticleSelection(article.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {getStatusIcon(article.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                        {article.doi && (
                          <p className="text-xs text-gray-500 mt-1">DOI: {article.doi}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {article.authors?.slice(0, 3).join(', ')}
                        {article.authors?.length > 3 && ' et al.'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{article.journal}</p>
                      <p className="text-xs text-gray-500">{article.publicationDate}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getDecisionBadge(article.screeningDecision)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/projects/${projectId}/articles/${article.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No articles found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Get started by importing articles'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={handleImport}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Import Articles
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}