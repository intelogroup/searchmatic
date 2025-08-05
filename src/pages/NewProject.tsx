import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'
import { ArrowLeft, Sparkles, Upload, Loader2 } from 'lucide-react'
import { useCreateProject } from '@/hooks/useProjects'
import { logInfo } from '@/lib/error-logger'

export const NewProject = () => {
  const navigate = useNavigate()
  const [isCreating, setIsCreating] = useState(false)
  const createProjectMutation = useCreateProject()

  const handleCreateProject = async (type: 'guided' | 'upload') => {
    setIsCreating(true)
    
    logInfo(`Starting project creation: ${type}`, {
      feature: 'projects',
      action: 'create-project-initiated',
      metadata: { type }
    })

    try {
      // Create a new project based on the type
      const projectData = {
        title: type === 'guided' 
          ? 'New Systematic Review' 
          : 'Document Collection Review',
        description: type === 'guided'
          ? 'AI-guided systematic literature review'
          : 'Review of uploaded document collection',
        project_type: 'systematic_review' as const,
        research_domain: undefined
      }

      const newProject = await createProjectMutation.mutateAsync(projectData)
      
      logInfo('Project created successfully, navigating to project', {
        feature: 'projects',
        action: 'create-project-success',
        metadata: { 
          projectId: newProject.id,
          title: newProject.title,
          type 
        }
      })

      // Navigate to the newly created project
      navigate(`/projects/${newProject.id}`)
      
    } catch (error) {
      console.error('Failed to create project:', error)
      // Error is already logged by the mutation
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="text-3xl font-bold mb-2">Create New Project</h2>
          <p className="text-muted-foreground">
            Choose how you'd like to start your systematic literature review
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
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
                  onClick={() => handleCreateProject('guided')}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Project...
                    </>
                  ) : (
                    'Start Guided Setup'
                  )}
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
                  onClick={() => handleCreateProject('upload')}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Project...
                    </>
                  ) : (
                    'Upload Documents'
                  )}
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
        </div>
      </main>
    </div>
  )
}