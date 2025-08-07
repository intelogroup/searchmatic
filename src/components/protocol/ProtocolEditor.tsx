import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Save, 
  Bot,
  Lightbulb,
  Plus,
  Minus,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react'
import { protocolService } from '@/services/protocolService'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'
import type { CreateProtocolData } from '@/services/protocolService'

type Protocol = Database['public']['Tables']['protocols']['Row']
type ProtocolUpdate = Database['public']['Tables']['protocols']['Update']

interface ProtocolEditorProps {
  protocol?: Protocol | null
  onSave?: (protocolId: string, updates: ProtocolUpdate) => Promise<void>
  onCreate?: (data: CreateProtocolData) => Promise<void>
  onCancel?: () => void
  className?: string
}

interface FrameworkSection {
  label: string
  key: keyof Protocol
  placeholder: string
  description: string
}

export const ProtocolEditor: React.FC<ProtocolEditorProps> = ({
  protocol,
  onSave,
  onCreate,
  onCancel,
  className
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    research_question: '',
    framework_type: 'pico' as 'pico' | 'spider' | 'other',
    population: '',
    intervention: '',
    comparison: '',
    outcome: '',
    sample: '',
    phenomenon: '',
    design: '',
    evaluation: '',
    research_type: '',
    inclusion_criteria: [] as string[],
    exclusion_criteria: [] as string[],
    keywords: [] as string[],
    databases: [] as string[]
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

  const picoFramework: FrameworkSection[] = [
    {
      label: 'Population',
      key: 'population',
      placeholder: 'Who is the target population? (e.g., adults with diabetes)',
      description: 'Define the specific group of participants or population of interest'
    },
    {
      label: 'Intervention',
      key: 'intervention',
      placeholder: 'What intervention or exposure? (e.g., cognitive behavioral therapy)',
      description: 'Specify the intervention, treatment, or exposure being studied'
    },
    {
      label: 'Comparison',
      key: 'comparison',
      placeholder: 'What is the comparison? (e.g., standard care, placebo)',
      description: 'Define the control group or alternative intervention'
    },
    {
      label: 'Outcome',
      key: 'outcome',
      placeholder: 'What outcomes are measured? (e.g., quality of life scores)',
      description: 'Specify the primary and secondary outcomes of interest'
    }
  ]

  const spiderFramework: FrameworkSection[] = [
    {
      label: 'Sample',
      key: 'sample',
      placeholder: 'Who are the participants?',
      description: 'Define the sample or participants'
    },
    {
      label: 'Phenomenon of Interest',
      key: 'phenomenon',
      placeholder: 'What phenomenon is being studied?',
      description: 'Specify the phenomenon or experience of interest'
    },
    {
      label: 'Design',
      key: 'design',
      placeholder: 'What study designs are included?',
      description: 'Define the research designs to be included'
    },
    {
      label: 'Evaluation',
      key: 'evaluation',
      placeholder: 'What is being evaluated or measured?',
      description: 'Specify what is being evaluated or the outcome measures'
    },
    {
      label: 'Research Type',
      key: 'research_type',
      placeholder: 'What type of research?',
      description: 'Define the type of research (qualitative, quantitative, mixed methods)'
    }
  ]

  const currentFramework = formData.framework_type === 'pico' ? picoFramework : 
                           formData.framework_type === 'spider' ? spiderFramework : []

  const handleInputChange = (key: string, value: string | string[] | number | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    setError(null)
  }

  const handleArrayAdd = (key: 'inclusion_criteria' | 'exclusion_criteria' | 'keywords' | 'databases', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), value.trim()]
      }))
    }
  }

  const handleArrayRemove = (key: 'inclusion_criteria' | 'exclusion_criteria' | 'keywords' | 'databases', index: number) => {
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

  const ArrayEditor = ({ 
    title, 
    items, 
    onAdd, 
    onRemove, 
    placeholder 
  }: {
    title: string
    items: string[]
    onAdd: (value: string) => void
    onRemove: (index: number) => void
    placeholder: string
  }) => {
    const [newItem, setNewItem] = useState('')

    const handleAdd = () => {
      if (newItem.trim()) {
        onAdd(newItem)
        setNewItem('')
      }
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{title}</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => getAIHelp(title.toLowerCase().includes('inclusion') ? 'inclusion' : 
                                   title.toLowerCase().includes('exclusion') ? 'exclusion' : 'search_strategy')}
            disabled={isGettingAIHelp || isLocked}
            className="h-7 text-xs"
          >
            <Bot className="h-3 w-3 mr-1" />
            AI Help
          </Button>
        </div>

        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
              <span className="flex-1">{item}</span>
              {!isLocked && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Minus className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {!isLocked && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-2 py-1 text-sm border rounded"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdd}
              disabled={!newItem.trim()}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    )
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
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-base">Basic Information</h3>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  disabled={isLocked}
                  placeholder="Enter protocol title"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={isLocked}
                  placeholder="Brief description of the protocol"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Research Question *</label>
                <Textarea
                  value={formData.research_question}
                  onChange={(e) => handleInputChange('research_question', e.target.value)}
                  disabled={isLocked}
                  placeholder="What is your main research question?"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Framework Type</label>
                <select
                  value={formData.framework_type}
                  onChange={(e) => handleInputChange('framework_type', e.target.value)}
                  disabled={isLocked}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="pico">PICO Framework</option>
                  <option value="spider">SPIDER Framework</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Framework Sections */}
            {currentFramework.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-base">
                    {formData.framework_type.toUpperCase()} Framework
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => getAIHelp('framework')}
                    disabled={isGettingAIHelp || isLocked}
                    className="h-7 text-xs"
                  >
                    <Lightbulb className="h-3 w-3 mr-1" />
                    AI Guidance
                  </Button>
                </div>

                {currentFramework.map((section) => (
                  <div key={section.key}>
                    <label className="text-sm font-medium mb-2 block">
                      {section.label}
                    </label>
                    <Textarea
                      value={((formData as Record<string, unknown>)[section.key] as string) || ''}
                      onChange={(e) => handleInputChange(section.key, e.target.value)}
                      disabled={isLocked}
                      placeholder={section.placeholder}
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {section.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Inclusion Criteria */}
            <ArrayEditor
              title="Inclusion Criteria"
              items={formData.inclusion_criteria}
              onAdd={(value) => handleArrayAdd('inclusion_criteria', value)}
              onRemove={(index) => handleArrayRemove('inclusion_criteria', index)}
              placeholder="Add an inclusion criterion"
            />

            {/* Exclusion Criteria */}
            <ArrayEditor
              title="Exclusion Criteria"
              items={formData.exclusion_criteria}
              onAdd={(value) => handleArrayAdd('exclusion_criteria', value)}
              onRemove={(index) => handleArrayRemove('exclusion_criteria', index)}
              placeholder="Add an exclusion criterion"
            />

            {/* Keywords */}
            <ArrayEditor
              title="Keywords"
              items={formData.keywords}
              onAdd={(value) => handleArrayAdd('keywords', value)}
              onRemove={(index) => handleArrayRemove('keywords', index)}
              placeholder="Add a keyword or search term"
            />

            {/* Databases */}
            <ArrayEditor
              title="Databases"
              items={formData.databases}
              onAdd={(value) => handleArrayAdd('databases', value)}
              onRemove={(index) => handleArrayRemove('databases', index)}
              placeholder="Add a database (e.g., PubMed, Scopus)"
            />

            {/* AI Suggestion Display */}
            {aiSuggestion && (
              <div className="space-y-3">
                <h3 className="font-medium text-base flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  AI Suggestion
                </h3>
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <pre className="whitespace-pre-wrap text-sm">{aiSuggestion}</pre>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAiSuggestion(null)}
                >
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
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