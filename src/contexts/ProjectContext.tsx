/**
 * Project Context Provider - Manages current project state and project-based access control
 * Ensures users must be in a project to use the app
 */

import React, { createContext, useState, useEffect, type ReactNode } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useProject } from '@/hooks/useProjects'
import { logInfo, logError } from '@/lib/error-logger'
import type { ProjectWithStats } from '@/services/projectService'

interface ProjectContextType {
  currentProject: ProjectWithStats | null
  isLoading: boolean
  error: Error | null
  setCurrentProject: (project: ProjectWithStats | null) => void
  requireProject: boolean
  canAccessProject: (projectId: string) => boolean
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

interface ProjectProviderProps {
  children: ReactNode
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<ProjectWithStats | null>(null)
  const [requireProject, setRequireProject] = useState(false)
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Fetch project data when projectId changes
  const { data: project, isLoading, error } = useProject(projectId)

  // Determine if current route requires a project
  useEffect(() => {
    const projectRequiredRoutes = [
      '/projects/',
      '/studies/',
      '/chat/',
      '/protocols/',
      '/export/'
    ]
    
    const needsProject = projectRequiredRoutes.some(route => 
      location.pathname.startsWith(route) && location.pathname !== '/projects/new'
    )
    
    setRequireProject(needsProject)
    
    logInfo('Project requirement check', {
      feature: 'project-context',
      action: 'check-project-requirement',
      metadata: {
        pathname: location.pathname,
        needsProject,
        hasProjectId: !!projectId
      }
    })
  }, [location.pathname, projectId])

  // Update current project when data changes
  useEffect(() => {
    if (project) {
      setCurrentProject(project)
      logInfo('Current project updated', {
        feature: 'project-context',
        action: 'set-current-project',
        metadata: {
          projectId: project.id,
          title: project.title,
          status: project.status
        }
      })
    } else if (projectId && !isLoading && !project) {
      // Project not found or no access
      logError('Project not found or access denied', {
        feature: 'project-context',
        action: 'project-access-denied',
        metadata: { projectId, pathname: location.pathname }
      })
      
      // Redirect to dashboard if project not found
      if (requireProject) {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [project, projectId, isLoading, requireProject, navigate, location.pathname])

  // Redirect logic for project-required routes
  useEffect(() => {
    if (requireProject && !projectId && !isLoading) {
      logInfo('Redirecting to dashboard - project required but none selected', {
        feature: 'project-context',
        action: 'redirect-to-dashboard',
        metadata: { pathname: location.pathname }
      })
      
      navigate('/dashboard', { 
        replace: true,
        state: { 
          message: 'Please select a project to continue',
          from: location.pathname 
        }
      })
    }
  }, [requireProject, projectId, isLoading, navigate, location.pathname])

  const canAccessProject = (targetProjectId: string): boolean => {
    // For now, we'll implement basic access control
    // This can be enhanced later with team-based permissions
    return !!currentProject && currentProject.id === targetProjectId
  }

  const contextValue: ProjectContextType = {
    currentProject,
    isLoading,
    error: error as Error | null,
    setCurrentProject,
    requireProject,
    canAccessProject
  }

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  )
}