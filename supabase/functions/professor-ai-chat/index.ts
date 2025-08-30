// Professor AI Chat - Works with or without authentication
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
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request
    const requestData: ChatRequest = await req.json()
    const { conversationId, messages, options = {} } = requestData

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Optional authentication check
    const authHeader = req.headers.get('Authorization')
    let userId = null
    
    if (authHeader && conversationId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        
        if (supabaseUrl && supabaseServiceKey) {
          // Use service role key to bypass RLS
          const supabase = createClient(supabaseUrl, supabaseServiceKey)
          
          // Try to decode the JWT to get user ID
          const token = authHeader.replace('Bearer ', '')
          const parts = token.split('.')
          
          if (parts.length === 3) {
            try {
              const payload = JSON.parse(atob(parts[1]))
              userId = payload.sub
              
              // Verify conversation ownership
              const { data: conversation } = await supabase
                .from('conversations')
                .select('user_id')
                .eq('id', conversationId)
                .single()
              
              if (conversation && conversation.user_id !== userId) {
                return new Response(
                  JSON.stringify({ error: 'Access denied to this conversation' }),
                  { 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 403 
                  }
                )
              }
            } catch (e) {
              console.log('Token decode failed:', e)
            }
          }
        }
      } catch (e) {
        console.log('Auth check error:', e)
        // Continue without auth
      }
    }

    // Set defaults
    const {
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      maxTokens = 1000,
      stream = false
    } = options

    // Call OpenAI
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
      const errorData = await openaiResponse.text()
      console.error('OpenAI error:', errorData)
      
      return new Response(
        JSON.stringify({ 
          error: 'AI service error',
          status: openaiResponse.status
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Handle streaming
    if (stream) {
      return new Response(openaiResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        }
      })
    }

    // Return response
    const data = await openaiResponse.json()
    
    // Log usage if user is authenticated
    if (userId && data.usage) {
      console.log('Usage:', {
        userId,
        conversationId,
        model,
        tokens: data.usage.total_tokens
      })
    }
    
    return new Response(
      JSON.stringify({
        content: data.choices[0]?.message?.content || '',
        usage: data.usage,
        model: data.model,
        timestamp: new Date().toISOString(),
        authenticated: !!userId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})