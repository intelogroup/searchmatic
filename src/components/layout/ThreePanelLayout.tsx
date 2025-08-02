import React from 'react'
import { cn } from '@/lib/utils'

interface ThreePanelLayoutProps {
  mainContent: React.ReactNode
  protocolPanel: React.ReactNode
  aiChatPanel: React.ReactNode
  className?: string
}

export const ThreePanelLayout: React.FC<ThreePanelLayoutProps> = ({
  mainContent,
  protocolPanel,
  aiChatPanel,
  className
}) => {
  return (
    <div className={cn("flex h-screen bg-background", className)}>
      {/* Main Content Area - Flexible width */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {mainContent}
        </main>
      </div>

      {/* Protocol Panel - Fixed width */}
      <div className="w-80 border-l border-border flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {protocolPanel}
        </div>
      </div>

      {/* AI Chat Panel - Fixed width */}
      <div className="w-96 border-l border-border flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {aiChatPanel}
        </div>
      </div>
    </div>
  )
}