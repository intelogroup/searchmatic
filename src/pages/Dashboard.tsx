import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'
import { Plus, BookOpen, Clock, CheckCircle2, BarChart3 } from 'lucide-react'

export const Dashboard = () => {
  const navigate = useNavigate()

  // Sample data to make the dashboard look more populated
  const sampleProjects = [
    {
      id: 'covid-treatments',
      title: 'COVID-19 Treatment Efficacy',
      description: 'Systematic review of COVID-19 therapeutic interventions',
      status: 'Active',
      articles: 156,
      progress: 65,
      lastUpdated: '2 hours ago',
      stage: 'Data Extraction'
    },
    {
      id: 'ai-healthcare',
      title: 'AI in Healthcare Diagnostics',
      description: 'Machine learning applications in medical diagnosis',
      status: 'Review',
      articles: 89,
      progress: 45,
      lastUpdated: '1 day ago',
      stage: 'Screening'
    },
    {
      id: 'mental-health',
      title: 'Digital Mental Health Interventions',
      description: 'Effectiveness of app-based mental health treatments',
      status: 'Completed',
      articles: 234,
      progress: 100,
      lastUpdated: '3 days ago',
      stage: 'Export Ready'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-50'
      case 'Review': return 'text-yellow-600 bg-yellow-50'
      case 'Completed': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <Clock className="h-4 w-4" />
      case 'Review': return <BarChart3 className="h-4 w-4" />
      case 'Completed': return <CheckCircle2 className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
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

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Articles Processed</p>
                  <p className="text-2xl font-bold">479</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Reviews</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">1</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* New Project Card */}
          <Card className="border-dashed hover:border-solid transition-all cursor-pointer group hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Start New Review
              </CardTitle>
              <CardDescription>
                Create a new systematic literature review with AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => navigate('/projects/new')}
              >
                Begin Project
              </Button>
            </CardContent>
          </Card>

          {/* Sample Project Cards */}
          {sampleProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {project.description}
                    </CardDescription>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    {project.status}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Articles:</span>
                    <span className="font-medium">{project.articles}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stage:</span>
                    <span className="font-medium">{project.stage}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress:</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Updated {project.lastUpdated}
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
          ))}
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
                  <Button onClick={() => navigate('/projects/new')}>
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