import React, { useState, useCallback, useRef } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Upload, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface DocumentUploadProps {
  projectId: string
  onUploadComplete?: (result: UploadResult) => void
  onUploadError?: (error: string) => void
}

interface UploadResult {
  success: boolean
  pdfFileId?: string
  articleId?: string
  fileName: string
  extractedText?: string
}

interface UploadProgress {
  fileName: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
  result?: UploadResult
}

const ALLOWED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'application/rtf': '.rtf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_FILES = 10

export function DocumentUpload({ projectId, onUploadComplete, onUploadError }: DocumentUploadProps) {
  const [uploads, setUploads] = useState<Record<string, UploadProgress>>({})
  const [processingType, setProcessingType] = useState<'text_extraction' | 'data_extraction' | 'full_analysis'>('text_extraction')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = useSupabaseClient()

  const validateFile = (file: File): string | null => {
    if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
      return `File type ${file.type} is not supported. Allowed types: PDF, TXT, RTF, DOCX`
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }

    return null
  }

  const processFile = async (file: File): Promise<UploadResult> => {
    const fileId = `${file.name}-${Date.now()}`
    
    // Convert file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data:mime;base64, prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    // Update progress
    setUploads(prev => ({
      ...prev,
      [fileId]: { fileName: file.name, status: 'processing', progress: 50 }
    }))

    // Get JWT token
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Authentication required')
    }

    // Call edge function
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/process-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        fileName: file.name,
        fileContent: base64,
        processType: processingType,
        language: 'en'
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Upload failed')
    }

    const result = await response.json()
    
    return {
      success: result.success,
      pdfFileId: result.pdfFileId,
      articleId: result.articleId,
      fileName: file.name,
      extractedText: result.result?.extractedText
    }
  }

  const handleFiles = useCallback(async (files: FileList) => {
    const filesToProcess = Array.from(files).slice(0, MAX_FILES)
    
    for (const file of filesToProcess) {
      const validationError = validateFile(file)
      const fileId = `${file.name}-${Date.now()}`

      if (validationError) {
        setUploads(prev => ({
          ...prev,
          [fileId]: { 
            fileName: file.name, 
            status: 'error', 
            progress: 0, 
            error: validationError 
          }
        }))
        onUploadError?.(validationError)
        continue
      }

      // Start upload
      setUploads(prev => ({
        ...prev,
        [fileId]: { fileName: file.name, status: 'uploading', progress: 0 }
      }))

      try {
        setUploads(prev => ({
          ...prev,
          [fileId]: { ...prev[fileId], progress: 25 }
        }))

        const result = await processFile(file)

        setUploads(prev => ({
          ...prev,
          [fileId]: { 
            fileName: file.name, 
            status: 'completed', 
            progress: 100,
            result
          }
        }))

        onUploadComplete?.(result)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Upload failed'
        setUploads(prev => ({
          ...prev,
          [fileId]: { 
            fileName: file.name, 
            status: 'error', 
            progress: 0, 
            error: errorMsg 
          }
        }))
        onUploadError?.(errorMsg)
      }
    }
  }, [projectId, processingType, supabase, onUploadComplete, onUploadError])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const clearCompleted = () => {
    setUploads(prev => {
      const filtered = Object.fromEntries(
        Object.entries(prev).filter(([, upload]) => upload.status !== 'completed')
      )
      return filtered
    })
  }

  const hasUploads = Object.keys(uploads).length > 0
  const hasCompleted = Object.values(uploads).some(upload => upload.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Processing Type Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Processing Type
        </label>
        <select 
          value={processingType} 
          onChange={(e) => setProcessingType(e.target.value as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="text_extraction">Text Extraction Only</option>
          <option value="data_extraction">Data Extraction with AI</option>
          <option value="full_analysis">Full Analysis with AI</option>
        </select>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={Object.values(ALLOWED_FILE_TYPES).join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        {isDragOver ? (
          <p className="text-lg text-blue-600">Drop the files here...</p>
        ) : (
          <div className="space-y-2">
            <p className="text-lg text-gray-600">
              Drag & drop documents here, or click to select files
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, TXT, RTF, DOCX • Max {MAX_FILE_SIZE / 1024 / 1024}MB per file • Up to {MAX_FILES} files
            </p>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {hasUploads && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Upload Progress</h3>
            {hasCompleted && (
              <button
                onClick={clearCompleted}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Completed
              </button>
            )}
          </div>

          <div className="space-y-2">
            {Object.entries(uploads).map(([fileId, upload]) => (
              <div key={fileId} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {upload.status === 'uploading' && (
                      <Clock className="h-5 w-5 text-blue-500 animate-spin" />
                    )}
                    {upload.status === 'processing' && (
                      <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />
                    )}
                    {upload.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {upload.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        {upload.fileName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {upload.status === 'completed' ? 'Complete' : 
                         upload.status === 'error' ? 'Failed' :
                         upload.status === 'processing' ? 'Processing...' : 'Uploading...'}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    {(upload.status === 'uploading' || upload.status === 'processing') && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {/* Error Message */}
                    {upload.error && (
                      <p className="text-sm text-red-600 mt-1">{upload.error}</p>
                    )}
                    
                    {/* Success Info */}
                    {upload.result && upload.status === 'completed' && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p>✓ Text extracted successfully</p>
                        {upload.result.extractedText && (
                          <p>📄 {upload.result.extractedText.length} characters extracted</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}