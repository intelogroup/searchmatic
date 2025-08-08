/**
 * Project Service Unit Tests
 * Tests for project CRUD operations and business logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { projectService, type CreateProjectData, type UpdateProjectData } from '../projectService'

// Mock dependencies
vi.mock('@/lib/error-logger', () => ({
  logInfo: vi.fn(),
  logSupabaseError: vi.fn(),
  logPerformance: vi.fn(),
  errorLogger: {
    logError: vi.fn(),
    setUserId: vi.fn()
  }
}))

vi.mock('@/lib/auth-utils', () => ({
  ensureAuthenticated: vi.fn(),
  createAuthSession: vi.fn(() => ({
    getUser: vi.fn().mockResolvedValue({ id: 'user-123', email: 'test@example.com' })
  }))
}))

vi.mock('@/lib/supabase', () => ({
  baseSupabaseClient: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}))

vi.mock('../projectStatsService', () => ({
  projectStatsService: {
    getProjectStats: vi.fn(),
    getDashboardStats: vi.fn(),
    enhanceProjectsWithStats: vi.fn(),
    enhanceProjectWithStats: vi.fn()
  }
}))

import { ensureAuthenticated } from '@/lib/auth-utils'
import { baseSupabaseClient as supabase } from '@/lib/supabase'
import { projectStatsService } from '../projectStatsService'

describe('ProjectService', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {},
    app_metadata: {}
  }

  const mockProject = {
    id: 'project-123',
    user_id: 'user-123',
    title: 'Test Project',
    description: 'A test project',
    project_type: 'systematic_review' as const,
    status: 'draft' as const,
    research_domain: 'medicine',
    progress_percentage: 0,
    current_stage: 'planning',
    last_activity_at: '2025-01-01T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }

  const mockProjectWithStats = {
    ...mockProject,
    total_studies: 10,
    pending_studies: 3,
    included_studies: 5,
    excluded_studies: 2,
    studies_last_updated: '2025-01-01T12:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ensureAuthenticated).mockResolvedValue(mockUser)
    vi.mocked(projectStatsService.getProjectStats).mockResolvedValue({
      total_studies: 10,
      pending_studies: 3,
      included_studies: 5,
      excluded_studies: 2,
      studies_last_updated: '2025-01-01T12:00:00Z'
    })
    vi.mocked(projectStatsService.enhanceProjectsWithStats).mockImplementation(async (projects) => 
      projects.map(project => ({ ...project, ...mockProjectWithStats }))
    )
    vi.mocked(projectStatsService.enhanceProjectWithStats).mockImplementation(async (project) => 
      ({ ...project, ...mockProjectWithStats })
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      const createData: CreateProjectData = {
        title: 'New Project',
        description: 'Project description',
        project_type: 'systematic_review',
        research_domain: 'medicine'
      }

      const mockFrom = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockProject, error: null })
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await projectService.createProject(createData)

      expect(result).toEqual(mockProject)
      expect(supabase.from).toHaveBeenCalledWith('projects')
      expect(ensureAuthenticated).toHaveBeenCalledTimes(1)
    })

    it('should handle database errors', async () => {
      const createData: CreateProjectData = {
        title: 'New Project',
        project_type: 'systematic_review'
      }

      const mockError = { message: 'Database error', code: 'DB001' }
      const mockFrom = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError })
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      await expect(projectService.createProject(createData)).rejects.toThrow('Database operation failed')
    })
  })

  describe('getUserProjects', () => {
    it('should retrieve user projects with stats successfully', async () => {
      const mockProjects = [mockProject, { ...mockProject, id: 'project-456' }]
      
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: mockProjects, error: null })
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await projectService.getUserProjects()

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(mockProjectWithStats)
      expect(projectStatsService.enhanceProjectsWithStats).toHaveBeenCalledWith(mockProjects)
    })

    it('should handle empty results', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await projectService.getUserProjects()

      expect(result).toEqual([])
    })

    it('should handle projects without stats gracefully', async () => {
      const mockProjects = [mockProject]
      
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: mockProjects, error: null })
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)
      vi.mocked(projectStatsService.getProjectStats).mockResolvedValue(null)

      const result = await projectService.getUserProjects()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        ...mockProject,
        total_studies: 0,
        pending_studies: 0,
        included_studies: 0,
        excluded_studies: 0,
        studies_last_updated: null
      })
    })
  })

  describe('getProjectById', () => {
    it('should retrieve a project by ID successfully with stats', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockProject, error: null })
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await projectService.getProjectById('project-123')

      expect(result).toEqual(mockProjectWithStats)
      expect(supabase.from).toHaveBeenCalledWith('projects')
      expect(projectStatsService.enhanceProjectWithStats).toHaveBeenCalledWith(mockProject)
    })

    it('should return null when project not found', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await projectService.getProjectById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('updateProject', () => {
    it('should update a project successfully', async () => {
      const updateData: UpdateProjectData = {
        title: 'Updated Project',
        status: 'active',
        progress_percentage: 50
      }

      const updatedProject = { ...mockProject, ...updateData }
      
      const mockFrom = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: updatedProject, error: null })
              }))
            }))
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await projectService.updateProject('project-123', updateData)

      expect(result).toEqual(updatedProject)
      expect(supabase.from).toHaveBeenCalledWith('projects')
    })

    it('should handle unauthorized updates', async () => {
      const updateData: UpdateProjectData = { title: 'Updated Title' }
      const mockError = { message: 'Not authorized', code: 'AUTH001' }
      
      const mockFrom = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: null, error: mockError })
              }))
            }))
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      await expect(projectService.updateProject('project-123', updateData)).rejects.toThrow('Database operation failed')
    })
  })

  describe('deleteProject', () => {
    it('should delete a project successfully', async () => {
      const mockFrom = vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: null, error: null })
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      await expect(projectService.deleteProject('project-123')).resolves.not.toThrow()
      expect(supabase.from).toHaveBeenCalledWith('projects')
    })

    it('should handle deletion errors', async () => {
      const mockError = { message: 'Cannot delete project', code: 'DELETE_ERROR' }
      const mockFrom = vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: null, error: mockError })
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      await expect(projectService.deleteProject('project-123')).rejects.toThrow('Cannot delete project')
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle authentication failures', async () => {
      vi.mocked(ensureAuthenticated).mockRejectedValue(new Error('Not authenticated'))

      await expect(projectService.createProject({
        title: 'Test',
        project_type: 'systematic_review'
      })).rejects.toThrow('Not authenticated')
    })

    it('should validate required fields', async () => {
      const invalidData = { title: '' } as CreateProjectData

      await expect(projectService.createProject(invalidData)).rejects.toThrow()
    })

    it('should handle network timeouts gracefully', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockRejectedValue(new Error('Network timeout'))
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      await expect(projectService.getUserProjects()).rejects.toThrow('Network timeout')
    })

    it('should handle stats service failures gracefully', async () => {
      const mockProjects = [mockProject]
      
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({ data: mockProjects, error: null })
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)
      vi.mocked(projectStatsService.getProjectStats).mockRejectedValue(new Error('Stats service error'))

      const result = await projectService.getUserProjects()

      // Should still return projects but with default stats
      expect(result).toHaveLength(1)
      expect(result[0].total_studies).toBe(0)
    })
  })
})