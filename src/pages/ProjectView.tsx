import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThreePanelLayout } from '@/components/layout/ThreePanelLayout'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { AIAnalysisPanel } from '@/components/ai/AIAnalysisPanel'
import { ProtocolPanel } from '@/components/protocol/ProtocolPanel'
import { StudiesList } from '@/components/studies/StudiesList'
import { StudyForm } from '@/components/studies/StudyForm'
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
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Plus
} from 'lucide-react'
import { useProjectContext } from '@/contexts/ProjectContext'
import { useStudyStatusCounts } from '@/hooks/useStudies'
import { formatDistanceToNow } from 'date-fns'
import type { Study } from '@/services/studyService'

export const ProjectView: React.FC = () => {
  const navigate = useNavigate()
  const { currentProject, isLoading, error } = useProjectContext()
  const [showStudyForm, setShowStudyForm] = useState(false)
  const [editingStudy, setEditingStudy] = useState<Study | null>(null)
  const [activePanel, setActivePanel] = useState<'protocol' | 'chat' | 'analysis'>('protocol')
  
  // Get real-time study counts
  const { data: studyCounts } = useStudyStatusCounts(currentProject?.id || '')

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="space-y-2 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !currentProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Project Not Found</h2>
            <p className="text-sm text-muted-foreground">
              {error?.message || 'The project you are looking for does not exist or you do not have access to it.'}
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
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
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
            <h1 className="text-2xl font-bold">{currentProject.title}</h1>
            <Badge className={getStatusColor(currentProject.status)}>
              {currentProject.status}
            </Badge>
          </div>
          {currentProject.description && (
            <p className="text-muted-foreground max-w-2xl">
              {currentProject.description}
            </p>
          )}
          {currentProject.research_domain && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Research Domain:</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
                {currentProject.research_domain}
              </span>
            </div>
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
              Studies
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{studyCounts?.total || currentProject.total_studies}</div>
            <p className="text-xs text-muted-foreground">
              {studyCounts?.pending || currentProject.pending_studies} pending, {studyCounts?.included || currentProject.included_studies} included
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stage
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold">{currentProject.current_stage}</div>
            <p className="text-xs text-muted-foreground">Current phase</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Type
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm font-bold capitalize">
              {currentProject.project_type.replace('_', ' ')}
            </div>
            <p className="text-xs text-muted-foreground">Review type</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{currentProject.progress_percentage}%</div>
            <div className="w-full bg-secondary rounded-full h-1 mt-2">
              <div 
                className="bg-primary h-1 rounded-full transition-all" 
                style={{ width: `${currentProject.progress_percentage}%` }}
              />
            </div>
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

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => setActivePanel('analysis')}
            >
              <Bot className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">AI Analysis</span>
              <span className="text-xs text-muted-foreground">Literature analysis</span>
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
                  {formatDistanceToNow(new Date(currentProject.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            {currentProject.last_activity_at !== currentProject.created_at && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Last activity</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(currentProject.last_activity_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}
            
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Start using the AI chat or create protocols to see activity here</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Studies Management */}
      {showStudyForm ? (
        <StudyForm
          projectId={currentProject.id}
          study={editingStudy || undefined}
          onSuccess={() => {
            setShowStudyForm(false)
            setEditingStudy(null)
          }}
          onCancel={() => {
            setShowStudyForm(false)
            setEditingStudy(null)
          }}
        />
      ) : (
        <StudiesList
          projectId={currentProject.id}
          onCreateStudy={() => setShowStudyForm(true)}
          onEditStudy={(study) => {
            setEditingStudy(study)
            setShowStudyForm(true)
          }}
        />
      )}

      {/* Getting Started Guide - Show only if no studies */}
      {(!studyCounts || studyCounts.total === 0) && (
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
                  <p className="text-sm font-medium">Add your first study</p>
                  <p className="text-xs text-muted-foreground">
                    Start by adding articles, theses, or other research materials
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowStudyForm(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Study
                </Button>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="h-6 w-6 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-xs font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Get AI assistance</p>
                  <p className="text-xs text-muted-foreground">
                    Chat with the AI assistant for guidance and methodology help →
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // Dynamic right panel based on active selection
  const getRightPanel = () => {
    switch (activePanel) {
      case 'protocol':
        return <ProtocolPanel projectId={currentProject.id} />
      case 'chat':
        return <ChatPanel projectId={currentProject.id} />
      case 'analysis':
        return <AIAnalysisPanel projectId={currentProject.id} />
      default:
        return <ProtocolPanel projectId={currentProject.id} />
    }
  }

  const protocolPanel = (
    <div className="h-full flex flex-col">
      {/* Panel Tabs */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActivePanel('protocol')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activePanel === 'protocol' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Protocol
        </button>
        <button
          onClick={() => setActivePanel('chat')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activePanel === 'chat' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          AI Chat
        </button>
        <button
          onClick={() => setActivePanel('analysis')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activePanel === 'analysis' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          AI Analysis
        </button>
      </div>
      
      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {getRightPanel()}
      </div>
    </div>
  )

  return (
    <ThreePanelLayout
      mainContent={mainContent}
      protocolPanel={protocolPanel}
      aiChatPanel={null} // Using unified right panel now
    />
  )
}

export default ProjectView