import React from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Upload, Loader2, Save } from 'lucide-react'

const projectSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(200, 'Title must be under 200 characters'),
  description: z.string().max(1000, 'Description must be under 1000 characters').optional(),
  project_type: z.enum(['systematic_review', 'meta_analysis', 'scoping_review', 'narrative_review', 'umbrella_review', 'custom']),
  research_domain: z.string().optional(),
  methodology: z.string().optional(),
  objective: z.string().optional(),
  timeline: z.string().optional(),
})

export type ProjectFormData = z.infer<typeof projectSchema>

interface ProjectFormProps {
  projectType: 'guided' | 'upload'
  onSubmit: (data: ProjectFormData) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
  initialData?: Partial<ProjectFormData>
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  projectType,
  onSubmit,
  onCancel,
  isSubmitting,
  initialData
}) => {
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      project_type: initialData?.project_type || 'systematic_review',
      research_domain: initialData?.research_domain || '',
      methodology: initialData?.methodology || '',
      objective: initialData?.objective || '',
      timeline: initialData?.timeline || '',
    }
  })

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {projectType === 'guided' ? (
              <Sparkles className="h-5 w-5 text-primary" />
            ) : (
              <Upload className="h-5 w-5 text-secondary-foreground" />
            )}
            {projectType === 'guided' ? 'AI-Guided Project' : 'Document Upload Project'}
          </CardTitle>
          <CardDescription>
            Provide the details for your research project
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="Enter your project title"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Describe your research project, objectives, and scope"
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>

            {/* Project Type */}
            <div className="space-y-2">
              <Label htmlFor="project_type">Review Type *</Label>
              <Select
                value={form.watch('project_type')}
                onValueChange={(value) => form.setValue('project_type', value as ProjectFormData['project_type'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select review type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="systematic_review">Systematic Review</SelectItem>
                  <SelectItem value="meta_analysis">Meta-Analysis</SelectItem>
                  <SelectItem value="scoping_review">Scoping Review</SelectItem>
                  <SelectItem value="narrative_review">Narrative Review</SelectItem>
                  <SelectItem value="umbrella_review">Umbrella Review</SelectItem>
                  <SelectItem value="custom">Custom Review</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.project_type && (
                <p className="text-sm text-destructive">{form.formState.errors.project_type.message}</p>
              )}
            </div>

            {/* Research Domain */}
            <div className="space-y-2">
              <Label htmlFor="research_domain">Research Domain</Label>
              <Input
                id="research_domain"
                {...form.register('research_domain')}
                placeholder="e.g., Medicine, Computer Science, Psychology"
              />
            </div>

            {/* Objective */}
            <div className="space-y-2">
              <Label htmlFor="objective">Research Objective</Label>
              <Textarea
                id="objective"
                {...form.register('objective')}
                placeholder="What is the main research question or objective?"
                rows={2}
              />
            </div>

            {/* Methodology */}
            <div className="space-y-2">
              <Label htmlFor="methodology">Methodology Notes</Label>
              <Textarea
                id="methodology"
                {...form.register('methodology')}
                placeholder="Any specific methodological considerations or approaches"
                rows={2}
              />
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <Label htmlFor="timeline">Expected Timeline</Label>
              <Input
                id="timeline"
                {...form.register('timeline')}
                placeholder="e.g., 3 months, Q1 2024, ongoing"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export { projectSchema }