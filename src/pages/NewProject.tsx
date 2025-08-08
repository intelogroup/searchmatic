import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/Header'
import { ArrowLeft } from 'lucide-react'
import { useCreateProject } from '@/hooks/useProjects'
import { logInfo } from '@/lib/error-logger'
import { ProjectTypeSelector } from '@/components/project/ProjectTypeSelector'
import { FeaturePreview } from '@/components/project/FeaturePreview'
import { ProjectForm, type ProjectFormData } from '@/components/project/ProjectForm'

export const NewProject = () => {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [projectType, setProjectType] = useState<'guided' | 'upload' | null>(null)
  const createProjectMutation = useCreateProject()

  const handleSelectType = async (type: 'guided' | 'upload') => {
    setProjectType(type)
    setShowForm(true)
  }

  const getInitialFormData = (type: 'guided' | 'upload'): Partial<ProjectFormData> => {
    if (type === 'guided') {
      return {
        title: 'New Systematic Review',
        description: 'AI-guided systematic literature review',
        project_type: 'systematic_review',
      }
    } else {
      return {
        title: 'Document Collection Review',
        description: 'Review of uploaded document collection',
        project_type: 'systematic_review',
      }
    }
  }

  const handleFormSubmit = async (data: ProjectFormData) => {
    logInfo('Starting project creation with form data', {
      feature: 'projects',
      action: 'create-project-form-submit',
      metadata: { 
        title: data.title,
        project_type: data.project_type,
        hasDescription: !!data.description 
      }
    })

    try {
      const projectData = {
        title: data.title,
        description: data.description || undefined,
        project_type: data.project_type,
        research_domain: data.research_domain || undefined,
      }

      const newProject = await createProjectMutation.mutateAsync(projectData)
      
      logInfo('Project created successfully, navigating to project', {
        feature: 'projects',
        action: 'create-project-success',
        metadata: { 
          projectId: newProject.id,
          title: newProject.title,
          project_type: newProject.project_type
        }
      })

      // Navigate to the newly created project
      navigate(`/projects/${newProject.id}`)
      
    } catch (error) {
      console.error('Failed to create project:', error)
      // Error is already logged by the mutation
    }
  }

  const handleBack = () => {
    if (showForm) {
      setShowForm(false)
      setProjectType(null)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {showForm ? 'Back to Options' : 'Back to Dashboard'}
          </Button>
          <h2 className="text-3xl font-bold mb-2">Create New Project</h2>
          <p className="text-muted-foreground">
            {showForm 
              ? 'Fill in the details for your research project'
              : 'Choose how you\'d like to start your systematic literature review'
            }
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {!showForm ? (
            <>
              <ProjectTypeSelector onSelectType={handleSelectType} />
              <FeaturePreview />
            </>
          ) : (
            <ProjectForm
              projectType={projectType!}
              onSubmit={handleFormSubmit}
              onCancel={() => setShowForm(false)}
              isSubmitting={createProjectMutation.isPending}
              initialData={getInitialFormData(projectType!)}
            />
          )}
        </div>
      </main>
    </div>
  )
}