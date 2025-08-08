import React from 'react'
import { Button } from '@/components/ui/button'
import { Bot } from 'lucide-react'

interface ProtocolAIAssistantProps {
  aiSuggestion: string | null
  onDismiss: () => void
}

export const ProtocolAIAssistant: React.FC<ProtocolAIAssistantProps> = ({
  aiSuggestion,
  onDismiss
}) => {
  if (!aiSuggestion) return null

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-base flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        AI Suggestion
      </h3>
      <div className="bg-muted/50 p-4 rounded-lg border">
        <pre className="whitespace-pre-wrap text-sm">{aiSuggestion}</pre>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onDismiss}
      >
        Dismiss
      </Button>
    </div>
  )
}