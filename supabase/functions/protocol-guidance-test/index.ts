// Test version of protocol guidance - relaxed validation for testing AI functionality
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { authenticateUser, createErrorResponse, createSuccessResponse } from '../_shared/auth.ts'

interface ProtocolGuidanceRequest {
  projectId?: string
  type: 'create' | 'validate' | 'improve' | 'framework'
  researchQuestion: string
  currentProtocol?: Record<string, any>
  focusArea?: 'pico' | 'spider' | 'inclusion' | 'exclusion' | 'search_strategy' | 'data_extraction' | 'quality_assessment'
  reviewType?: 'systematic_review' | 'meta_analysis' | 'scoping_review' | 'narrative_review' | 'umbrella_review'
}

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Authenticate user
    const { user, supabase } = await authenticateUser(req)

    const {
      projectId,
      type,
      researchQuestion,
      currentProtocol,
      focusArea,
      reviewType = 'systematic_review'
    }: ProtocolGuidanceRequest = await req.json()

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

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('AI service not available')
    }

    // Generate guidance based on type
    let guidance: any

    switch (type) {
      case 'create':
        guidance = await createProtocol(openaiApiKey, researchQuestion, reviewType, focusArea)
        break
      
      case 'framework':
        guidance = await generateFramework(openaiApiKey, researchQuestion, focusArea, reviewType)
        break
      
      default:
        throw new Error('Invalid guidance type for testing')
    }

    return createSuccessResponse({
      success: true,
      guidance,
      type,
      focusArea,
      reviewType,
      user_id: user.id,
      test_mode: projectId?.startsWith('test-') || false
    })

  } catch (error) {
    return createErrorResponse(error, error.message.includes('Unauthorized') ? 401 : 400)
  }
})

// Create new protocol
async function createProtocol(apiKey: string, researchQuestion: string, reviewType: string, focusArea?: string): Promise<any> {
  const systemPrompt = `You are a world-class research methodology expert specializing in systematic literature reviews and meta-analyses. You help researchers create comprehensive, high-quality research protocols following PRISMA, Cochrane, and JBI guidelines.

Create a complete research protocol with specific, actionable components.`

  let userPrompt = `Create a comprehensive research protocol for a ${reviewType} with this research question:

"${researchQuestion}"

Please provide a structured protocol including:
1. Background and rationale
2. Objectives (primary and secondary) 
3. Methods (PICO framework, inclusion/exclusion criteria)
4. Search strategy (databases, keywords)
5. Study selection process
6. Data extraction plan
7. Quality assessment approach

Format as structured JSON with detailed explanations.`

  if (focusArea === 'pico') {
    userPrompt += '\n\nFocus particularly on developing a robust PICO framework.'
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    return {
      success: true,
      protocol: content,
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

// Generate specific framework (PICO/SPIDER)
async function generateFramework(apiKey: string, researchQuestion: string, focusArea?: string, reviewType: string = 'systematic_review'): Promise<any> {
  const systemPrompt = `You are a research framework specialist. Generate detailed, well-structured research frameworks (PICO, SPIDER) that guide systematic literature searches and reviews.`

  const frameworkType = focusArea || 'pico'
  
  const userPrompt = `Create a detailed ${frameworkType.toUpperCase()} framework for this ${reviewType}:

Research Question: "${researchQuestion}"

Provide:
1. Structured framework components
2. Specific definitions for each element  
3. Examples and operationalization
4. Search terms derived from framework
5. Inclusion/exclusion criteria based on framework

Format as structured JSON.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1500
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    return {
      success: true,
      framework: content,
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