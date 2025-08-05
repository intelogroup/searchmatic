/**
 * Study Service - Handles studies/articles management within projects
 * Studies represent individual research articles, theses, books, etc.
 */

import { baseSupabaseClient as supabase } from '@/lib/supabase'
import { logSupabaseError, logInfo, logPerformance } from '@/lib/error-logger'

export interface Study {
  id: string
  project_id: string
  user_id: string
  title: string
  authors: string | null
  publication_year: number | null
  journal: string | null
  doi: string | null
  pmid: string | null
  url: string | null
  study_type: 'article' | 'thesis' | 'book' | 'conference_paper' | 'report' | 'patent' | 'other'
  status: 'pending' | 'screening' | 'included' | 'excluded' | 'duplicate' | 'extracted'
  abstract: string | null
  keywords: string[] | null
  full_text: string | null
  citation: string | null
  pdf_url: string | null
  pdf_processed: boolean
  extraction_data: Record<string, any>
  screening_notes: string | null
  quality_score: number | null
  similarity_hash: string | null
  is_duplicate: boolean
  duplicate_of: string | null
  ai_summary: string | null
  ai_tags: string[] | null
  ai_confidence_score: number | null
  created_at: string
  updated_at: string
  processed_at: string | null
}

export interface CreateStudyData {
  title: string
  authors?: string
  publication_year?: number
  journal?: string
  doi?: string
  pmid?: string
  url?: string
  study_type?: Study['study_type']
  abstract?: string
  keywords?: string[]
  citation?: string
}

export interface UpdateStudyData {
  title?: string
  authors?: string
  publication_year?: number
  journal?: string
  doi?: string
  pmid?: string
  url?: string
  study_type?: Study['study_type']
  status?: Study['status']
  abstract?: string
  keywords?: string[]
  citation?: string
  screening_notes?: string
  quality_score?: number
}

class StudyService {
  /**
   * Get all studies for a project
   */
  async getProjectStudies(projectId: string): Promise<Study[]> {
    const startTime = performance.now()
    
    logInfo(`Fetching studies for project: ${projectId}`, {
      feature: 'studies',
      action: 'fetch-project-studies',
      metadata: { projectId }
    })

    try {
      const { data: studies, error } = await supabase
        .from('studies')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        logSupabaseError('fetch-project-studies', error, {
          feature: 'studies',
          action: 'fetch-project-studies',
          metadata: { projectId }
        })
        throw new Error(`Failed to fetch studies: ${error.message}`)
      }

      const duration = performance.now() - startTime
      logPerformance('Fetch project studies', duration, {
        feature: 'studies',
        metadata: { projectId, count: studies?.length || 0 }
      })

      logInfo(`Successfully fetched ${studies?.length || 0} studies`, {
        feature: 'studies',
        action: 'fetch-project-studies-success',
        metadata: { projectId, count: studies?.length || 0 }
      })

      return studies as Study[] || []

    } catch (error) {
      const duration = performance.now() - startTime
      logPerformance('Failed to fetch project studies', duration)
      
      logSupabaseError('fetch-project-studies-unexpected', error, {
        feature: 'studies',
        action: 'fetch-project-studies-error',
        metadata: { projectId }
      })
      
      throw error
    }
  }

  /**
   * Get a single study by ID
   */
  async getStudyById(studyId: string): Promise<Study | null> {
    const startTime = performance.now()
    
    logInfo(`Fetching study: ${studyId}`, {
      feature: 'studies',
      action: 'fetch-study-by-id',
      metadata: { studyId }
    })

    try {
      const { data: study, error } = await supabase
        .from('studies')
        .select('*')
        .eq('id', studyId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          logInfo(`Study not found: ${studyId}`, {
            feature: 'studies',
            action: 'study-not-found',
            metadata: { studyId }
          })
          return null
        }
        
        logSupabaseError('fetch-study-by-id', error, {
          feature: 'studies',
          action: 'fetch-study-by-id',
          metadata: { studyId }
        })
        throw new Error(`Failed to fetch study: ${error.message}`)
      }

      const duration = performance.now() - startTime
      logPerformance('Fetch study by ID', duration, {
        feature: 'studies',
        metadata: { studyId }
      })

      return study as Study

    } catch (error) {
      const duration = performance.now() - startTime
      logPerformance('Failed to fetch study by ID', duration)
      
      logSupabaseError('fetch-study-by-id-unexpected', error, {
        feature: 'studies',
        action: 'fetch-study-by-id-error',
        metadata: { studyId }
      })
      
      throw error
    }
  }

  /**
   * Create a new study within a project
   */
  async createStudy(projectId: string, studyData: CreateStudyData): Promise<Study> {
    const startTime = performance.now()
    
    logInfo(`Creating study in project: ${projectId}`, {
      feature: 'studies',
      action: 'create-study',
      metadata: {
        projectId,
        title: studyData.title,
        type: studyData.study_type
      }
    })

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        throw new Error('User not authenticated')
      }

      const { data: study, error } = await supabase
        .from('studies')
        .insert({
          project_id: projectId,
          user_id: user.user.id,
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
          citation: studyData.citation || null,
          pdf_processed: false,
          extraction_data: {},
          is_duplicate: false,
        })
        .select()
        .single()

      if (error) {
        logSupabaseError('create-study', error, {
          feature: 'studies',
          action: 'create-study',
          metadata: { projectId, title: studyData.title }
        })
        throw new Error(`Failed to create study: ${error.message}`)
      }

      const duration = performance.now() - startTime
      logPerformance('Create study', duration, {
        feature: 'studies',
        metadata: { projectId, studyId: study.id }
      })

      logInfo('Study created successfully', {
        feature: 'studies',
        action: 'create-study-success',
        metadata: {
          projectId,
          studyId: study.id,
          title: study.title,
          type: study.study_type
        }
      })

      return study as Study

    } catch (error) {
      const duration = performance.now() - startTime
      logPerformance('Failed to create study', duration)
      
      logSupabaseError('create-study-unexpected', error, {
        feature: 'studies',
        action: 'create-study-error',
        metadata: { projectId, title: studyData.title }
      })
      
      throw error
    }
  }

  /**
   * Update an existing study
   */
  async updateStudy(studyId: string, updates: UpdateStudyData): Promise<Study> {
    const startTime = performance.now()
    
    logInfo(`Updating study: ${studyId}`, {
      feature: 'studies',
      action: 'update-study',
      metadata: { studyId, updates }
    })

    try {
      const { data: study, error } = await supabase
        .from('studies')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', studyId)
        .select()
        .single()

      if (error) {
        logSupabaseError('update-study', error, {
          feature: 'studies',
          action: 'update-study',
          metadata: { studyId }
        })
        throw new Error(`Failed to update study: ${error.message}`)
      }

      const duration = performance.now() - startTime
      logPerformance('Update study', duration, {
        feature: 'studies',
        metadata: { studyId }
      })

      logInfo('Study updated successfully', {
        feature: 'studies',
        action: 'update-study-success',
        metadata: { studyId, title: study.title }
      })

      return study as Study

    } catch (error) {
      const duration = performance.now() - startTime
      logPerformance('Failed to update study', duration)
      
      logSupabaseError('update-study-unexpected', error, {
        feature: 'studies',
        action: 'update-study-error',
        metadata: { studyId }
      })
      
      throw error
    }
  }

  /**
   * Delete a study
   */
  async deleteStudy(studyId: string): Promise<void> {
    const startTime = performance.now()
    
    logInfo(`Deleting study: ${studyId}`, {
      feature: 'studies',
      action: 'delete-study',
      metadata: { studyId }
    })

    try {
      const { error } = await supabase
        .from('studies')
        .delete()
        .eq('id', studyId)

      if (error) {
        logSupabaseError('delete-study', error, {
          feature: 'studies',
          action: 'delete-study',
          metadata: { studyId }
        })
        throw new Error(`Failed to delete study: ${error.message}`)
      }

      const duration = performance.now() - startTime
      logPerformance('Delete study', duration, {
        feature: 'studies',
        metadata: { studyId }
      })

      logInfo('Study deleted successfully', {
        feature: 'studies',
        action: 'delete-study-success',
        metadata: { studyId }
      })

    } catch (error) {
      const duration = performance.now() - startTime
      logPerformance('Failed to delete study', duration)
      
      logSupabaseError('delete-study-unexpected', error, {
        feature: 'studies',
        action: 'delete-study-error',
        metadata: { studyId }
      })
      
      throw error
    }
  }

  /**
   * Update study status (common operation for screening)
   */
  async updateStudyStatus(studyId: string, status: Study['status'], notes?: string): Promise<Study> {
    const updates: UpdateStudyData = { status }
    if (notes) {
      updates.screening_notes = notes
    }

    logInfo(`Updating study status: ${studyId} to ${status}`, {
      feature: 'studies',
      action: 'update-study-status',
      metadata: { studyId, status, hasNotes: !!notes }
    })

    return this.updateStudy(studyId, updates)
  }

  /**
   * Bulk update study statuses (for screening workflow)
   */
  async bulkUpdateStudyStatus(studyIds: string[], status: Study['status']): Promise<void> {
    const startTime = performance.now()
    
    logInfo(`Bulk updating ${studyIds.length} studies to ${status}`, {
      feature: 'studies',
      action: 'bulk-update-status',
      metadata: { count: studyIds.length, status }
    })

    try {
      const { error } = await supabase
        .from('studies')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', studyIds)

      if (error) {
        logSupabaseError('bulk-update-study-status', error, {
          feature: 'studies',
          action: 'bulk-update-status',
          metadata: { count: studyIds.length, status }
        })
        throw new Error(`Failed to bulk update studies: ${error.message}`)
      }

      const duration = performance.now() - startTime
      logPerformance('Bulk update study status', duration, {
        feature: 'studies',
        metadata: { count: studyIds.length, status }
      })

      logInfo(`Successfully updated ${studyIds.length} studies`, {
        feature: 'studies',
        action: 'bulk-update-status-success',
        metadata: { count: studyIds.length, status }
      })

    } catch (error) {
      const duration = performance.now() - startTime
      logPerformance('Failed to bulk update study status', duration)
      
      logSupabaseError('bulk-update-study-status-unexpected', error, {
        feature: 'studies',
        action: 'bulk-update-status-error',
        metadata: { count: studyIds.length, status }
      })
      
      throw error
    }
  }
}

// Export singleton instance
export const studyService = new StudyService()