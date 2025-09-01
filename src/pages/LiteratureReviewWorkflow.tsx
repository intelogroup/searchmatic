import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { CheckCircle, Circle, Clock, AlertCircle, ChevronRight, Lock, FileText, Search, Filter, BarChart3, Download, Users, Zap } from 'lucide-react'

interface WorkflowStep {
  id: string
  name: string
  description: string
  status: 'completed' | 'in-progress' | 'pending' | 'locked'
  icon: React.ReactNode
  route: string
  stats?: {
    label: string
    value: string | number
  }
}

interface ProjectWorkflow {
  projectId: string
  currentStep: number
  completedSteps: string[]
  lastUpdated: string
}

export default function LiteratureReviewWorkflow() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState<ProjectWorkflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})

  const workflowSteps: WorkflowStep[] = [
    {
      id: 'protocol',
      name: 'Define Protocol',
      description: 'Set research question, PICO/SPIDER framework, inclusion/exclusion criteria',
      status: 'pending',
      icon: <FileText className="w-5 h-5" />,
      route: `/projects/${projectId}`,
      stats: { label: 'Framework', value: 'PICO' }
    },
    {
      id: 'search-strategy',
      name: 'Build Search Strategy',
      description: 'Create and test search queries for multiple databases',
      status: 'pending',
      icon: <Search className="w-5 h-5" />,
      route: `/projects/${projectId}/search-strategy`,
      stats: { label: 'Databases', value: 0 }
    },
    {
      id: 'database-search',
      name: 'Search Databases',
      description: 'Execute searches across PubMed, Scopus, Web of Science, etc.',
      status: 'pending',
      icon: <Search className="w-5 h-5" />,
      route: `/projects/${projectId}/search`,
      stats: { label: 'Articles Found', value: 0 }
    },
    {
      id: 'import',
      name: 'Import Articles',
      description: 'Import search results and manage references',
      status: 'pending',
      icon: <Download className="w-5 h-5" />,
      route: `/projects/${projectId}/articles/import`,
      stats: { label: 'Imported', value: 0 }
    },
    {
      id: 'duplicates',
      name: 'Remove Duplicates',
      description: 'Identify and merge duplicate articles',
      status: 'pending',
      icon: <Filter className="w-5 h-5" />,
      route: `/projects/${projectId}/duplicates`,
      stats: { label: 'Duplicates', value: 0 }
    },
    {
      id: 'screening-title',
      name: 'Title/Abstract Screening',
      description: 'Screen articles based on title and abstract',
      status: 'pending',
      icon: <Filter className="w-5 h-5" />,
      route: `/projects/${projectId}/screening`,
      stats: { label: 'Screened', value: '0/0' }
    },
    {
      id: 'screening-fulltext',
      name: 'Full-Text Screening',
      description: 'Review full text of potentially relevant articles',
      status: 'pending',
      icon: <FileText className="w-5 h-5" />,
      route: `/projects/${projectId}/screening?mode=fulltext`,
      stats: { label: 'Reviewed', value: '0/0' }
    },
    {
      id: 'quality-assessment',
      name: 'Quality Assessment',
      description: 'Assess methodological quality and risk of bias',
      status: 'pending',
      icon: <BarChart3 className="w-5 h-5" />,
      route: `/projects/${projectId}/quality`,
      stats: { label: 'Assessed', value: '0/0' }
    },
    {
      id: 'data-extraction',
      name: 'Data Extraction',
      description: 'Extract relevant data from included studies',
      status: 'pending',
      icon: <BarChart3 className="w-5 h-5" />,
      route: `/projects/${projectId}/extraction`,
      stats: { label: 'Extracted', value: '0/0' }
    },
    {
      id: 'synthesis',
      name: 'Data Synthesis',
      description: 'Synthesize findings and perform meta-analysis if applicable',
      status: 'pending',
      icon: <Zap className="w-5 h-5" />,
      route: `/projects/${projectId}/synthesis`,
      stats: { label: 'Studies', value: 0 }
    },
    {
      id: 'report',
      name: 'Generate Report',
      description: 'Create PRISMA diagram, export data, and generate final report',
      status: 'pending',
      icon: <Download className="w-5 h-5" />,
      route: `/projects/${projectId}/export`,
      stats: { label: 'Exports', value: 0 }
    }
  ]

  useEffect(() => {
    if (projectId) {
      fetchWorkflowData()
    }
  }, [projectId])

  const fetchWorkflowData = async () => {
    try {
      setLoading(true)

      // Fetch project data
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      // Fetch statistics
      const { data: articles } = await supabase
        .from('articles')
        .select('*')
        .eq('project_id', projectId)

      const totalArticles = articles?.length || 0
      const screened = articles?.filter(a => a.screening_decision !== null).length || 0
      const included = articles?.filter(a => a.screening_decision === 'include').length || 0
      const extracted = articles?.filter(a => a.extracted_data !== null).length || 0

      // Update workflow steps with real data
      const updatedSteps = workflowSteps.map(step => {
        const newStep = { ...step }
        
        // Update stats based on actual data
        switch (step.id) {
          case 'protocol':
            newStep.status = project?.protocol ? 'completed' : 'in-progress'
            newStep.stats = { label: 'Framework', value: project?.protocol?.framework_type || 'Not set' }
            break
          case 'database-search':
            newStep.status = totalArticles > 0 ? 'completed' : 'pending'
            newStep.stats = { label: 'Articles Found', value: totalArticles }
            break
          case 'import':
            newStep.status = totalArticles > 0 ? 'completed' : 'pending'
            newStep.stats = { label: 'Imported', value: totalArticles }
            break
          case 'screening-title':
            if (screened === totalArticles && totalArticles > 0) {
              newStep.status = 'completed'
            } else if (screened > 0) {
              newStep.status = 'in-progress'
            }
            newStep.stats = { label: 'Screened', value: `${screened}/${totalArticles}` }
            break
          case 'data-extraction':
            if (extracted === included && included > 0) {
              newStep.status = 'completed'
            } else if (extracted > 0) {
              newStep.status = 'in-progress'
            }
            newStep.stats = { label: 'Extracted', value: `${extracted}/${included}` }
            break
        }

        // Lock steps that depend on previous steps
        if (step.id === 'screening-title' && totalArticles === 0) {
          newStep.status = 'locked'
        }
        if (step.id === 'data-extraction' && included === 0) {
          newStep.status = 'locked'
        }

        return newStep
      })

      setStats({
        totalArticles,
        screened,
        included,
        excluded: articles?.filter(a => a.screening_decision === 'exclude').length || 0,
        extracted
      })

      setWorkflow({
        projectId: projectId!,
        currentStep: updatedSteps.findIndex(s => s.status === 'in-progress') || 0,
        completedSteps: updatedSteps.filter(s => s.status === 'completed').map(s => s.id),
        lastUpdated: new Date().toISOString()
      })
    } catch (err) {
      console.error('Error fetching workflow data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'in-progress':
        return <Clock className="w-6 h-6 text-blue-500 animate-pulse" />
      case 'locked':
        return <Lock className="w-6 h-6 text-gray-400" />
      default:
        return <Circle className="w-6 h-6 text-gray-400" />
    }
  }

  const getStepStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 hover:bg-green-100'
      case 'in-progress':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100 ring-2 ring-blue-500 ring-offset-2'
      case 'locked':
        return 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
      default:
        return 'bg-white border-gray-200 hover:bg-gray-50'
    }
  }

  const handleStepClick = (step: WorkflowStep) => {
    if (step.status !== 'locked') {
      navigate(step.route)
    }
  }

  if (loading) return <LoadingSpinner />

  // Calculate overall progress
  const completedCount = workflowSteps.filter(s => s.status === 'completed').length
  const progress = (completedCount / workflowSteps.length) * 100

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Literature Review Workflow</h1>
          <p className="text-gray-600">Track your systematic review progress step by step</p>
        </div>

        {/* Overall Progress */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-900">Overall Progress</h2>
            <span className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.totalArticles || 0}</p>
              <p className="text-sm text-gray-600">Total Articles</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.screened || 0}</p>
              <p className="text-sm text-gray-600">Screened</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.included || 0}</p>
              <p className="text-sm text-gray-600">Included</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.excluded || 0}</p>
              <p className="text-sm text-gray-600">Excluded</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.extracted || 0}</p>
              <p className="text-sm text-gray-600">Extracted</p>
            </div>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="space-y-4">
          {workflowSteps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connection Line */}
              {index < workflowSteps.length - 1 && (
                <div className="absolute left-7 top-16 w-0.5 h-8 bg-gray-300" />
              )}
              
              {/* Step Card */}
              <div
                onClick={() => handleStepClick(step)}
                className={`border rounded-lg p-6 transition-all cursor-pointer ${getStepStyles(step.status)}`}
              >
                <div className="flex items-start gap-4">
                  {/* Step Icon */}
                  <div className="flex-shrink-0">
                    {getStepIcon(step.status)}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          {step.icon}
                          {step.name}
                          {step.status === 'in-progress' && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              Current
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      </div>
                      
                      {/* Step Stats */}
                      {step.stats && (
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">{step.stats.value}</p>
                          <p className="text-xs text-gray-500">{step.stats.label}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {step.status !== 'locked' && (
                      <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        {step.status === 'completed' ? 'Review' : step.status === 'in-progress' ? 'Continue' : 'Start'}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate(`/projects/${projectId}/export`)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Generate PRISMA Diagram
            </button>
            <button
              onClick={() => navigate(`/projects/${projectId}/team`)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Invite Collaborators
            </button>
            <button
              onClick={() => navigate(`/projects/${projectId}`)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              View Project Dashboard
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}