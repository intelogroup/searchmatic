/**
 * Project Service - Handles all project-related database operations
 * Follows 2025 best practices for Supabase integration with comprehensive error handling
 */

import { baseSupabaseClient as supabase } from '@/lib/supabase'
import { BaseService } from '@/lib/service-wrapper'
import { type AuthenticatedUser } from '@/lib/auth-utils'

// Type for project statistics from RPC function
interface ProjectStats {
  total_studies: number
  pending_studies: number
  included_studies: number
  excluded_studies: number
  last_updated: string | null
}

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

class ProjectService extends BaseService {
  constructor() {
    super('project')
  }
  /**
   * Get all projects for the current user with statistics
   */
  async getUserProjects(): Promise<ProjectWithStats[]> {
    return this.executeSupabase(
      'get-user-projects',
      async () => {
        // First get the basic project data
        return supabase
          .from('projects')
          .select('*')
          .order('last_activity_at', { ascending: false })
      },
      'projects'
    ).then(async (projects) => {

      // Get statistics for each project
      const projectsWithStats: ProjectWithStats[] = []
      
      for (const project of projects || []) {
        try {
          // Use the helper function we created in the migration
          const { data: stats, error: statsError } = await supabase
            .rpc('get_project_stats', { project_uuid: project.id })
            .single()

          if (statsError) {
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
              total_studies: (stats as ProjectStats).total_studies || 0,
              pending_studies: (stats as ProjectStats).pending_studies || 0,
              included_studies: (stats as ProjectStats).included_studies || 0,
              excluded_studies: (stats as ProjectStats).excluded_studies || 0,
              studies_last_updated: (stats as ProjectStats).last_updated || null
            })
          }
        } catch (error) {
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

      return projectsWithStats
    })
  }

  /**
   * Get a single project by ID with statistics
   */
  async getProjectById(projectId: string): Promise<ProjectWithStats | null> {
    return this.execute(
      'get-project-by-id',
      async () => {
        // Get project data
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (projectError) {
          if (projectError.code === 'PGRST116') {
            return null // No rows returned
          }
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

        if (!statsError) {
          projectStats = {
            total_studies: (stats as ProjectStats).total_studies || 0,
            pending_studies: (stats as ProjectStats).pending_studies || 0,
            included_studies: (stats as ProjectStats).included_studies || 0,
            excluded_studies: (stats as ProjectStats).excluded_studies || 0,
            studies_last_updated: (stats as ProjectStats).last_updated || null
          }
        }

        const result: ProjectWithStats = {
          ...project,
          ...projectStats
        }

        return result
      },
      { projectId }
    )
  }

  /**
   * Create a new project
   */
  async createProject(projectData: CreateProjectData): Promise<Project> {
    return this.executeAuthenticatedSupabase(
      'create-project',
      async (user: AuthenticatedUser) => {
        return supabase
          .from('projects')
          .insert({
            title: projectData.title,
            description: projectData.description || null,
            project_type: projectData.project_type,
            research_domain: projectData.research_domain || null,
            user_id: user.id,
            status: 'draft' as const,
            progress_percentage: 0,
            current_stage: 'Planning',
            last_activity_at: new Date().toISOString()
          })
          .select()
          .single()
      },
      'projects',
      {
        title: projectData.title,
        type: projectData.project_type,
        domain: projectData.research_domain
      }
    )
  }

  /**
   * Update an existing project
   */
  async updateProject(projectId: string, updates: UpdateProjectData): Promise<Project> {
    return this.executeSupabase(
      'update-project',
      async () => {
        return supabase
          .from('projects')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId)
          .select()
          .single()
      },
      'projects',
      { projectId, updates }
    )
  }

  /**
   * Delete a project and all related data
   */
  async deleteProject(projectId: string): Promise<void> {
    await this.execute(
      'delete-project',
      async () => {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId)

        if (error) throw error
      },
      { projectId }
    )
  }

  /**
   * Get project statistics summary for dashboard
   */
  async getDashboardStats() {
    return this.executeSupabase(
      'get-dashboard-stats',
      async () => {
        return supabase
          .from('projects')
          .select('status, progress_percentage, created_at')
      },
      'projects'
    ).then((projects) => {
      const stats = {
        totalProjects: projects?.length || 0,
        activeProjects: projects?.filter(p => p.status === 'active').length || 0,
        completedProjects: projects?.filter(p => p.status === 'completed').length || 0,
        averageProgress: projects?.length > 0 
          ? Math.round(projects.reduce((sum, p) => sum + p.progress_percentage, 0) / projects.length)
          : 0
      }

      return stats
    })
  }
}

// Export singleton instance
export const projectService = new ProjectService()