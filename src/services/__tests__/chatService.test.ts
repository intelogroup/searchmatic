/**
 * Chat Service Unit Tests
 * Tests for conversation and message management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { chatService, type CreateConversationData, type CreateMessageData } from '../chatService'

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

import { ensureAuthenticated } from '@/lib/auth-utils'
import { baseSupabaseClient as supabase } from '@/lib/supabase'

describe('ChatService', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {},
    app_metadata: {}
  }

  const mockConversation = {
    id: 'conv-123',
    project_id: 'project-123',
    user_id: 'user-123',
    title: 'Test Conversation',
    context: 'Research discussion',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }

  const mockMessage = {
    id: 'msg-123',
    conversation_id: 'conv-123',
    role: 'user' as const,
    content: 'Hello, how can you help?',
    metadata: null,
    created_at: '2025-01-01T00:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ensureAuthenticated).mockResolvedValue(mockUser)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createConversation', () => {
    it('should create a conversation successfully', async () => {
      const createData: CreateConversationData = {
        project_id: 'project-123',
        title: 'New Chat',
        context: 'Protocol discussion'
      }

      const mockFrom = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockConversation, error: null })
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await chatService.createConversation(createData)

      expect(result).toEqual(mockConversation)
      expect(supabase.from).toHaveBeenCalledWith('conversations')
      expect(ensureAuthenticated).toHaveBeenCalledTimes(1)
    })

    it('should use default title if not provided', async () => {
      const createData: CreateConversationData = {
        project_id: 'project-123'
      }

      const conversationWithDefaultTitle = { ...mockConversation, title: 'New Conversation' }
      const mockFrom = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: conversationWithDefaultTitle, error: null })
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await chatService.createConversation(createData)

      expect(result.title).toBe('New Conversation')
    })

    it('should handle database errors', async () => {
      const createData: CreateConversationData = {
        project_id: 'project-123',
        title: 'Test Chat'
      }

      const mockError = { message: 'Foreign key constraint violation', code: '23503' }
      const mockFrom = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError })
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      await expect(chatService.createConversation(createData)).rejects.toThrow('Database operation failed')
    })
  })

  describe('getConversations', () => {
    it('should retrieve conversations for a project', async () => {
      const mockConversations = [mockConversation, { ...mockConversation, id: 'conv-456' }]
      
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: mockConversations, error: null })
            }))
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await chatService.getConversations('project-123')

      expect(result).toEqual(mockConversations)
      expect(supabase.from).toHaveBeenCalledWith('conversations')
    })

    it('should handle empty results', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null })
            }))
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await chatService.getConversations('project-123')

      expect(result).toEqual([])
    })
  })

  describe('getConversationWithMessages', () => {
    it('should retrieve a conversation with its messages', async () => {
      const messages = [mockMessage, { ...mockMessage, id: 'msg-456', role: 'assistant' as const }]

      // Mock both the conversation and messages queries
      const mockFrom = vi.fn((table: string) => {
        if (table === 'conversations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: mockConversation, error: null })
                }))
              }))
            }))
          }
        } else if (table === 'messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({ data: messages, error: null })
              }))
            }))
          }
        }
        return {}
      })
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await chatService.getConversationWithMessages('conv-123')

      expect(result).toEqual({
        ...mockConversation,
        messages
      })
    })

    it('should return null when conversation not found', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            }))
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await chatService.getConversationWithMessages('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('createMessage', () => {
    it('should create a message successfully', async () => {
      const messageData: CreateMessageData = {
        conversation_id: 'conv-123',
        role: 'user',
        content: 'What are the inclusion criteria?',
        metadata: { source: 'web_interface' }
      }

      const newMessage = { ...mockMessage, ...messageData, id: 'msg-new' }
      
      const mockFrom = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: newMessage, error: null })
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      // Mock the updateConversationTimestamp method by mocking supabase calls
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        }))
      }))

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'messages') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: newMessage, error: null })
              }))
            }))
          }
        } else if (table === 'conversations') {
          return {
            update: mockUpdate
          }
        }
        return {}
      })

      const result = await chatService.createMessage(messageData)

      expect(result).toEqual(newMessage)
      expect(supabase.from).toHaveBeenCalledWith('messages')
    })

    it('should handle message creation errors', async () => {
      const messageData: CreateMessageData = {
        conversation_id: 'conv-123',
        role: 'user',
        content: 'Test message'
      }

      const mockError = { message: 'Conversation not found', code: '23503' }
      const mockFrom = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError })
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      await expect(chatService.createMessage(messageData)).rejects.toThrow('Database operation failed')
    })
  })

  describe('updateConversation', () => {
    it('should update conversation successfully', async () => {
      const updateData = { title: 'Updated Title' }
      const updatedConversation = { ...mockConversation, title: 'Updated Title' }
      
      const mockFrom = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: updatedConversation, error: null })
              }))
            }))
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await chatService.updateConversation('conv-123', updateData)

      expect(result).toEqual(updatedConversation)
      expect(supabase.from).toHaveBeenCalledWith('conversations')
    })
  })

  describe('deleteConversation', () => {
    it('should delete a conversation successfully', async () => {
      const mockFrom = vi.fn((table: string) => {
        if (table === 'messages') {
          return {
            delete: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: null, error: null })
            }))
          }
        } else if (table === 'conversations') {
          return {
            delete: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({ data: null, error: null })
              }))
            }))
          }
        }
        return {}
      })
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      await expect(chatService.deleteConversation('conv-123')).resolves.not.toThrow()
      expect(supabase.from).toHaveBeenCalledWith('messages')
      expect(supabase.from).toHaveBeenCalledWith('conversations')
    })

    it('should handle deletion errors', async () => {
      const mockError = { message: 'Cannot delete conversation', code: 'DELETE_ERROR' }
      const mockFrom = vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: null, error: mockError })
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      await expect(chatService.deleteConversation('conv-123')).rejects.toThrow('Cannot delete conversation')
    })
  })

  describe('getMessages', () => {
    it('should retrieve messages for a conversation', async () => {
      const messages = [mockMessage, { ...mockMessage, id: 'msg-456' }]
      
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({ data: messages, error: null })
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await chatService.getMessages('conv-123')

      expect(result).toEqual(messages)
      expect(supabase.from).toHaveBeenCalledWith('messages')
    })

    it('should handle empty message results', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await chatService.getMessages('conv-123')

      expect(result).toEqual([])
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle authentication failures', async () => {
      vi.mocked(ensureAuthenticated).mockRejectedValue(new Error('User not authenticated'))

      await expect(chatService.createConversation({
        project_id: 'project-123',
        title: 'Test'
      })).rejects.toThrow('User not authenticated')
    })

    it('should validate required fields', async () => {
      const invalidData = { project_id: '' } as CreateConversationData

      await expect(chatService.createConversation(invalidData)).rejects.toThrow()
    })

    it('should handle network errors gracefully', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockRejectedValue(new Error('Network error'))
            }))
          }))
        }))
      }))
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      await expect(chatService.getConversations('project-123')).rejects.toThrow('Network error')
    })
  })
})