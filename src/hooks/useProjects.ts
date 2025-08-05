/**
 * React hooks for project management
 * Uses React Query for server state management with optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService, type ProjectWithStats, type CreateProjectData, type UpdateProjectData } from '@/services/projectService'
import { logInfo, logSupabaseError } from '@/lib/error-logger'

// Query keys for React Query caching
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: string) => [...projectKeys.lists(), { filters }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  stats: () => [...projectKeys.all, 'stats'] as const,
}

/**
 * Hook to get all user projects with real-time updates
 */
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: () => projectService.getUserProjects(),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime)
    retry: (failureCount, error) => {
      // Retry up to 3 times, but not for authentication errors
      if (error?.message?.includes('auth') || error?.message?.includes('permission')) {
        return false
      }
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}

/**
 * Hook to get a single project by ID
 */
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId || ''),
    queryFn: () => projectService.getProjectById(projectId!),
    enabled: !!projectId, // Only run if projectId exists
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error?.message?.includes('auth') || error?.message?.includes('permission')) {
        return false
      }
      return failureCount < 2 // Fewer retries for individual project
    },
  })
}

/**
 * Hook to get dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: projectKeys.stats(),
    queryFn: () => projectService.getDashboardStats(),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to create a new project with optimistic updates
 */
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectData: CreateProjectData) => projectService.createProject(projectData),
    
    // Optimistic update
    onMutate: async (newProject) => {
      logInfo('Starting optimistic project creation', {
        feature: 'projects',
        action: 'optimistic-create',
        metadata: { title: newProject.title }
      })

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() })

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData<ProjectWithStats[]>(projectKeys.lists())

      // Optimistically update to the new value
      if (previousProjects) {
        const optimisticProject: ProjectWithStats = {
          id: `temp-${Date.now()}`, // Temporary ID
          user_id: 'current-user',
          title: newProject.title,
          description: newProject.description || null,
          project_type: newProject.project_type,
          status: 'draft',
          research_domain: newProject.research_domain || null,
          progress_percentage: 0,
          current_stage: 'Planning',
          last_activity_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total_studies: 0,
          pending_studies: 0,
          included_studies: 0,
          excluded_studies: 0,
          studies_last_updated: null,
        }

        queryClient.setQueryData<ProjectWithStats[]>(
          projectKeys.lists(),
          [...previousProjects, optimisticProject]
        )
      }

      // Return context object with the snapshotted value
      return { previousProjects }
    },

    // If the mutation succeeds, we get the actual project data from the server
    onSuccess: (data) => {
      logInfo('Project created successfully', {
        feature: 'projects',
        action: 'create-success',
        metadata: { 
          projectId: data.id,
          title: data.title,
          type: data.project_type
        }
      })

      // Invalidate and refetch projects to get the real data
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
      
      // Set the individual project data
      queryClient.setQueryData(projectKeys.detail(data.id), {
        ...data,
        total_studies: 0,
        pending_studies: 0,
        included_studies: 0,
        excluded_studies: 0,
        studies_last_updated: null,
      })
    },

    // If the mutation fails, rollback to the previous value
    onError: (error, variables, context) => {
      logSupabaseError('create-project-mutation-error', error, {
        feature: 'projects',
        action: 'create-error',
        metadata: { title: variables.title }
      })

      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.lists(), context.previousProjects)
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

/**
 * Hook to update a project with optimistic updates
 */
export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, updates }: { projectId: string; updates: UpdateProjectData }) => 
      projectService.updateProject(projectId, updates),
    
    onMutate: async ({ projectId, updates }) => {
      logInfo(`Starting optimistic project update: ${projectId}`, {
        feature: 'projects',
        action: 'optimistic-update',
        metadata: { projectId, updates }
      })

      // Cancel queries
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(projectId) })
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() })

      // Snapshot previous values
      const previousProject = queryClient.getQueryData<ProjectWithStats>(projectKeys.detail(projectId))
      const previousProjects = queryClient.getQueryData<ProjectWithStats[]>(projectKeys.lists())

      // Optimistically update individual project
      if (previousProject) {
        const updatedProject = {
          ...previousProject,
          ...updates,
          updated_at: new Date().toISOString(),
        }
        queryClient.setQueryData(projectKeys.detail(projectId), updatedProject)
      }

      // Optimistically update projects list
      if (previousProjects) {
        const updatedProjects = previousProjects.map(project =>
          project.id === projectId
            ? { ...project, ...updates, updated_at: new Date().toISOString() }
            : project
        )
        queryClient.setQueryData(projectKeys.lists(), updatedProjects)
      }

      return { previousProject, previousProjects }
    },

    onSuccess: (data, { projectId }) => {
      logInfo('Project updated successfully', {
        feature: 'projects',
        action: 'update-success',
        metadata: { projectId, title: data.title }
      })

      // Update with real server data
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
    },

    onError: (error, { projectId }, context) => {
      logSupabaseError('update-project-mutation-error', error, {
        feature: 'projects',
        action: 'update-error',
        metadata: { projectId }
      })

      // Rollback optimistic updates
      if (context?.previousProject) {
        queryClient.setQueryData(projectKeys.detail(projectId), context.previousProject)
      }
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.lists(), context.previousProjects)
      }
    },
  })
}

/**
 * Hook to delete a project with optimistic updates
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectId: string) => projectService.deleteProject(projectId),
    
    onMutate: async (projectId) => {
      logInfo(`Starting optimistic project deletion: ${projectId}`, {
        feature: 'projects',
        action: 'optimistic-delete',
        metadata: { projectId }
      })

      await queryClient.cancelQueries({ queryKey: projectKeys.lists() })

      const previousProjects = queryClient.getQueryData<ProjectWithStats[]>(projectKeys.lists())

      // Remove project from the list optimistically
      if (previousProjects) {
        const updatedProjects = previousProjects.filter(project => project.id !== projectId)
        queryClient.setQueryData(projectKeys.lists(), updatedProjects)
      }

      return { previousProjects }
    },

    onSuccess: (_, projectId) => {
      logInfo('Project deleted successfully', {
        feature: 'projects',
        action: 'delete-success',
        metadata: { projectId }
      })

      // Remove from individual cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
    },

    onError: (error, projectId, context) => {
      logSupabaseError('delete-project-mutation-error', error, {
        feature: 'projects',
        action: 'delete-error',
        metadata: { projectId }
      })

      // Rollback the optimistic update
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.lists(), context.previousProjects)
      }
    },
  })
}

/**
 * Hook to prefetch a project (useful for hover states)
 */
export function usePrefetchProject() {
  const queryClient = useQueryClient()

  return (projectId: string) => {
    queryClient.prefetchQuery({
      queryKey: projectKeys.detail(projectId),
      queryFn: () => projectService.getProjectById(projectId),
      staleTime: 30 * 1000,
    })
  }
}