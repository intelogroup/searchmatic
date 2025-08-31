// Official Supabase Edge Function Template - Public (No Authentication)
// Based on: https://supabase.com/docs/guides/functions
// Deploy with: supabase functions deploy function-name --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors, corsHeaders } from '../_shared/cors.ts'

// Define your request/response types
interface RequestBody {
  // Define your expected request structure
  message?: string
  data?: any
}

interface ResponseData {
  success: boolean
  result: any
  public: true
}

serve(async (req) => {
  // Handle CORS preflight - official pattern
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Parse request body (optional for public endpoints)
    let body: RequestBody = {}
    try {
      body = await req.json()
    } catch {
      // Request body is optional for public endpoints
    }

    // Your public business logic here
    const result = {
      message: body.message || 'Public function executed successfully',
      processed_data: body.data,
      timestamp: new Date().toISOString(),
      environment: {
        SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? 'set' : 'not set',
        SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') ? 'set' : 'not set'
      }
    }

    // Return success response
    const responseData: ResponseData = {
      success: true,
      result,
      public: true
    }

    return new Response(
      JSON.stringify({
        ...responseData,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )

  } catch (error) {
    // Return error response
    console.error('Public function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})

/* Usage Example:

POST /functions/v1/your-function-name
Content-Type: application/json

{
  "message": "Hello public function",
  "data": { "test": true }
}

Response:
{
  "success": true,
  "result": { ... },
  "public": true,
  "timestamp": "2025-01-01T..."
}

*/