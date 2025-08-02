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
  AlertTriangle
} from 'lucide-react'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { ConversationList } from './ConversationList'

interface ChatPanelProps {
  projectId: string
  className?: string
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  projectId, 
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

  useEffect(() => {
    if (projectId) {
      loadConversations(projectId)
    }
  }, [projectId, loadConversations])

  const handleCreateConversation = async () => {
    setIsCreatingConversation(true)
    try {
      const conversation = await createConversation(projectId, 'New Research Chat')
      await selectConversation(conversation.id)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    } finally {
      setIsCreatingConversation(false)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!currentConversation) {
      // Auto-create conversation if none exists
      try {
        const conversation = await createConversation(projectId, 'Research Discussion')
        await selectConversation(conversation.id)
        await sendMessage(content)
      } catch (error) {
        console.error('Failed to create conversation and send message:', error)
      }
    } else {
      await sendMessage(content)
    }
  }

  const isEmpty = conversations.length === 0 && !isLoading

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Research Assistant</CardTitle>
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
              onClick={handleCreateConversation}
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
              <h3 className="font-medium">Start a Research Discussion</h3>
              <p className="text-sm text-muted-foreground max-w-[250px]">
                Get AI assistance with your systematic review methodology, search strategies, 
                and research questions.
              </p>
            </div>
            <Button 
              onClick={handleCreateConversation}
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
                      : "Ask about research methodology, search strategies..."
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

export default ChatPanel