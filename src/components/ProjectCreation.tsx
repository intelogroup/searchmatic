import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { 
  Plus, 
  ArrowRight, 
  BookOpen, 
  Target, 
  Users, 
  FileText, 
  Settings,
  CheckCircle,
  AlertCircle 
} from 'lucide-react'

interface ProjectCreationProps {
  onProjectCreated?: (projectId: string) => void
}

interface ProjectFormData {
  title: string
  description: string
  researchQuestion: string
  frameworkType: 'pico' | 'spider' | 'other'
  population: string
  intervention: string
  comparison: string
  outcome: string
  sample?: string
  phenomenon?: string
  design?: string
  evaluation?: string
  researchType?: string
  inclusionCriteria: string[]
  exclusionCriteria: string[]
  keywords: string[]
  databases: string[]
}

interface CreationStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  fields: (keyof ProjectFormData)[]
}

const CREATION_STEPS: CreationStep[] = [
  {
    id: 'basic',
    title: 'Project Basics',
    description: 'Set up your project title and research question',
    icon: BookOpen,
    fields: ['title', 'description', 'researchQuestion', 'frameworkType']
  },
  {
    id: 'framework',
    title: 'Research Framework',
    description: 'Define your PICO or SPIDER components',
    icon: Target,
    fields: ['population', 'intervention', 'comparison', 'outcome', 'sample', 'phenomenon', 'design', 'evaluation', 'researchType']
  },
  {
    id: 'criteria',
    title: 'Selection Criteria',
    description: 'Set inclusion and exclusion criteria',
    icon: Users,
    fields: ['inclusionCriteria', 'exclusionCriteria']
  },
  {
    id: 'search',
    title: 'Search Strategy',
    description: 'Define keywords and databases',
    icon: FileText,
    fields: ['keywords', 'databases']
  }
]

const FRAMEWORK_OPTIONS = [
  {
    value: 'pico',
    label: 'PICO',
    description: 'Population, Intervention, Comparison, Outcome - for clinical questions',
    components: ['population', 'intervention', 'comparison', 'outcome']
  },
  {
    value: 'spider',
    label: 'SPIDER',
    description: 'Sample, Phenomenon, Design, Evaluation, Research type - for qualitative research',
    components: ['sample', 'phenomenon', 'design', 'evaluation', 'researchType']
  },
  {
    value: 'other',
    label: 'Other/Custom',
    description: 'Define your own framework components',
    components: []
  }
]

const DATABASE_OPTIONS = [
  'PubMed/MEDLINE',
  'Embase',
  'Cochrane Library',
  'Scopus',
  'Web of Science',
  'CINAHL',
  'PsycINFO',
  'IEEE Xplore',
  'ACM Digital Library',
  'Google Scholar'
]

export function ProjectCreation({ onProjectCreated }: ProjectCreationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    researchQuestion: '',
    frameworkType: 'pico',
    population: '',
    intervention: '',
    comparison: '',
    outcome: '',
    sample: '',
    phenomenon: '',
    design: '',
    evaluation: '',
    researchType: '',
    inclusionCriteria: [],
    exclusionCriteria: [],
    keywords: [],
    databases: ['PubMed/MEDLINE']
  })
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newCriterion, setNewCriterion] = useState('')
  const [newKeyword, setNewKeyword] = useState('')

  const supabase = useSupabaseClient()
  const user = useUser()
  const navigate = useNavigate()

  const currentStepData = CREATION_STEPS[currentStep]
  const isLastStep = currentStep === CREATION_STEPS.length - 1

  const updateFormData = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addToArray = (field: 'inclusionCriteria' | 'exclusionCriteria' | 'keywords', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }))
    }
  }

  const removeFromArray = (field: 'inclusionCriteria' | 'exclusionCriteria' | 'keywords', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const validateCurrentStep = (): boolean => {
    const step = CREATION_STEPS[currentStep]
    
    switch (step.id) {
      case 'basic':
        return !!(formData.title && formData.researchQuestion)
      case 'framework':
        if (formData.frameworkType === 'pico') {
          return !!(formData.population || formData.intervention || formData.outcome)
        } else if (formData.frameworkType === 'spider') {
          return !!(formData.sample || formData.phenomenon || formData.design)
        }
        return true
      case 'criteria':
        return formData.inclusionCriteria.length > 0 || formData.exclusionCriteria.length > 0
      case 'search':
        return formData.keywords.length > 0 && formData.databases.length > 0
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      setError(null)
      if (isLastStep) {
        handleCreateProject()
      } else {
        setCurrentStep(prev => prev + 1)
      }
    } else {
      setError('Please fill in the required fields for this step')
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1))
    setError(null)
  }

  const handleCreateProject = async () => {
    if (!user) {
      setError('You must be logged in to create a project')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      // Create the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          title: formData.title,
          description: formData.description,
          status: 'active',
          user_id: user.id,
          settings: {
            frameworkType: formData.frameworkType,
            databases: formData.databases,
            createdAt: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (projectError) {
        throw new Error(`Failed to create project: ${projectError.message}`)
      }

      // Create the protocol
      const protocolData = {
        project_id: project.id,
        user_id: user.id,
        title: `${formData.title} Protocol`,
        description: formData.description,
        research_question: formData.researchQuestion,
        framework_type: formData.frameworkType,
        status: 'draft' as const,
        version: 1,
        population: formData.population || null,
        intervention: formData.intervention || null,
        comparison: formData.comparison || null,
        outcome: formData.outcome || null,
        sample: formData.sample || null,
        phenomenon: formData.phenomenon || null,
        design: formData.design || null,
        evaluation: formData.evaluation || null,
        research_type: formData.researchType || null,
        inclusion_criteria: formData.inclusionCriteria,
        exclusion_criteria: formData.exclusionCriteria,
        keywords: formData.keywords,
        databases: formData.databases,
        is_locked: false,
        metadata: {
          createdVia: 'project-creation-wizard',
          wizard: {
            completedSteps: CREATION_STEPS.map(s => s.id),
            completedAt: new Date().toISOString()
          }
        }
      }

      const { data: protocol, error: protocolError } = await supabase
        .from('protocols')
        .insert(protocolData)
        .select()
        .single()

      if (protocolError) {
        console.error('Protocol creation error:', protocolError)
        // Don't fail the entire creation if protocol fails, but log it
      }

      // Create initial protocol version
      if (protocol) {
        const { error: versionError } = await supabase
          .from('protocol_versions')
          .insert({
            protocol_id: protocol.id,
            version_number: 1,
            title: protocolData.title,
            description: protocolData.description,
            research_question: protocolData.research_question,
            framework_type: protocolData.framework_type,
            changes_summary: 'Initial protocol creation',
            snapshot_data: protocolData,
            created_by: user.id
          })

        if (versionError) {
          console.warn('Failed to create protocol version:', versionError)
        }
      }

      onProjectCreated?.(project.id)
      navigate(`/projects/${project.id}`)

    } catch (error) {
      console.error('Project creation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create project')
    } finally {
      setIsCreating(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="e.g., Effects of Exercise on Depression in Adults"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Brief description of your systematic review..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Research Question *
              </label>
              <textarea
                value={formData.researchQuestion}
                onChange={(e) => updateFormData('researchQuestion', e.target.value)}
                placeholder="What is the main research question you're trying to answer?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Research Framework
              </label>
              <div className="space-y-3">
                {FRAMEWORK_OPTIONS.map((framework) => (
                  <label key={framework.value} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="frameworkType"
                      value={framework.value}
                      checked={formData.frameworkType === framework.value}
                      onChange={(e) => updateFormData('frameworkType', e.target.value)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{framework.label}</div>
                      <div className="text-sm text-gray-600">{framework.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 'framework':
        const selectedFramework = FRAMEWORK_OPTIONS.find(f => f.value === formData.frameworkType)
        
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                {selectedFramework?.label} Framework
              </h4>
              <p className="text-sm text-blue-700">
                {selectedFramework?.description}
              </p>
            </div>

            {formData.frameworkType === 'pico' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Population
                  </label>
                  <input
                    type="text"
                    value={formData.population}
                    onChange={(e) => updateFormData('population', e.target.value)}
                    placeholder="Who are the participants?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervention
                  </label>
                  <input
                    type="text"
                    value={formData.intervention}
                    onChange={(e) => updateFormData('intervention', e.target.value)}
                    placeholder="What is being studied?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comparison
                  </label>
                  <input
                    type="text"
                    value={formData.comparison}
                    onChange={(e) => updateFormData('comparison', e.target.value)}
                    placeholder="What is it compared to?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Outcome
                  </label>
                  <input
                    type="text"
                    value={formData.outcome}
                    onChange={(e) => updateFormData('outcome', e.target.value)}
                    placeholder="What are you measuring?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {formData.frameworkType === 'spider' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sample
                  </label>
                  <input
                    type="text"
                    value={formData.sample}
                    onChange={(e) => updateFormData('sample', e.target.value)}
                    placeholder="Who are the participants?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phenomenon of Interest
                  </label>
                  <input
                    type="text"
                    value={formData.phenomenon}
                    onChange={(e) => updateFormData('phenomenon', e.target.value)}
                    placeholder="What phenomenon is studied?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Design
                  </label>
                  <input
                    type="text"
                    value={formData.design}
                    onChange={(e) => updateFormData('design', e.target.value)}
                    placeholder="Study design?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evaluation
                  </label>
                  <input
                    type="text"
                    value={formData.evaluation}
                    onChange={(e) => updateFormData('evaluation', e.target.value)}
                    placeholder="How is it measured/evaluated?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Research Type
                  </label>
                  <input
                    type="text"
                    value={formData.researchType}
                    onChange={(e) => updateFormData('researchType', e.target.value)}
                    placeholder="What type of research?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        )

      case 'criteria':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inclusion Criteria
              </label>
              <p className="text-sm text-gray-600 mb-3">
                What characteristics must studies have to be included?
              </p>
              <div className="space-y-2">
                {formData.inclusionCriteria.map((criterion, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="flex-grow px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm">
                      {criterion}
                    </span>
                    <button
                      onClick={() => removeFromArray('inclusionCriteria', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCriterion}
                    onChange={(e) => setNewCriterion(e.target.value)}
                    placeholder="Add inclusion criterion..."
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('inclusionCriteria', newCriterion)
                        setNewCriterion('')
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      addToArray('inclusionCriteria', newCriterion)
                      setNewCriterion('')
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exclusion Criteria
              </label>
              <p className="text-sm text-gray-600 mb-3">
                What characteristics will exclude studies from your review?
              </p>
              <div className="space-y-2">
                {formData.exclusionCriteria.map((criterion, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="flex-grow px-3 py-2 bg-red-50 border border-red-200 rounded-md text-sm">
                      {criterion}
                    </span>
                    <button
                      onClick={() => removeFromArray('exclusionCriteria', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCriterion}
                    onChange={(e) => setNewCriterion(e.target.value)}
                    placeholder="Add exclusion criterion..."
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && currentStepData.id === 'criteria') {
                        addToArray('exclusionCriteria', newCriterion)
                        setNewCriterion('')
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      addToArray('exclusionCriteria', newCriterion)
                      setNewCriterion('')
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'search':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords and Search Terms *
              </label>
              <p className="text-sm text-gray-600 mb-3">
                What keywords will you use to search for relevant studies?
              </p>
              <div className="space-y-2">
                {formData.keywords.map((keyword, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="flex-grow px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm">
                      {keyword}
                    </span>
                    <button
                      onClick={() => removeFromArray('keywords', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Add keyword or search term..."
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('keywords', newKeyword)
                        setNewKeyword('')
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      addToArray('keywords', newKeyword)
                      setNewKeyword('')
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Databases to Search *
              </label>
              <div className="space-y-2">
                {DATABASE_OPTIONS.map((database) => (
                  <label key={database} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.databases.includes(database)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFormData('databases', [...formData.databases, database])
                        } else {
                          updateFormData('databases', formData.databases.filter(d => d !== database))
                        }
                      }}
                      className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{database}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Project
        </h1>
        <p className="text-gray-600">
          Set up your systematic review project with guided protocol creation
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {CREATION_STEPS.map((step, index) => {
            const StepIcon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            
            return (
              <div key={step.id} className={`flex items-center ${index < CREATION_STEPS.length - 1 ? 'flex-1' : ''}`}>
                <div className={`flex items-center space-x-3 ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive ? 'border-blue-600 bg-blue-50' : 
                    isCompleted ? 'border-green-600 bg-green-50' : 
                    'border-gray-300'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
                {index < CREATION_STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white shadow rounded-lg p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600">
            {currentStepData.description}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={isCreating}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isCreating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating Project...
              </>
            ) : isLastStep ? (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </>
            ) : (
              <>
                Next Step
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}