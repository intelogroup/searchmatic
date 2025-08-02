import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Send, 
  Loader2,
  Paperclip,
  Mic,
  Square,
  RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>
  disabled?: boolean
  placeholder?: string
  className?: string
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  className
}) => {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || disabled || isSending) return

    const messageToSend = message.trim()
    setMessage('')
    setIsSending(true)

    try {
      await onSendMessage(messageToSend)
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessage(messageToSend) // Restore message on error
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line on Shift+Enter
        return
      } else {
        // Send on Enter
        e.preventDefault()
        handleSubmit(e)
      }
    }
  }

  const handleVoiceRecording = () => {
    // Voice recording functionality could be implemented here
    // For now, just toggle the recording state
    setIsRecording(!isRecording)
  }

  const clearMessage = () => {
    setMessage('')
  }

  const quickMessages = [
    "Help me develop a PICO framework",
    "What databases should I search?",
    "How do I create inclusion criteria?",
    "Explain systematic review methodology"
  ]

  const insertQuickMessage = (quickMessage: string) => {
    setMessage(quickMessage)
    textareaRef.current?.focus()
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Quick Message Suggestions */}
      {message === '' && (
        <div className="flex flex-wrap gap-1">
          {quickMessages.map((quickMsg, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => insertQuickMessage(quickMsg)}
              disabled={disabled}
              className="text-xs h-7 px-2"
            >
              {quickMsg}
            </Button>
          ))}
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[44px] max-h-[120px] resize-none pr-20"
            rows={1}
          />
          
          {/* Input Actions */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {message && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearMessage}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
            
            {/* Voice Recording Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleVoiceRecording}
              disabled={disabled}
              className={cn(
                "h-6 w-6 p-0",
                isRecording 
                  ? "text-red-500 hover:text-red-600" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isRecording ? (
                <Square className="h-3 w-3" />
              ) : (
                <Mic className="h-3 w-3" />
              )}
            </Button>

            {/* Attachment Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <Paperclip className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          disabled={!message.trim() || disabled || isSending}
          className="h-auto px-3"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Character Count */}
      {message.length > 500 && (
        <div className="text-xs text-muted-foreground text-right">
          {message.length}/1000 characters
        </div>
      )}

      {/* Voice Recording Indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Recording... (tap to stop)
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  )
}

export default MessageInput