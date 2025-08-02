import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Plus, 
  Bot,
  Lightbulb,
  AlertTriangle
} from 'lucide-react'
import { protocolService } from '@/services/protocolService'
import { ProtocolEditor } from './ProtocolEditor'
import { ProtocolList } from './ProtocolList'
import type { Database } from '@/types/database'

type Protocol = Database['public']['Tables']['protocols']['Row']

interface ProtocolPanelProps {
  projectId: string
  className?: string
}

export const ProtocolPanel: React.FC<ProtocolPanelProps> = ({ 
  projectId, 
  className = ''
}) => {
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'editor' | 'ai-create'>('list')

  useEffect(() => {
    if (projectId) {
      loadProtocols()
    }
  }, [projectId])

  const loadProtocols = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const protocolsData = await protocolService.getProtocols(projectId)
      setProtocols(protocolsData)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load protocols')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProtocol = async (data: {
    title: string
    description?: string
    research_question: string
    framework_type: 'pico' | 'spider' | 'other'
  }) => {
    setIsCreating(true)
    try {
      const protocol = await protocolService.createProtocol({
        project_id: projectId,
        ...data
      })
      setProtocols(prev => [protocol, ...prev])
      setSelectedProtocol(protocol)
      setView('editor')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create protocol')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateWithAI = async (researchQuestion: string, frameworkType: 'pico' | 'spider' | 'other' = 'pico') => {
    setIsCreating(true)
    try {
      const protocol = await protocolService.generateProtocolFromAI(
        projectId,
        researchQuestion,
        frameworkType
      )
      setProtocols(prev => [protocol, ...prev])
      setSelectedProtocol(protocol)
      setView('editor')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create AI-generated protocol')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectProtocol = async (protocolId: string) => {
    try {
      const protocol = await protocolService.getProtocol(protocolId)
      if (protocol) {
        setSelectedProtocol(protocol)
        setView('editor')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load protocol')
    }
  }

  const handleUpdateProtocol = async (protocolId: string, updates: any) => {
    try {
      const updatedProtocol = await protocolService.updateProtocol(protocolId, updates)
      setProtocols(prev => prev.map(p => p.id === protocolId ? updatedProtocol : p))
      setSelectedProtocol(updatedProtocol)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update protocol')
    }
  }

  const handleDeleteProtocol = async (protocolId: string) => {
    if (confirm('Are you sure you want to delete this protocol? This action cannot be undone.')) {
      try {
        await protocolService.deleteProtocol(protocolId)
        setProtocols(prev => prev.filter(p => p.id !== protocolId))
        if (selectedProtocol?.id === protocolId) {
          setSelectedProtocol(null)
          setView('list')
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to delete protocol')
      }
    }
  }

  const handleLockProtocol = async (protocolId: string) => {
    try {
      const lockedProtocol = await protocolService.lockProtocol(protocolId)
      setProtocols(prev => prev.map(p => p.id === protocolId ? lockedProtocol : p))
      setSelectedProtocol(lockedProtocol)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to lock protocol')
    }
  }

  const handleUnlockProtocol = async (protocolId: string) => {
    try {
      const unlockedProtocol = await protocolService.unlockProtocol(protocolId)
      setProtocols(prev => prev.map(p => p.id === protocolId ? unlockedProtocol : p))
      setSelectedProtocol(unlockedProtocol)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to unlock protocol')
    }
  }


  const isEmpty = protocols.length === 0 && !isLoading

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Research Protocols</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {protocols.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {protocols.length} protocol{protocols.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {view !== 'list' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setView('list')
                  setSelectedProtocol(null)
                }}
                className="h-8"
              >
                Back to List
              </Button>
            )}
          </div>
        </div>
        
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-2 rounded flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="ml-auto h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 p-4 pt-0">
        {view === 'list' && (
          <>
            {isEmpty ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Create Your First Protocol</h3>
                  <p className="text-sm text-muted-foreground max-w-[250px]">
                    Define your research methodology, inclusion criteria, and search strategy 
                    with AI assistance.
                  </p>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <Button 
                    onClick={() => setView('ai-create')}
                    disabled={isCreating}
                    className="w-full"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    Create with AI
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setView('editor')}
                    disabled={isCreating}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Manually
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-3">
                  <Button 
                    onClick={() => setView('ai-create')}
                    disabled={isCreating}
                    size="sm"
                    className="flex-1"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    AI Create
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setView('editor')}
                    disabled={isCreating}
                    size="sm"
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Manual
                  </Button>
                </div>

                <div className="flex-1 min-h-0">
                  <ProtocolList
                    protocols={protocols}
                    selectedProtocolId={selectedProtocol?.id}
                    onSelectProtocol={handleSelectProtocol}
                    onDeleteProtocol={handleDeleteProtocol}
                    onLockProtocol={handleLockProtocol}
                    onUnlockProtocol={handleUnlockProtocol}
                    isLoading={isLoading}
                    className="h-full"
                  />
                </div>
              </>
            )}
          </>
        )}

        {view === 'editor' && (
          <div className="flex-1 min-h-0">
            <ProtocolEditor
              protocol={selectedProtocol}
              onSave={handleUpdateProtocol}
              onCreate={handleCreateProtocol}
              onCancel={() => {
                setView('list')
                setSelectedProtocol(null)
              }}
              className="h-full"
            />
          </div>
        )}

        {view === 'ai-create' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2 max-w-[300px]">
              <h3 className="font-medium">AI-Generated Protocol</h3>
              <p className="text-sm text-muted-foreground">
                Describe your research question and I'll help you create a comprehensive 
                research protocol with PICO/SPIDER framework, inclusion criteria, and search strategy.
              </p>
            </div>
            
            <div className="w-full max-w-[400px] space-y-4">
              <textarea
                placeholder="Enter your research question (e.g., 'What is the effectiveness of cognitive behavioral therapy for treating depression in adolescents?')"
                className="w-full h-24 p-3 border rounded-md resize-none"
                id="research-question-input"
              />
              
              <div className="flex gap-2">
                <select className="flex-1 p-2 border rounded-md">
                  <option value="pico">PICO Framework</option>
                  <option value="spider">SPIDER Framework</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setView('list')}
                  disabled={isCreating}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    const textarea = document.getElementById('research-question-input') as HTMLTextAreaElement
                    const select = document.querySelector('select') as HTMLSelectElement
                    if (textarea.value.trim()) {
                      handleCreateWithAI(textarea.value.trim(), select.value as 'pico' | 'spider' | 'other')
                    }
                  }}
                  disabled={isCreating}
                  className="flex-1"
                >
                  {isCreating ? (
                    <>
                      <Bot className="h-4 w-4 mr-2 animate-pulse" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Generate Protocol
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ProtocolPanel