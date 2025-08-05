/**
 * React Query hooks for studies management within projects
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studyService, type Study, type CreateStudyData, type UpdateStudyData } from '@/services/studyService'
import { logInfo, logError } from '@/lib/error-logger'

// Query keys
export const studyKeys = {
  all: ['studies'] as const,
  projectStudies: (projectId: string) => [...studyKeys.all, 'project', projectId] as const,
  study: (studyId: string) => [...studyKeys.all, 'study', studyId] as const,
}

/**
 * Get all studies for a project
 */
export function useProjectStudies(projectId: string) {
  return useQuery({
    queryKey: studyKeys.projectStudies(projectId),
    queryFn: () => studyService.getProjectStudies(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Get a single study by ID
 */
export function useStudy(studyId: string) {
  return useQuery({
    queryKey: studyKeys.study(studyId),
    queryFn: () => studyService.getStudyById(studyId),
    enabled: !!studyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Create a new study
 */
export function useCreateStudy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, studyData }: { projectId: string; studyData: CreateStudyData }) =>
      studyService.createStudy(projectId, studyData),
    onMutate: async ({ projectId, studyData }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: studyKeys.projectStudies(projectId) })

      // Snapshot previous value
      const previousStudies = queryClient.getQueryData<Study[]>(studyKeys.projectStudies(projectId))

      // Optimistically update
      if (previousStudies) {
        const optimisticStudy: Study = {
          id: `temp-${Date.now()}`,
          project_id: projectId,
          user_id: 'temp-user',
          title: studyData.title,
          authors: studyData.authors || null,
          publication_year: studyData.publication_year || null,
          journal: studyData.journal || null,
          doi: studyData.doi || null,
          pmid: studyData.pmid || null,
          url: studyData.url || null,
          study_type: studyData.study_type || 'article',
          status: 'pending',
          abstract: studyData.abstract || null,
          keywords: studyData.keywords || null,
          full_text: null,
          citation: studyData.citation || null,
          pdf_url: null,
          pdf_processed: false,
          extraction_data: {},
          screening_notes: null,
          quality_score: null,
          similarity_hash: null,
          is_duplicate: false,
          duplicate_of: null,
          ai_summary: null,
          ai_tags: null,
          ai_confidence_score: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          processed_at: null,
        }

        queryClient.setQueryData<Study[]>(
          studyKeys.projectStudies(projectId),
          [optimisticStudy, ...previousStudies]
        )
      }

      return { previousStudies }
    },
    onError: (err, { projectId }, context) => {
      // Revert optimistic update
      if (context?.previousStudies) {
        queryClient.setQueryData(studyKeys.projectStudies(projectId), context.previousStudies)
      }

      logError('Failed to create study', {
        feature: 'studies',
        action: 'create-study-mutation-error',
        metadata: { projectId, error: err.message }
      })
    },
    onSuccess: (newStudy, { projectId }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: studyKeys.projectStudies(projectId) })
      
      logInfo('Study created successfully', {
        feature: 'studies',
        action: 'create-study-mutation-success',
        metadata: { 
          projectId, 
          studyId: newStudy.id,
          title: newStudy.title 
        }
      })
    }
  })
}

/**
 * Update an existing study
 */
export function useUpdateStudy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ studyId, updates }: { studyId: string; updates: UpdateStudyData }) =>
      studyService.updateStudy(studyId, updates),
    onMutate: async ({ studyId, updates }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: studyKeys.study(studyId) })

      // Snapshot previous value
      const previousStudy = queryClient.getQueryData<Study>(studyKeys.study(studyId))

      // Optimistically update individual study
      if (previousStudy) {
        const optimisticStudy = {
          ...previousStudy,
          ...updates,
          updated_at: new Date().toISOString()
        }
        queryClient.setQueryData(studyKeys.study(studyId), optimisticStudy)

        // Also update in project studies list if present
        const projectStudiesKey = studyKeys.projectStudies(previousStudy.project_id)
        const previousProjectStudies = queryClient.getQueryData<Study[]>(projectStudiesKey)
        
        if (previousProjectStudies) {
          const updatedProjectStudies = previousProjectStudies.map(study =>
            study.id === studyId ? optimisticStudy : study
          )
          queryClient.setQueryData(projectStudiesKey, updatedProjectStudies)
        }
      }

      return { previousStudy }
    },
    onError: (err, { studyId }, context) => {
      // Revert optimistic update
      if (context?.previousStudy) {
        queryClient.setQueryData(studyKeys.study(studyId), context.previousStudy)
        
        // Also revert project studies list
        const projectStudiesKey = studyKeys.projectStudies(context.previousStudy.project_id)
        const currentProjectStudies = queryClient.getQueryData<Study[]>(projectStudiesKey)
        
        if (currentProjectStudies) {
          const revertedProjectStudies = currentProjectStudies.map(study =>
            study.id === studyId ? context.previousStudy : study
          )
          queryClient.setQueryData(projectStudiesKey, revertedProjectStudies)
        }
      }

      logError('Failed to update study', {
        feature: 'studies',
        action: 'update-study-mutation-error',
        metadata: { studyId, error: err.message }
      })
    },
    onSuccess: (updatedStudy, { studyId }) => {
      // Update individual study cache
      queryClient.setQueryData(studyKeys.study(studyId), updatedStudy)
      
      // Invalidate project studies to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: studyKeys.projectStudies(updatedStudy.project_id) 
      })
      
      logInfo('Study updated successfully', {
        feature: 'studies',
        action: 'update-study-mutation-success',
        metadata: { 
          studyId: updatedStudy.id,
          title: updatedStudy.title,
          status: updatedStudy.status
        }
      })
    }
  })
}

/**
 * Delete a study
 */
export function useDeleteStudy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (studyId: string) => studyService.deleteStudy(studyId),
    onMutate: async (studyId) => {
      // Get the study first to know which project list to update
      const study = queryClient.getQueryData<Study>(studyKeys.study(studyId))
      
      if (study) {
        // Cancel outgoing queries
        await queryClient.cancelQueries({ queryKey: studyKeys.projectStudies(study.project_id) })

        // Snapshot previous value
        const previousStudies = queryClient.getQueryData<Study[]>(studyKeys.projectStudies(study.project_id))

        // Optimistically remove from list
        if (previousStudies) {
          const updatedStudies = previousStudies.filter(s => s.id !== studyId)
          queryClient.setQueryData(studyKeys.projectStudies(study.project_id), updatedStudies)
        }

        return { previousStudies, projectId: study.project_id }
      }

      return {}
    },
    onError: (err, studyId, context) => {
      // Revert optimistic update
      if (context?.previousStudies && context?.projectId) {
        queryClient.setQueryData(studyKeys.projectStudies(context.projectId), context.previousStudies)
      }

      logError('Failed to delete study', {
        feature: 'studies',
        action: 'delete-study-mutation-error',
        metadata: { studyId, error: err.message }
      })
    },
    onSuccess: (_, studyId, context) => {
      // Remove from individual study cache
      queryClient.removeQueries({ queryKey: studyKeys.study(studyId) })
      
      // Invalidate project studies if we know the project
      if (context?.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: studyKeys.projectStudies(context.projectId) 
        })
      }
      
      logInfo('Study deleted successfully', {
        feature: 'studies',
        action: 'delete-study-mutation-success',
        metadata: { studyId }
      })
    }
  })
}

/**
 * Update study status (specialized hook for screening workflow)
 */
export function useUpdateStudyStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ studyId, status, notes }: { studyId: string; status: Study['status']; notes?: string }) =>
      studyService.updateStudyStatus(studyId, status, notes),
    onSuccess: (updatedStudy) => {
      // Update both individual study and project studies list
      queryClient.setQueryData(studyKeys.study(updatedStudy.id), updatedStudy)
      queryClient.invalidateQueries({ 
        queryKey: studyKeys.projectStudies(updatedStudy.project_id) 
      })
      
      logInfo('Study status updated successfully', {
        feature: 'studies',
        action: 'update-study-status-success',
        metadata: { 
          studyId: updatedStudy.id,
          status: updatedStudy.status,
          title: updatedStudy.title
        }
      })
    },
    onError: (err, { studyId, status }) => {
      logError('Failed to update study status', {
        feature: 'studies',
        action: 'update-study-status-error',
        metadata: { studyId, status, error: err.message }
      })
    }
  })
}

/**
 * Bulk update study statuses
 */
export function useBulkUpdateStudyStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ studyIds, status }: { studyIds: string[]; status: Study['status']; projectId: string }) =>
      studyService.bulkUpdateStudyStatus(studyIds, status),
    onSuccess: (_, { projectId, studyIds, status }) => {
      // Invalidate project studies to refetch updated data
      queryClient.invalidateQueries({ 
        queryKey: studyKeys.projectStudies(projectId) 
      })
      
      // Also invalidate individual study queries for affected studies
      studyIds.forEach(studyId => {
        queryClient.invalidateQueries({ queryKey: studyKeys.study(studyId) })
      })
      
      logInfo('Bulk study status update successful', {
        feature: 'studies',
        action: 'bulk-update-status-success',
        metadata: { 
          projectId,
          count: studyIds.length,
          status
        }
      })
    },
    onError: (err, { studyIds, status }) => {
      logError('Failed to bulk update study status', {
        feature: 'studies',
        action: 'bulk-update-status-error',
        metadata: { 
          count: studyIds.length, 
          status, 
          error: err.message 
        }
      })
    }
  })
}

/**
 * Get studies by status for a project (useful for screening workflow)
 */
export function useStudiesByStatus(projectId: string, status: Study['status']) {
  return useQuery({
    queryKey: [...studyKeys.projectStudies(projectId), 'status', status],
    queryFn: async () => {
      const studies = await studyService.getProjectStudies(projectId)
      return studies.filter(study => study.status === status)
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2, // 2 minutes (shorter for status-specific views)
  })
}

/**
 * Get study counts by status for dashboard/overview
 */
export function useStudyStatusCounts(projectId: string) {
  return useQuery({
    queryKey: [...studyKeys.projectStudies(projectId), 'status-counts'],
    queryFn: async () => {
      const studies = await studyService.getProjectStudies(projectId)
      
      const counts = {
        pending: 0,
        screening: 0,
        included: 0,
        excluded: 0,
        duplicate: 0,
        extracted: 0,
        total: studies.length
      }

      studies.forEach(study => {
        counts[study.status]++
      })

      return counts
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 1, // 1 minute for counts
  })
}