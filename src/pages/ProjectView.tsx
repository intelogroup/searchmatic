import React, { useState, lazy, Suspense, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { ArticleSearch } from '@/components/ArticleSearch'
import ArticleScreening from '@/components/ArticleScreening'

// Lazy load heavy components  
const ChatPanel = lazy(() => import('@/components/chat/ChatPanel').then(module => ({ default: module.ChatPanel })))
const ProtocolPanel = lazy(() => import('@/components/protocol/ProtocolPanel').then(module => ({ default: module.ProtocolPanel })))

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  FileSearch,
  Filter,
  BarChart3,
  MessageCircle,
  Settings,
  BookOpen,
  Download,
  AlertCircle
} from 'lucide-react'

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  created_at: string
  project_type: string
  research_domain: string | null
}

export default function ProjectView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('protocol')

  useEffect(() => {
    if (id && user) {
      loadProject()
    }
  }, [id, user])

  const loadProject = async () => {
    if (!id || !user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      setProject(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800' 
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </AppLayout>
    )
  }

  // Error state
  if (error || !project) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Project Not Found</h2>
              <p className="text-sm text-gray-600">
                {error || 'The project you are looking for does not exist or you do not have access to it.'}
              </p>
            </div>
            <Button onClick={() => navigate('/projects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Project Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/projects')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{project.title}</h1>
            </div>
            {project.description && (
              <p className="text-gray-600 text-sm sm:text-base">
                {project.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" className="sm:hidden">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="sm:hidden">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Systematic Review Workflow Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="protocol" className="flex items-center gap-1 md:gap-2 px-2 py-3 text-xs md:text-sm">
              <BookOpen className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Protocol</span>
              <span className="sm:hidden">P</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-1 md:gap-2 px-2 py-3 text-xs md:text-sm">
              <FileSearch className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Search</span>
              <span className="sm:hidden">S</span>
            </TabsTrigger>
            <TabsTrigger value="screening" className="flex items-center gap-1 md:gap-2 px-2 py-3 text-xs md:text-sm">
              <Filter className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Screening</span>
              <span className="sm:hidden">Sc</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-1 md:gap-2 px-2 py-3 text-xs md:text-sm">
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Analysis</span>
              <span className="sm:hidden">A</span>
            </TabsTrigger>
            <TabsTrigger value="assistant" className="flex items-center gap-1 md:gap-2 px-2 py-3 text-xs md:text-sm">
              <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">AI Assistant</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="protocol" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Research Protocol</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="flex items-center justify-center p-8">Loading protocol...</div>}>
                  <ProtocolPanel projectId={project.id} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <ArticleSearch 
              projectId={project.id} 
              onImportComplete={(count) => {
                console.log(`Imported ${count} articles`)
              }}
            />
          </TabsContent>

          <TabsContent value="screening" className="space-y-6">
            <ArticleScreening 
              projectId={project.id}
              onScreeningComplete={(articleId, decision, notes) => {
                console.log(`Article ${articleId} screened: ${decision}`)
              }}
            />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analysis Coming Soon</h3>
                  <p className="text-gray-600 mb-4">
                    Data extraction and analysis features will be available here.
                  </p>
                  <Button variant="outline">
                    View Analytics Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assistant" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Research Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="flex items-center justify-center p-8">Loading assistant...</div>}>
                  <ChatPanel projectId={project.id} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}