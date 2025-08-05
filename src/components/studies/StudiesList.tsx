/**
 * Studies List Component - Display and manage studies within a project
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  ExternalLink,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useProjectStudies, useUpdateStudyStatus, useDeleteStudy, useBulkUpdateStudyStatus } from '@/hooks/useStudies'
import type { Study } from '@/services/studyService'
import { formatDistanceToNow } from 'date-fns'

interface StudiesListProps {
  projectId: string
  onCreateStudy?: () => void
  onEditStudy?: (study: Study) => void
}

export const StudiesList: React.FC<StudiesListProps> = ({ 
  projectId, 
  onCreateStudy,
  onEditStudy 
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedStudies, setSelectedStudies] = useState<string[]>([])
  
  const { data: studies, isLoading, error } = useProjectStudies(projectId)
  const updateStatusMutation = useUpdateStudyStatus()
  const deleteStudyMutation = useDeleteStudy()
  const bulkUpdateMutation = useBulkUpdateStudyStatus()

  // Filter studies based on search and status
  const filteredStudies = studies?.filter(study => {
    const matchesSearch = !searchQuery || 
      study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.authors?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.journal?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || study.status === statusFilter
    
    return matchesSearch && matchesStatus
  }) || []

  const getStatusIcon = (status: Study['status']) => {
    switch (status) {
      case 'included': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'excluded': return <XCircle className="h-4 w-4 text-red-600" />
      case 'duplicate': return <XCircle className="h-4 w-4 text-orange-600" />
      case 'extracted': return <FileText className="h-4 w-4 text-blue-600" />
      case 'screening': return <Clock className="h-4 w-4 text-yellow-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: Study['status']) => {
    switch (status) {
      case 'included': return 'bg-green-100 text-green-800'
      case 'excluded': return 'bg-red-100 text-red-800'
      case 'duplicate': return 'bg-orange-100 text-orange-800'
      case 'extracted': return 'bg-blue-100 text-blue-800'
      case 'screening': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatusUpdate = async (studyId: string, status: Study['status']) => {
    try {
      await updateStatusMutation.mutateAsync({ studyId, status })
    } catch (error) {
      console.error('Failed to update study status:', error)
    }
  }

  const handleDeleteStudy = async (studyId: string) => {
    if (confirm('Are you sure you want to delete this study? This action cannot be undone.')) {
      try {
        await deleteStudyMutation.mutateAsync(studyId)
        setSelectedStudies(prev => prev.filter(id => id !== studyId))
      } catch (error) {
        console.error('Failed to delete study:', error)
      }
    }
  }

  const handleBulkStatusUpdate = async (status: Study['status']) => {
    if (selectedStudies.length === 0) return
    
    try {
      await bulkUpdateMutation.mutateAsync({
        studyIds: selectedStudies,
        status,
        projectId
      })
      setSelectedStudies([])
    } catch (error) {
      console.error('Failed to bulk update studies:', error)
    }
  }

  const toggleStudySelection = (studyId: string) => {
    setSelectedStudies(prev => 
      prev.includes(studyId) 
        ? prev.filter(id => id !== studyId)
        : [...prev, studyId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedStudies.length === filteredStudies.length) {
      setSelectedStudies([])
    } else {
      setSelectedStudies(filteredStudies.map(study => study.id))
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="space-y-2 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading studies...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Failed to Load Studies</h3>
                <p className="text-sm text-muted-foreground">
                  {error.message || 'An unexpected error occurred while loading studies.'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Studies</CardTitle>
            <Badge variant="secondary">
              {filteredStudies.length} {statusFilter !== 'all' ? statusFilter : 'total'}
            </Badge>
          </div>
          <Button onClick={onCreateStudy} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Study
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search studies by title, author, or journal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="screening">Screening</SelectItem>
              <SelectItem value="included">Included</SelectItem>
              <SelectItem value="excluded">Excluded</SelectItem>
              <SelectItem value="duplicate">Duplicate</SelectItem>
              <SelectItem value="extracted">Extracted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedStudies.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
            <span className="text-sm font-medium">
              {selectedStudies.length} studies selected
            </span>
            <div className="flex gap-2 ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('included')}
                disabled={bulkUpdateMutation.isPending}
              >
                Include
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('excluded')}
                disabled={bulkUpdateMutation.isPending}
              >
                Exclude
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedStudies([])}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Studies List */}
        {filteredStudies.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Studies Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'No studies match your current filters.'
                : 'Start by adding your first study to this project.'
              }
            </p>
            {onCreateStudy && (
              <Button onClick={onCreateStudy}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Study
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Select All Checkbox */}
            <div className="flex items-center gap-2 py-2 border-b">
              <Checkbox
                checked={selectedStudies.length === filteredStudies.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Select all ({filteredStudies.length})
              </span>
            </div>

            {/* Studies */}
            {filteredStudies.map((study) => (
              <div 
                key={study.id}
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <Checkbox
                  checked={selectedStudies.includes(study.id)}
                  onCheckedChange={() => toggleStudySelection(study.id)}
                />
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm leading-tight">{study.title}</h4>
                      {study.authors && (
                        <p className="text-xs text-muted-foreground mt-1">{study.authors}</p>
                      )}
                      {(study.journal || study.publication_year) && (
                        <p className="text-xs text-muted-foreground">
                          {study.journal}{study.journal && study.publication_year && ', '}{study.publication_year}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(study.status)}
                        <Badge className={getStatusColor(study.status)} variant="secondary">
                          {study.status}
                        </Badge>
                      </div>
                      
                      {study.url && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => window.open(study.url!, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Added {formatDistanceToNow(new Date(study.created_at), { addSuffix: true })}</span>
                      {study.doi && (
                        <span className="inline-flex items-center gap-1">
                          DOI: {study.doi}
                        </span>
                      )}
                      {study.study_type !== 'article' && (
                        <Badge variant="outline" className="text-xs">
                          {study.study_type.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {/* Status Update Dropdown */}
                      <Select
                        value={study.status}
                        onValueChange={(status) => handleStatusUpdate(study.id, status as Study['status'])}
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="screening">Screening</SelectItem>
                          <SelectItem value="included">Included</SelectItem>
                          <SelectItem value="excluded">Excluded</SelectItem>
                          <SelectItem value="duplicate">Duplicate</SelectItem>
                          <SelectItem value="extracted">Extracted</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Edit Button */}
                      {onEditStudy && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => onEditStudy(study)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}

                      {/* Delete Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteStudy(study.id)}
                        disabled={deleteStudyMutation.isPending}
                      >
                        {deleteStudyMutation.isPending && deleteStudyMutation.variables === study.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Abstract Preview */}
                  {study.abstract && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {study.abstract}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default StudiesList