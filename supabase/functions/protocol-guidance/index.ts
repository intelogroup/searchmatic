// Edge Function for AI-powered research protocol guidance and validation
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProtocolGuidanceRequest {
  projectId?: string
  type: 'create' | 'validate' | 'improve' | 'framework'
  researchQuestion: string
  currentProtocol?: Record<string, any>
  focusArea?: 'pico' | 'spider' | 'inclusion' | 'exclusion' | 'search_strategy' | 'data_extraction' | 'quality_assessment'
  reviewType?: 'systematic_review' | 'meta_analysis' | 'scoping_review' | 'narrative_review' | 'umbrella_review'
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
      type,
      researchQuestion,
      currentProtocol,
      focusArea,
      reviewType = 'systematic_review'
    }: ProtocolGuidanceRequest = await req.json()

    // Validate project ownership if projectId provided
    if (projectId) {
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
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Generate guidance based on type
    let guidance: any

    switch (type) {
      case 'create':
        guidance = await createProtocol(openaiApiKey, researchQuestion, reviewType, focusArea)
        break
      
      case 'validate':
        guidance = await validateProtocol(openaiApiKey, currentProtocol, researchQuestion, reviewType)
        break
      
      case 'improve':
        guidance = await improveProtocol(openaiApiKey, currentProtocol, researchQuestion, reviewType, focusArea)
        break
      
      case 'framework':
        guidance = await generateFramework(openaiApiKey, researchQuestion, focusArea, reviewType)
        break
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid guidance type' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    // Store protocol guidance if projectId provided
    if (projectId && guidance.success) {
      await supabaseClient
        .from('protocols')
        .upsert({
          project_id: projectId,
          protocol_data: guidance.protocol || guidance.framework || currentProtocol,
          ai_guidance: guidance.guidance,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'project_id'
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        guidance,
        type,
        focusArea,
        reviewType,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Protocol Guidance Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Create new protocol
async function createProtocol(apiKey: string, researchQuestion: string, reviewType: string, focusArea?: string): Promise<any> {
  const systemPrompt = `You are a world-class research methodology expert specializing in systematic literature reviews and meta-analyses. You help researchers create comprehensive, high-quality research protocols following PRISMA, Cochrane, and JBI guidelines.

Create a complete research protocol with specific, actionable components. Always provide structured, detailed guidance with rationale.`

  let userPrompt = `Create a comprehensive research protocol for a ${reviewType} with this research question:

"${researchQuestion}"

Please provide a structured protocol including:
1. Background and rationale
2. Objectives (primary and secondary)
3. Methods (PICO/SPIDER framework, inclusion/exclusion criteria)
4. Search strategy (databases, keywords, limits)
5. Study selection process
6. Data extraction plan
7. Quality assessment approach
8. Data synthesis methods
9. Timeline and resources needed

Format the response as structured JSON with detailed explanations.`

  if (focusArea) {
    const focusDescriptions = {
      pico: 'Focus particularly on developing a robust PICO framework',
      spider: 'Focus particularly on developing a comprehensive SPIDER framework',
      inclusion: 'Focus particularly on defining clear, specific inclusion criteria',
      exclusion: 'Focus particularly on defining comprehensive exclusion criteria',
      search_strategy: 'Focus particularly on developing an optimal search strategy',
      data_extraction: 'Focus particularly on designing the data extraction process',
      quality_assessment: 'Focus particularly on selecting appropriate quality assessment tools'
    }
    userPrompt += `\n\n${focusDescriptions[focusArea as keyof typeof focusDescriptions]}`
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    // Try to parse as JSON, fallback to text
    let protocol
    try {
      protocol = JSON.parse(content)
    } catch {
      protocol = { guidance: content, structured: false }
    }

    return {
      success: true,
      protocol,
      guidance: content,
      usage: data.usage
    }

  } catch (error) {
    console.error('Create protocol error:', error)
    return {
      success: false,
      error: 'Failed to generate protocol guidance'
    }
  }
}

// Validate existing protocol
async function validateProtocol(apiKey: string, protocol: any, researchQuestion: string, reviewType: string): Promise<any> {
  const systemPrompt = `You are a senior research methodology reviewer. Evaluate research protocols for completeness, rigor, and adherence to established guidelines (PRISMA, Cochrane, JBI).

Provide constructive feedback with specific recommendations for improvement.`

  const userPrompt = `Please validate this ${reviewType} protocol for the research question: "${researchQuestion}"

Current Protocol:
${JSON.stringify(protocol, null, 2)}

Evaluate:
1. Completeness - Are all essential components present?
2. Clarity - Are objectives and methods clearly defined?
3. Feasibility - Is the approach realistic and well-planned?
4. Rigor - Does it meet methodological standards?
5. Compliance - Does it follow relevant guidelines?

Provide specific recommendations for improvement with rationale.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 2500
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const validation = data.choices[0]?.message?.content

    return {
      success: true,
      validation,
      originalProtocol: protocol,
      usage: data.usage
    }

  } catch (error) {
    console.error('Validate protocol error:', error)
    return {
      success: false,
      error: 'Failed to validate protocol'
    }
  }
}

// Improve existing protocol
async function improveProtocol(apiKey: string, protocol: any, researchQuestion: string, reviewType: string, focusArea?: string): Promise<any> {
  const systemPrompt = `You are an expert research methodology consultant. Help researchers enhance their protocols by providing specific improvements and refinements while maintaining scientific rigor.`

  let userPrompt = `Improve this ${reviewType} protocol for: "${researchQuestion}"

Current Protocol:
${JSON.stringify(protocol, null, 2)}

Please provide an enhanced version with:
1. Refined methodology
2. Strengthened inclusion/exclusion criteria
3. Improved search strategy
4. Enhanced data extraction plan
5. More robust quality assessment approach

Explain your improvements with clear rationale.`

  if (focusArea) {
    const improvements = {
      pico: 'Particularly focus on refining the PICO framework elements',
      spider: 'Particularly focus on strengthening the SPIDER framework',
      inclusion: 'Particularly focus on improving inclusion criteria specificity',
      exclusion: 'Particularly focus on comprehensive exclusion criteria',
      search_strategy: 'Particularly focus on optimizing the search strategy',
      data_extraction: 'Particularly focus on enhancing data extraction procedures',
      quality_assessment: 'Particularly focus on improving quality assessment methods'
    }
    userPrompt += `\n\n${improvements[focusArea as keyof typeof improvements]}`
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const improvements = data.choices[0]?.message?.content

    return {
      success: true,
      improvements,
      originalProtocol: protocol,
      usage: data.usage
    }

  } catch (error) {
    console.error('Improve protocol error:', error)
    return {
      success: false,
      error: 'Failed to improve protocol'
    }
  }
}

// Generate specific framework (PICO/SPIDER)
async function generateFramework(apiKey: string, researchQuestion: string, focusArea?: string, reviewType: string = 'systematic_review'): Promise<any> {
  const systemPrompt = `You are a research framework specialist. Generate detailed, well-structured research frameworks (PICO, SPIDER) that guide systematic literature searches and reviews.`

  const frameworks = {
    pico: 'PICO (Population, Intervention, Comparison, Outcome)',
    spider: 'SPIDER (Sample, Phenomenon of Interest, Design, Evaluation, Research type)',
    search_strategy: 'comprehensive search strategy with databases, keywords, and syntax',
    data_extraction: 'data extraction framework with specific fields and procedures',
    quality_assessment: 'quality assessment framework with appropriate tools and criteria'
  }

  const frameworkType = focusArea || 'pico'
  const frameworkName = frameworks[frameworkType as keyof typeof frameworks]

  const userPrompt = `Create a detailed ${frameworkName} framework for this ${reviewType}:

Research Question: "${researchQuestion}"

Provide:
1. Structured framework components
2. Specific definitions for each element
3. Examples and operationalization
4. Search terms derived from framework
5. Inclusion/exclusion criteria based on framework

Format as structured JSON with detailed explanations.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 2000
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    // Try to parse as JSON
    let framework
    try {
      framework = JSON.parse(content)
    } catch {
      framework = { guidance: content, structured: false }
    }

    return {
      success: true,
      framework,
      frameworkType,
      guidance: content,
      usage: data.usage
    }

  } catch (error) {
    console.error('Generate framework error:', error)
    return {
      success: false,
      error: 'Failed to generate framework'
    }
  }
}

/* Usage Examples:

1. Create Protocol:
POST /functions/v1/protocol-guidance
{
  "projectId": "uuid",
  "type": "create",
  "researchQuestion": "What is the effectiveness of mindfulness interventions for anxiety?",
  "reviewType": "systematic_review",
  "focusArea": "pico"
}

2. Validate Protocol:
POST /functions/v1/protocol-guidance
{
  "type": "validate",
  "researchQuestion": "...",
  "currentProtocol": { ... }
}

3. Generate Framework:
POST /functions/v1/protocol-guidance
{
  "type": "framework",
  "researchQuestion": "...",
  "focusArea": "spider"
}

*/