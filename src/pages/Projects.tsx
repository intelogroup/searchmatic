import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { 
  Plus, 
  FileSearch, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings,
  Eye,
  Trash2
} from 'lucide-react'

interface Project {
  id: string
  title: string
  description: string | null
  project_type: string
  research_domain: string | null
  status: string
  created_at: string
  updated_at: string
  user_id: string
  article_count?: number
  protocol_count?: number
}

export default function Projects() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalArticles: 0,
    completedReviews: 0
  })

  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user])

  const loadProjects = async () => {
    try {
      // In demo mode, create mock data instead of querying database
      const isDemoMode = typeof window !== 'undefined' && window.location.search.includes('demo=true')
      
      if (isDemoMode) {
        // Create mock projects data
        const mockProjects = [
          {
            id: 'demo-project-1',
            title: 'COVID-19 Treatment Effectiveness',
            description: 'A systematic review examining the effectiveness of various COVID-19 treatments in hospitalized patients.',
            status: 'active',
            project_type: 'systematic_review',
            research_domain: 'Medicine',
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            user_id: 'demo-user',
            article_count: 127,
            protocol_count: 1
          },
          {
            id: 'demo-project-2',
            title: 'Machine Learning in Healthcare',
            description: 'Evaluating the effectiveness of machine learning applications in clinical diagnosis.',
            status: 'completed',
            project_type: 'systematic_review',
            research_domain: 'Computer Science',
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            user_id: 'demo-user',
            article_count: 89,
            protocol_count: 1
          }
        ]
        
        setProjects(mockProjects)
        return
      }

      if (!user) return

      // Regular database query for authenticated users
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // For now, set counts to 0 - we'll implement proper counting later
      const projectsWithCounts = projectsData?.map(project => ({
        ...project,
        article_count: 0,
        protocol_count: 0
      })) || []

      setProjects(projectsWithCounts)

      // Calculate stats
      const totalArticles = projectsWithCounts.reduce((sum, p) => sum + (p.article_count || 0), 0)
      const activeProjects = projectsWithCounts.filter(p => p.status === 'active').length
      const completedReviews = projectsWithCounts.filter(p => p.status === 'completed').length

      setStats({
        totalProjects: projectsWithCounts.length,
        activeProjects,
        totalArticles,
        completedReviews
      })

    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Research Projects</h1>
            <p className="text-gray-600 mt-2">
              Manage your systematic literature reviews and research projects
            </p>
          </div>
          <Button onClick={() => navigate('/projects/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileSearch className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Users className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Articles</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedReviews}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create your first systematic literature review project to get started."
            action={
              <Button onClick={() => navigate('/projects/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Project
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
                      {project.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        {project.research_domain && (
                          <Badge variant="outline">{project.research_domain}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Project Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Articles:</span> {project.article_count || 0}
                      </div>
                      <div>
                        <span className="font-medium">Protocols:</span> {project.protocol_count || 0}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Updated:</span> {formatDate(project.updated_at)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Project
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/projects/${project.id}/settings`)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}