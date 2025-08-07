import { errorLogger } from '@/lib/error-logger'
import type { Database } from '@/types/database'

type Protocol = Database['public']['Tables']['protocols']['Row']

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

export interface OpenAIResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

class OpenAIService {
  private apiKey: string
  private baseUrl = 'https://api.openai.com/v1'

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured')
    }
  }

  async createChatCompletion(
    messages: ChatMessage[],
    options: {
      model?: string
      temperature?: number
      maxTokens?: number
      stream?: boolean
    } = {}
  ): Promise<OpenAIResponse> {
    const {
      model = 'gpt-4',
      temperature = 0.7,
      maxTokens = 1000,
      stream = false
    } = options

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature,
          max_tokens: maxTokens,
          stream,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      
      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage
      }
    } catch (error) {
      errorLogger.logError((error as Error).message, {
        action: 'OpenAI Chat Completion',
        metadata: {
          messages: messages.length,
          model,
          temperature,
          maxTokens
        }
      })
      throw error
    }
  }

  async createStreamingChatCompletion(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    options: {
      model?: string
      temperature?: number
      maxTokens?: number
    } = {}
  ): Promise<void> {
    const {
      model = 'gpt-4',
      temperature = 0.7,
      maxTokens = 1000
    } = options

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()
      let buffer = ''

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
            if (data === '[DONE]') return

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
    } catch (error) {
      errorLogger.logError((error as Error).message, {
        action: 'OpenAI Streaming Chat Completion',
        metadata: {
          messages: messages.length,
          model,
          temperature,
          maxTokens
        }
      })
      throw error
    }
  }

  // Specialized method for research protocol guidance
  async getProtocolGuidance(
    researchQuestion: string,
    currentProtocol?: Protocol,
    options: {
      focusArea?: 'pico' | 'spider' | 'inclusion' | 'exclusion' | 'search_strategy'
    } = {}
  ): Promise<OpenAIResponse> {
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

    return this.createChatCompletion(messages, {
      model: 'gpt-4',
      temperature: 0.3, // Lower temperature for more consistent protocol guidance
      maxTokens: 1500
    })
  }

  // Method for general research assistance
  async getResearchAssistance(
    query: string,
    context?: {
      projectTitle?: string
      currentStage?: string
      relevantDocuments?: string[]
    }
  ): Promise<OpenAIResponse> {
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

    return this.createChatCompletion(messages, {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1200
    })
  }
}

export const openAIService = new OpenAIService()