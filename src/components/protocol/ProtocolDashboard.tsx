import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Settings, 
  Share, 
  Download, 
  Clock,
  FileText,
  BarChart,
  Workflow,
  MessageSquare
} from 'lucide-react'
import ProtocolEditor from './ProtocolEditor'
import ProtocolWorkflow from './ProtocolWorkflow'
import ProtocolChatPanel from './ProtocolChatPanel'
import { ThreePanelLayout } from '../layout/ThreePanelLayout'
import type { Protocol } from '@/types/database'

interface ProtocolDashboardProps {
  protocol: Protocol
  onBack: () => void
  onSave: (protocolId: string, updates: Partial<Protocol>) => Promise<void>
  onShare?: (protocolId: string) => void
  onExport?: (protocolId: string) => void
  className?: string
}

export const ProtocolDashboard: React.FC<ProtocolDashboardProps> = ({
  protocol,
  onBack,
  onSave,
  onShare,
  onExport,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('workflow')
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getProtocolCompletionScore = useCallback(() => {
    let score = 0
    const maxScore = 10

    // Basic information (2 points)
    if (protocol.title) score += 1
    if (protocol.research_question) score += 1

    // Framework components (4 points)
    if (protocol.framework_type === 'pico') {
      if (protocol.population) score += 1
      if (protocol.intervention) score += 1
      if (protocol.comparison) score += 1
      if (protocol.outcome) score += 1
    } else if (protocol.framework_type === 'spider') {
      if (protocol.sample) score += 0.8
      if (protocol.phenomenon) score += 0.8
      if (protocol.design) score += 0.8
      if (protocol.evaluation) score += 0.8
      if (protocol.research_type) score += 0.8
    }

    // Criteria (2 points)
    if (protocol.inclusion_criteria.length > 0) score += 1
    if (protocol.exclusion_criteria.length > 0) score += 1

    // Search strategy (2 points)
    if (protocol.keywords.length > 0) score += 1
    if (protocol.databases.length > 0) score += 1

    return Math.min(Math.round((score / maxScore) * 100), 100)
  }, [protocol])

  const getStatusColor = (status: Protocol['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'locked': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleWorkflowStepClick = useCallback((stepId: string) => {
    setCurrentWorkflowStep(stepId)
    
    // Navigate to editor for certain steps
    const editableSteps = ['research-question', 'framework-definition', 'inclusion-exclusion', 'search-strategy']
    if (editableSteps.includes(stepId)) {
      setActiveTab('editor')
    }
  }, [])

  const handleUpdateWorkflowStep = useCallback((stepId: string, status: 'completed' | 'current' | 'pending' | 'blocked') => {
    // This would typically update the protocol status or workflow state
    console.log(`Update step ${stepId} to ${status}`)
  }, [])

  const handleProtocolAction = useCallback((action: string, data?: unknown) => {
    switch (action) {
      case 'help_research_question':
      case 'complete_pico':
      case 'complete_spider':
      case 'suggest_inclusion':
      case 'suggest_exclusion':
      case 'suggest_keywords':
      case 'suggest_databases':
        setActiveTab('chat')
        break
      case 'review_protocol':
        setActiveTab('workflow')
        break
      default:
        console.log('Unknown action:', action, data)
    }
  }, [])

  const completionScore = getProtocolCompletionScore()

  return (
    <div className={`h-screen flex flex-col ${className}`}>
      {/* Header */}
      <div className="border-b bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold truncate">{protocol.title}</h1>
              <Badge className={`text-xs border ${getStatusColor(protocol.status)}`}>
                {protocol.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                v{protocol.version}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Updated {formatDate(protocol.updated_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart className="w-3 h-3" />
                <span>{completionScore}% complete</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {onShare && (
            <Button variant="outline" size="sm" onClick={() => onShare(protocol.id)}>
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={() => onExport(protocol.id)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
          <Button 
            variant={isEditing ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => setIsEditing(!isEditing)}
          >
            <Settings className="w-4 h-4 mr-2" />
            {isEditing ? 'View Mode' : 'Edit Mode'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="workflow" className="flex items-center gap-2">
                <Workflow className="w-4 h-4" />
                Workflow
              </TabsTrigger>
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Assistant
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0">
            <TabsContent value="workflow" className="h-full m-0">
              <ThreePanelLayout
                leftPanel={
                  <div className="h-full p-6 overflow-auto">
                    <ProtocolWorkflow
                      protocol={protocol}
                      onStepClick={handleWorkflowStepClick}
                      onUpdateStep={handleUpdateWorkflowStep}
                    />
                  </div>
                }
                rightPanel={
                  <ProtocolChatPanel
                    projectId={protocol.project_id}
                    protocol={protocol}
                    currentStep={currentWorkflowStep || undefined}
                    onSuggestedActionClick={handleProtocolAction}
                  />
                }
              />
            </TabsContent>

            <TabsContent value="editor" className="h-full m-0">
              <ThreePanelLayout
                leftPanel={
                  <div className="h-full p-6">
                    <ProtocolEditor
                      protocol={protocol}
                      onSave={onSave}
                      className="h-full"
                    />
                  </div>
                }
                rightPanel={
                  <ProtocolChatPanel
                    projectId={protocol.project_id}
                    protocol={protocol}
                    currentStep={currentWorkflowStep || undefined}
                    onSuggestedActionClick={handleProtocolAction}
                  />
                }
              />
            </TabsContent>

            <TabsContent value="chat" className="h-full m-0">
              <div className="h-full">
                <ThreePanelLayout
                  leftPanel={
                    <Card className="h-full m-6 overflow-auto">
                      <CardHeader>
                        <CardTitle className="text-lg">Protocol Overview</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="font-medium mb-2">Research Question</h3>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            {protocol.research_question || 'Not yet defined'}
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="font-medium mb-2">Framework</h3>
                          <Badge variant="outline" className="text-xs">
                            {protocol.framework_type?.toUpperCase()}
                          </Badge>
                        </div>

                        <div>
                          <h3 className="font-medium mb-2">Completion Status</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Overall Progress</span>
                              <span>{completionScore}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${completionScore}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h3 className="font-medium mb-2">Quick Stats</h3>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="font-medium">{protocol.inclusion_criteria.length}</div>
                              <div className="text-gray-600 text-xs">Inclusion Criteria</div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="font-medium">{protocol.exclusion_criteria.length}</div>
                              <div className="text-gray-600 text-xs">Exclusion Criteria</div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="font-medium">{protocol.keywords.length}</div>
                              <div className="text-gray-600 text-xs">Keywords</div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="font-medium">{protocol.databases.length}</div>
                              <div className="text-gray-600 text-xs">Databases</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  }
                  rightPanel={
                    <ProtocolChatPanel
                      projectId={protocol.project_id}
                      protocol={protocol}
                      currentStep={currentWorkflowStep || undefined}
                      onSuggestedActionClick={handleProtocolAction}
                    />
                  }
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

export default ProtocolDashboard