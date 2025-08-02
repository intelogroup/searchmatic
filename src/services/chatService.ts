import { baseSupabaseClient as supabase } from '@/lib/supabase'
import { errorLogger } from '@/lib/error-logger'
import type { Database } from '@/types/database'

type Conversation = Database['public']['Tables']['conversations']['Row']
type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
type ConversationUpdate = Database['public']['Tables']['conversations']['Update']

type Message = Database['public']['Tables']['messages']['Row']
type MessageInsert = Database['public']['Tables']['messages']['Insert']

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
}

export interface CreateConversationData {
  project_id: string
  title?: string
  context?: string
}

export interface CreateMessageData {
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: any
}

class ChatService {
  // Conversation CRUD operations
  async createConversation(data: CreateConversationData): Promise<Conversation> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const conversationData: ConversationInsert = {
        project_id: data.project_id,
        user_id: user.id,
        title: data.title || 'New Conversation',
        context: data.context
      }

      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert([conversationData])
        .select()
        .single()

      if (error) throw error
      return conversation
    } catch (error) {
      errorLogger.logError((error as Error).message, {
        action: 'Create Conversation',
        metadata: { data }
      })
      throw error
    }
  }

  async getConversations(projectId: string): Promise<Conversation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return conversations || []
    } catch (error) {
      errorLogger.logError((error as Error).message, {
        action: 'Get Conversations',
        metadata: { projectId }
      })
      throw error
    }
  }

  async getConversationWithMessages(conversationId: string): Promise<ConversationWithMessages | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single()

      if (convError) throw convError
      if (!conversation) return null

      // Get messages
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgError) throw msgError

      return {
        ...conversation,
        messages: messages || []
      }
    } catch (error) {
      errorLogger.logError((error as Error).message, {
        action: 'Get Conversation With Messages',
        metadata: { conversationId }
      })
      throw error
    }
  }

  async updateConversation(id: string, updates: ConversationUpdate): Promise<Conversation> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: conversation, error } = await supabase
        .from('conversations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return conversation
    } catch (error) {
      errorLogger.logError((error as Error).message, {
        action: 'Update Conversation',
        metadata: { id, updates }
      })
      throw error
    }
  }

  async deleteConversation(id: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Delete messages first (due to foreign key constraint)
      const { error: msgError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', id)

      if (msgError) throw msgError

      // Delete conversation
      const { error: convError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (convError) throw convError
    } catch (error) {
      errorLogger.logError((error as Error).message, {
        action: 'Delete Conversation',
        metadata: { id }
      })
      throw error
    }
  }

  // Message CRUD operations
  async createMessage(data: CreateMessageData): Promise<Message> {
    try {
      const messageData: MessageInsert = {
        conversation_id: data.conversation_id,
        role: data.role,
        content: data.content,
        metadata: data.metadata || {}
      }

      const { data: message, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single()

      if (error) throw error

      // Update conversation timestamp
      await this.updateConversationTimestamp(data.conversation_id)

      return message
    } catch (error) {
      errorLogger.logError((error as Error).message, {
        action: 'Create Message',
        metadata: { data }
      })
      throw error
    }
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return messages || []
    } catch (error) {
      errorLogger.logError((error as Error).message, {
        action: 'Get Messages',
        metadata: { conversationId }
      })
      throw error
    }
  }

  async deleteMessage(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      errorLogger.logError((error as Error).message, {
        action: 'Delete Message',
        metadata: { id }
      })
      throw error
    }
  }

  // Helper methods
  private async updateConversationTimestamp(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      if (error) throw error
    } catch (error) {
      errorLogger.logError((error as Error).message, {
        action: 'Update Conversation Timestamp',
        metadata: { conversationId }
      })
      // Don't throw here as this is a helper operation
    }
  }

  // Real-time subscriptions
  subscribeToConversationMessages(
    conversationId: string,
    onMessage: (message: Message) => void
  ) {
    return supabase
      .channel(`messages:conversation_id=eq.${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          onMessage(payload.new as Message)
        }
      )
      .subscribe()
  }

  subscribeToProjectConversations(
    projectId: string,
    onConversationChange: (conversation: Conversation, event: 'INSERT' | 'UPDATE' | 'DELETE') => void
  ) {
    return supabase
      .channel(`conversations:project_id=eq.${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          onConversationChange(
            payload.new as Conversation,
            payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
          )
        }
      )
      .subscribe()
  }

  // Bulk operations
  async deleteAllConversationsForProject(projectId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get all conversation IDs for the project
      const { data: conversations, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)

      if (fetchError) throw fetchError

      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id)

        // Delete all messages for these conversations
        const { error: msgError } = await supabase
          .from('messages')
          .delete()
          .in('conversation_id', conversationIds)

        if (msgError) throw msgError

        // Delete all conversations
        const { error: convError } = await supabase
          .from('conversations')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', user.id)

        if (convError) throw convError
      }
    } catch (error) {
      errorLogger.logError((error as Error).message, {
        action: 'Delete All Conversations For Project',
        metadata: { projectId }
      })
      throw error
    }
  }
}

export const chatService = new ChatService()