import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  FileText, 
  Lock,
  Unlock,
  Trash2,
  Bot,
  Edit2,
  CheckCircle,
  Clock,
  MoreHorizontal
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

type Protocol = Database['public']['Tables']['protocols']['Row']

interface ProtocolListProps {
  protocols: Protocol[]
  selectedProtocolId?: string
  onSelectProtocol: (protocolId: string) => void
  onDeleteProtocol: (protocolId: string) => void
  onLockProtocol: (protocolId: string) => void
  onUnlockProtocol: (protocolId: string) => void
  isLoading?: boolean
  className?: string
}

interface ProtocolItemProps {
  protocol: Protocol
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onLock: () => void
  onUnlock: () => void
}

const ProtocolItem: React.FC<ProtocolItemProps> = ({
  protocol,
  isSelected,
  onSelect,
  onDelete,
  onLock,
  onUnlock
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />
      case 'draft': return <Edit2 className="h-3 w-3" />
      case 'completed': return <CheckCircle className="h-3 w-3" />
      case 'archived': return <Clock className="h-3 w-3" />
      default: return <FileText className="h-3 w-3" />
    }
  }

  const getFrameworkBadge = (framework: string) => {
    switch (framework) {
      case 'pico': return { label: 'PICO', color: 'bg-blue-100 text-blue-800' }
      case 'spider': return { label: 'SPIDER', color: 'bg-purple-100 text-purple-800' }
      default: return { label: 'OTHER', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const frameworkBadge = getFrameworkBadge(protocol.framework_type)

  return (
    <div
      className={cn(
        "group p-4 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50 border",
        isSelected ? "bg-muted border-primary shadow-sm" : "border-transparent hover:border-border"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Protocol Icon */}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          <FileText className="h-4 w-4" />
        </div>

        {/* Protocol Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-sm truncate pr-2">
              {protocol.title}
            </h3>
            
            {/* Actions */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {protocol.is_locked ? (
                    <DropdownMenuItem onClick={onUnlock}>
                      <Unlock className="h-4 w-4 mr-2" />
                      Unlock
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={onLock}>
                      <Lock className="h-4 w-4 mr-2" />
                      Lock
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={onDelete}
                    className="text-destructive"
                    disabled={protocol.is_locked}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Research Question Preview */}
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {protocol.research_question}
          </p>

          {/* Badges */}
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant="outline" 
              className={cn("text-xs h-5", getStatusColor(protocol.status))}
            >
              {getStatusIcon(protocol.status)}
              <span className="ml-1 capitalize">{protocol.status}</span>
            </Badge>

            <Badge 
              variant="outline" 
              className={cn("text-xs h-5", frameworkBadge.color)}
            >
              {frameworkBadge.label}
            </Badge>

            {protocol.is_locked && (
              <Badge variant="outline" className="text-xs h-5 bg-red-100 text-red-800">
                <Lock className="h-3 w-3 mr-1" />
                Locked
              </Badge>
            )}

            {protocol.ai_generated && (
              <Badge variant="outline" className="text-xs h-5 bg-indigo-100 text-indigo-800">
                <Bot className="h-3 w-3 mr-1" />
                AI
              </Badge>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Version {protocol.version}</span>
            <span>{formatDate(protocol.updated_at)}</span>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                protocol.inclusion_criteria?.length > 0 ? "bg-green-500" : "bg-gray-300"
              )} />
              <span>Inclusion</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                protocol.exclusion_criteria?.length > 0 ? "bg-green-500" : "bg-gray-300"
              )} />
              <span>Exclusion</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                protocol.keywords?.length > 0 ? "bg-green-500" : "bg-gray-300"
              )} />
              <span>Keywords</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const ProtocolList: React.FC<ProtocolListProps> = ({
  protocols,
  selectedProtocolId,
  onSelectProtocol,
  onDeleteProtocol,
  onLockProtocol,
  onUnlockProtocol,
  isLoading = false,
  className
}) => {
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-muted rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="flex gap-2">
                  <div className="h-5 bg-muted rounded w-16" />
                  <div className="h-5 bg-muted rounded w-12" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (protocols.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No protocols found</p>
      </div>
    )
  }

  // Group protocols by status
  const groupedProtocols = protocols.reduce((groups, protocol) => {
    const status = protocol.status
    if (!groups[status]) {
      groups[status] = []
    }
    groups[status].push(protocol)
    return groups
  }, {} as Record<string, Protocol[]>)

  const statusOrder = ['active', 'draft', 'completed', 'archived']

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-4">
        {statusOrder.map(status => {
          const statusProtocols = groupedProtocols[status]
          if (!statusProtocols || statusProtocols.length === 0) return null

          return (
            <div key={status}>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
                {status} ({statusProtocols.length})
              </h4>
              <div className="space-y-2">
                {statusProtocols.map((protocol) => (
                  <ProtocolItem
                    key={protocol.id}
                    protocol={protocol}
                    isSelected={protocol.id === selectedProtocolId}
                    onSelect={() => onSelectProtocol(protocol.id)}
                    onDelete={() => onDeleteProtocol(protocol.id)}
                    onLock={() => onLockProtocol(protocol.id)}
                    onUnlock={() => onUnlockProtocol(protocol.id)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

export default ProtocolList