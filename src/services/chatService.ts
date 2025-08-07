import { baseSupabaseClient as supabase } from '@/lib/supabase'
import type { Database, Json } from '@/types/database'
import { BaseService } from '@/lib/service-wrapper'
import { type AuthenticatedUser } from '@/lib/auth-utils'

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
  metadata?: Json
}

class ChatService extends BaseService {
  constructor() {
    super('chat')
  }
  // Conversation CRUD operations
  async createConversation(data: CreateConversationData): Promise<Conversation> {
    return this.executeAuthenticatedSupabase(
      'create-conversation',
      async (user: AuthenticatedUser) => {
        const conversationData: ConversationInsert = {
          project_id: data.project_id,
          user_id: user.id,
          title: data.title || 'New Conversation',
          context: data.context
        }

        return supabase
          .from('conversations')
          .insert([conversationData])
          .select()
          .single()
      },
      'conversations',
      { data }
    )
  }

  async getConversations(projectId: string): Promise<Conversation[]> {
    return this.executeAuthenticatedSupabase(
      'get-conversations',
      async (user: AuthenticatedUser) => {
        return supabase
          .from('conversations')
          .select('*')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
      },
      'conversations',
      { projectId }
    ).then(data => data || [])
  }

  async getConversationWithMessages(conversationId: string): Promise<ConversationWithMessages | null> {
    return this.executeAuthenticated(
      'get-conversation-with-messages',
      async (user: AuthenticatedUser) => {
        // Get conversation
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('user_id', user.id)
          .single()

        if (convError) {
          if (convError.code === 'PGRST116') return null // Not found
          throw convError
        }
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
      },
      { conversationId }
    )
  }

  async updateConversation(id: string, updates: ConversationUpdate): Promise<Conversation> {
    return this.executeAuthenticatedSupabase(
      'update-conversation',
      async (user: AuthenticatedUser) => {
        return supabase
          .from('conversations')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single()
      },
      'conversations',
      { id, updates }
    )
  }

  async deleteConversation(id: string): Promise<void> {
    await this.executeAuthenticated(
      'delete-conversation',
      async (user: AuthenticatedUser) => {
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
      },
      { id }
    )
  }

  // Message CRUD operations
  async createMessage(data: CreateMessageData): Promise<Message> {
    return this.executeSupabase(
      'create-message',
      async () => {
        const messageData: MessageInsert = {
          conversation_id: data.conversation_id,
          role: data.role,
          content: data.content,
          metadata: data.metadata || {}
        }

        const result = await supabase
          .from('messages')
          .insert([messageData])
          .select()
          .single()

        if (result.error) throw result.error
        const message = result.data

        // Update conversation timestamp
        await this.updateConversationTimestamp(data.conversation_id)

        return { data: message, error: null }
      },
      'messages',
      { data }
    )
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return this.executeSupabase(
      'get-messages',
      async () => {
        return supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
      },
      'messages',
      { conversationId }
    ).then(data => data || [])
  }

  async deleteMessage(id: string): Promise<void> {
    await this.execute(
      'delete-message',
      async () => {
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', id)

        if (error) throw error
      },
      { id }
    )
  }

  // Helper methods
  private async updateConversationTimestamp(conversationId: string): Promise<void> {
    try {
      await this.execute(
        'update-conversation-timestamp',
        async () => {
          const { error } = await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId)

          if (error) throw error
        },
        { conversationId }
      )
    } catch (error) {
      // Don't throw here as this is a helper operation
      console.warn('Failed to update conversation timestamp:', error)
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
    await this.executeAuthenticated(
      'delete-all-conversations-for-project',
      async (user: AuthenticatedUser) => {
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
      },
      { projectId }
    )
  }
}

export const chatService = new ChatService()