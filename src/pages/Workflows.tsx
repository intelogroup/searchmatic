import React from 'react'
import { Navigate } from 'react-router-dom'

interface WorkflowsProps {
  projectId?: string
}

export const Workflows: React.FC<WorkflowsProps> = () => {
  // Redirect to protocols page as workflows have been replaced with protocol functionality
  return <Navigate to="/protocols" replace />
}

export default Workflows