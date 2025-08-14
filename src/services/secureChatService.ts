import { baseSupabaseClient as supabase } from '@/lib/supabase'
import { BaseService } from '@/lib/service-wrapper'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatCompletionOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

interface ChatCompletionResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
  timestamp: string
}

class SecureChatService extends BaseService {
  constructor() {
    super('secure-chat')
  }

  /**
   * Send chat completion request to secure edge function
   * @param conversationId - ID of the conversation
   * @param messages - Array of chat messages
   * @param options - OpenAI options
   */
  async createChatCompletion(
    conversationId: string,
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResponse> {
    return this.executeAuthenticated(
      'create-chat-completion',
      async () => {
        const session = await supabase.auth.getSession()
        if (!session.data.session?.access_token) {
          throw new Error('No valid session token')
        }

        const response = await fetch('/functions/v1/chat-completion', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
            'Content-Type': 'application/json',
            'x-client-info': 'supabase-js-web'
          },
          body: JSON.stringify({
            conversationId,
            messages,
            options: {
              model: 'gpt-4',
              temperature: 0.7,
              maxTokens: 1000,
              stream: false,
              ...options
            }
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.error || 
            `Chat completion failed: ${response.status} ${response.statusText}`
          )
        }

        const data = await response.json()
        return data
      },
      { conversationId, messages: messages.length, options }
    )
  }

  /**
   * Create streaming chat completion using secure edge function
   * @param conversationId - ID of the conversation
   * @param messages - Array of chat messages
   * @param onChunk - Callback for each chunk received
   * @param options - OpenAI options
   */
  async createStreamingChatCompletion(
    conversationId: string,
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    options: ChatCompletionOptions = {}
  ): Promise<void> {
    return this.executeAuthenticated(
      'create-streaming-chat-completion',
      async () => {
        const session = await supabase.auth.getSession()
        if (!session.data.session?.access_token) {
          throw new Error('No valid session token')
        }

        const response = await fetch('/functions/v1/chat-completion', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
            'Content-Type': 'application/json',
            'x-client-info': 'supabase-js-web'
          },
          body: JSON.stringify({
            conversationId,
            messages,
            options: {
              model: 'gpt-4',
              temperature: 0.7,
              maxTokens: 1000,
              stream: true,
              ...options
            }
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.error || 
            `Streaming chat completion failed: ${response.status} ${response.statusText}`
          )
        }

        // Handle Server-Sent Events stream
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('Failed to get response reader')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (trimmed.startsWith('data: ')) {
                const data = trimmed.slice(6)
                if (data === '[DONE]') {
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices[0]?.delta?.content
                  if (content) {
                    onChunk(content)
                  }
                } catch {
                  // Ignore parse errors for malformed chunks
                  console.warn('Failed to parse SSE chunk:', data)
                }
              }
            }
          }
        } finally {
          reader.releaseLock()
        }
      },
      { conversationId, messages: messages.length, options }
    )
  }

  /**
   * Get protocol guidance using secure edge function (research-specific)
   * @param conversationId - ID of the conversation
   * @param researchQuestion - The research question
   * @param currentProtocol - Current protocol data (optional)
   * @param focusArea - Specific area to focus on
   */
  async getProtocolGuidance(
    conversationId: string,
    researchQuestion: string,
    currentProtocol?: Record<string, unknown>,
    options: {
      focusArea?: 'pico' | 'spider' | 'inclusion' | 'exclusion' | 'search_strategy'
    } = {}
  ): Promise<ChatCompletionResponse> {
    const systemPrompt = `You are a research methodology expert specializing in systematic literature reviews. 
Help researchers create comprehensive research protocols including PICO/SPIDER frameworks, inclusion/exclusion criteria, and search strategies.

Provide specific, actionable guidance that follows established systematic review guidelines (PRISMA, Cochrane).
Be thorough but concise, and always explain the rationale behind recommendations.`

    let userPrompt = `Research Question: "${researchQuestion}"`
    
    if (currentProtocol) {
      userPrompt += `\n\nCurrent Protocol:\n${JSON.stringify(currentProtocol, null, 2)}`
    }

    if (options.focusArea) {
      const focusDescriptions = {
        pico: 'Help me develop the PICO framework (Population, Intervention, Comparison, Outcome)',
        spider: 'Help me develop the SPIDER framework (Sample, Phenomenon of Interest, Design, Evaluation, Research type)',
        inclusion: 'Help me define clear inclusion criteria',
        exclusion: 'Help me define clear exclusion criteria',
        search_strategy: 'Help me develop an effective search strategy including keywords and databases'
      }
      userPrompt += `\n\nSpecific guidance needed: ${focusDescriptions[options.focusArea]}`
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    return this.createChatCompletion(conversationId, messages, {
      model: 'gpt-4',
      temperature: 0.3, // Lower temperature for more consistent protocol guidance
      maxTokens: 1500
    })
  }

  /**
   * Get research assistance using secure edge function
   * @param conversationId - ID of the conversation
   * @param query - The research query
   * @param context - Additional context
   */
  async getResearchAssistance(
    conversationId: string,
    query: string,
    context?: {
      projectTitle?: string
      currentStage?: string
      relevantDocuments?: string[]
    }
  ): Promise<ChatCompletionResponse> {
    const systemPrompt = `You are an AI research assistant specializing in systematic literature reviews and evidence synthesis. 
You help researchers with methodology, analysis, and best practices.

Provide accurate, evidence-based guidance while being helpful and encouraging.
When discussing methodology, reference relevant guidelines (PRISMA, Cochrane, JBI) when appropriate.`

    let userPrompt = query

    if (context?.projectTitle) {
      userPrompt = `Project: "${context.projectTitle}"\n\n${userPrompt}`
    }

    if (context?.currentStage) {
      userPrompt += `\n\nCurrent stage: ${context.currentStage}`
    }

    if (context?.relevantDocuments?.length) {
      userPrompt += `\n\nRelevant documents: ${context.relevantDocuments.join(', ')}`
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    return this.createChatCompletion(conversationId, messages, {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1200
    })
  }
}

export const secureChatService = new SecureChatService()
export type { ChatMessage, ChatCompletionOptions, ChatCompletionResponse }