import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ThreePanelLayout } from '@/components/layout/ThreePanelLayout'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { ProtocolPanel } from '@/components/protocol/ProtocolPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  FileText,
  MessageCircle,
  Bot,
  Search,
  Filter,
  Download,
  Settings,
  MoreHorizontal
} from 'lucide-react'
import { baseSupabaseClient as supabase } from '@/lib/supabase'
import { errorLogger } from '@/lib/error-logger'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

export const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      loadProject(projectId)
    }
  }, [projectId])

  const loadProject = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      setProject(project)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load project')
      errorLogger.logError((error as Error).message, { action: 'Load Project', metadata: { projectId: id } })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="space-y-2 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <FileText className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Project Not Found</h2>
            <p className="text-sm text-muted-foreground">
              {error || 'The project you are looking for does not exist.'}
            </p>
          </div>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const mainContent = (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground max-w-2xl">
              {project.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Articles
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Total articles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Protocols
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Active protocols</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Searches
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Search queries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">15%</div>
            <p className="text-xs text-muted-foreground">Complete</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Search className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Search Databases</span>
              <span className="text-xs text-muted-foreground">PubMed, Scopus, etc.</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Filter className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Screen Articles</span>
              <span className="text-xs text-muted-foreground">Review and filter</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Extract Data</span>
              <span className="text-xs text-muted-foreground">Structured extraction</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Download className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Export Results</span>
              <span className="text-xs text-muted-foreground">Multiple formats</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Project created</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Start using the AI chat or create protocols to see activity here</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Create a research protocol</p>
                <p className="text-xs text-muted-foreground">
                  Define your research question and methodology using the Protocol panel →
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="h-6 w-6 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-xs font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Get AI assistance</p>
                <p className="text-xs text-muted-foreground">
                  Chat with the AI assistant for guidance and methodology help →
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="h-6 w-6 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-xs font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Search and collect articles</p>
                <p className="text-xs text-muted-foreground">
                  Use the search tools to find relevant research articles
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const protocolPanel = <ProtocolPanel projectId={project.id} />
  const aiChatPanel = <ChatPanel projectId={project.id} />

  return (
    <ThreePanelLayout
      mainContent={mainContent}
      protocolPanel={protocolPanel}
      aiChatPanel={aiChatPanel}
    />
  )
}

export default ProjectView