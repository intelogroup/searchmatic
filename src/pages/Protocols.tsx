import React, { useState, useCallback } from 'react'
import ProtocolPanel from '@/components/protocol/ProtocolPanel'
import ProtocolDashboard from '@/components/protocol/ProtocolDashboard'
import { protocolService } from '@/services/protocolService'
import { FileText } from 'lucide-react'
import type { Protocol } from '@/types/database'

interface ProtocolsProps {
  projectId?: string
}

type ViewMode = 'list' | 'dashboard'

export const Protocols: React.FC<ProtocolsProps> = ({ 
  projectId = 'default-project' 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [currentProtocol, setCurrentProtocol] = useState<Protocol | null>(null)

  const handleProtocolSave = useCallback(async (protocolId: string, updates: Partial<Protocol>) => {
    try {
      const updatedProtocol = await protocolService.updateProtocol(protocolId, updates)
      setCurrentProtocol(updatedProtocol)
    } catch (error) {
      console.error('Failed to update protocol:', error)
    }
  }, [])

  const handleBack = useCallback(() => {
    setViewMode('list')
    setCurrentProtocol(null)
  }, [])

  const handleShare = useCallback((protocolId: string) => {
    // TODO: Implement protocol sharing
    console.log('Share protocol:', protocolId)
  }, [])

  const handleExport = useCallback((protocolId: string) => {
    // TODO: Implement protocol export
    console.log('Export protocol:', protocolId)
  }, [])

  if (viewMode === 'list') {
    return (
      <div className="h-screen flex flex-col">
        <div className="border-b bg-white p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold">Research Protocols</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage systematic review protocols with AI assistance
          </p>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {/* Custom protocol handler that integrates with our new components */}
          <div className="h-full">
            <ProtocolPanel 
              projectId={projectId}
              className="h-full"
            />
          </div>
        </div>
      </div>
    )
  }

  if (viewMode === 'dashboard' && currentProtocol) {
    return (
      <ProtocolDashboard
        protocol={currentProtocol}
        onBack={handleBack}
        onSave={handleProtocolSave}
        onShare={handleShare}
        onExport={handleExport}
      />
    )
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium mb-2">Loading...</h2>
        <p className="text-sm text-gray-600">Please wait while we load your protocol</p>
      </div>
    </div>
  )
}

export default Protocols