import React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Lightbulb } from 'lucide-react'

interface FrameworkSection {
  label: string
  key: keyof ProtocolFormData
  placeholder: string
  description: string
}

interface ProtocolFormData {
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
}

interface ProtocolFormProps {
  formData: ProtocolFormData
  isLocked: boolean
  isGettingAIHelp: boolean
  onInputChange: (key: string, value: string) => void
  onGetAIHelp: (focusArea: 'framework') => void
}

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

export const ProtocolForm: React.FC<ProtocolFormProps> = ({
  formData,
  isLocked,
  isGettingAIHelp,
  onInputChange,
  onGetAIHelp
}) => {
  const currentFramework = formData.framework_type === 'pico' ? picoFramework : 
                           formData.framework_type === 'spider' ? spiderFramework : []

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-medium text-base">Basic Information</h3>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            disabled={isLocked}
            placeholder="Enter protocol title"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            disabled={isLocked}
            placeholder="Brief description of the protocol"
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Research Question *</label>
          <Textarea
            value={formData.research_question}
            onChange={(e) => onInputChange('research_question', e.target.value)}
            disabled={isLocked}
            placeholder="What is your main research question?"
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Framework Type</label>
          <select
            value={formData.framework_type}
            onChange={(e) => onInputChange('framework_type', e.target.value)}
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
              onClick={() => onGetAIHelp('framework')}
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
                value={(formData[section.key] as string) || ''}
                onChange={(e) => onInputChange(section.key, e.target.value)}
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
    </div>
  )
}