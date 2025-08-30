// Simple test function with proper CORS and no authentication
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    // This function doesn't require authentication
    // It's for testing basic connectivity
    
    // Get request body
    let body = {}
    try {
      const text = await req.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch (e) {
      // If body parsing fails, continue with empty body
      console.log('Body parsing error:', e)
    }
    
    const name = body.name || 'World'
    
    // Get auth header for debugging (but don't validate)
    const authHeader = req.headers.get('Authorization')
    const hasAuth = authHeader ? 'present' : 'missing'
    
    // Simple response
    const response = {
      message: `Hello ${name}!`,
      timestamp: new Date().toISOString(),
      status: 'success',
      function: 'test-simple-v2',
      auth_header: hasAuth,
      environment: {
        SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? 'set' : 'not set',
        SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') ? 'set' : 'not set',
        SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'set' : 'not set',
      },
      headers_received: {
        authorization: authHeader ? authHeader.substring(0, 20) + '...' : null,
        apikey: req.headers.get('apikey') ? 'present' : null,
        content_type: req.headers.get('content-type'),
      }
    }
    
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    )
  } catch (error) {
    console.error('Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        function: 'test-simple-v2',
        status: 'error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    )
  }
})