/**
 * Project Service - Handles all project-related database operations
 * Follows 2025 best practices for Supabase integration with comprehensive error handling
 */

import { baseSupabaseClient as supabase } from '@/lib/supabase'
import { logSupabaseError, logInfo, logPerformance } from '@/lib/error-logger'

// Type definitions matching the enhanced database schema
export interface Project {
  id: string
  user_id: string
  title: string
  description: string | null
  project_type: 'systematic_review' | 'meta_analysis' | 'scoping_review' | 'narrative_review' | 'umbrella_review' | 'custom'
  status: 'draft' | 'active' | 'review' | 'completed' | 'archived'
  research_domain: string | null
  progress_percentage: number
  current_stage: string
  last_activity_at: string
  created_at: string
  updated_at: string
}

export interface ProjectWithStats extends Project {
  total_studies: number
  pending_studies: number
  included_studies: number
  excluded_studies: number
  studies_last_updated: string | null
}

export interface CreateProjectData {
  title: string
  description?: string
  project_type: Project['project_type']
  research_domain?: string
}

export interface UpdateProjectData {
  title?: string
  description?: string
  status?: Project['status']
  research_domain?: string
  progress_percentage?: number
  current_stage?: string
}

class ProjectService {
  /**
   * Get all projects for the current user with statistics
   */
  async getUserProjects(): Promise<ProjectWithStats[]> {
    const startTime = performance.now()
    
    logInfo('Fetching user projects', {
      feature: 'projects',
      action: 'fetch-user-projects'
    })

    try {
      // First get the basic project data
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('last_activity_at', { ascending: false })

      if (projectsError) {
        logSupabaseError('fetch-user-projects', projectsError, {
          feature: 'projects',
          action: 'fetch-user-projects'
        })
        throw new Error(`Failed to fetch projects: ${projectsError.message}`)
      }

      // Get statistics for each project
      const projectsWithStats: ProjectWithStats[] = []
      
      for (const project of projects || []) {
        try {
          // Use the helper function we created in the migration
          const { data: stats, error: statsError } = await supabase
            .rpc('get_project_stats', { project_uuid: project.id })
            .single()

          if (statsError) {
            logSupabaseError('get-project-stats', statsError, {
              feature: 'projects',
              action: 'get-project-stats',
              metadata: { projectId: project.id }
            })
            // Continue with default stats if function fails
            projectsWithStats.push({
              ...project,
              total_studies: 0,
              pending_studies: 0,
              included_studies: 0,
              excluded_studies: 0,
              studies_last_updated: null
            })
          } else {
            projectsWithStats.push({
              ...project,
              total_studies: (stats as any).total_studies || 0,
              pending_studies: (stats as any).pending_studies || 0,
              included_studies: (stats as any).included_studies || 0,
              excluded_studies: (stats as any).excluded_studies || 0,
              studies_last_updated: (stats as any).last_updated || null
            })
          }
        } catch (error) {
          logSupabaseError('project-stats-processing', error, {
            feature: 'projects',
            action: 'process-project-stats',
            metadata: { projectId: project.id }
          })
          // Continue with project but no stats
          projectsWithStats.push({
            ...project,
            total_studies: 0,
            pending_studies: 0,
            included_studies: 0,
            excluded_studies: 0,
            studies_last_updated: null
          })
        }
      }

      const duration = performance.now() - startTime
      logPerformance('Fetch user projects with stats', duration, {
        feature: 'projects',
        metadata: { projectCount: projectsWithStats.length }
      })

      logInfo(`Successfully fetched ${projectsWithStats.length} projects`, {
        feature: 'projects',
        action: 'fetch-user-projects-success',
        metadata: { count: projectsWithStats.length }
      })

      return projectsWithStats

    } catch (error) {
      const duration = performance.now() - startTime
      logPerformance('Failed to fetch user projects', duration)
      
      logSupabaseError('fetch-user-projects-unexpected', error, {
        feature: 'projects',
        action: 'fetch-user-projects-error'
      })
      
      throw error
    }
  }

  /**
   * Get a single project by ID with statistics
   */
  async getProjectById(projectId: string): Promise<ProjectWithStats | null> {
    const startTime = performance.now()
    
    logInfo(`Fetching project: ${projectId}`, {
      feature: 'projects',
      action: 'fetch-project-by-id',
      metadata: { projectId }
    })

    try {
      // Get project data
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) {
        if (projectError.code === 'PGRST116') {
          // No rows returned
          logInfo(`Project not found: ${projectId}`, {
            feature: 'projects',
            action: 'project-not-found',
            metadata: { projectId }
          })
          return null
        }
        
        logSupabaseError('fetch-project-by-id', projectError, {
          feature: 'projects',
          action: 'fetch-project-by-id',
          metadata: { projectId }
        })
        throw new Error(`Failed to fetch project: ${projectError.message}`)
      }

      // Get project statistics
      const { data: stats, error: statsError } = await supabase
        .rpc('get_project_stats', { project_uuid: projectId })
        .single()

      let projectStats = {
        total_studies: 0,
        pending_studies: 0,
        included_studies: 0,
        excluded_studies: 0,
        studies_last_updated: null as string | null
      }

      if (statsError) {
        logSupabaseError('get-project-stats', statsError, {
          feature: 'projects',
          action: 'get-project-stats',
          metadata: { projectId }
        })
      } else {
        projectStats = {
          total_studies: (stats as any).total_studies || 0,
          pending_studies: (stats as any).pending_studies || 0,
          included_studies: (stats as any).included_studies || 0,
          excluded_studies: (stats as any).excluded_studies || 0,
          studies_last_updated: (stats as any).last_updated || null
        }
      }

      const result: ProjectWithStats = {
        ...project,
        ...projectStats
      }

      const duration = performance.now() - startTime
      logPerformance('Fetch project by ID', duration, {
        feature: 'projects',
        metadata: { projectId, hasStats: !statsError }
      })

      return result

    } catch (error) {
      const duration = performance.now() - startTime
      logPerformance('Failed to fetch project by ID', duration)
      
      logSupabaseError('fetch-project-by-id-unexpected', error, {
        feature: 'projects',
        action: 'fetch-project-by-id-error',
        metadata: { projectId }
      })
      
      throw error
    }
  }

  /**
   * Create a new project
   */
  async createProject(projectData: CreateProjectData): Promise<Project> {
    const startTime = performance.now()
    
    logInfo('Creating new project', {
      feature: 'projects',
      action: 'create-project',
      metadata: {
        title: projectData.title,
        type: projectData.project_type,
        domain: projectData.research_domain
      }
    })

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        throw new Error('User not authenticated')
      }

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          title: projectData.title,
          description: projectData.description || null,
          project_type: projectData.project_type,
          research_domain: projectData.research_domain || null,
          user_id: user.user.id,
          status: 'draft' as const,
          progress_percentage: 0,
          current_stage: 'Planning',
          last_activity_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        logSupabaseError('create-project', error, {
          feature: 'projects',
          action: 'create-project',
          metadata: { title: projectData.title }
        })
        throw new Error(`Failed to create project: ${error.message}`)
      }

      const duration = performance.now() - startTime
      logPerformance('Create project', duration, {
        feature: 'projects',
        metadata: { projectId: project.id }
      })

      logInfo('Project created successfully', {
        feature: 'projects',
        action: 'create-project-success',
        metadata: {
          projectId: project.id,
          title: project.title,
          type: project.project_type
        }
      })

      return project

    } catch (error) {
      const duration = performance.now() - startTime
      logPerformance('Failed to create project', duration)
      
      logSupabaseError('create-project-unexpected', error, {
        feature: 'projects',
        action: 'create-project-error',
        metadata: { title: projectData.title }
      })
      
      throw error
    }
  }

  /**
   * Update an existing project
   */
  async updateProject(projectId: string, updates: UpdateProjectData): Promise<Project> {
    const startTime = performance.now()
    
    logInfo(`Updating project: ${projectId}`, {
      feature: 'projects',
      action: 'update-project',
      metadata: { projectId, updates }
    })

    try {
      const { data: project, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single()

      if (error) {
        logSupabaseError('update-project', error, {
          feature: 'projects',
          action: 'update-project',
          metadata: { projectId }
        })
        throw new Error(`Failed to update project: ${error.message}`)
      }

      const duration = performance.now() - startTime
      logPerformance('Update project', duration, {
        feature: 'projects',
        metadata: { projectId }
      })

      logInfo('Project updated successfully', {
        feature: 'projects',
        action: 'update-project-success',
        metadata: { projectId, title: project.title }
      })

      return project

    } catch (error) {
      const duration = performance.now() - startTime
      logPerformance('Failed to update project', duration)
      
      logSupabaseError('update-project-unexpected', error, {
        feature: 'projects',
        action: 'update-project-error',
        metadata: { projectId }
      })
      
      throw error
    }
  }

  /**
   * Delete a project and all related data
   */
  async deleteProject(projectId: string): Promise<void> {
    const startTime = performance.now()
    
    logInfo(`Deleting project: ${projectId}`, {
      feature: 'projects',
      action: 'delete-project',
      metadata: { projectId }
    })

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) {
        logSupabaseError('delete-project', error, {
          feature: 'projects',
          action: 'delete-project',
          metadata: { projectId }
        })
        throw new Error(`Failed to delete project: ${error.message}`)
      }

      const duration = performance.now() - startTime
      logPerformance('Delete project', duration, {
        feature: 'projects',
        metadata: { projectId }
      })

      logInfo('Project deleted successfully', {
        feature: 'projects',
        action: 'delete-project-success',
        metadata: { projectId }
      })

    } catch (error) {
      const duration = performance.now() - startTime
      logPerformance('Failed to delete project', duration)
      
      logSupabaseError('delete-project-unexpected', error, {
        feature: 'projects',
        action: 'delete-project-error',
        metadata: { projectId }
      })
      
      throw error
    }
  }

  /**
   * Get project statistics summary for dashboard
   */
  async getDashboardStats() {
    const startTime = performance.now()
    
    logInfo('Fetching dashboard statistics', {
      feature: 'projects',
      action: 'fetch-dashboard-stats'
    })

    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('status, progress_percentage, created_at')

      if (error) {
        logSupabaseError('fetch-dashboard-stats', error, {
          feature: 'projects',
          action: 'fetch-dashboard-stats'
        })
        throw new Error(`Failed to fetch dashboard stats: ${error.message}`)
      }

      const stats = {
        totalProjects: projects?.length || 0,
        activeProjects: projects?.filter(p => p.status === 'active').length || 0,
        completedProjects: projects?.filter(p => p.status === 'completed').length || 0,
        averageProgress: projects?.length > 0 
          ? Math.round(projects.reduce((sum, p) => sum + p.progress_percentage, 0) / projects.length)
          : 0
      }

      const duration = performance.now() - startTime
      logPerformance('Fetch dashboard stats', duration, {
        feature: 'projects',
        metadata: stats
      })

      return stats

    } catch (error) {
      const duration = performance.now() - startTime
      logPerformance('Failed to fetch dashboard stats', duration)
      
      logSupabaseError('fetch-dashboard-stats-unexpected', error, {
        feature: 'projects',
        action: 'fetch-dashboard-stats-error'
      })
      
      throw error
    }
  }
}

// Export singleton instance
export const projectService = new ProjectService()