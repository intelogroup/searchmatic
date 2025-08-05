/**
 * Study Form Component - Create and edit studies
 */

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, X } from 'lucide-react'
import { useCreateStudy, useUpdateStudy } from '@/hooks/useStudies'
import type { Study, CreateStudyData, UpdateStudyData } from '@/services/studyService'

const studySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  authors: z.string().optional(),
  publication_year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  journal: z.string().optional(),
  doi: z.string().optional(),
  pmid: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  study_type: z.enum(['article', 'thesis', 'book', 'conference_paper', 'report', 'patent', 'other']).optional(),
  abstract: z.string().optional(),
  keywords: z.string().optional(), // Will be split into array
  citation: z.string().optional(),
})

type StudyFormData = z.infer<typeof studySchema>

interface StudyFormProps {
  projectId: string
  study?: Study // For editing existing study
  onSuccess: () => void
  onCancel: () => void
}

export const StudyForm: React.FC<StudyFormProps> = ({
  projectId,
  study,
  onSuccess,
  onCancel
}) => {
  const isEditing = !!study
  const createMutation = useCreateStudy()
  const updateMutation = useUpdateStudy()

  const form = useForm<StudyFormData>({
    resolver: zodResolver(studySchema),
    defaultValues: {
      title: study?.title || '',
      authors: study?.authors || '',
      publication_year: study?.publication_year || undefined,
      journal: study?.journal || '',
      doi: study?.doi || '',
      pmid: study?.pmid || '',
      url: study?.url || '',
      study_type: study?.study_type || 'article',
      abstract: study?.abstract || '',
      keywords: study?.keywords?.join(', ') || '',
      citation: study?.citation || '',
    }
  })

  const onSubmit = async (data: StudyFormData) => {
    try {
      const studyData: CreateStudyData | UpdateStudyData = {
        title: data.title,
        authors: data.authors || undefined,
        publication_year: data.publication_year,
        journal: data.journal || undefined,
        doi: data.doi || undefined,
        pmid: data.pmid || undefined,
        url: data.url || undefined,
        study_type: data.study_type,
        abstract: data.abstract || undefined,
        keywords: data.keywords ? data.keywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
        citation: data.citation || undefined,
      }

      if (isEditing) {
        await updateMutation.mutateAsync({
          studyId: study.id,
          updates: studyData as UpdateStudyData
        })
      } else {
        await createMutation.mutateAsync({
          projectId,
          studyData: studyData as CreateStudyData
        })
      }

      onSuccess()
    } catch (error) {
      console.error('Failed to save study:', error)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit Study' : 'Add New Study'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="Enter study title"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Authors */}
          <div className="space-y-2">
            <Label htmlFor="authors">Authors</Label>
            <Input
              id="authors"
              {...form.register('authors')}
              placeholder="e.g., Smith, J., Jones, A."
            />
          </div>

          {/* Journal and Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="journal">Journal</Label>
              <Input
                id="journal"
                {...form.register('journal')}
                placeholder="Journal name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="publication_year">Publication Year</Label>
              <Input
                id="publication_year"
                type="number"
                {...form.register('publication_year', { valueAsNumber: true })}
                placeholder="YYYY"
                min="1900"
                max={new Date().getFullYear() + 1}
              />
              {form.formState.errors.publication_year && (
                <p className="text-sm text-destructive">{form.formState.errors.publication_year.message}</p>
              )}
            </div>
          </div>

          {/* DOI and PMID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doi">DOI</Label>
              <Input
                id="doi"
                {...form.register('doi')}
                placeholder="10.1000/123456"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pmid">PMID</Label>
              <Input
                id="pmid"
                {...form.register('pmid')}
                placeholder="PubMed ID"
              />
            </div>
          </div>

          {/* URL and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                {...form.register('url')}
                placeholder="https://..."
              />
              {form.formState.errors.url && (
                <p className="text-sm text-destructive">{form.formState.errors.url.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="study_type">Study Type</Label>
              <Select
                value={form.watch('study_type')}
                onValueChange={(value) => form.setValue('study_type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="thesis">Thesis</SelectItem>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="conference_paper">Conference Paper</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="patent">Patent</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords</Label>
            <Input
              id="keywords"
              {...form.register('keywords')}
              placeholder="keyword1, keyword2, keyword3"
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple keywords with commas
            </p>
          </div>

          {/* Abstract */}
          <div className="space-y-2">
            <Label htmlFor="abstract">Abstract</Label>
            <Textarea
              id="abstract"
              {...form.register('abstract')}
              placeholder="Study abstract..."
              rows={4}
            />
          </div>

          {/* Citation */}
          <div className="space-y-2">
            <Label htmlFor="citation">Citation</Label>
            <Textarea
              id="citation"
              {...form.register('citation')}
              placeholder="Formatted citation..."
              rows={2}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Study' : 'Create Study'}
                </>
              )}
            </Button>
            
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default StudyForm