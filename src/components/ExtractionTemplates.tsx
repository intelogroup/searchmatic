import React, { useState, useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Plus, Edit2, Trash2, Save, X, FileText, Settings, Copy } from 'lucide-react'

interface ExtractionTemplate {
  id: string
  name: string
  fields: ExtractionField[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ExtractionField {
  name: string
  type: 'text' | 'number' | 'boolean' | 'date' | 'list' | 'json'
  description?: string
  required?: boolean
  defaultValue?: any
  validation?: {
    min?: number
    max?: number
    pattern?: string
    options?: string[]
  }
}

interface ExtractionTemplatesProps {
  projectId: string
  onTemplateSelect?: (template: ExtractionTemplate) => void
  selectedTemplateId?: string
}

const DEFAULT_TEMPLATES: Partial<ExtractionTemplate>[] = [
  {
    name: 'PICO Research Study',
    fields: [
      { name: 'population', type: 'text', description: 'Study population/participants', required: true },
      { name: 'intervention', type: 'text', description: 'Intervention being studied', required: true },
      { name: 'comparison', type: 'text', description: 'Comparison/control group' },
      { name: 'outcome', type: 'text', description: 'Primary outcome measures', required: true },
      { name: 'sample_size', type: 'number', description: 'Number of participants' },
      { name: 'study_design', type: 'text', description: 'Type of study design', required: true },
      { name: 'duration', type: 'text', description: 'Study duration' },
      { name: 'setting', type: 'text', description: 'Study setting/location' },
      { name: 'inclusion_criteria', type: 'list', description: 'Inclusion criteria' },
      { name: 'exclusion_criteria', type: 'list', description: 'Exclusion criteria' },
      { name: 'primary_findings', type: 'text', description: 'Main study findings', required: true },
      { name: 'limitations', type: 'list', description: 'Study limitations' },
      { name: 'funding_source', type: 'text', description: 'Funding information' },
      { name: 'conflicts_of_interest', type: 'text', description: 'Declared conflicts' }
    ],
    isActive: true
  },
  {
    name: 'Basic Study Information',
    fields: [
      { name: 'title', type: 'text', description: 'Study title', required: true },
      { name: 'authors', type: 'list', description: 'List of authors', required: true },
      { name: 'publication_year', type: 'number', description: 'Year of publication', required: true },
      { name: 'journal', type: 'text', description: 'Journal name', required: true },
      { name: 'doi', type: 'text', description: 'Digital Object Identifier' },
      { name: 'abstract', type: 'text', description: 'Study abstract', required: true },
      { name: 'keywords', type: 'list', description: 'Study keywords' },
      { name: 'study_type', type: 'text', description: 'Type of study', required: true }
    ],
    isActive: true
  },
  {
    name: 'Quality Assessment',
    fields: [
      { name: 'randomization', type: 'boolean', description: 'Was randomization used?' },
      { name: 'blinding', type: 'text', description: 'Type of blinding used' },
      { name: 'allocation_concealment', type: 'boolean', description: 'Adequate allocation concealment?' },
      { name: 'complete_outcome_data', type: 'boolean', description: 'Complete outcome data reported?' },
      { name: 'selective_reporting', type: 'boolean', description: 'Free of selective reporting?' },
      { name: 'other_bias', type: 'text', description: 'Other potential sources of bias' },
      { name: 'overall_risk', type: 'text', description: 'Overall risk of bias assessment', validation: { options: ['Low', 'Moderate', 'High', 'Unclear'] } },
      { name: 'jadad_score', type: 'number', description: 'Jadad quality score (0-5)', validation: { min: 0, max: 5 } }
    ],
    isActive: true
  }
]

export function ExtractionTemplates({ projectId, onTemplateSelect, selectedTemplateId }: ExtractionTemplatesProps) {
  const [templates, setTemplates] = useState<ExtractionTemplate[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ExtractionTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useSupabaseClient()

  useEffect(() => {
    loadTemplates()
  }, [projectId])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('extraction_templates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTemplates(data || [])
    } catch (err) {
      console.error('Error loading templates:', err)
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const createDefaultTemplates = async () => {
    try {
      const templateData = DEFAULT_TEMPLATES.map(template => ({
        project_id: projectId,
        name: template.name!,
        fields: template.fields!,
        is_active: template.isActive!
      }))

      const { error } = await supabase
        .from('extraction_templates')
        .insert(templateData)

      if (error) throw error

      await loadTemplates()
    } catch (err) {
      console.error('Error creating default templates:', err)
      setError(err instanceof Error ? err.message : 'Failed to create default templates')
    }
  }

  const saveTemplate = async (template: Partial<ExtractionTemplate>) => {
    try {
      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('extraction_templates')
          .update({
            name: template.name,
            fields: template.fields,
            is_active: template.isActive,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTemplate.id)

        if (error) throw error
      } else {
        // Create new template
        const { error } = await supabase
          .from('extraction_templates')
          .insert({
            project_id: projectId,
            name: template.name!,
            fields: template.fields!,
            is_active: template.isActive ?? true
          })

        if (error) throw error
      }

      await loadTemplates()
      setIsCreating(false)
      setEditingTemplate(null)
    } catch (err) {
      console.error('Error saving template:', err)
      setError(err instanceof Error ? err.message : 'Failed to save template')
    }
  }

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('extraction_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error

      await loadTemplates()
    } catch (err) {
      console.error('Error deleting template:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete template')
    }
  }

  const duplicateTemplate = async (template: ExtractionTemplate) => {
    try {
      const { error } = await supabase
        .from('extraction_templates')
        .insert({
          project_id: projectId,
          name: `${template.name} (Copy)`,
          fields: template.fields,
          is_active: true
        })

      if (error) throw error

      await loadTemplates()
    } catch (err) {
      console.error('Error duplicating template:', err)
      setError(err instanceof Error ? err.message : 'Failed to duplicate template')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Data Extraction Templates</h3>
        <div className="flex space-x-2">
          {templates.length === 0 && (
            <button
              onClick={createDefaultTemplates}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Settings className="h-4 w-4 mr-2" />
              Create Default Templates
            </button>
          )}
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Templates List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
              selectedTemplateId === template.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onTemplateSelect?.(template)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-grow">
                  <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {template.fields.length} fields • {template.isActive ? 'Active' : 'Inactive'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Created {new Date(template.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingTemplate(template)
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    duplicateTemplate(template)
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete template "${template.name}"?`)) {
                      deleteTemplate(template.id)
                    }
                  }}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Fields Preview */}
            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-2">Fields:</div>
              <div className="space-y-1">
                {template.fields.slice(0, 3).map((field, index) => (
                  <div key={index} className="text-xs bg-gray-50 rounded px-2 py-1">
                    <span className="font-medium">{field.name}</span>
                    <span className="text-gray-500 ml-1">({field.type})</span>
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                ))}
                {template.fields.length > 3 && (
                  <div className="text-xs text-gray-400">
                    +{template.fields.length - 3} more fields
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Template Modal would go here */}
      {(isCreating || editingTemplate) && (
        <TemplateEditor
          template={editingTemplate}
          onSave={saveTemplate}
          onCancel={() => {
            setIsCreating(false)
            setEditingTemplate(null)
          }}
        />
      )}
    </div>
  )
}

interface TemplateEditorProps {
  template?: ExtractionTemplate | null
  onSave: (template: Partial<ExtractionTemplate>) => void
  onCancel: () => void
}

function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || '')
  const [fields, setFields] = useState<ExtractionField[]>(template?.fields || [])
  const [isActive, setIsActive] = useState(template?.isActive ?? true)

  const addField = () => {
    setFields([...fields, {
      name: '',
      type: 'text',
      description: '',
      required: false
    }])
  }

  const updateField = (index: number, updates: Partial<ExtractionField>) => {
    const updated = [...fields]
    updated[index] = { ...updated[index], ...updates }
    setFields(updated)
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!name.trim()) {
      alert('Template name is required')
      return
    }

    if (fields.length === 0) {
      alert('At least one field is required')
      return
    }

    const validFields = fields.filter(field => field.name.trim())
    if (validFields.length !== fields.length) {
      alert('All fields must have a name')
      return
    }

    onSave({
      name: name.trim(),
      fields: validFields,
      isActive
    })
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {template ? 'Edit Template' : 'Create New Template'}
          </h3>
        </div>

        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Template Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Template Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter template name"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            {/* Fields */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-gray-900">Extraction Fields</h4>
                <button
                  onClick={addField}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(index, { name: e.target.value })}
                          placeholder="Field name"
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(index, { type: e.target.value as any })}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="date">Date</option>
                          <option value="list">List</option>
                          <option value="json">JSON</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={field.required || false}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                          <span className="ml-1 text-sm text-gray-700">Required</span>
                        </label>
                        <button
                          onClick={() => removeField(index)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={field.description || ''}
                        onChange={(e) => updateField(index, { description: e.target.value })}
                        placeholder="Field description (optional)"
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2 inline" />
            Save Template
          </button>
        </div>
      </div>
    </div>
  )
}