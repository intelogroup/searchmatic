// Edge Function for AI-powered literature analysis
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisRequest {
  articleText: string
  analysisType: 'summary' | 'extraction' | 'quality' | 'bias'
  projectId: string
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
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { articleText, analysisType, projectId, extractionTemplate }: AnalysisRequest = await req.json()

    // Validate request
    if (!articleText || !analysisType || !projectId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: articleText, analysisType, projectId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verify project ownership
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

    // Call OpenAI API for analysis
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
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
        return new Response(
          JSON.stringify({ error: 'Invalid analysis type' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API Error:', errorText)
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const openaiData = await openaiResponse.json()
    const analysis = openaiData.choices[0]?.message?.content

    if (!analysis) {
      return new Response(
        JSON.stringify({ error: 'No analysis generated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Store analysis results (optional - you might want to log these)
    // const analysisResult = {
    //   projectId,
    //   analysisType,
    //   analysis,
    //   timestamp: new Date().toISOString(),
    //   userId: user.id,
    // }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        analysisType,
        timestamp: new Date().toISOString(),
        usage: openaiData.usage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Analysis Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

/* Usage Example:

POST /functions/v1/analyze-literature
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "articleText": "Full text of the research article...",
  "analysisType": "summary",
  "projectId": "uuid-of-project",
  "extractionTemplate": {
    "study_design": "string",
    "sample_size": "number",
    "outcomes": "array"
  }
}

*/