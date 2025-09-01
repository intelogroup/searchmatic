// Shared authentication utilities following official Supabase patterns
// https://supabase.com/docs/guides/functions/auth

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from './cors.ts'

export interface AuthUser {
  id: string
  email?: string
  [key: string]: any
}

export interface AuthContext {
  user: AuthUser
  supabase: any
}

// Official pattern: Create authenticated Supabase client
export function createAuthenticatedClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: { Authorization: authHeader }
      }
    }
  )
}

// Official pattern: Verify user authentication
export async function authenticateUser(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader) {
    throw new Error('Missing Authorization header')
  }

  const supabase = createAuthenticatedClient(authHeader)
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('Unauthorized: Invalid or expired token')
  }

  return { user, supabase }
}

// Official pattern: Create error response with CORS
export function createErrorResponse(error: Error, status: number = 400): Response {
  console.error('Function error:', error)
  
  return new Response(
    JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    }
  )
}

// Official pattern: Create success response with CORS
export function createSuccessResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify({
      ...data,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    }
  )
}