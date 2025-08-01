import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  projectId: string
  message: string
  conversationId?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Parse request body
    const { projectId, message, conversationId } = await req.json() as RequestBody

    // Verify user owns the project
    const { data: project } = await supabaseClient
      .from('projects')
      .select('id, protocol')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // TODO: Implement OpenAI API call here
    // For now, return a mock response
    const aiResponse = {
      role: 'assistant',
      content: `I understand you want to research: "${message}". Let me help you define your research scope. Could you tell me more about the specific population or patient group you're interested in studying?`,
      suggestions: {
        population: 'Consider specifying age range, condition, or demographic',
        intervention: 'What treatment or intervention are you examining?',
        comparison: 'What will you compare the intervention against?',
        outcome: 'What outcomes are you measuring?'
      }
    }

    // Create or update conversation
    let convId = conversationId
    if (!convId) {
      const { data: newConversation, error: convError } = await supabaseClient
        .from('conversations')
        .insert({
          project_id: projectId,
          user_id: user.id,
          title: message.substring(0, 50) + '...',
          context: 'guided_scoping'
        })
        .select()
        .single()

      if (convError) throw convError
      convId = newConversation.id
    }

    // Save user message
    await supabaseClient
      .from('messages')
      .insert({
        conversation_id: convId,
        role: 'user',
        content: message,
      })

    // Save AI response
    await supabaseClient
      .from('messages')
      .insert({
        conversation_id: convId,
        role: 'assistant',
        content: aiResponse.content,
        metadata: aiResponse.suggestions
      })

    return new Response(
      JSON.stringify({
        conversationId: convId,
        response: aiResponse
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})