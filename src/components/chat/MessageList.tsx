import React, { useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Bot, 
  Trash2, 
  Copy,
  MoreHorizontal,
  Loader2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useChatStore } from '@/stores/chatStore'
import type { ConversationWithMessages } from '@/services/chatService'
import { cn } from '@/lib/utils'

interface MessageListProps {
  conversation: ConversationWithMessages
  isStreaming?: boolean
  className?: string
}

interface MessageItemProps {
  message: {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    created_at: string
    metadata?: any
  }
  onDelete: (messageId: string) => void
  isStreaming?: boolean
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onDelete, isStreaming }) => {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const isSystem = message.role === 'system'

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <Badge variant="outline" className="text-xs">
          {message.content}
        </Badge>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex gap-3 p-4 group hover:bg-muted/30 transition-colors",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex-1 min-w-0",
        isUser ? "text-right" : "text-left"
      )}>
        <div className={cn(
          "inline-block max-w-[85%] p-3 rounded-lg text-sm",
          isUser 
            ? "bg-primary text-primary-foreground ml-auto" 
            : "bg-muted text-foreground"
        )}>
          <div className="whitespace-pre-wrap break-words">
            {message.content}
            {isStreaming && isAssistant && (
              <span className="inline-flex items-center ml-1">
                <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
              </span>
            )}
          </div>
        </div>

        {/* Message Footer */}
        <div className={cn(
          "flex items-center gap-2 mt-1 text-xs text-muted-foreground",
          isUser ? "justify-end" : "justify-start"
        )}>
          <span>{formatTime(message.created_at)}</span>
          
          {/* Message Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isUser ? "end" : "start"}>
                <DropdownMenuItem onClick={copyToClipboard}>
                  <Copy className="h-3 w-3 mr-2" />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(message.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}

export const MessageList: React.FC<MessageListProps> = ({ 
  conversation, 
  isStreaming = false,
  className 
}) => {
  const { deleteMessage } = useChatStore()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation.messages, isStreaming])

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      await deleteMessage(messageId)
    }
  }

  if (conversation.messages.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center space-y-2">
          <Bot className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Start a conversation by sending a message
          </p>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            Ask about research methodology, search strategies, or any questions about your systematic review.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className={cn("h-full", className)} ref={scrollAreaRef}>
      <div className="space-y-1">
        {conversation.messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onDelete={handleDeleteMessage}
            isStreaming={isStreaming && message === conversation.messages[conversation.messages.length - 1]}
          />
        ))}
        
        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex gap-3 p-4">
            <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="inline-block bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI is thinking...
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}

export default MessageList