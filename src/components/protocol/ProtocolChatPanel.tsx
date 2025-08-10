import React, { useEffect, useState } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  Plus, 
  Bot,
  Loader2,
  AlertTriangle,
  FileText,
  Lightbulb,
  Search,
  Filter,
  BookOpen,
  CheckCircle,
  Clock
} from 'lucide-react'
import { MessageList } from '../chat/MessageList'
import { MessageInput } from '../chat/MessageInput'
import { ConversationList } from '../chat/ConversationList'
import type { Protocol } from '@/types/database'

interface ProtocolChatPanelProps {
  projectId: string
  protocol?: Protocol
  currentStep?: string
  onSuggestedActionClick?: (action: string, data?: unknown) => void
  className?: string
}

interface ProtocolSuggestion {
  id: string
  title: string
  description: string
  action: string
  icon: React.ElementType
  urgent?: boolean
}

export const ProtocolChatPanel: React.FC<ProtocolChatPanelProps> = ({ 
  projectId, 
  protocol,
  currentStep,
  onSuggestedActionClick,
  className = ''
}) => {
  const {
    conversations,
    currentConversation,
    isLoading,
    isStreaming,
    error,
    loadConversations,
    createConversation,
    selectConversation,
    sendMessage,
    deleteConversation,
    clearError
  } = useChatStore()

  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  const [suggestions, setSuggestions] = useState<ProtocolSuggestion[]>([])

  useEffect(() => {
    if (projectId) {
      loadConversations(projectId)
    }
  }, [projectId, loadConversations])

  useEffect(() => {
    // Generate contextual suggestions based on protocol state
    if (protocol) {
      const newSuggestions = generateSuggestions(protocol)
      setSuggestions(newSuggestions)
    }
  }, [protocol, currentStep])

  const generateSuggestions = (protocol: Protocol): ProtocolSuggestion[] => {
    const suggestions: ProtocolSuggestion[] = []

    // Research question suggestions
    if (!protocol.research_question || protocol.research_question.trim() === '') {
      suggestions.push({
        id: 'rq-help',
        title: 'Need help with research question?',
        description: 'Get AI assistance to formulate a clear, focused research question',
        action: 'help_research_question',
        icon: Lightbulb,
        urgent: true
      })
    }

    // Framework suggestions
    if (protocol.research_question && protocol.framework_type === 'pico') {
      const picoFields = ['population', 'intervention', 'comparison', 'outcome']
      const missingFields = picoFields.filter(field => 
        !protocol[field as keyof Protocol] || String(protocol[field as keyof Protocol]).trim() === ''
      )
      
      if (missingFields.length > 0) {
        suggestions.push({
          id: 'pico-complete',
          title: `Complete PICO framework`,
          description: `Missing: ${missingFields.join(', ')}. Get AI help to define these components.`,
          action: 'complete_pico',
          icon: Filter
        })
      }
    }

    if (protocol.research_question && protocol.framework_type === 'spider') {
      const spiderFields = ['sample', 'phenomenon', 'design', 'evaluation', 'research_type']
      const missingFields = spiderFields.filter(field => 
        !protocol[field as keyof Protocol] || String(protocol[field as keyof Protocol]).trim() === ''
      )
      
      if (missingFields.length > 0) {
        suggestions.push({
          id: 'spider-complete',
          title: `Complete SPIDER framework`,
          description: `Missing: ${missingFields.join(', ')}. Get AI help to define these components.`,
          action: 'complete_spider',
          icon: Filter
        })
      }
    }

    // Criteria suggestions
    if (protocol.inclusion_criteria.length === 0) {
      suggestions.push({
        id: 'inclusion-help',
        title: 'Define inclusion criteria',
        description: 'Get suggestions for appropriate inclusion criteria based on your research question',
        action: 'suggest_inclusion',
        icon: CheckCircle
      })
    }

    if (protocol.exclusion_criteria.length === 0) {
      suggestions.push({
        id: 'exclusion-help',
        title: 'Define exclusion criteria',
        description: 'Get suggestions for appropriate exclusion criteria to refine your study selection',
        action: 'suggest_exclusion',
        icon: CheckCircle
      })
    }

    // Search strategy suggestions
    if (protocol.keywords.length === 0) {
      suggestions.push({
        id: 'keywords-help',
        title: 'Generate search keywords',
        description: 'AI can help identify relevant keywords and synonyms for your search strategy',
        action: 'suggest_keywords',
        icon: Search
      })
    }

    if (protocol.databases.length === 0) {
      suggestions.push({
        id: 'databases-help',
        title: 'Select appropriate databases',
        description: 'Get recommendations for databases most relevant to your research topic',
        action: 'suggest_databases',
        icon: BookOpen
      })
    }

    // Protocol completeness check
    const isComplete = protocol.research_question && 
                      (protocol.framework_type !== 'pico' || (protocol.population && protocol.intervention && protocol.comparison && protocol.outcome)) &&
                      (protocol.framework_type !== 'spider' || (protocol.sample && protocol.phenomenon && protocol.design && protocol.evaluation && protocol.research_type)) &&
                      protocol.inclusion_criteria.length > 0 &&
                      protocol.exclusion_criteria.length > 0 &&
                      protocol.keywords.length > 0 &&
                      protocol.databases.length > 0

    if (isComplete && protocol.status === 'draft') {
      suggestions.push({
        id: 'protocol-review',
        title: 'Protocol ready for review',
        description: 'Your protocol appears complete. Consider reviewing it before activation.',
        action: 'review_protocol',
        icon: FileText
      })
    }

    return suggestions.slice(0, 3) // Limit to 3 most relevant suggestions
  }

  const handleCreateConversation = async (title?: string) => {
    setIsCreatingConversation(true)
    try {
      const conversationTitle = title || (protocol 
        ? `${protocol.title} Discussion` 
        : 'New Protocol Discussion')
      const conversation = await createConversation(projectId, conversationTitle)
      await selectConversation(conversation.id)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    } finally {
      setIsCreatingConversation(false)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!currentConversation) {
      try {
        const conversation = await createConversation(
          projectId, 
          protocol ? `${protocol.title} Discussion` : 'Protocol Discussion'
        )
        await selectConversation(conversation.id)
        
        // Add protocol context to the message
        const contextualContent = protocol 
          ? `[Protocol: ${protocol.title}] ${content}`
          : content
          
        await sendMessage(contextualContent)
      } catch (error) {
        console.error('Failed to create conversation and send message:', error)
      }
    } else {
      await sendMessage(content)
    }
  }

  const handleSuggestionClick = (suggestion: ProtocolSuggestion) => {
    if (onSuggestedActionClick) {
      onSuggestedActionClick(suggestion.action, { protocol, suggestion })
    }

    // Also create a conversation with AI assistance for this topic
    const aiPrompts = {
      help_research_question: "I need help formulating a clear research question for my systematic review. Can you guide me through the process?",
      complete_pico: `I'm working on a PICO framework for my protocol "${protocol?.title}". My research question is: "${protocol?.research_question}". Can you help me complete the missing components?`,
      complete_spider: `I'm working on a SPIDER framework for my protocol "${protocol?.title}". My research question is: "${protocol?.research_question}". Can you help me complete the missing components?`,
      suggest_inclusion: `Based on my research question "${protocol?.research_question}" and my ${protocol?.framework_type?.toUpperCase()} framework, what inclusion criteria would you recommend?`,
      suggest_exclusion: `Based on my research question "${protocol?.research_question}" and my ${protocol?.framework_type?.toUpperCase()} framework, what exclusion criteria would you recommend?`,
      suggest_keywords: `I need help developing a comprehensive search strategy. My research question is: "${protocol?.research_question}". What keywords and synonyms should I consider?`,
      suggest_databases: `For my systematic review on "${protocol?.research_question}", which databases would be most appropriate to search?`,
      review_protocol: `Can you review my protocol for completeness and provide feedback? The research question is: "${protocol?.research_question}"`
    }

    const prompt = aiPrompts[suggestion.action as keyof typeof aiPrompts]
    if (prompt) {
      handleSendMessage(prompt)
    }
  }

  const isEmpty = conversations.length === 0 && !isLoading

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Protocol Assistant</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {conversations.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {conversations.length} chat{conversations.length !== 1 ? 's' : ''}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCreateConversation()}
              disabled={isCreatingConversation}
              className="h-8"
            >
              {isCreatingConversation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Protocol Context */}
        {protocol && (
          <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-gray-600" />
              <div className="font-medium text-sm truncate">{protocol.title}</div>
              <Badge variant={protocol.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                {protocol.status}
              </Badge>
            </div>
            {currentStep && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="w-3 h-3" />
                <span>Current step: {currentStep.replace('-', ' ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Suggestions:</div>
            <div className="space-y-2">
              {suggestions.map(suggestion => {
                const IconComponent = suggestion.icon
                return (
                  <Button
                    key={suggestion.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full justify-start h-auto p-2 ${
                      suggestion.urgent ? 'border-orange-200 bg-orange-50 hover:bg-orange-100' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2 text-left">
                      <IconComponent className={`w-4 h-4 mt-0.5 ${
                        suggestion.urgent ? 'text-orange-600' : 'text-gray-600'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-xs">{suggestion.title}</div>
                        <div className="text-xs text-gray-600 mt-0.5">{suggestion.description}</div>
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-2 rounded flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearError}
              className="ml-auto h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 p-4 pt-0">
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">
                {protocol 
                  ? `Discuss ${protocol.title}` 
                  : 'Start Protocol Discussion'
                }
              </h3>
              <p className="text-sm text-muted-foreground max-w-[250px]">
                Get AI assistance with your research protocol. Ask about methodology, 
                framework completion, search strategies, or get suggestions for improvement.
              </p>
            </div>
            <Button 
              onClick={() => handleCreateConversation()}
              disabled={isCreatingConversation}
              className="mt-4"
            >
              {isCreatingConversation ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {/* Conversation List */}
            {conversations.length > 1 && (
              <div className="mb-3">
                <ConversationList
                  conversations={conversations}
                  currentConversationId={currentConversation?.id}
                  onSelectConversation={selectConversation}
                  onDeleteConversation={deleteConversation}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 min-h-0">
              {currentConversation ? (
                <MessageList
                  conversation={currentConversation}
                  isStreaming={isStreaming}
                  className="h-full"
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Select a conversation to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t pt-3">
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={isStreaming}
                placeholder={
                  currentConversation 
                    ? isStreaming 
                      ? "AI is responding..." 
                      : protocol
                        ? `Ask about ${protocol.title} protocol...`
                        : "Ask about protocol development, methodology, search strategies..."
                    : "Select a conversation or create a new one"
                }
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ProtocolChatPanel