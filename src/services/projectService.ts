/**
 * Project Service - Handles all project-related database operations
 * Follows 2025 best practices for Supabase integration with comprehensive error handling
 */

import { baseSupabaseClient as supabase } from '@/lib/supabase'
import { BaseService } from '@/lib/service-wrapper'
import { type AuthenticatedUser } from '@/lib/auth-utils'
import { projectStatsService, type DashboardStats } from './projectStatsService'

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
      if (!projects || projects.length === 0) return []
      
      // Use stats service to enhance projects with statistics
      return projectStatsService.enhanceProjectsWithStats(projects)
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

        // Use stats service to enhance project with statistics
        return projectStatsService.enhanceProjectWithStats(project)
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
  async getDashboardStats(): Promise<DashboardStats> {
    return projectStatsService.getDashboardStats()
  }
}

// Export singleton instance
export const projectService = new ProjectService()