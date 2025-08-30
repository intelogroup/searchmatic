// Chat completion function with flexible authentication
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  conversationId?: string
  messages: ChatMessage[]
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
    stream?: boolean
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration')
    }

    // Parse request body
    let requestData: ChatRequest
    try {
      const text = await req.text()
      requestData = JSON.parse(text)
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { conversationId, messages, options = {} } = requestData

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured')
      return new Response(
        JSON.stringify({ error: 'AI service not available' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Optional: Check user authentication if conversationId is provided
    if (conversationId) {
      const authHeader = req.headers.get('Authorization')
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        
        // Try to validate with Supabase (but don't fail if it doesn't work)
        try {
          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { 
              headers: { 
                Authorization: authHeader 
              } 
            }
          })
          
          const { data: { user }, error } = await supabase.auth.getUser(token)
          
          if (user) {
            console.log('Authenticated user:', user.email)
            
            // Verify conversation ownership
            const { data: conversation } = await supabase
              .from('conversations')
              .select('user_id')
              .eq('id', conversationId)
              .single()
            
            if (conversation && conversation.user_id !== user.id) {
              return new Response(
                JSON.stringify({ error: 'Access denied to this conversation' }),
                { 
                  status: 403,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              )
            }
          }
        } catch (e) {
          console.log('Auth check failed, continuing anyway:', e.message)
        }
      }
    }

    // Set OpenAI parameters
    const {
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      maxTokens = 1000,
      stream = false
    } = options

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API Error:', errorText)
      
      return new Response(
        JSON.stringify({ 
          error: 'AI completion failed',
          details: openaiResponse.status === 401 ? 'Invalid API key' : 'Service error'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (stream) {
      // Pass through streaming response
      return new Response(openaiResponse.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })
    } else {
      // Return formatted response
      const data = await openaiResponse.json()
      
      return new Response(
        JSON.stringify({
          content: data.choices[0]?.message?.content || '',
          usage: data.usage,
          model: data.model,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Chat Completion Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})