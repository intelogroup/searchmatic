// Simple test function without authentication requirements
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const body = await req.json().catch(() => ({}))
    const name = body.name || 'World'
    
    // Simple response without authentication
    return new Response(
      JSON.stringify({
        message: `Hello ${name}!`,
        timestamp: new Date().toISOString(),
        status: 'success',
        function: 'test-simple',
        environment: {
          SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? 'set' : 'not set',
          SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') ? 'set' : 'not set',
          JWT_SECRET: Deno.env.get('JWT_SECRET') ? 'set' : 'not set',
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message,
        function: 'test-simple',
        status: 'error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})