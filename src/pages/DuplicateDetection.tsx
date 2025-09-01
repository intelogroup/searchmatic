import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Copy, Merge, Trash2, CheckCircle, XCircle, AlertTriangle, Search, Filter } from 'lucide-react'

interface Article {
  id: string
  title: string
  authors: string[]
  journal: string
  publicationDate: string
  doi: string
  pmid?: string
  abstract: string
  source: string
}

interface DuplicatePair {
  id: string
  article1: Article
  article2: Article
  similarity: number
  matchType: 'exact' | 'fuzzy' | 'doi' | 'title' | 'similar'
  status: 'pending' | 'merged' | 'not_duplicate'
}

export default function DuplicateDetection() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [selectedPair, setSelectedPair] = useState<DuplicatePair | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    exact: 0,
    fuzzy: 0,
    resolved: 0
  })
  const [filterType, setFilterType] = useState<string>('all')
  const [autoMergeEnabled, setAutoMergeEnabled] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchDuplicates()
    }
  }, [projectId])

  const fetchDuplicates = async () => {
    try {
      setLoading(true)
      
      // Fetch all articles
      const { data: articles, error } = await supabase
        .from('articles')
        .select('*')
        .eq('project_id', projectId)
        .order('title')

      if (error) throw error

      // Find duplicates
      const duplicatePairs = findDuplicates(articles || [])
      setDuplicates(duplicatePairs)
      
      // Calculate stats
      setStats({
        total: duplicatePairs.length,
        exact: duplicatePairs.filter(d => d.matchType === 'exact' || d.matchType === 'doi').length,
        fuzzy: duplicatePairs.filter(d => d.matchType === 'fuzzy' || d.matchType === 'similar').length,
        resolved: duplicatePairs.filter(d => d.status !== 'pending').length
      })
    } catch (err) {
      console.error('Error fetching duplicates:', err)
    } finally {
      setLoading(false)
    }
  }

  const findDuplicates = (articles: Article[]): DuplicatePair[] => {
    const pairs: DuplicatePair[] = []
    const processed = new Set<string>()

    for (let i = 0; i < articles.length; i++) {
      for (let j = i + 1; j < articles.length; j++) {
        const article1 = articles[i]
        const article2 = articles[j]
        const pairId = `${article1.id}-${article2.id}`

        if (processed.has(pairId)) continue
        processed.add(pairId)

        // Check for exact DOI match
        if (article1.doi && article2.doi && article1.doi === article2.doi) {
          pairs.push({
            id: pairId,
            article1,
            article2,
            similarity: 100,
            matchType: 'doi',
            status: 'pending'
          })
          continue
        }

        // Check for exact title match
        if (article1.title.toLowerCase() === article2.title.toLowerCase()) {
          pairs.push({
            id: pairId,
            article1,
            article2,
            similarity: 100,
            matchType: 'exact',
            status: 'pending'
          })
          continue
        }

        // Check for fuzzy title match
        const similarity = calculateSimilarity(article1.title, article2.title)
        if (similarity > 85) {
          pairs.push({
            id: pairId,
            article1,
            article2,
            similarity,
            matchType: 'fuzzy',
            status: 'pending'
          })
          continue
        }

        // Check for similar authors and year
        if (hasOverlappingAuthors(article1.authors, article2.authors) && 
            article1.publicationDate === article2.publicationDate &&
            similarity > 70) {
          pairs.push({
            id: pairId,
            article1,
            article2,
            similarity,
            matchType: 'similar',
            status: 'pending'
          })
        }
      }
    }

    return pairs.sort((a, b) => b.similarity - a.similarity)
  }

  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase()
    const s2 = str2.toLowerCase()
    
    if (s1 === s2) return 100
    
    const longer = s1.length > s2.length ? s1 : s2
    const shorter = s1.length > s2.length ? s2 : s1
    
    if (longer.length === 0) return 100
    
    const editDistance = getEditDistance(longer, shorter)
    return Math.round(((longer.length - editDistance) / longer.length) * 100)
  }

  const getEditDistance = (s1: string, s2: string): number => {
    const costs = []
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j
        } else if (j > 0) {
          let newValue = costs[j - 1]
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
          }
          costs[j - 1] = lastValue
          lastValue = newValue
        }
      }
      if (i > 0) costs[s2.length] = lastValue
    }
    return costs[s2.length]
  }

  const hasOverlappingAuthors = (authors1: string[], authors2: string[]): boolean => {
    if (!authors1?.length || !authors2?.length) return false
    
    const set1 = new Set(authors1.map(a => a.toLowerCase().split(' ').pop()))
    const set2 = new Set(authors2.map(a => a.toLowerCase().split(' ').pop()))
    
    for (const author of set1) {
      if (set2.has(author)) return true
    }
    return false
  }

  const handleMerge = async (pair: DuplicatePair, keepArticle: 'article1' | 'article2') => {
    try {
      const keepId = pair[keepArticle].id
      const removeId = keepArticle === 'article1' ? pair.article2.id : pair.article1.id

      // Delete the duplicate
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', removeId)

      if (error) throw error

      // Update local state
      setDuplicates(duplicates.map(d => 
        d.id === pair.id ? { ...d, status: 'merged' } : d
      ))

      // Update stats
      setStats(prev => ({
        ...prev,
        resolved: prev.resolved + 1
      }))
    } catch (err) {
      console.error('Error merging articles:', err)
    }
  }

  const handleNotDuplicate = (pair: DuplicatePair) => {
    setDuplicates(duplicates.map(d => 
      d.id === pair.id ? { ...d, status: 'not_duplicate' } : d
    ))
    setStats(prev => ({
      ...prev,
      resolved: prev.resolved + 1
    }))
  }

  const handleAutoMerge = async () => {
    const exactDuplicates = duplicates.filter(d => 
      d.status === 'pending' && (d.matchType === 'doi' || d.matchType === 'exact')
    )

    for (const pair of exactDuplicates) {
      // Keep the one with more complete data
      const article1Complete = [pair.article1.doi, pair.article1.abstract, pair.article1.pmid].filter(Boolean).length
      const article2Complete = [pair.article2.doi, pair.article2.abstract, pair.article2.pmid].filter(Boolean).length
      
      await handleMerge(pair, article1Complete >= article2Complete ? 'article1' : 'article2')
    }
  }

  const filteredDuplicates = duplicates.filter(d => {
    if (filterType === 'all') return true
    if (filterType === 'pending') return d.status === 'pending'
    if (filterType === 'resolved') return d.status !== 'pending'
    return d.matchType === filterType
  })

  if (loading) return <LoadingSpinner />

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Duplicate Detection</h1>
          <p className="text-gray-600">Identify and merge duplicate articles in your library</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Duplicates</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Copy className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Exact Matches</p>
                <p className="text-2xl font-bold text-red-600">{stats.exact}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fuzzy Matches</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.fuzzy}</p>
              </div>
              <Search className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Duplicates</option>
                <option value="pending">Pending Review</option>
                <option value="resolved">Resolved</option>
                <option value="exact">Exact Matches</option>
                <option value="doi">DOI Matches</option>
                <option value="fuzzy">Fuzzy Matches</option>
              </select>
              <button
                onClick={fetchDuplicates}
                disabled={scanning}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {scanning ? 'Scanning...' : 'Rescan'}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoMergeEnabled}
                  onChange={(e) => setAutoMergeEnabled(e.target.checked)}
                  className="mr-2 rounded border-gray-300"
                />
                <span className="text-sm">Enable Auto-Merge for Exact Matches</span>
              </label>
              {autoMergeEnabled && stats.exact > 0 && (
                <button
                  onClick={handleAutoMerge}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Auto-Merge {stats.exact} Exact Matches
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Duplicate Pairs */}
        {filteredDuplicates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Duplicates Found</h3>
            <p className="text-gray-600">Your article library is free of duplicates!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDuplicates.map(pair => (
              <div
                key={pair.id}
                className={`bg-white rounded-lg shadow-sm border ${
                  pair.status === 'merged' ? 'border-green-200 bg-green-50' :
                  pair.status === 'not_duplicate' ? 'border-gray-200 bg-gray-50' :
                  'border-yellow-200'
                } p-6`}
              >
                {/* Similarity Badge */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      pair.similarity === 100 ? 'bg-red-100 text-red-800' :
                      pair.similarity > 90 ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {pair.similarity}% Match
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      {pair.matchType === 'doi' ? 'DOI Match' :
                       pair.matchType === 'exact' ? 'Exact Title' :
                       pair.matchType === 'fuzzy' ? 'Similar Title' :
                       'Likely Duplicate'}
                    </span>
                    {pair.status !== 'pending' && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        pair.status === 'merged' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {pair.status === 'merged' ? 'Merged' : 'Not Duplicate'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Articles Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-gray-500">Article 1</span>
                      {pair.article1.source && (
                        <span className="text-xs text-gray-500">{pair.article1.source}</span>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{pair.article1.title}</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      {pair.article1.authors?.slice(0, 3).join(', ')}
                      {pair.article1.authors?.length > 3 && ' et al.'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {pair.article1.journal} • {pair.article1.publicationDate}
                    </p>
                    {pair.article1.doi && (
                      <p className="text-xs text-gray-500 mt-1">DOI: {pair.article1.doi}</p>
                    )}
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-gray-500">Article 2</span>
                      {pair.article2.source && (
                        <span className="text-xs text-gray-500">{pair.article2.source}</span>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{pair.article2.title}</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      {pair.article2.authors?.slice(0, 3).join(', ')}
                      {pair.article2.authors?.length > 3 && ' et al.'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {pair.article2.journal} • {pair.article2.publicationDate}
                    </p>
                    {pair.article2.doi && (
                      <p className="text-xs text-gray-500 mt-1">DOI: {pair.article2.doi}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {pair.status === 'pending' && (
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleMerge(pair, 'article1')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <Merge className="w-4 h-4 inline mr-1" />
                      Keep Article 1
                    </button>
                    <button
                      onClick={() => handleMerge(pair, 'article2')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <Merge className="w-4 h-4 inline mr-1" />
                      Keep Article 2
                    </button>
                    <button
                      onClick={() => handleNotDuplicate(pair)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                    >
                      <XCircle className="w-4 h-4 inline mr-1" />
                      Not Duplicates
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}