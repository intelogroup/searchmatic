// Test version of literature analysis - relaxed validation for testing AI functionality
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { authenticateUser, createErrorResponse, createSuccessResponse } from '../_shared/auth.ts'

interface AnalysisRequest {
  articleText: string
  analysisType: 'summary' | 'extraction' | 'quality' | 'bias'
  projectId: string
  extractionTemplate?: Record<string, unknown>
}

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Authenticate user
    const { user, supabase } = await authenticateUser(req)

    const { articleText, analysisType, projectId, extractionTemplate }: AnalysisRequest = await req.json()

    // Validate request
    if (!articleText || !analysisType || !projectId) {
      throw new Error('Missing required fields: articleText, analysisType, projectId')
    }

    // Relaxed project validation for testing
    if (projectId && !projectId.startsWith('test-')) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single()

      if (projectError || !project) {
        throw new Error('Project not found or access denied')
      }
    }

    // Call OpenAI API for analysis
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    let systemPrompt: string
    let userPrompt: string

    switch (analysisType) {
      case 'summary':
        systemPrompt = "You are a research assistant specializing in systematic literature reviews. Provide concise, accurate summaries of research articles."
        userPrompt = `Please provide a structured summary of this research article including: 1) Main research question/objective, 2) Methodology, 3) Key findings, 4) Conclusions, 5) Limitations. Article text: ${articleText}`
        break
      
      case 'extraction':
        systemPrompt = "You are a data extraction specialist for systematic reviews. Extract specific data points according to the provided template."
        userPrompt = `Extract data from this article according to the template: ${JSON.stringify(extractionTemplate)}. Article text: ${articleText}`
        break
      
      case 'quality':
        systemPrompt = "You are a research quality assessor. Evaluate the methodological quality and risk of bias in research studies."
        userPrompt = `Assess the methodological quality of this study. Consider: study design, sample size, methodology, data analysis, reporting quality, and potential sources of bias. Provide a structured assessment. Article text: ${articleText}`
        break
      
      case 'bias':
        systemPrompt = "You are a bias detection expert for systematic reviews. Identify potential sources of bias in research studies."
        userPrompt = `Identify and analyze potential sources of bias in this study including: selection bias, performance bias, detection bias, attrition bias, reporting bias, and other methodological concerns. Article text: ${articleText}`
        break
      
      default:
        throw new Error('Invalid analysis type')
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API Error:', errorText)
      throw new Error('AI analysis failed')
    }

    const openaiData = await openaiResponse.json()
    const analysis = openaiData.choices[0]?.message?.content

    if (!analysis) {
      throw new Error('No analysis generated')
    }

    return createSuccessResponse({
      success: true,
      analysis,
      analysisType,
      usage: openaiData.usage,
      user_id: user.id,
      test_mode: projectId?.startsWith('test-') || false
    })

  } catch (error) {
    console.error('Analysis Error:', error)
    return createErrorResponse(error, error.message.includes('Unauthorized') ? 401 : 500)
  }
})