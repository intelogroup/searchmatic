// Test function using official Supabase Edge Function patterns
// This demonstrates the correct implementation based on official documentation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { authenticateUser, createErrorResponse, createSuccessResponse } from '../_shared/auth.ts'

interface RequestBody {
  message?: string
  testData?: any
  requireAuth?: boolean
}

serve(async (req) => {
  // Handle CORS preflight - official pattern
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Parse request body
    let body: RequestBody = {}
    try {
      body = await req.json()
    } catch {
      // Request body is optional
    }

    let result: any = {
      message: body.message || 'Official pattern test function working',
      testData: body.testData,
      patterns_used: [
        'Shared CORS utilities',
        'Shared authentication utilities',
        'Official error handling',
        'Official response formatting'
      ]
    }

    // Conditional authentication based on request
    if (body.requireAuth) {
      const { user, supabase } = await authenticateUser(req)
      result.user_authenticated = {
        id: user.id,
        email: user.email
      }
      result.message = `Hello ${user.email || 'authenticated user'}! Official patterns working.`
    } else {
      result.public_access = true
      result.message = 'Public access - no authentication required'
    }

    // Return success response using official pattern
    return createSuccessResponse({
      success: true,
      result,
      official_patterns: 'implemented'
    })

  } catch (error) {
    // Return error response using official pattern
    return createErrorResponse(error, error.message.includes('Unauthorized') ? 401 : 400)
  }
})

/* Test Examples:

1. Public access:
POST /functions/v1/test-official-pattern
{
  "message": "Testing public access",
  "requireAuth": false
}

2. Authenticated access:
POST /functions/v1/test-official-pattern
Authorization: Bearer YOUR_USER_JWT_TOKEN
{
  "message": "Testing authenticated access", 
  "requireAuth": true
}

*/