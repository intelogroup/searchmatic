import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { chatService, type ConversationWithMessages } from '@/services/chatService'
import { openAIService, type ChatMessage } from '@/services/openai'
import { errorLogger } from '@/lib/error-logger'
import type { Database } from '@/types/database'

type Conversation = Database['public']['Tables']['conversations']['Row']

interface ChatState {
  // Current state
  conversations: Conversation[]
  currentConversation: ConversationWithMessages | null
  isLoading: boolean
  isStreaming: boolean
  error: string | null

  // Actions
  loadConversations: (projectId: string) => Promise<void>
  createConversation: (projectId: string, title?: string) => Promise<Conversation>
  selectConversation: (conversationId: string) => Promise<void>
  sendMessage: (content: string, options?: { useStreaming?: boolean }) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>
  clearError: () => void
  reset: () => void
}

export const useChatStore = create<ChatState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    conversations: [],
    currentConversation: null,
    isLoading: false,
    isStreaming: false,
    error: null,

    // Actions
    loadConversations: async (projectId: string) => {
      set({ isLoading: true, error: null })
      try {
        const conversations = await chatService.getConversations(projectId)
        set({ conversations, isLoading: false })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load conversations'
        set({ error: message, isLoading: false })
        errorLogger.logError((error as Error).message, { action: 'Load Conversations', metadata: { projectId } })
      }
    },

    createConversation: async (projectId: string, title?: string) => {
      set({ isLoading: true, error: null })
      try {
        const conversation = await chatService.createConversation({
          project_id: projectId,
          title: title || 'New Conversation'
        })
        
        const conversations = [conversation, ...get().conversations]
        set({ conversations, isLoading: false })
        
        return conversation
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create conversation'
        set({ error: message, isLoading: false })
        errorLogger.logError((error as Error).message, { action: 'Create Conversation', metadata: { projectId, title } })
        throw error
      }
    },

    selectConversation: async (conversationId: string) => {
      set({ isLoading: true, error: null })
      try {
        const conversation = await chatService.getConversationWithMessages(conversationId)
        set({ currentConversation: conversation, isLoading: false })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load conversation'
        set({ error: message, isLoading: false })
        errorLogger.logError((error as Error).message, { action: 'Select Conversation', metadata: { conversationId } })
      }
    },

    sendMessage: async (content: string, options = {}) => {
      const { currentConversation } = get()
      if (!currentConversation) {
        set({ error: 'No conversation selected' })
        return
      }

      const { useStreaming = true } = options
      set({ isStreaming: useStreaming, error: null })

      try {
        // Create user message
        const userMessage = await chatService.createMessage({
          conversation_id: currentConversation.id,
          role: 'user',
          content,
          metadata: { timestamp: new Date().toISOString() }
        })

        // Update current conversation with user message
        const updatedConversation: ConversationWithMessages = {
          ...currentConversation,
          messages: [...currentConversation.messages, userMessage]
        }
        set({ currentConversation: updatedConversation })

        // Prepare conversation history for AI
        const conversationHistory: ChatMessage[] = updatedConversation.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
          timestamp: new Date(msg.created_at)
        }))

        if (useStreaming) {
          // Create placeholder assistant message for streaming
          let assistantContent = ''
          const assistantMessage = await chatService.createMessage({
            conversation_id: currentConversation.id,
            role: 'assistant',
            content: '',
            metadata: { 
              timestamp: new Date().toISOString(),
              streaming: true 
            }
          })

          // Update conversation with placeholder message
          const conversationWithPlaceholder: ConversationWithMessages = {
            ...updatedConversation,
            messages: [...updatedConversation.messages, assistantMessage]
          }
          set({ currentConversation: conversationWithPlaceholder })

          // Stream AI response
          await openAIService.createStreamingChatCompletion(
            conversationHistory,
            (chunk: string) => {
              assistantContent += chunk
              const { currentConversation: current } = get()
              if (current) {
                const updatedMessages = current.messages.map(msg =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: assistantContent }
                    : msg
                )
                set({
                  currentConversation: {
                    ...current,
                    messages: updatedMessages
                  }
                })
              }
            },
            {
              model: 'gpt-4',
              temperature: 0.7,
              maxTokens: 1000
            }
          )

          // Update the message in the database with final content
          await chatService.deleteMessage(assistantMessage.id)
          const finalAssistantMessage = await chatService.createMessage({
            conversation_id: currentConversation.id,
            role: 'assistant',
            content: assistantContent,
            metadata: { 
              timestamp: new Date().toISOString(),
              streaming: false,
              final: true
            }
          })

          // Update conversation with final message
          const { currentConversation: current } = get()
          if (current) {
            const updatedMessages = current.messages.map(msg =>
              msg.id === assistantMessage.id ? finalAssistantMessage : msg
            )
            set({
              currentConversation: {
                ...current,
                messages: updatedMessages
              }
            })
          }

        } else {
          // Non-streaming response
          const aiResponse = await openAIService.createChatCompletion(
            conversationHistory,
            {
              model: 'gpt-4',
              temperature: 0.7,
              maxTokens: 1000
            }
          )

          // Create assistant message
          const assistantMessage = await chatService.createMessage({
            conversation_id: currentConversation.id,
            role: 'assistant',
            content: aiResponse.content,
            metadata: { 
              timestamp: new Date().toISOString(),
              usage: aiResponse.usage
            }
          })

          // Update conversation with assistant message
          const finalConversation: ConversationWithMessages = {
            ...updatedConversation,
            messages: [...updatedConversation.messages, assistantMessage]
          }
          set({ currentConversation: finalConversation })
        }

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to send message'
        set({ error: message })
        errorLogger.logError((error as Error).message, { 
          action: 'Send Message',
          metadata: {
            conversationId: currentConversation.id,
            content: content.substring(0, 100),
            useStreaming
          }
        })
      } finally {
        set({ isStreaming: false })
      }
    },

    deleteConversation: async (conversationId: string) => {
      set({ isLoading: true, error: null })
      try {
        await chatService.deleteConversation(conversationId)
        
        const conversations = get().conversations.filter(c => c.id !== conversationId)
        const currentConversation = get().currentConversation?.id === conversationId 
          ? null 
          : get().currentConversation

        set({ conversations, currentConversation, isLoading: false })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete conversation'
        set({ error: message, isLoading: false })
        errorLogger.logError((error as Error).message, { action: 'Delete Conversation', metadata: { conversationId } })
      }
    },

    deleteMessage: async (messageId: string) => {
      set({ error: null })
      try {
        await chatService.deleteMessage(messageId)
        
        const { currentConversation } = get()
        if (currentConversation) {
          const updatedMessages = currentConversation.messages.filter(m => m.id !== messageId)
          set({
            currentConversation: {
              ...currentConversation,
              messages: updatedMessages
            }
          })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete message'
        set({ error: message })
        errorLogger.logError((error as Error).message, { action: 'Delete Message', metadata: { messageId } })
      }
    },

    updateConversationTitle: async (conversationId: string, title: string) => {
      set({ error: null })
      try {
        await chatService.updateConversation(conversationId, { title })
        
        const conversations = get().conversations.map(c =>
          c.id === conversationId ? { ...c, title } : c
        )
        
        const { currentConversation } = get()
        const updatedCurrentConversation = currentConversation?.id === conversationId
          ? { ...currentConversation, title }
          : currentConversation

        set({ conversations, currentConversation: updatedCurrentConversation })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update conversation title'
        set({ error: message })
        errorLogger.logError((error as Error).message, { action: 'Update Conversation Title', metadata: { conversationId, title } })
      }
    },

    clearError: () => set({ error: null }),

    reset: () => set({
      conversations: [],
      currentConversation: null,
      isLoading: false,
      isStreaming: false,
      error: null
    })
  }))
)

// Auto-generate conversation titles based on first message
useChatStore.subscribe(
  (state) => state.currentConversation,
  (currentConversation, previousConversation) => {
    if (
      currentConversation &&
      previousConversation?.id !== currentConversation.id &&
      currentConversation.messages.length > 0 &&
      currentConversation.title === 'New Conversation'
    ) {
      const firstUserMessage = currentConversation.messages.find(m => m.role === 'user')
      if (firstUserMessage) {
        const title = firstUserMessage.content.length > 50
          ? firstUserMessage.content.substring(0, 47) + '...'
          : firstUserMessage.content
        
        useChatStore.getState().updateConversationTitle(currentConversation.id, title)
      }
    }
  }
)