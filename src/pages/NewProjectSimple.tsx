import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save } from 'lucide-react'

export default function NewProjectSimple() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    research_domain: '',
    project_type: 'systematic_review'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For demo purposes, just navigate back to projects
    console.log('Creating project:', formData)
    navigate('/projects')
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
            <p className="text-gray-600 mt-1">
              Set up your systematic literature review project
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Effectiveness of COVID-19 Treatments"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Briefly describe your systematic review objectives and scope..."
                rows={4}
              />
            </div>

            {/* Research Domain */}
            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
                Research Domain
              </label>
              <select
                id="domain"
                value={formData.research_domain}
                onChange={(e) => handleChange('research_domain', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a domain</option>
                <option value="medicine">Medicine</option>
                <option value="psychology">Psychology</option>
                <option value="education">Education</option>
                <option value="computer_science">Computer Science</option>
                <option value="biology">Biology</option>
                <option value="social_science">Social Science</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Project Type
              </label>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="systematic_review"
                    type="radio"
                    value="systematic_review"
                    checked={formData.project_type === 'systematic_review'}
                    onChange={(e) => handleChange('project_type', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="systematic_review" className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">Systematic Review</span>
                    <span className="block text-sm text-gray-500">
                      Comprehensive analysis of research literature on a specific topic
                    </span>
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="meta_analysis"
                    type="radio"
                    value="meta_analysis"
                    checked={formData.project_type === 'meta_analysis'}
                    onChange={(e) => handleChange('project_type', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="meta_analysis" className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">Meta-Analysis</span>
                    <span className="block text-sm text-gray-500">
                      Statistical analysis combining results from multiple studies
                    </span>
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="scoping_review"
                    type="radio"
                    value="scoping_review"
                    checked={formData.project_type === 'scoping_review'}
                    onChange={(e) => handleChange('project_type', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="scoping_review" className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">Scoping Review</span>
                    <span className="block text-sm text-gray-500">
                      Broad overview to map existing literature and identify gaps
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/projects')}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}