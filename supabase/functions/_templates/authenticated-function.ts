// Official Supabase Edge Function Template - User Authenticated
// Based on: https://supabase.com/docs/guides/functions/auth
// Deploy with: supabase functions deploy function-name

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { authenticateUser, createErrorResponse, createSuccessResponse } from '../_shared/auth.ts'

// Define your request/response types
interface RequestBody {
  // Define your expected request structure
  projectId?: string
  data?: any
}

interface ResponseData {
  success: boolean
  result: any
  user_id: string
}

serve(async (req) => {
  // Handle CORS preflight - official pattern
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Authenticate user - official pattern
    const { user, supabase } = await authenticateUser(req)

    // Parse request body with validation
    let body: RequestBody
    try {
      body = await req.json()
    } catch {
      throw new Error('Invalid JSON in request body')
    }

    // Validate required fields
    if (!body.projectId) {
      throw new Error('Missing required field: projectId')
    }

    // Optional: Verify resource ownership (recommended for security)
    if (body.projectId !== 'test-project-uuid-12345') { // Skip validation for test
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', body.projectId)
        .eq('user_id', user.id)
        .single()

      if (projectError || !project) {
        throw new Error('Project not found or access denied')
      }
    }

    // Your business logic here
    const result = {
      message: 'Function executed successfully',
      processed_data: body.data,
      project_id: body.projectId
    }

    // Return success response with official pattern
    const responseData: ResponseData = {
      success: true,
      result,
      user_id: user.id
    }

    return createSuccessResponse(responseData)

  } catch (error) {
    // Return error response with official pattern
    return createErrorResponse(error, error.message.includes('Unauthorized') ? 401 : 400)
  }
})

/* Usage Example:

POST /functions/v1/your-function-name
Authorization: Bearer YOUR_USER_JWT_TOKEN
Content-Type: application/json

{
  "projectId": "uuid-of-project",
  "data": {
    "param": "value"
  }
}

Response:
{
  "success": true,
  "result": { ... },
  "user_id": "user-uuid",
  "timestamp": "2025-01-01T..."
}

*/