import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'
import { Plus, BookOpen, Clock, CheckCircle2, AlertCircle, Loader2, RefreshCw, Sparkles, BarChart3 } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { formatDistanceToNow } from 'date-fns'
import { logInfo } from '@/lib/error-logger'

export const Dashboard = () => {
  const navigate = useNavigate()
  
  // Use real data from Supabase
  const { data: projects, isLoading: projectsLoading, error: projectsError, refetch: refetchProjects } = useProjects()

  const handleCreateProject = () => {
    logInfo('User clicked create project from dashboard', {
      feature: 'dashboard',
      action: 'create-project-click'
    })
    navigate('/projects/new')
  }

  // Map database status to display values
  const getStatusDisplay = (status: string) => {
    const statusMap = {
      'draft': { label: 'Draft', color: 'text-gray-600 bg-gray-50', icon: <BookOpen className="h-4 w-4" /> },
      'active': { label: 'Active', color: 'text-green-600 bg-green-50', icon: <Clock className="h-4 w-4" /> },
      'review': { label: 'Review', color: 'text-yellow-600 bg-yellow-50', icon: <BarChart3 className="h-4 w-4" /> },
      'completed': { label: 'Completed', color: 'text-blue-600 bg-blue-50', icon: <CheckCircle2 className="h-4 w-4" /> },
      'archived': { label: 'Archived', color: 'text-purple-600 bg-purple-50', icon: <BookOpen className="h-4 w-4" /> }
    }
    return statusMap[status as keyof typeof statusMap] || statusMap.draft
  }

  // Format time ago helper
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  // Loading state
  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading your projects...</span>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (projectsError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Card className="p-6 max-w-md">
              <div className="flex items-center gap-3 text-destructive mb-4">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Failed to load projects</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {projectsError?.message || 'An unexpected error occurred.'}
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  refetchProjects()
                }}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Your Literature Reviews</h2>
          <p className="text-muted-foreground">
            AI-powered systematic reviews made simple. Create, manage, and export your research projects.
          </p>
        </div>

        {/* Simple Stats */}
        {projects && projects.length > 0 && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{projects.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {projects.length === 1 ? 'Project' : 'Projects'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Most recent: {formatTimeAgo(projects[0]?.last_activity_at || projects[0]?.updated_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* New Project Card */}
          <Card className="border-dashed border-primary/20 hover:border-primary/40 transition-all cursor-pointer group hover:shadow-md" 
                onClick={handleCreateProject}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                Start New Review
              </CardTitle>
              <CardDescription>
                Create a systematic literature review with AI guidance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary/60 rounded-full" />
                  <span>AI-powered protocol creation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary/60 rounded-full" />
                  <span>Smart search & deduplication</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary/60 rounded-full" />
                  <span>Export-ready results</span>
                </div>
              </div>
              <Button 
                className="w-full mt-4 group-hover:shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateProject();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>

          {/* Real Project Cards */}
          {projects && projects.length > 0 ? (
            projects.map((project) => {
              const statusDisplay = getStatusDisplay(project.status)
              return (
                <Card key={project.id} className="hover:shadow-md transition-all cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {project.description || 'No description provided'}
                        </CardDescription>
                        {project.research_domain && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
                              {project.research_domain}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                        {statusDisplay.icon}
                        {statusDisplay.label}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Studies:</span>
                        <span className="font-medium">{project.total_studies}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Stage:</span>
                        <span className="font-medium">{project.current_stage}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress:</span>
                        <span className="font-medium">{project.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${project.progress_percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Updated {formatTimeAgo(project.last_activity_at)}
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full mt-4"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        Open Project
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            // Empty state when no projects exist
            <div className="col-span-full">
              <Card className="p-8 text-center">
                <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-16 h-16 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first systematic literature review to get started
                </p>
                <Button onClick={handleCreateProject}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              </Card>
            </div>
          )}
        </div>

        {/* Getting Started Section */}
        <div className="mt-12">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Welcome to Searchmatic!</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Transform your systematic literature reviews with AI-powered assistance. Our platform guides you through each step, 
                  from research scoping to final export, making rigorous research accessible to everyone.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={handleCreateProject}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Your First Review
                  </Button>
                  <Button variant="outline">
                    View Documentation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}