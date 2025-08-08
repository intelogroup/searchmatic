/**
 * Project Statistics Service - Handles project statistics and analytics
 * Separated from main ProjectService to maintain VCT compliance
 */

import { baseSupabaseClient as supabase } from '@/lib/supabase'
import { BaseService } from '@/lib/service-wrapper'
import type { Project, ProjectWithStats } from './projectService'

// Type for project statistics from RPC function
export interface ProjectStats {
  total_studies: number
  pending_studies: number
  included_studies: number
  excluded_studies: number
  last_updated: string | null
}

export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  averageProgress: number
}

export class ProjectStatsService extends BaseService {
  constructor() {
    super('project-stats')
  }

  /**
   * Get statistics for a specific project
   */
  async getProjectStats(projectId: string): Promise<ProjectStats> {
    return this.execute(
      'get-project-stats',
      async () => {
        const { data: stats, error } = await supabase
          .rpc('get_project_stats', { project_uuid: projectId })
          .single()

        if (error) {
          // Return default stats if function fails
          return {
            total_studies: 0,
            pending_studies: 0,
            included_studies: 0,
            excluded_studies: 0,
            last_updated: null
          }
        }

        return {
          total_studies: (stats as ProjectStats).total_studies || 0,
          pending_studies: (stats as ProjectStats).pending_studies || 0,
          included_studies: (stats as ProjectStats).included_studies || 0,
          excluded_studies: (stats as ProjectStats).excluded_studies || 0,
          last_updated: (stats as ProjectStats).last_updated || null
        }
      },
      { projectId }
    )
  }

  /**
   * Enhance a project with statistics
   */
  async enhanceProjectWithStats(project: Project): Promise<ProjectWithStats> {
    return this.execute(
      'enhance-project-with-stats',
      async () => {
        try {
          const stats = await this.getProjectStats(project.id)
          return {
            ...project,
            total_studies: stats.total_studies,
            pending_studies: stats.pending_studies,
            included_studies: stats.included_studies,
            excluded_studies: stats.excluded_studies,
            studies_last_updated: stats.last_updated
          }
        } catch {
          // Return project with default stats on error
          return {
            ...project,
            total_studies: 0,
            pending_studies: 0,
            included_studies: 0,
            excluded_studies: 0,
            studies_last_updated: null
          }
        }
      },
      { projectId: project.id }
    )
  }

  /**
   * Enhance multiple projects with statistics
   */
  async enhanceProjectsWithStats(projects: Project[]): Promise<ProjectWithStats[]> {
    return this.execute(
      'enhance-projects-with-stats',
      async () => {
        const projectsWithStats: ProjectWithStats[] = []
        
        for (const project of projects) {
          const enhancedProject = await this.enhanceProjectWithStats(project)
          projectsWithStats.push(enhancedProject)
        }

        return projectsWithStats
      },
      { projectCount: projects.length }
    )
  }

  /**
   * Get dashboard statistics summary
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return this.executeSupabase(
      'get-dashboard-stats',
      async () => {
        return supabase
          .from('projects')
          .select('status, progress_percentage, created_at')
      },
      'projects'
    ).then((projects) => {
      const stats: DashboardStats = {
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

  /**
   * Get detailed project analytics
   */
  async getProjectAnalytics(projectId: string) {
    return this.execute(
      'get-project-analytics',
      async () => {
        const stats = await this.getProjectStats(projectId)
        
        // Calculate additional analytics
        const analytics = {
          ...stats,
          completionRate: stats.total_studies > 0 
            ? Math.round(((stats.included_studies + stats.excluded_studies) / stats.total_studies) * 100)
            : 0,
          inclusionRate: (stats.included_studies + stats.excluded_studies) > 0
            ? Math.round((stats.included_studies / (stats.included_studies + stats.excluded_studies)) * 100)
            : 0,
          studyReviewProgress: {
            reviewed: stats.included_studies + stats.excluded_studies,
            pending: stats.pending_studies,
            total: stats.total_studies
          }
        }

        return analytics
      },
      { projectId }
    )
  }

  /**
   * Get project progress metrics
   */
  async getProjectProgress(projectId: string) {
    return this.execute(
      'get-project-progress',
      async () => {
        // Get project data
        const { data: project, error } = await supabase
          .from('projects')
          .select('progress_percentage, current_stage, status')
          .eq('id', projectId)
          .single()

        if (error) throw error

        const stats = await this.getProjectStats(projectId)
        
        return {
          percentage: project.progress_percentage,
          currentStage: project.current_stage,
          status: project.status,
          studies: {
            total: stats.total_studies,
            completed: stats.included_studies + stats.excluded_studies,
            remaining: stats.pending_studies
          },
          lastActivity: stats.last_updated
        }
      },
      { projectId }
    )
  }

  /**
   * Update project progress based on study statistics
   */
  async updateProjectProgress(projectId: string): Promise<number> {
    return this.execute(
      'update-project-progress',
      async () => {
        const stats = await this.getProjectStats(projectId)
        
        // Calculate progress percentage based on study completion
        let progressPercentage = 0
        if (stats.total_studies > 0) {
          const completedStudies = stats.included_studies + stats.excluded_studies
          progressPercentage = Math.round((completedStudies / stats.total_studies) * 100)
        }

        // Update project progress in database
        const { error } = await supabase
          .from('projects')
          .update({ 
            progress_percentage: progressPercentage,
            last_activity_at: new Date().toISOString()
          })
          .eq('id', projectId)

        if (error) throw error

        return progressPercentage
      },
      { projectId }
    )
  }
}

export const projectStatsService = new ProjectStatsService()