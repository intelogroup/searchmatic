import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Save, Lock, Unlock, AlertTriangle } from 'lucide-react'
import { protocolService } from '@/services/protocolService'
import { cn } from '@/lib/utils'
import { ProtocolForm } from './ProtocolForm'
import { ProtocolArrayEditor } from './ProtocolArrayEditor'
import { ProtocolAIAssistant } from './ProtocolAIAssistant'
import type { Database } from '@/types/database'
import type { CreateProtocolData } from '@/services/protocolService'

type Protocol = Database['public']['Tables']['protocols']['Row']
type ProtocolUpdate = Database['public']['Tables']['protocols']['Update']
type CreateProtocolFormData = Omit<CreateProtocolData, 'project_id'>

interface ProtocolEditorProps {
  protocol?: Protocol | null
  onSave?: (protocolId: string, updates: ProtocolUpdate) => Promise<void>
  onCreate?: (data: CreateProtocolFormData) => Promise<void>
  onCancel?: () => void
  className?: string
}

interface FormData {
  title: string
  description: string
  research_question: string
  framework_type: 'pico' | 'spider' | 'other'
  population: string
  intervention: string
  comparison: string
  outcome: string
  sample: string
  phenomenon: string
  design: string
  evaluation: string
  research_type: string
  inclusion_criteria: string[]
  exclusion_criteria: string[]
  keywords: string[]
  databases: string[]
}

export const ProtocolEditor: React.FC<ProtocolEditorProps> = ({
  protocol,
  onSave,
  onCreate,
  onCancel,
  className
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    research_question: '',
    framework_type: 'pico',
    population: '',
    intervention: '',
    comparison: '',
    outcome: '',
    sample: '',
    phenomenon: '',
    design: '',
    evaluation: '',
    research_type: '',
    inclusion_criteria: [],
    exclusion_criteria: [],
    keywords: [],
    databases: []
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isGettingAIHelp, setIsGettingAIHelp] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!protocol
  const isLocked = protocol?.is_locked || false

  useEffect(() => {
    if (protocol) {
      setFormData({
        title: protocol.title || '',
        description: protocol.description || '',
        research_question: protocol.research_question || '',
        framework_type: protocol.framework_type || 'pico',
        population: protocol.population || '',
        intervention: protocol.intervention || '',
        comparison: protocol.comparison || '',
        outcome: protocol.outcome || '',
        sample: protocol.sample || '',
        phenomenon: protocol.phenomenon || '',
        design: protocol.design || '',
        evaluation: protocol.evaluation || '',
        research_type: protocol.research_type || '',
        inclusion_criteria: protocol.inclusion_criteria || [],
        exclusion_criteria: protocol.exclusion_criteria || [],
        keywords: protocol.keywords || [],
        databases: protocol.databases || []
      })
    }
  }, [protocol])

  const handleInputChange = (key: string, value: string | string[] | number | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    setError(null)
  }

  const handleArrayAdd = (key: keyof Pick<FormData, 'inclusion_criteria' | 'exclusion_criteria' | 'keywords' | 'databases'>, value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), value.trim()]
      }))
    }
  }

  const handleArrayRemove = (key: keyof Pick<FormData, 'inclusion_criteria' | 'exclusion_criteria' | 'keywords' | 'databases'>, index: number) => {
    setFormData(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, i) => i !== index)
    }))
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.research_question.trim()) {
      setError('Title and research question are required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (isEditing && protocol && onSave) {
        await onSave(protocol.id, formData)
      } else if (onCreate) {
        await onCreate({
          title: formData.title,
          description: formData.description,
          research_question: formData.research_question,
          framework_type: formData.framework_type
        })
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save protocol')
    } finally {
      setIsSaving(false)
    }
  }

  const getAIHelp = async (focusArea: 'framework' | 'inclusion' | 'exclusion' | 'search_strategy') => {
    if (!formData.research_question.trim()) {
      setError('Please enter a research question first')
      return
    }

    setIsGettingAIHelp(true)
    setError(null)

    try {
      const suggestion = await protocolService.getAIGuidance({
        research_question: formData.research_question,
        current_protocol: protocol ? protocol : undefined,
        focus_area: focusArea
      })
      setAiSuggestion(suggestion)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get AI assistance')
    } finally {
      setIsGettingAIHelp(false)
    }
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {isEditing ? 'Edit Protocol' : 'Create Protocol'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isEditing && (
              <Badge 
                variant={isLocked ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {isLocked ? (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3 mr-1" />
                    Editable
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-2 rounded flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        <ScrollArea className="flex-1">
          <div className="space-y-6 pr-4">
            <ProtocolForm
              formData={formData}
              isLocked={isLocked}
              isGettingAIHelp={isGettingAIHelp}
              onInputChange={handleInputChange}
              onGetAIHelp={getAIHelp}
            />

            <ProtocolArrayEditor
              title="Inclusion Criteria"
              items={formData.inclusion_criteria}
              onAdd={(value) => handleArrayAdd('inclusion_criteria', value)}
              onRemove={(index) => handleArrayRemove('inclusion_criteria', index)}
              placeholder="Add an inclusion criterion"
              isLocked={isLocked}
              isGettingAIHelp={isGettingAIHelp}
              onGetAIHelp={getAIHelp}
            />

            <ProtocolArrayEditor
              title="Exclusion Criteria"
              items={formData.exclusion_criteria}
              onAdd={(value) => handleArrayAdd('exclusion_criteria', value)}
              onRemove={(index) => handleArrayRemove('exclusion_criteria', index)}
              placeholder="Add an exclusion criterion"
              isLocked={isLocked}
              isGettingAIHelp={isGettingAIHelp}
              onGetAIHelp={getAIHelp}
            />

            <ProtocolArrayEditor
              title="Keywords"
              items={formData.keywords}
              onAdd={(value) => handleArrayAdd('keywords', value)}
              onRemove={(index) => handleArrayRemove('keywords', index)}
              placeholder="Add a keyword or search term"
              isLocked={isLocked}
              isGettingAIHelp={isGettingAIHelp}
              onGetAIHelp={getAIHelp}
            />

            <ProtocolArrayEditor
              title="Databases"
              items={formData.databases}
              onAdd={(value) => handleArrayAdd('databases', value)}
              onRemove={(index) => handleArrayRemove('databases', index)}
              placeholder="Add a database (e.g., PubMed, Scopus)"
              isLocked={isLocked}
              isGettingAIHelp={isGettingAIHelp}
              onGetAIHelp={getAIHelp}
            />

            <ProtocolAIAssistant
              aiSuggestion={aiSuggestion}
              onDismiss={() => setAiSuggestion(null)}
            />
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLocked || !formData.title.trim() || !formData.research_question.trim()}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-pulse" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update' : 'Create'} Protocol
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProtocolEditor