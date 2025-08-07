export type ProjectStatus = 'active' | 'completed' | 'draft' | 'archived'

export const getStatusDisplay = (status: ProjectStatus): string => {
  const statusMap: Record<ProjectStatus, string> = {
    active: 'Active',
    completed: 'Completed', 
    draft: 'Draft',
    archived: 'Archived'
  }
  return statusMap[status] || status
}

export const getStatusColor = (status: ProjectStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const colorMap: Record<ProjectStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    completed: 'secondary',
    draft: 'outline', 
    archived: 'destructive'
  }
  return colorMap[status] || 'outline'
}