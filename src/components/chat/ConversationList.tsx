import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageCircle, 
  Trash2, 
  Edit2,
  MoreHorizontal,
  Calendar,
  Clock
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Conversation = Database['public']['Tables']['conversations']['Row']

interface ConversationListProps {
  conversations: Conversation[]
  currentConversationId?: string
  onSelectConversation: (conversationId: string) => void
  onDeleteConversation: (conversationId: string) => void
  isLoading?: boolean
  className?: string
}

interface ConversationItemProps {
  conversation: Conversation
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onSelect,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(conversation.title || 'Untitled')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    // TODO: Implement title update
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditTitle(conversation.title || 'Untitled')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      onDelete()
    }
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
        isSelected && "bg-muted border border-border"
      )}
      onClick={!isEditing ? onSelect : undefined}
    >
      {/* Conversation Icon */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        <MessageCircle className="h-4 w-4" />
      </div>

      {/* Conversation Details */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-b border-border text-sm font-medium focus:outline-none focus:border-primary"
            autoFocus
          />
        ) : (
          <div className="font-medium text-sm truncate">
            {conversation.title || 'Untitled Conversation'}
          </div>
        )}
        
        <div className="flex items-center gap-2 mt-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {formatDate(conversation.updated_at)}
          </span>
          
          {conversation.context && (
            <Badge variant="secondary" className="text-xs h-4 px-1">
              Context
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  isLoading = false,
  className
}) => {
  // Group conversations by date
  const groupedConversations = React.useMemo(() => {
    const groups: { [key: string]: Conversation[] } = {}
    
    conversations.forEach(conversation => {
      const date = new Date(conversation.updated_at)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      let groupKey: string
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today'
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday'
      } else if (date.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
        groupKey = 'This Week'
      } else {
        groupKey = date.toLocaleDateString([], { month: 'long', year: 'numeric' })
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(conversation)
    })
    
    return groups
  }, [conversations])

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className={cn("text-center py-6", className)}>
        <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No conversations yet</p>
      </div>
    )
  }

  return (
    <ScrollArea className={cn("max-h-[300px]", className)}>
      <div className="space-y-4">
        {Object.entries(groupedConversations).map(([groupKey, groupConversations]) => (
          <div key={groupKey}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {groupKey}
              </h4>
            </div>
            
            <div className="space-y-1">
              {groupConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={conversation.id === currentConversationId}
                  onSelect={() => onSelectConversation(conversation.id)}
                  onDelete={() => onDeleteConversation(conversation.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

export default ConversationList