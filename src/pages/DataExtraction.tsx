import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Plus, Save, Trash2, Edit2, CheckCircle, FileText, Grid, List, Settings, Download } from 'lucide-react'

interface ExtractionField {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean'
  options?: string[]
  required: boolean
  description?: string
}

interface ExtractionTemplate {
  id: string
  name: string
  fields: ExtractionField[]
  isActive: boolean
}

interface ExtractedData {
  articleId: string
  articleTitle: string
  data: Record<string, any>
  completedAt?: string
  completedBy?: string
}

export default function DataExtraction() {
  const { projectId } = useParams()
  const [templates, setTemplates] = useState<ExtractionTemplate[]>([])
  const [activeTemplate, setActiveTemplate] = useState<ExtractionTemplate | null>(null)
  const [articles, setArticles] = useState<any[]>([])
  const [selectedArticle, setSelectedArticle] = useState<any>(null)
  const [extractedData, setExtractedData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'form' | 'table'>('form')
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ExtractionTemplate | null>(null)

  useEffect(() => {
    if (projectId) {
      fetchData()
    }
  }, [projectId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch extraction templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('extraction_templates')
        .select('*')
        .eq('project_id', projectId)

      if (templatesError) throw templatesError

      // Fetch articles that are included in screening
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .eq('project_id', projectId)
        .eq('screening_decision', 'include')
        .order('title')

      if (articlesError) throw articlesError

      setTemplates(templatesData || [])
      setArticles(articlesData || [])

      // Set active template
      const active = templatesData?.find(t => t.isActive) || templatesData?.[0]
      if (active) {
        setActiveTemplate(active)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultTemplate = () => {
    const defaultTemplate: ExtractionTemplate = {
      id: 'new',
      name: 'Default Extraction Template',
      isActive: true,
      fields: [
        { id: '1', name: 'Study Design', type: 'select', options: ['RCT', 'Cohort', 'Case-Control', 'Cross-Sectional', 'Case Report'], required: true },
        { id: '2', name: 'Sample Size', type: 'number', required: true, description: 'Total number of participants' },
        { id: '3', name: 'Population', type: 'text', required: true, description: 'Description of study population' },
        { id: '4', name: 'Intervention', type: 'text', required: false, description: 'Description of intervention (if applicable)' },
        { id: '5', name: 'Comparator', type: 'text', required: false, description: 'Description of comparator (if applicable)' },
        { id: '6', name: 'Primary Outcome', type: 'text', required: true, description: 'Primary outcome measure' },
        { id: '7', name: 'Secondary Outcomes', type: 'text', required: false, description: 'Secondary outcome measures' },
        { id: '8', name: 'Key Findings', type: 'text', required: true, description: 'Summary of key findings' },
        { id: '9', name: 'Limitations', type: 'text', required: false, description: 'Study limitations' },
        { id: '10', name: 'Quality Score', type: 'select', options: ['High', 'Moderate', 'Low', 'Very Low'], required: true },
        { id: '11', name: 'Risk of Bias', type: 'multiselect', options: ['Selection Bias', 'Performance Bias', 'Detection Bias', 'Attrition Bias', 'Reporting Bias'], required: false },
        { id: '12', name: 'Funding Source', type: 'text', required: false },
        { id: '13', name: 'Conflicts of Interest', type: 'boolean', required: true, description: 'Were conflicts of interest declared?' },
        { id: '14', name: 'Notes', type: 'text', required: false, description: 'Additional notes' }
      ]
    }
    setEditingTemplate(defaultTemplate)
    setShowTemplateEditor(true)
  }

  const saveTemplate = async () => {
    if (!editingTemplate) return

    setSaving(true)
    try {
      if (editingTemplate.id === 'new') {
        const { data, error } = await supabase
          .from('extraction_templates')
          .insert({
            project_id: projectId,
            name: editingTemplate.name,
            fields: editingTemplate.fields,
            is_active: editingTemplate.isActive
          })
          .select()
          .single()

        if (error) throw error
        setTemplates([...templates, data])
        setActiveTemplate(data)
      } else {
        const { error } = await supabase
          .from('extraction_templates')
          .update({
            name: editingTemplate.name,
            fields: editingTemplate.fields,
            is_active: editingTemplate.isActive
          })
          .eq('id', editingTemplate.id)

        if (error) throw error
        setTemplates(templates.map(t => t.id === editingTemplate.id ? editingTemplate : t))
      }

      setShowTemplateEditor(false)
      setEditingTemplate(null)
    } catch (err) {
      console.error('Error saving template:', err)
    } finally {
      setSaving(false)
    }
  }

  const saveExtractedData = async () => {
    if (!selectedArticle || !activeTemplate) return

    setSaving(true)
    try {
      // Save to extracted_data table or update article's extracted_data field
      const { error } = await supabase
        .from('articles')
        .update({
          extracted_data: extractedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedArticle.id)

      if (error) throw error

      // Move to next article
      const currentIndex = articles.findIndex(a => a.id === selectedArticle.id)
      if (currentIndex < articles.length - 1) {
        setSelectedArticle(articles[currentIndex + 1])
        setExtractedData({})
      }
    } catch (err) {
      console.error('Error saving data:', err)
    } finally {
      setSaving(false)
    }
  }

  const exportData = () => {
    const data = articles.map(article => ({
      Title: article.title,
      Authors: article.authors?.join('; '),
      Journal: article.journal,
      Year: article.publicationDate,
      ...article.extracted_data
    }))

    const csv = convertToCSV(data)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `extracted-data-${new Date().toISOString()}.csv`
    a.click()
  }

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return ''
    const headers = Object.keys(data[0])
    const rows = data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    return [headers.join(','), ...rows].join('\n')
  }

  const renderField = (field: ExtractionField) => {
    const value = extractedData[field.name] || ''

    switch (field.type) {
      case 'text':
        return (
          <textarea
            value={value}
            onChange={(e) => setExtractedData({...extractedData, [field.name]: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            required={field.required}
          />
        )
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setExtractedData({...extractedData, [field.name]: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        )
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setExtractedData({...extractedData, [field.name]: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        )
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setExtractedData({...extractedData, [field.name]: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required={field.required}
          >
            <option value="">Select...</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )
      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(value as string[])?.includes(option) || false}
                  onChange={(e) => {
                    const current = (value as string[]) || []
                    if (e.target.checked) {
                      setExtractedData({...extractedData, [field.name]: [...current, option]})
                    } else {
                      setExtractedData({...extractedData, [field.name]: current.filter(v => v !== option)})
                    }
                  }}
                  className="mr-2 rounded border-gray-300"
                />
                {option}
              </label>
            ))}
          </div>
        )
      case 'boolean':
        return (
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={field.name}
                value="true"
                checked={value === true || value === 'true'}
                onChange={() => setExtractedData({...extractedData, [field.name]: true})}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={field.name}
                value="false"
                checked={value === false || value === 'false'}
                onChange={() => setExtractedData({...extractedData, [field.name]: false})}
                className="mr-2"
              />
              No
            </label>
          </div>
        )
      default:
        return null
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Data Extraction</h1>
              <p className="text-gray-600 mt-1">Extract structured data from included articles</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportData}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'form' ? 'table' : 'form')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                {viewMode === 'form' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                {viewMode === 'form' ? 'Table View' : 'Form View'}
              </button>
            </div>
          </div>
        </div>

        {/* Template Management */}
        {templates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center mb-6">
            <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Extraction Template</h3>
            <p className="text-gray-600 mb-4">Create a template to define what data to extract from articles</p>
            <button
              onClick={createDefaultTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Default Template
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Active Template:</label>
                <select
                  value={activeTemplate?.id || ''}
                  onChange={(e) => setActiveTemplate(templates.find(t => t.id === e.target.value) || null)}
                  className="px-3 py-1 border border-gray-300 rounded-lg"
                >
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingTemplate(activeTemplate)
                    setShowTemplateEditor(true)
                  }}
                  className="px-3 py-1 text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={createDefaultTemplate}
                  className="px-3 py-1 text-green-600 hover:text-green-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  New
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {activeTemplate && viewMode === 'form' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Article List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold">Articles to Extract ({articles.length})</h3>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {articles.map(article => (
                    <button
                      key={article.id}
                      onClick={() => {
                        setSelectedArticle(article)
                        setExtractedData(article.extracted_data || {})
                      }}
                      className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 ${
                        selectedArticle?.id === article.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900 line-clamp-2">{article.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {article.authors?.slice(0, 2).join(', ')}
                            {article.authors?.length > 2 && ' et al.'}
                          </p>
                        </div>
                        {article.extracted_data && (
                          <CheckCircle className="w-5 h-5 text-green-500 ml-2 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Extraction Form */}
            <div className="lg:col-span-2">
              {selectedArticle ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedArticle.title}</h3>
                    <p className="text-sm text-gray-600">
                      {selectedArticle.authors?.join(', ')} • {selectedArticle.journal} • {selectedArticle.publicationDate}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {activeTemplate.fields.map(field => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.name} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.description && (
                          <p className="text-xs text-gray-500 mb-2">{field.description}</p>
                        )}
                        {renderField(field)}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => {
                        setExtractedData({})
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-700"
                    >
                      Clear Form
                    </button>
                    <button
                      onClick={saveExtractedData}
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save & Next'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">Select an article to begin extraction</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table View */}
        {activeTemplate && viewMode === 'table' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Article</th>
                    {activeTemplate.fields.map(field => (
                      <th key={field.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {field.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {articles.map(article => (
                    <tr key={article.id}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 max-w-xs truncate">{article.title}</p>
                      </td>
                      {activeTemplate.fields.map(field => (
                        <td key={field.id} className="px-4 py-3 text-sm text-gray-600">
                          {article.extracted_data?.[field.name] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      {showTemplateEditor && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Edit Extraction Template</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Fields</h3>
                <p className="text-sm text-gray-600 mb-4">Template editing interface would go here...</p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowTemplateEditor(false)
                    setEditingTemplate(null)
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}