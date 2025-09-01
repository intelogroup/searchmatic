import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Plus, FileSearch, BarChart3, Calendar } from 'lucide-react'

export default function ProjectsSimple() {
  const navigate = useNavigate()

  const mockProjects = [
    {
      id: 'demo-project-1',
      title: 'COVID-19 Treatment Effectiveness',
      description: 'A systematic review examining the effectiveness of various COVID-19 treatments in hospitalized patients.',
      status: 'active',
      updated_at: new Date().toISOString()
    },
    {
      id: 'demo-project-2',
      title: 'Machine Learning in Healthcare',
      description: 'Evaluating the effectiveness of machine learning applications in clinical diagnosis.',
      status: 'completed',
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': 
        return 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium'
      case 'completed': 
        return 'bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium'
      default: 
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
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
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileSearch className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{mockProjects.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockProjects.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Articles</p>
                <p className="text-2xl font-bold text-gray-900">216</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockProjects.filter(p => p.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mockProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {project.description}
                  </p>
                  <span className={getStatusColor(project.status)}>
                    {project.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Updated:</span> {formatDate(project.updated_at)}
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="flex-1"
                  >
                    View Project
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}