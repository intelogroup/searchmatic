import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Database,
  Users,
  FileCheck
} from 'lucide-react'
import type { Protocol } from '@/types/database'

interface WorkflowStep {
  id: string
  title: string
  description: string
  status: 'completed' | 'current' | 'pending' | 'blocked'
  icon: React.ElementType
  estimatedTime?: string
  dependencies?: string[]
  tasks?: {
    id: string
    title: string
    completed: boolean
    required: boolean
  }[]
}

interface ProtocolWorkflowProps {
  protocol: Protocol
  onStepClick: (stepId: string) => void
  onUpdateStep: (stepId: string, status: WorkflowStep['status']) => void
  className?: string
}

export const ProtocolWorkflow: React.FC<ProtocolWorkflowProps> = ({
  protocol,
  onStepClick,
  className = ''
}) => {
  const [selectedStep, setSelectedStep] = useState<string | null>(null)

  const workflowSteps: WorkflowStep[] = [
    {
      id: 'research-question',
      title: 'Research Question',
      description: 'Define your research question and objectives',
      status: protocol.research_question ? 'completed' : 'current',
      icon: FileText,
      estimatedTime: '1-2 hours',
      tasks: [
        { id: 'rq1', title: 'Define primary research question', completed: !!protocol.research_question, required: true },
        { id: 'rq2', title: 'Identify secondary objectives', completed: !!protocol.description, required: false },
        { id: 'rq3', title: 'Select appropriate framework', completed: !!protocol.framework_type, required: true }
      ]
    },
    {
      id: 'framework-definition',
      title: 'Framework Definition', 
      description: 'Complete PICO/SPIDER framework components',
      status: getFrameworkStatus(protocol),
      icon: Filter,
      estimatedTime: '2-3 hours',
      dependencies: ['research-question'],
      tasks: getFrameworkTasks(protocol)
    },
    {
      id: 'inclusion-exclusion',
      title: 'Inclusion/Exclusion Criteria',
      description: 'Define study selection criteria',
      status: getCriteriaStatus(protocol),
      icon: Users,
      estimatedTime: '1-2 hours',
      dependencies: ['framework-definition'],
      tasks: [
        { id: 'ie1', title: 'Define inclusion criteria', completed: protocol.inclusion_criteria.length > 0, required: true },
        { id: 'ie2', title: 'Define exclusion criteria', completed: protocol.exclusion_criteria.length > 0, required: true },
        { id: 'ie3', title: 'Review criteria completeness', completed: false, required: false }
      ]
    },
    {
      id: 'search-strategy',
      title: 'Search Strategy',
      description: 'Develop keywords and database selection',
      status: getSearchStatus(protocol),
      icon: Search,
      estimatedTime: '2-4 hours',
      dependencies: ['inclusion-exclusion'],
      tasks: [
        { id: 'ss1', title: 'Define keywords and synonyms', completed: protocol.keywords.length > 0, required: true },
        { id: 'ss2', title: 'Select databases', completed: protocol.databases.length > 0, required: true },
        { id: 'ss3', title: 'Test search strategy', completed: false, required: false },
        { id: 'ss4', title: 'Document search limits', completed: false, required: false }
      ]
    },
    {
      id: 'protocol-review',
      title: 'Protocol Review',
      description: 'Review and validate protocol completeness',
      status: getReviewStatus(protocol),
      icon: FileCheck,
      estimatedTime: '1 hour',
      dependencies: ['search-strategy'],
      tasks: [
        { id: 'pr1', title: 'Internal review', completed: false, required: true },
        { id: 'pr2', title: 'Peer review', completed: false, required: false },
        { id: 'pr3', title: 'Final approval', completed: protocol.status === 'active', required: true }
      ]
    },
    {
      id: 'execution',
      title: 'Execute Search',
      description: 'Implement search strategy and collect studies',
      status: protocol.status === 'active' ? 'current' : 'pending',
      icon: Database,
      estimatedTime: '4-8 hours',
      dependencies: ['protocol-review'],
      tasks: [
        { id: 'ex1', title: 'Execute database searches', completed: false, required: true },
        { id: 'ex2', title: 'Remove duplicates', completed: false, required: true },
        { id: 'ex3', title: 'Screen titles/abstracts', completed: false, required: true },
        { id: 'ex4', title: 'Full-text screening', completed: false, required: true }
      ]
    }
  ]

  function getFrameworkStatus(protocol: Protocol): WorkflowStep['status'] {
    if (!protocol.research_question) return 'blocked'
    
    const requiredFields = protocol.framework_type === 'pico' 
      ? ['population', 'intervention', 'comparison', 'outcome']
      : protocol.framework_type === 'spider'
      ? ['sample', 'phenomenon', 'design', 'evaluation', 'research_type']
      : []
    
    const completedFields = requiredFields.filter(field => 
      protocol[field as keyof Protocol] && 
      String(protocol[field as keyof Protocol]).trim() !== ''
    ).length
    
    if (completedFields === requiredFields.length) return 'completed'
    if (completedFields > 0) return 'current'
    return 'pending'
  }

  function getFrameworkTasks(protocol: Protocol) {
    if (protocol.framework_type === 'pico') {
      return [
        { id: 'fw1', title: 'Define Population', completed: !!protocol.population, required: true },
        { id: 'fw2', title: 'Define Intervention', completed: !!protocol.intervention, required: true },
        { id: 'fw3', title: 'Define Comparison', completed: !!protocol.comparison, required: true },
        { id: 'fw4', title: 'Define Outcome', completed: !!protocol.outcome, required: true }
      ]
    } else if (protocol.framework_type === 'spider') {
      return [
        { id: 'fw1', title: 'Define Sample', completed: !!protocol.sample, required: true },
        { id: 'fw2', title: 'Define Phenomenon', completed: !!protocol.phenomenon, required: true },
        { id: 'fw3', title: 'Define Design', completed: !!protocol.design, required: true },
        { id: 'fw4', title: 'Define Evaluation', completed: !!protocol.evaluation, required: true },
        { id: 'fw5', title: 'Define Research Type', completed: !!protocol.research_type, required: true }
      ]
    }
    return [
      { id: 'fw1', title: 'Define framework components', completed: false, required: true }
    ]
  }

  function getCriteriaStatus(protocol: Protocol): WorkflowStep['status'] {
    const frameworkComplete = getFrameworkStatus(protocol) === 'completed'
    if (!frameworkComplete) return 'blocked'
    
    const hasInclusion = protocol.inclusion_criteria.length > 0
    const hasExclusion = protocol.exclusion_criteria.length > 0
    
    if (hasInclusion && hasExclusion) return 'completed'
    if (hasInclusion || hasExclusion) return 'current'
    return 'pending'
  }

  function getSearchStatus(protocol: Protocol): WorkflowStep['status'] {
    const criteriaComplete = getCriteriaStatus(protocol) === 'completed'
    if (!criteriaComplete) return 'blocked'
    
    const hasKeywords = protocol.keywords.length > 0
    const hasDatabases = protocol.databases.length > 0
    
    if (hasKeywords && hasDatabases) return 'completed'
    if (hasKeywords || hasDatabases) return 'current'
    return 'pending'
  }

  function getReviewStatus(protocol: Protocol): WorkflowStep['status'] {
    const searchComplete = getSearchStatus(protocol) === 'completed'
    if (!searchComplete) return 'blocked'
    
    return protocol.status === 'active' ? 'completed' : 'current'
  }

  const getStepStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'current':
        return <Circle className="w-5 h-5 text-blue-600 fill-current" />
      case 'blocked':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      default:
        return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStepStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 border-green-200 bg-green-50'
      case 'current': return 'text-blue-600 border-blue-200 bg-blue-50'
      case 'blocked': return 'text-red-600 border-red-200 bg-red-50'
      default: return 'text-gray-600 border-gray-200 bg-gray-50'
    }
  }

  const completedSteps = workflowSteps.filter(step => step.status === 'completed').length
  const totalSteps = workflowSteps.length
  const progressPercentage = (completedSteps / totalSteps) * 100

  const handleStepClick = (step: WorkflowStep) => {
    setSelectedStep(selectedStep === step.id ? null : step.id)
    onStepClick(step.id)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Protocol Development Progress</CardTitle>
            <Badge variant="secondary">
              {completedSteps} of {totalSteps} completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <div className="space-y-4">
        {workflowSteps.map((step, index) => {
          const isSelected = selectedStep === step.id
          const isBlocked = step.status === 'blocked'
          const IconComponent = step.icon
          
          return (
            <Card 
              key={step.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
              } ${isBlocked ? 'opacity-60' : 'hover:shadow-md'}`}
              onClick={() => !isBlocked && handleStepClick(step)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Step Number & Status */}
                  <div className="flex flex-col items-center gap-2 min-w-[3rem]">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${getStepStatusColor(step.status)}`}>
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-200"></div>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <IconComponent className="w-5 h-5 text-gray-600" />
                      <h3 className="font-medium text-base">{step.title}</h3>
                      {getStepStatusIcon(step.status)}
                      {step.estimatedTime && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {step.estimatedTime}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{step.description}</p>

                    {/* Dependencies */}
                    {step.dependencies && step.dependencies.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-gray-500">Depends on:</span>
                        {step.dependencies.map(depId => {
                          const dep = workflowSteps.find(s => s.id === depId)
                          return dep ? (
                            <Badge key={depId} variant="outline" className="text-xs">
                              {dep.title}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    )}

                    {/* Task List */}
                    {isSelected && step.tasks && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium mb-3">Tasks:</h4>
                        <div className="space-y-2">
                          {step.tasks.map(task => (
                            <div key={task.id} className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                task.completed 
                                  ? 'bg-green-500 border-green-500' 
                                  : 'border-gray-300'
                              }`}>
                                {task.completed && (
                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className={`text-sm flex-1 ${
                                task.completed ? 'line-through text-gray-500' : ''
                              }`}>
                                {task.title}
                                {task.required && <span className="text-red-500 ml-1">*</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default ProtocolWorkflow