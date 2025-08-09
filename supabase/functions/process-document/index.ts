// Edge Function for processing uploaded documents and PDFs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessRequest {
  projectId: string
  fileName: string
  fileUrl?: string
  fileContent?: string // Base64 encoded
  processType: 'text_extraction' | 'data_extraction' | 'full_analysis'
  extractionTemplate?: Record<string, unknown>
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

    // Verify user authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { 
      projectId, 
      fileName, 
      fileUrl, 
      fileContent, 
      processType, 
      extractionTemplate 
    }: ProcessRequest = await req.json()

    // Validate project ownership
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found or access denied' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    let documentText = ''
    
    // Extract text from document
    if (fileContent) {
      // Process base64 content (simplified - would use proper PDF parsing)
      try {
        const buffer = Uint8Array.from(atob(fileContent), c => c.charCodeAt(0))
        documentText = await extractTextFromBuffer(buffer, fileName)
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to process file content' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    } else if (fileUrl) {
      // Download and process file from URL
      try {
        const fileResponse = await fetch(fileUrl)
        if (!fileResponse.ok) {
          throw new Error(`Failed to fetch file: ${fileResponse.status}`)
        }
        const buffer = new Uint8Array(await fileResponse.arrayBuffer())
        documentText = await extractTextFromBuffer(buffer, fileName)
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to download and process file' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Either fileContent or fileUrl must be provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let result: any = { extractedText: documentText }

    // Process based on type
    switch (processType) {
      case 'text_extraction':
        // Basic text extraction only
        result = { extractedText: documentText }
        break

      case 'data_extraction':
        // Use AI to extract specific data points
        if (extractionTemplate) {
          result = await extractDataWithAI(documentText, extractionTemplate)
        } else {
          result = { extractedText: documentText, warning: 'No extraction template provided' }
        }
        break

      case 'full_analysis':
        // Comprehensive analysis using AI
        result = await analyzeDocumentWithAI(documentText)
        break
    }

    // Create article record if this is a new document
    const { data: article, error: articleError } = await supabaseClient
      .from('articles')
      .insert({
        project_id: projectId,
        source: 'manual',
        title: fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
        full_text: documentText,
        extracted_data: processType !== 'text_extraction' ? result : null,
        status: 'completed',
        metadata: {
          fileName,
          processType,
          processedAt: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (articleError) {
      console.error('Error creating article record:', articleError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        result,
        articleId: article?.id,
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

// Extract text from document buffer (simplified implementation)
async function extractTextFromBuffer(buffer: Uint8Array, fileName: string): Promise<string> {
  const fileExtension = fileName.toLowerCase().split('.').pop()

  switch (fileExtension) {
    case 'pdf':
      // Would use a PDF parsing library like pdf-parse
      return `[PDF TEXT] - Content from ${fileName} (PDF parsing not implemented in this demo)`

    case 'txt':
      // Simple text file
      return new TextDecoder().decode(buffer)

    case 'docx':
      // Would use a Word document parser
      return `[DOCX TEXT] - Content from ${fileName} (DOCX parsing not implemented in this demo)`

    default:
      // Try to decode as text
      try {
        return new TextDecoder().decode(buffer)
      } catch {
        throw new Error(`Unsupported file type: ${fileExtension}`)
      }
  }
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