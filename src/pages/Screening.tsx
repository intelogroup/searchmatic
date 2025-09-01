import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { CheckCircle, XCircle, HelpCircle, ChevronLeft, ChevronRight, FileText, Users, BarChart3, Clock, AlertCircle } from 'lucide-react'

interface Article {
  id: string
  title: string
  authors: string[]
  abstract: string
  journal: string
  publicationDate: string
  doi: string
  screeningDecision: 'include' | 'exclude' | 'maybe' | null
  screeningNotes: string
}

interface ScreeningStats {
  total: number
  screened: number
  included: number
  excluded: number
  maybe: number
  remaining: number
}

export default function Screening() {
  const { projectId } = useParams()
  const [articles, setArticles] = useState<Article[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState('')
  const [showFullAbstract, setShowFullAbstract] = useState(false)
  const [stats, setStats] = useState<ScreeningStats>({
    total: 0,
    screened: 0,
    included: 0,
    excluded: 0,
    maybe: 0,
    remaining: 0
  })
  const [screeningMode, setScreeningMode] = useState<'title-abstract' | 'full-text'>('title-abstract')
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchArticles()
    }
  }, [projectId])

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return

      switch(e.key) {
        case '1':
        case 'i':
          handleDecision('include')
          break
        case '2':
        case 'e':
          handleDecision('exclude')
          break
        case '3':
        case 'm':
          handleDecision('maybe')
          break
        case 'ArrowLeft':
          navigateArticle('prev')
          break
        case 'ArrowRight':
          navigateArticle('next')
          break
        case '?':
          setShowKeyboardShortcuts(!showKeyboardShortcuts)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, articles, showKeyboardShortcuts])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const articlesData = data || []
      setArticles(articlesData)
      
      // Calculate stats
      const screened = articlesData.filter(a => a.screeningDecision !== null)
      setStats({
        total: articlesData.length,
        screened: screened.length,
        included: screened.filter(a => a.screeningDecision === 'include').length,
        excluded: screened.filter(a => a.screeningDecision === 'exclude').length,
        maybe: screened.filter(a => a.screeningDecision === 'maybe').length,
        remaining: articlesData.filter(a => a.screeningDecision === null).length
      })

      // Find first unscreened article
      const firstUnscreened = articlesData.findIndex(a => a.screeningDecision === null)
      if (firstUnscreened !== -1) {
        setCurrentIndex(firstUnscreened)
      }
    } catch (err) {
      console.error('Error fetching articles:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = async (decision: 'include' | 'exclude' | 'maybe') => {
    if (!articles[currentIndex]) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('articles')
        .update({ 
          screening_decision: decision,
          screening_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', articles[currentIndex].id)

      if (error) throw error

      // Update local state
      const updatedArticles = [...articles]
      updatedArticles[currentIndex] = {
        ...updatedArticles[currentIndex],
        screeningDecision: decision,
        screeningNotes: notes
      }
      setArticles(updatedArticles)

      // Update stats
      setStats(prev => ({
        ...prev,
        screened: prev.screened + (articles[currentIndex].screeningDecision ? 0 : 1),
        included: prev.included + (decision === 'include' ? 1 : 0) - (articles[currentIndex].screeningDecision === 'include' ? 1 : 0),
        excluded: prev.excluded + (decision === 'exclude' ? 1 : 0) - (articles[currentIndex].screeningDecision === 'exclude' ? 1 : 0),
        maybe: prev.maybe + (decision === 'maybe' ? 1 : 0) - (articles[currentIndex].screeningDecision === 'maybe' ? 1 : 0),
        remaining: prev.remaining - (articles[currentIndex].screeningDecision ? 0 : 1)
      }))

      // Move to next unscreened article
      setNotes('')
      moveToNextUnscreened()
    } catch (err) {
      console.error('Error saving decision:', err)
    } finally {
      setSaving(false)
    }
  }

  const moveToNextUnscreened = () => {
    const nextUnscreened = articles.findIndex((a, i) => i > currentIndex && a.screeningDecision === null)
    if (nextUnscreened !== -1) {
      setCurrentIndex(nextUnscreened)
    } else {
      // If no more unscreened, just move to next
      if (currentIndex < articles.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    }
  }

  const navigateArticle = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setNotes(articles[currentIndex - 1].screeningNotes || '')
    } else if (direction === 'next' && currentIndex < articles.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setNotes(articles[currentIndex + 1].screeningNotes || '')
    }
  }

  if (loading) return <LoadingSpinner />
  if (articles.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Articles to Screen</h2>
          <p className="text-gray-600">Import articles first to begin screening</p>
        </div>
      </AppLayout>
    )
  }

  const currentArticle = articles[currentIndex]
  const progress = (stats.screened / stats.total) * 100

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Stats */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Article Screening</h1>
              <p className="text-gray-600 mt-1">
                {screeningMode === 'title-abstract' ? 'Title & Abstract' : 'Full Text'} Screening
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setScreeningMode('title-abstract')}
                className={`px-4 py-2 rounded-lg ${
                  screeningMode === 'title-abstract' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Title & Abstract
              </button>
              <button
                onClick={() => setScreeningMode('full-text')}
                className={`px-4 py-2 rounded-lg ${
                  screeningMode === 'full-text' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Full Text
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress: {stats.screened} of {stats.total} articles</span>
              <span>{progress.toFixed(1)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Included</p>
                  <p className="text-2xl font-bold text-green-600">{stats.included}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Excluded</p>
                  <p className="text-2xl font-bold text-red-600">{stats.excluded}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500 opacity-50" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Maybe</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.maybe}</p>
                </div>
                <HelpCircle className="w-8 h-8 text-yellow-500 opacity-50" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.remaining}</p>
                </div>
                <Clock className="w-8 h-8 text-gray-500 opacity-50" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Screening Interface */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Article Navigation */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <button
              onClick={() => navigateArticle('prev')}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            <div className="text-center">
              <span className="text-lg font-medium">
                Article {currentIndex + 1} of {articles.length}
              </span>
              {currentArticle.screeningDecision && (
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    currentArticle.screeningDecision === 'include' ? 'bg-green-100 text-green-800' :
                    currentArticle.screeningDecision === 'exclude' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    Already screened: {currentArticle.screeningDecision}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => navigateArticle('next')}
              disabled={currentIndex === articles.length - 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Article Content */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{currentArticle.title}</h2>
            
            <div className="text-sm text-gray-600 mb-4">
              <p className="mb-1">
                <strong>Authors:</strong> {currentArticle.authors?.join(', ')}
              </p>
              <p className="mb-1">
                <strong>Journal:</strong> {currentArticle.journal} ({currentArticle.publicationDate})
              </p>
              {currentArticle.doi && (
                <p>
                  <strong>DOI:</strong> <a href={`https://doi.org/${currentArticle.doi}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{currentArticle.doi}</a>
                </p>
              )}
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Abstract</h3>
              <div className={`text-gray-700 ${!showFullAbstract ? 'line-clamp-6' : ''}`}>
                {currentArticle.abstract || 'No abstract available'}
              </div>
              {currentArticle.abstract && currentArticle.abstract.length > 500 && (
                <button
                  onClick={() => setShowFullAbstract(!showFullAbstract)}
                  className="text-blue-600 hover:text-blue-700 text-sm mt-2"
                >
                  {showFullAbstract ? 'Show less' : 'Show full abstract'}
                </button>
              )}
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Screening Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about your screening decision..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Decision Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleDecision('include')}
                disabled={saving}
                className="flex-1 max-w-xs px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Include (1)
              </button>
              <button
                onClick={() => handleDecision('exclude')}
                disabled={saving}
                className="flex-1 max-w-xs px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Exclude (2)
              </button>
              <button
                onClick={() => handleDecision('maybe')}
                disabled={saving}
                className="flex-1 max-w-xs px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-5 h-5" />
                Maybe (3)
              </button>
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Keyboard shortcuts (?)
              </button>
              {showKeyboardShortcuts && (
                <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm text-left inline-block">
                  <p className="font-semibold mb-2">Keyboard Shortcuts:</p>
                  <p>1 or I - Include</p>
                  <p>2 or E - Exclude</p>
                  <p>3 or M - Maybe</p>
                  <p>← → - Navigate articles</p>
                  <p>? - Toggle this help</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}