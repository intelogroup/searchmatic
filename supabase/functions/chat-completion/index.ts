// Secure Edge Function for OpenAI Chat Completions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  conversationId: string
  messages: ChatMessage[]
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
    stream?: boolean
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create authenticated Supabase client with user context
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

    // Parse and validate request
    let requestData: ChatRequest
    try {
      requestData = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { conversationId, messages, options = {} } = requestData

    // Validate required fields
    if (!conversationId || !messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: conversationId, messages' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate conversation ownership
    const { data: conversation, error: convError } = await supabaseClient
      .from('conversations')
      .select('user_id, project_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation || conversation.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found or access denied' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Get OpenAI API key from secure server environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured in environment')
      return new Response(
        JSON.stringify({ error: 'AI service not available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Set defaults for OpenAI request
    const {
      model = 'gpt-4',
      temperature = 0.7,
      maxTokens = 1000,
      stream = false
    } = options

    // Validate message format
    const validMessages = messages.filter(msg => 
      msg.role && msg.content && ['user', 'assistant', 'system'].includes(msg.role)
    )

    if (validMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid messages found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Call OpenAI API securely from server
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: validMessages,
        temperature,
        max_tokens: maxTokens,
        stream
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API Error:', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        error: errorText,
        userId: user.id,
        conversationId
      })
      
      // Return generic error to client (don't expose OpenAI error details)
      return new Response(
        JSON.stringify({ 
          error: 'AI completion failed',
          status: openaiResponse.status 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (stream) {
      // Handle streaming response - pass through the stream
      return new Response(openaiResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })
    } else {
      // Handle non-streaming response
      const data = await openaiResponse.json()
      
      // Log usage for monitoring (optional)
      if (data.usage) {
        console.log('OpenAI API Usage:', {
          userId: user.id,
          conversationId,
          model,
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
          timestamp: new Date().toISOString()
        })
      }

      return new Response(
        JSON.stringify({
          content: data.choices[0]?.message?.content || '',
          usage: data.usage,
          model,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

  } catch (error) {
    console.error('Chat Completion Error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/* Usage Example:

POST /functions/v1/chat-completion
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "conversationId": "uuid-of-conversation",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello, how are you?" }
  ],
  "options": {
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 1000,
    "stream": false
  }
}

Response:
{
  "content": "Hello! I'm doing well, thank you for asking...",
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 15,
    "total_tokens": 35
  },
  "model": "gpt-4",
  "timestamp": "2025-01-09T..."
}

Security Features:
✅ JWT authentication required
✅ OpenAI API key secure in server environment  
✅ Conversation ownership validation
✅ CORS properly configured
✅ Comprehensive error handling
✅ Input validation and sanitization
✅ Usage logging for monitoring
✅ No sensitive data exposed to client

*/