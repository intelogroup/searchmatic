// Edge Function for processing uploaded documents and PDFs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// PDF parsing will be imported dynamically when needed
// Using Web API crypto for hashing

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessRequest {
  projectId: string
  fileName: string
  fileUrl?: string
  fileContent?: string // Base64 encoded
  processType: 'text_extraction' | 'data_extraction' | 'full_analysis' | 'ocr_extraction'
  extractionTemplate?: Record<string, unknown>
  priority?: number
  language?: string
}

interface ProcessingResult {
  success: boolean
  extractedText?: string
  extractedData?: any
  analysis?: string
  pdfFileId?: string
  articleId?: string
  queueId?: string
  metadata?: Record<string, any>
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verify user authentication or service role
    const authHeader = req.headers.get('Authorization')
    let isServiceRole = false
    let userId: string
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      try {
        // Decode JWT payload to check role
        const payload = JSON.parse(atob(token.split('.')[1]))
        isServiceRole = payload.role === 'service_role'
      } catch (e) {
        // Invalid JWT format, continue with normal flow
      }
    }
    
    const { 
      projectId, 
      fileName, 
      fileUrl, 
      fileContent, 
      processType, 
      extractionTemplate,
      priority = 5,
      language = 'en'
    }: ProcessRequest = await req.json()

    if (isServiceRole) {
      // For service role, use the project owner's ID or a service user ID
      const { data: project } = await supabaseClient
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single()
      
      userId = project?.user_id || 'service-role-user'
    } else {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - invalid user token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
      userId = user.id
    }

    // Validate project ownership (skip for service role)
    if (!isServiceRole) {
      const { data: project, error: projectError } = await supabaseClient
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single()

      if (projectError || !project) {
        return new Response(
          JSON.stringify({ error: 'Project not found or access denied' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }
    }

    let documentBuffer: Uint8Array
    let documentText = ''
    let fileHash = ''
    let fileSize = 0
    let mimeType = 'application/octet-stream'
    
    // Get file buffer
    if (fileContent) {
      try {
        documentBuffer = Uint8Array.from(atob(fileContent), c => c.charCodeAt(0))
        fileSize = documentBuffer.length
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Invalid base64 content' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    } else if (fileUrl) {
      try {
        const fileResponse = await fetch(fileUrl)
        if (!fileResponse.ok) {
          throw new Error(`Failed to fetch file: ${fileResponse.status}`)
        }
        documentBuffer = new Uint8Array(await fileResponse.arrayBuffer())
        fileSize = documentBuffer.length
        mimeType = fileResponse.headers.get('content-type') || mimeType
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to download file' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Either fileContent or fileUrl must be provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Calculate file hash using Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', documentBuffer)
    fileHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Check if file already exists
    const { data: existingPdf } = await supabaseClient
      .from('pdf_files')
      .select('id, article_id, processing_status')
      .eq('file_hash', fileHash)
      .single()

    let pdfFileId: string
    let articleId: string

    if (existingPdf) {
      pdfFileId = existingPdf.id
      articleId = existingPdf.article_id
      
      // If already processed, return existing results
      if (existingPdf.processing_status === 'completed') {
        const { data: article } = await supabaseClient
          .from('articles')
          .select('full_text, extracted_data')
          .eq('id', articleId)
          .single()

        return new Response(
          JSON.stringify({
            success: true,
            result: {
              extractedText: article?.full_text,
              extractedData: article?.extracted_data
            },
            pdfFileId,
            articleId,
            processType,
            fromCache: true,
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // Create article record
      const { data: article, error: articleError } = await supabaseClient
        .from('articles')
        .insert({
          project_id: projectId,
          source: 'manual',
          title: fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
          status: 'processing',
          metadata: {
            fileName,
            processType,
            uploadedAt: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (articleError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create article record' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      articleId = article.id

      // Store file in Supabase Storage
      const storagePath = `uploads/${projectId}/${fileHash}_${fileName}`
      const { error: uploadError } = await supabaseClient.storage
        .from('documents')
        .upload(storagePath, documentBuffer, {
          contentType: mimeType,
          upsert: true
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
      }

      // Create PDF file record
      const { data: pdfFile, error: pdfError } = await supabaseClient
        .from('pdf_files')
        .insert({
          article_id: articleId,
          storage_path: storagePath,
          file_name: fileName,
          file_size: fileSize,
          mime_type: mimeType,
          file_hash: fileHash,
          language,
          processing_status: 'processing',
          needs_ocr: processType === 'ocr_extraction'
        })
        .select()
        .single()

      if (pdfError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create PDF file record' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      pdfFileId = pdfFile.id
    }

    // Process the document
    try {
      documentText = await extractTextFromBuffer(documentBuffer, fileName, language)
    } catch (error) {
      await logProcessingError(supabaseClient, pdfFileId, 'Text extraction failed', error.message)
      return new Response(
        JSON.stringify({ error: 'Failed to extract text from document' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let result: any = { extractedText: documentText }

    // Process based on type
    switch (processType) {
      case 'text_extraction':
        result = { extractedText: documentText }
        break

      case 'data_extraction':
        if (extractionTemplate) {
          result = await extractDataWithAI(documentText, extractionTemplate)
        } else {
          result = { extractedText: documentText, warning: 'No extraction template provided' }
        }
        break

      case 'full_analysis':
        result = await analyzeDocumentWithAI(documentText)
        break

      case 'ocr_extraction':
        // Queue for OCR processing if needed
        const { data: queueItem } = await supabaseClient
          .from('pdf_processing_queue')
          .insert({
            pdf_file_id: pdfFileId,
            priority,
            processing_type: 'ocr',
            processing_options: { language }
          })
          .select()
          .single()

        return new Response(
          JSON.stringify({
            success: true,
            result: { message: 'Queued for OCR processing' },
            pdfFileId,
            articleId,
            queueId: queueItem?.id,
            processType,
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Update article with results
    const { error: updateError } = await supabaseClient
      .from('articles')
      .update({
        full_text: documentText,
        extracted_data: processType !== 'text_extraction' ? result : null,
        status: 'completed',
        metadata: {
          fileName,
          processType,
          processedAt: new Date().toISOString()
        }
      })
      .eq('id', articleId)

    if (updateError) {
      await logProcessingError(supabaseClient, pdfFileId, 'Article update failed', updateError.message)
    } else {
      // Update PDF file status
      await supabaseClient
        .from('pdf_files')
        .update({
          processing_status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', pdfFileId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        result,
        pdfFileId,
        articleId,
        processType,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Process Document Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Extract text from document buffer with proper PDF parsing
async function extractTextFromBuffer(buffer: Uint8Array, fileName: string, language = 'en'): Promise<string> {
  const fileExtension = fileName.toLowerCase().split('.').pop()

  switch (fileExtension) {
    case 'pdf':
      try {
        // Dynamically import PDF parser
        const { default: pdfParse } = await import("https://esm.sh/pdf-parse@1.1.1")
        const pdfData = await pdfParse(buffer)
        return pdfData.text || '[PDF contains no extractable text]'
      } catch (error) {
        console.error('PDF parsing error:', error)
        throw new Error(`Failed to parse PDF: ${error.message}`)
      }

    case 'txt':
      return new TextDecoder('utf-8').decode(buffer)

    case 'docx':
      // For now, return placeholder - would implement proper DOCX parsing
      return `[DOCX parsing not yet implemented for ${fileName}]`

    case 'rtf':
      // Basic RTF text extraction (simplified)
      const rtfText = new TextDecoder('utf-8').decode(buffer)
      return rtfText.replace(/\\[a-z]+\d*\s?/g, ' ').replace(/[{}]/g, '').trim()

    default:
      // Try to decode as text
      try {
        const text = new TextDecoder('utf-8').decode(buffer)
        if (text.trim().length === 0) {
          throw new Error('Document appears to be empty or unreadable')
        }
        return text
      } catch {
        throw new Error(`Unsupported file type: ${fileExtension}`)
      }
  }
}

// Log processing errors to the database
async function logProcessingError(supabaseClient: any, pdfFileId: string, message: string, details: string) {
  await supabaseClient
    .from('pdf_processing_logs')
    .insert({
      pdf_file_id: pdfFileId,
      log_level: 'error',
      message,
      metadata: { details, timestamp: new Date().toISOString() }
    })

  // Get current attempts count and increment
  const { data: currentFile } = await supabaseClient
    .from('pdf_files')
    .select('processing_attempts')
    .eq('id', pdfFileId)
    .single()
  
  const newAttempts = (currentFile?.processing_attempts || 0) + 1

  await supabaseClient
    .from('pdf_files')
    .update({
      processing_status: 'failed',
      processing_error: details,
      processing_attempts: newAttempts
    })
    .eq('id', pdfFileId)
}

// Extract structured data using AI
async function extractDataWithAI(text: string, template: Record<string, unknown>): Promise<any> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    return { error: 'AI service not available' }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a data extraction specialist. Extract the requested information from research documents and return it as structured JSON.'
          },
          {
            role: 'user',
            content: `Extract data from this document according to the template:\n\nTemplate: ${JSON.stringify(template, null, 2)}\n\nDocument text: ${text.substring(0, 4000)}...`
          }
        ],
        temperature: 0.1,
        max_tokens: 1500
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const extractedData = data.choices[0]?.message?.content

    try {
      return {
        extractedData: JSON.parse(extractedData),
        extractedText: text
      }
    } catch {
      return {
        extractedData: extractedData,
        extractedText: text,
        note: 'AI response was not valid JSON'
      }
    }

  } catch (error) {
    console.error('AI extraction error:', error)
    return {
      error: 'AI extraction failed',
      extractedText: text
    }
  }
}

// Analyze document comprehensively with AI
async function analyzeDocumentWithAI(text: string): Promise<any> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    return { 
      extractedText: text,
      analysis: 'AI analysis not available - API key not configured' 
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a research analysis expert. Analyze research documents and provide structured insights including methodology, findings, strengths, limitations, and relevance for systematic reviews.'
          },
          {
            role: 'user',
            content: `Analyze this research document and provide insights:\n\n${text.substring(0, 4000)}...`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const analysis = data.choices[0]?.message?.content

    return {
      extractedText: text,
      analysis,
      usage: data.usage,
      processedAt: new Date().toISOString()
    }

  } catch (error) {
    console.error('AI analysis error:', error)
    return {
      extractedText: text,
      analysis: `Analysis failed: ${error.message}`
    }
  }
}

/* Usage Example:

POST /functions/v1/process-document
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "projectId": "uuid-of-project",
  "fileName": "research-paper.pdf",
  "fileContent": "base64-encoded-content...",
  "processType": "full_analysis",
  "extractionTemplate": {
    "study_design": "string",
    "sample_size": "number",
    "main_findings": "string",
    "limitations": "string"
  }
}

Response:
{
  "success": true,
  "result": {
    "extractedText": "Full document text...",
    "analysis": "AI analysis of the document...",
    "usage": {...}
  },
  "articleId": "uuid-of-created-article",
  "processType": "full_analysis",
  "timestamp": "2025-01-09T..."
}

*/