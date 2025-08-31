import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { DocumentUpload } from '../components/DocumentUpload'
import { ExtractionTemplates } from '../components/ExtractionTemplates'
import { ExtractionWorkflow } from '../components/ExtractionWorkflow'
import { FileText, Upload, Settings, BarChart3 } from 'lucide-react'

export default function DocumentProcessing() {
  const { projectId } = useParams<{ projectId: string }>()
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [uploadCount, setUploadCount] = useState(0)

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Project ID required</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select a project to access document processing features.
          </p>
        </div>
      </div>
    )
  }

  const handleUploadComplete = (result: any) => {
    console.log('Upload completed:', result)
    setUploadCount(prev => prev + 1)
    // Could show a toast notification here
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
    // Could show a toast notification here
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Processing</h1>
          <p className="mt-2 text-gray-600">
            Upload documents, configure extraction templates, and track processing workflow.
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Workflow</span>
            </TabsTrigger>
            <TabsTrigger value="extraction" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Results</span>
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Upload Documents
                </h3>
                <DocumentUpload
                  projectId={projectId}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Documents Uploaded Today
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {uploadCount}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Settings className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Templates
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {selectedTemplate ? 1 : 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BarChart3 className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Processing Queue
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          Live
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Upload Tips
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>PDF files work best for academic papers and research documents</li>
                      <li>Use "Full Analysis" for comprehensive AI-powered extraction</li>
                      <li>Create extraction templates for consistent data structure</li>
                      <li>Large files (>10MB) may take longer to process</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <ExtractionTemplates
                  projectId={projectId}
                  onTemplateSelect={setSelectedTemplate}
                  selectedTemplateId={selectedTemplate?.id}
                />
              </div>
            </div>

            {/* Template Usage Guide */}
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Settings className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Template Usage Guide
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Use PICO templates for clinical research studies</li>
                      <li>Quality Assessment templates help evaluate study bias</li>
                      <li>Create custom templates for specific research domains</li>
                      <li>Required fields ensure consistent data extraction</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6">
            <ExtractionWorkflow projectId={projectId} />
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="extraction" className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Extraction Results
                </h3>
                
                {selectedTemplate ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <p className="text-sm text-green-700">
                        Using template: <strong>{selectedTemplate.name}</strong>
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {selectedTemplate.fields.length} fields configured
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-center text-lg font-medium text-gray-900 mb-2">
                        Ready for Extraction
                      </h3>
                      <p className="text-center text-gray-500 mb-4">
                        Upload documents using the selected template for structured data extraction.
                      </p>
                      <div className="text-center">
                        <button
                          onClick={() => {
                            // Switch to upload tab
                            document.querySelector('[value="upload"]')?.click()
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Documents
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Settings className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No Template Selected
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Create or select an extraction template to structure your data extraction.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          // Switch to templates tab
                          document.querySelector('[value="templates"]')?.click()
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configure Templates
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}