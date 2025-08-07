import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'
import { ArrowLeft, Sparkles, Upload, Loader2, Save } from 'lucide-react'
import { useCreateProject } from '@/hooks/useProjects'
import { logInfo } from '@/lib/error-logger'

const projectSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(200, 'Title must be under 200 characters'),
  description: z.string().max(1000, 'Description must be under 1000 characters').optional(),
  project_type: z.enum(['systematic_review', 'meta_analysis', 'scoping_review', 'narrative_review', 'umbrella_review', 'custom']),
  research_domain: z.string().optional(),
  methodology: z.string().optional(),
  objective: z.string().optional(),
  timeline: z.string().optional(),
})

type ProjectFormData = z.infer<typeof projectSchema>

export const NewProject = () => {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [projectType, setProjectType] = useState<'guided' | 'upload' | null>(null)
  const createProjectMutation = useCreateProject()

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      project_type: 'systematic_review',
      research_domain: '',
      methodology: '',
      objective: '',
      timeline: '',
    }
  })

  const onSubmit = async (data: ProjectFormData) => {
    logInfo('Starting project creation with form data', {
      feature: 'projects',
      action: 'create-project-form-submit',
      metadata: { 
        title: data.title,
        project_type: data.project_type,
        hasDescription: !!data.description 
      }
    })

    try {
      const projectData = {
        title: data.title,
        description: data.description || undefined,
        project_type: data.project_type,
        research_domain: data.research_domain || undefined,
        methodology: data.methodology || undefined,
        objective: data.objective || undefined,
        timeline: data.timeline || undefined,
      }

      const newProject = await createProjectMutation.mutateAsync(projectData)
      
      logInfo('Project created successfully, navigating to project', {
        feature: 'projects',
        action: 'create-project-success',
        metadata: { 
          projectId: newProject.id,
          title: newProject.title,
          project_type: newProject.project_type
        }
      })

      // Navigate to the newly created project
      navigate(`/projects/${newProject.id}`)
      
    } catch (error) {
      console.error('Failed to create project:', error)
      // Error is already logged by the mutation
    }
  }

  const handleQuickCreate = async (type: 'guided' | 'upload') => {
    setProjectType(type)
    
    // Pre-fill form based on quick path selection
    if (type === 'guided') {
      form.reset({
        title: 'New Systematic Review',
        description: 'AI-guided systematic literature review',
        project_type: 'systematic_review',
        research_domain: '',
        methodology: '',
        objective: '',
        timeline: '',
      })
    } else {
      form.reset({
        title: 'Document Collection Review',
        description: 'Review of uploaded document collection',
        project_type: 'systematic_review',
        research_domain: '',
        methodology: '',
        objective: '',
        timeline: '',
      })
    }
    
    setShowForm(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => showForm ? setShowForm(false) : navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {showForm ? 'Back to Options' : 'Back to Dashboard'}
          </Button>
          <h2 className="text-3xl font-bold mb-2">Create New Project</h2>
          <p className="text-muted-foreground">
            {showForm 
              ? 'Fill in the details for your research project'
              : 'Choose how you\'d like to start your systematic literature review'
            }
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {!showForm ? (
            <>
              <div className="grid gap-8 md:grid-cols-2">
                {/* Guided Path */}
                <Card className="cursor-pointer transition-all hover:shadow-lg">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">AI-Guided Setup</CardTitle>
                    <CardDescription>
                      Let our AI assistant help you define your research scope and methodology
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Perfect for:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• New researchers</li>
                        <li>• Starting from scratch</li>
                        <li>• Need help with methodology</li>
                        <li>• Want AI-powered query generation</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">What you'll get:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Interactive protocol development</li>
                        <li>• AI-generated search queries</li>
                        <li>• PICO framework guidance</li>
                        <li>• Step-by-step workflow</li>
                      </ul>
                    </div>

                    <Button 
                      className="w-full mt-6" 
                      onClick={() => handleQuickCreate('guided')}
                    >
                      Start Guided Setup
                    </Button>
                  </CardContent>
                </Card>

                {/* Upload Path */}
                <Card className="cursor-pointer transition-all hover:shadow-lg">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 bg-secondary/50 rounded-full w-16 h-16 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-secondary-foreground" />
                    </div>
                    <CardTitle className="text-xl">Bring Your Own Documents</CardTitle>
                    <CardDescription>
                      Upload your own collection of research papers and PDFs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Perfect for:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Experienced researchers</li>
                        <li>• Have existing papers</li>
                        <li>• Custom document collections</li>
                        <li>• Specific data extraction needs</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">What you'll get:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Bulk PDF processing</li>
                        <li>• Automated data extraction</li>
                        <li>• Custom field definitions</li>
                        <li>• Export ready datasets</li>
                      </ul>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full mt-6"
                      onClick={() => handleQuickCreate('upload')}
                    >
                      Upload Documents
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Feature Preview */}
              <div className="mt-12">
                <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-4">What makes Searchmatic different?</h3>
                      <div className="grid gap-6 md:grid-cols-3 text-sm">
                        <div>
                          <div className="font-medium mb-2">🤖 AI-Powered Assistant</div>
                          <p className="text-muted-foreground">
                            Get guidance from our Professor AI persona throughout your review process
                          </p>
                        </div>
                        <div>
                          <div className="font-medium mb-2">⚡ Automated Processing</div>
                          <p className="text-muted-foreground">
                            Automatic deduplication, screening, and data extraction from PDFs
                          </p>
                        </div>
                        <div>
                          <div className="font-medium mb-2">📊 Export Ready</div>
                          <p className="text-muted-foreground">
                            Generate publication-ready datasets and PRISMA compliance reports
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            /* Project Creation Form */
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
                        onValueChange={(value) => form.setValue('project_type', value as 'systematic_review' | 'meta_analysis' | 'scoping_review' | 'narrative_review' | 'umbrella_review' | 'custom')}
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
                        disabled={createProjectMutation.isPending}
                        className="flex-1"
                      >
                        {createProjectMutation.isPending ? (
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
                        onClick={() => setShowForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}