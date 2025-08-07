import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bot, Plus, Minus } from 'lucide-react'

interface ArrayEditorProps {
  title: string
  items: string[]
  onAdd: (value: string) => void
  onRemove: (index: number) => void
  placeholder: string
  isLocked: boolean
  isGettingAIHelp: boolean
  onGetAIHelp: (focusArea: 'inclusion' | 'exclusion' | 'search_strategy') => void
}

export const ProtocolArrayEditor: React.FC<ArrayEditorProps> = ({ 
  title, 
  items, 
  onAdd, 
  onRemove, 
  placeholder,
  isLocked,
  isGettingAIHelp,
  onGetAIHelp
}) => {
  const [newItem, setNewItem] = useState('')

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem)
      setNewItem('')
    }
  }

  const getFocusArea = (title: string): 'inclusion' | 'exclusion' | 'search_strategy' => {
    if (title.toLowerCase().includes('inclusion')) return 'inclusion'
    if (title.toLowerCase().includes('exclusion')) return 'exclusion'
    return 'search_strategy'
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">{title}</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onGetAIHelp(getFocusArea(title))}
          disabled={isGettingAIHelp || isLocked}
          className="h-7 text-xs"
        >
          <Bot className="h-3 w-3 mr-1" />
          AI Help
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
            <span className="flex-1">{item}</span>
            {!isLocked && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              >
                <Minus className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {!isLocked && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-2 py-1 text-sm border rounded"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={!newItem.trim()}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}