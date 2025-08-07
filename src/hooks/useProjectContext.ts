import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProjectContext, ProjectWithStats } from '@/contexts/ProjectContext'
import { logInfo } from '@/lib/error-logger'

// Hook to use the project context
export const useProjectContext = () => {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider')
  }
  return context
}

// Hook to ensure we're in a project (throws if not)
export const useRequireProject = () => {
  const { currentProject, isLoading, requireProject } = useProjectContext()
  
  if (requireProject && !isLoading && !currentProject) {
    throw new Error('This component requires an active project')
  }
  
  return currentProject
}

// Hook for project switching
export const useProjectSwitcher = () => {
  const navigate = useNavigate()
  const { setCurrentProject } = useProjectContext()
  
  const switchToProject = (project: ProjectWithStats) => {
    logInfo('Switching to project', {
      feature: 'projects',
      action: 'switch-project',
      metadata: { projectId: project.id, projectTitle: project.title }
    })
    
    setCurrentProject(project)
    navigate('/dashboard')
  }
  
  return { switchToProject }
}