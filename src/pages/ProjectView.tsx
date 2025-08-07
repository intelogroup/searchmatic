import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Settings,
  MoreHorizontal,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useProjectContext } from '@/hooks/useProjectContext'
import { formatDistanceToNow } from 'date-fns'

export const ProjectView: React.FC = () => {
  const navigate = useNavigate()
  const { currentProject, isLoading, error } = useProjectContext()
  const [activePanel, setActivePanel] = useState<'protocol' | 'chat'>('protocol')

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

      {/* Project Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold capitalize">{currentProject.status}</div>
            <p className="text-xs text-muted-foreground">Current status</p>
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
              systematic review
            </div>
            <p className="text-xs text-muted-foreground">Project type</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Created
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm font-bold">
              {formatDistanceToNow(new Date(currentProject.created_at))} ago
            </div>
            <p className="text-xs text-muted-foreground">Project age</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Project Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Project Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Welcome to your project workspace. Use the protocol panel to define your research methodology 
            and the chat panel to interact with the AI assistant for guidance.
          </p>
          
          <div className="mt-4 flex gap-2">
            <Button
              variant={activePanel === 'protocol' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePanel('protocol')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Protocol
            </Button>
            <Button
              variant={activePanel === 'chat' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePanel('chat')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const protocolPanel = <ProtocolPanel projectId={currentProject.id} />
  const chatPanel = <ChatPanel projectId={currentProject.id} />

  return (
    <ThreePanelLayout
      mainContent={mainContent}
      protocolPanel={activePanel === 'protocol' ? protocolPanel : undefined}
      aiChatPanel={activePanel === 'chat' ? chatPanel : undefined}
    />
  )
}