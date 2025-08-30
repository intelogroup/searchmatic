// Public function - no authentication required
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // No authentication check - this is a public endpoint
  const response = {
    message: 'Public endpoint - no auth required',
    timestamp: new Date().toISOString(),
    method: req.method,
    headers: {
      authorization: req.headers.get('authorization') ? 'present' : 'none',
      apikey: req.headers.get('apikey') ? 'present' : 'none',
    },
    environment: {
      VERIFY_JWT: Deno.env.get('VERIFY_JWT'),
    }
  }

  return new Response(
    JSON.stringify(response),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  )
}, {
  // Try to disable JWT verification
  port: 8000,
})