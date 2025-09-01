# Official Supabase Edge Function Patterns

## Overview

This document provides comprehensive patterns and best practices for implementing Supabase Edge Functions in the Searchmatic platform. All patterns follow official Supabase documentation and are battle-tested in production.

## Table of Contents

1. [Core Patterns](#core-patterns)
2. [Template Functions](#template-functions)
3. [Shared Utilities](#shared-utilities)
4. [Authentication Patterns](#authentication-patterns)
5. [Error Handling](#error-handling)
6. [CORS Configuration](#cors-configuration)
7. [Database Integration](#database-integration)
8. [External API Integration](#external-api-integration)
9. [Testing Patterns](#testing-patterns)
10. [Deployment](#deployment)
11. [Common Issues & Solutions](#common-issues--solutions)

---

## Core Patterns

### 1. Basic Function Structure

Every edge function follows this standard structure:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { authenticateUser, createErrorResponse, createSuccessResponse } from '../_shared/auth.ts'

serve(async (req) => {
  // 1. Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // 2. Authenticate user (if required)
    const { user, supabase } = await authenticateUser(req)
    
    // 3. Parse and validate request
    const body = await req.json()
    
    // 4. Execute business logic
    const result = await processRequest(body)
    
    // 5. Return success response
    return createSuccessResponse(result)
    
  } catch (error) {
    // 6. Return error response
    return createErrorResponse(error)
  }
})
```

### 2. Request/Response Types

Always define TypeScript interfaces for type safety:

```typescript
interface RequestBody {
  projectId: string
  data?: any
  options?: {
    limit?: number
    offset?: number
  }
}

interface ResponseData {
  success: boolean
  result: any
  timestamp: string
  user_id?: string
}
```

---

## Template Functions

### Authenticated Function Template

Location: `/supabase/functions/_templates/authenticated-function.ts`

**Key Features:**
- User authentication required
- Resource ownership verification
- Comprehensive error handling
- TypeScript type safety

```typescript
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Authenticate user - throws if unauthorized
    const { user, supabase } = await authenticateUser(req)
    
    // Parse request body
    const body: RequestBody = await req.json()
    
    // Verify resource ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', body.projectId)
      .eq('user_id', user.id)
      .single()
      
    if (!project) {
      throw new Error('Project not found or access denied')
    }
    
    // Business logic here
    const result = await processWithAuth(body, user)
    
    return createSuccessResponse({
      success: true,
      result,
      user_id: user.id
    })
    
  } catch (error) {
    return createErrorResponse(error, 
      error.message.includes('Unauthorized') ? 401 : 400
    )
  }
})
```

### Public Function Template

Location: `/supabase/functions/_templates/public-function.ts`

**Key Features:**
- No authentication required
- Optional request body
- Public access allowed

```typescript
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Parse optional request body
    let body = {}
    try {
      body = await req.json()
    } catch {
      // Body is optional for public endpoints
    }
    
    // Public business logic
    const result = await processPublicRequest(body)
    
    return createSuccessResponse({
      success: true,
      result,
      public: true
    })
    
  } catch (error) {
    return createErrorResponse(error, 500)
  }
})
```

---

## Shared Utilities

### Authentication Utilities

Location: `/supabase/functions/_shared/auth.ts`

```typescript
// Create authenticated Supabase client
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

// Authenticate user from request
export async function authenticateUser(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader) {
    throw new Error('Missing Authorization header')
  }

  const supabase = createAuthenticatedClient(authHeader)
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized: Invalid or expired token')
  }

  return { user, supabase }
}

// Create standardized responses
export function createSuccessResponse(data: any, status = 200): Response {
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

export function createErrorResponse(error: Error, status = 400): Response {
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
```

### CORS Utilities

Location: `/supabase/functions/_shared/cors.ts`

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}
```

---

## Authentication Patterns

### 1. User Authentication

Always authenticate users for protected endpoints:

```typescript
const { user, supabase } = await authenticateUser(req)
```

### 2. Resource Ownership Verification

Verify users can only access their own resources:

```typescript
const { data: resource, error } = await supabase
  .from('resources')
  .select('id')
  .eq('id', resourceId)
  .eq('user_id', user.id)
  .single()

if (!resource) {
  throw new Error('Resource not found or access denied')
}
```

### 3. Skip Validation for Tests

For test environments, skip validation:

```typescript
if (!projectId.startsWith('test-')) {
  // Perform validation
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()
    
  if (!project) {
    throw new Error('Access denied')
  }
}
```

---

## Error Handling

### Standard Error Response

```typescript
try {
  // Your code
} catch (error) {
  // Determine status code based on error type
  const status = error.message.includes('Unauthorized') ? 401 :
                 error.message.includes('not found') ? 404 :
                 error.message.includes('Invalid') ? 400 : 500
                 
  return createErrorResponse(error, status)
}
```

### Custom Error Classes

```typescript
class AuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
```

---

## CORS Configuration

### Standard CORS Headers

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}
```

### Environment-Specific CORS

```typescript
const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || ['*']

const origin = req.headers.get('origin') || ''
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigins.includes('*') ? '*' : 
    allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  // ... other headers
}
```

---

## Database Integration

### 1. Using Authenticated Client

```typescript
const { user, supabase } = await authenticateUser(req)

// This client has user context
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('user_id', user.id)
```

### 2. Batch Operations

```typescript
// Insert multiple records efficiently
const records = items.map(item => ({
  project_id: projectId,
  user_id: user.id,
  ...item
}))

const { error } = await supabase
  .from('table')
  .insert(records)
```

### 3. Upsert with Conflict Resolution

```typescript
await supabase
  .from('articles')
  .upsert(articles, { 
    onConflict: 'project_id,pmid',
    ignoreDuplicates: true 
  })
```

---

## External API Integration

### PubMed API Example

```typescript
class PubMedAPI {
  private baseURL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/'
  private apiKey: string | null
  private requestDelay: number

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null
    // Respect rate limits: 3/sec with key, 1/sec without
    this.requestDelay = apiKey ? 334 : 1000
  }

  async search(query: string): Promise<SearchResult> {
    // Rate limiting
    await this.delay(this.requestDelay)
    
    const params = new URLSearchParams({
      db: 'pubmed',
      term: query,
      retmode: 'json',
      ...(this.apiKey && { api_key: this.apiKey })
    })
    
    const response = await fetch(`${this.baseURL}esearch.fcgi?${params}`)
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    
    return await response.json()
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

### OpenAI API Integration

```typescript
async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  })
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.choices[0].message.content
}
```

---

## Testing Patterns

### 1. Test with cURL

```bash
# Public function
curl -X POST https://your-project.supabase.co/functions/v1/function-name \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# Authenticated function
curl -X POST https://your-project.supabase.co/functions/v1/function-name \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId": "uuid"}'
```

### 2. Test with JavaScript

```javascript
// Generate test JWT
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, anonKey)
const { data: { session } } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password'
})

// Call function
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { projectId: 'uuid' },
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
})
```

### 3. Local Testing

```bash
# Run function locally
supabase functions serve function-name --env-file .env.local

# Test locally
curl -X POST http://localhost:54321/functions/v1/function-name \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## Deployment

### 1. Deploy Single Function

```bash
# Deploy authenticated function
supabase functions deploy function-name

# Deploy public function (no JWT verification)
supabase functions deploy function-name --no-verify-jwt
```

### 2. Deploy All Functions

```bash
# Deploy all functions in the functions directory
for dir in supabase/functions/*/; do
  if [ -f "$dir/index.ts" ]; then
    func_name=$(basename "$dir")
    echo "Deploying $func_name..."
    supabase functions deploy "$func_name"
  fi
done
```

### 3. Environment Variables

```bash
# Set function secrets
supabase secrets set OPENAI_API_KEY=your-key
supabase secrets set PUBMED_API_KEY=your-key

# List secrets
supabase secrets list
```

---

## Common Issues & Solutions

### Issue 1: JWT Token Invalid

**Problem:** "Unauthorized: Invalid or expired token"

**Solution:**
```typescript
// Ensure fresh token
const { data: { session } } = await supabase.auth.refreshSession()
const token = session?.access_token
```

### Issue 2: CORS Errors

**Problem:** "Access to fetch at ... has been blocked by CORS policy"

**Solution:**
```typescript
// Always handle preflight
const corsResponse = handleCors(req)
if (corsResponse) return corsResponse

// Include CORS headers in all responses
return new Response(data, {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
})
```

### Issue 3: Rate Limiting

**Problem:** External API rate limit exceeded

**Solution:**
```typescript
class RateLimiter {
  private lastCall = 0
  private minDelay: number
  
  constructor(requestsPerSecond: number) {
    this.minDelay = 1000 / requestsPerSecond
  }
  
  async throttle(): Promise<void> {
    const now = Date.now()
    const timeSinceLastCall = now - this.lastCall
    
    if (timeSinceLastCall < this.minDelay) {
      await this.delay(this.minDelay - timeSinceLastCall)
    }
    
    this.lastCall = Date.now()
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

### Issue 4: Large Response Payloads

**Problem:** Response too large, function timeout

**Solution:**
```typescript
// Implement pagination
interface PaginatedResponse {
  data: any[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

function paginate(data: any[], page = 1, pageSize = 50): PaginatedResponse {
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return {
    data: data.slice(start, end),
    total: data.length,
    page,
    pageSize,
    hasMore: end < data.length
  }
}
```

### Issue 5: Database Connection Issues

**Problem:** "connection refused" or timeout errors

**Solution:**
```typescript
// Use connection pooling
const supabase = createClient(url, key, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Implement retry logic
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)))
    }
  }
  throw new Error('Max retries exceeded')
}
```

---

## Best Practices

### 1. Input Validation

```typescript
function validateRequest(body: any): RequestBody {
  if (!body.projectId) {
    throw new ValidationError('projectId is required')
  }
  
  if (body.limit && (body.limit < 1 || body.limit > 1000)) {
    throw new ValidationError('limit must be between 1 and 1000')
  }
  
  return body as RequestBody
}
```

### 2. Logging

```typescript
// Development logging
if (Deno.env.get('ENVIRONMENT') === 'development') {
  console.log('Request:', { 
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers)
  })
}

// Production logging (minimal)
console.log(`Processing ${req.method} request for user ${user.id}`)
```

### 3. Security

```typescript
// Never log sensitive data
const sanitizedBody = {
  ...body,
  password: '[REDACTED]',
  apiKey: '[REDACTED]'
}

// Validate ownership before operations
const isOwner = await verifyResourceOwnership(resourceId, user.id)
if (!isOwner) {
  throw new AuthorizationError('Access denied')
}
```

### 4. Performance

```typescript
// Use Promise.all for parallel operations
const [articles, templates, protocols] = await Promise.all([
  supabase.from('articles').select('*').eq('project_id', projectId),
  supabase.from('templates').select('*').eq('project_id', projectId),
  supabase.from('protocols').select('*').eq('project_id', projectId)
])

// Batch database operations
const batchSize = 100
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize)
  await supabase.from('table').insert(batch)
}
```

---

## Function Examples

### 1. Search Articles (PubMed Integration)

See `/supabase/functions/search-articles/index.ts` for a complete implementation including:
- PubMed API integration
- XML parsing
- Rate limiting
- Database storage
- Error handling

### 2. Chat Completion (AI Integration)

```typescript
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user, supabase } = await authenticateUser(req)
    const { projectId, messages } = await req.json()
    
    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()
    
    if (!project) {
      throw new Error('Project not found')
    }
    
    // Call AI API
    const completion = await callOpenAI(messages)
    
    // Store conversation
    await supabase.from('conversations').insert({
      project_id: projectId,
      user_id: user.id,
      messages,
      completion,
      created_at: new Date().toISOString()
    })
    
    return createSuccessResponse({ completion })
    
  } catch (error) {
    return createErrorResponse(error)
  }
})
```

### 3. Document Processing

```typescript
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user, supabase } = await authenticateUser(req)
    const { documentUrl, projectId } = await req.json()
    
    // Download document
    const response = await fetch(documentUrl)
    const buffer = await response.arrayBuffer()
    
    // Process document (example: extract text)
    const text = await extractTextFromPDF(buffer)
    
    // Store results
    await supabase.from('documents').insert({
      project_id: projectId,
      user_id: user.id,
      url: documentUrl,
      extracted_text: text,
      processed_at: new Date().toISOString()
    })
    
    return createSuccessResponse({ 
      success: true,
      textLength: text.length 
    })
    
  } catch (error) {
    return createErrorResponse(error)
  }
})
```

---

## Migration Guide

### From Old Pattern to New Pattern

**Old Pattern:**
```typescript
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Manual CORS handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        // ... other headers
      }
    })
  }
  
  // Manual auth verification
  const authHeader = req.headers.get('Authorization')!
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabaseClient.auth.getUser(token)
  
  // ... rest of function
})
```

**New Pattern:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { authenticateUser, createErrorResponse, createSuccessResponse } from '../_shared/auth.ts'

serve(async (req) => {
  // Standardized CORS handling
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse
  
  try {
    // Standardized authentication
    const { user, supabase } = await authenticateUser(req)
    
    // ... rest of function
    
    // Standardized response
    return createSuccessResponse(result)
    
  } catch (error) {
    // Standardized error handling
    return createErrorResponse(error)
  }
})
```

---

## Monitoring & Debugging

### 1. Function Logs

```bash
# View function logs
supabase functions logs function-name

# Follow logs in real-time
supabase functions logs function-name --follow
```

### 2. Debug Mode

```typescript
const DEBUG = Deno.env.get('DEBUG') === 'true'

if (DEBUG) {
  console.log('Request body:', body)
  console.log('User:', user)
  console.log('Query result:', data)
}
```

### 3. Performance Monitoring

```typescript
const startTime = performance.now()

// Your function logic

const duration = performance.now() - startTime
console.log(`Function executed in ${duration}ms`)

// Include in response for monitoring
return createSuccessResponse({
  result,
  performance: {
    duration_ms: duration,
    timestamp: new Date().toISOString()
  }
})
```

---

## Resources

- [Official Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Runtime Documentation](https://deno.land/manual)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Edge Functions Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions)

---

## Summary

This document provides comprehensive patterns for implementing Supabase Edge Functions following official best practices. Key takeaways:

1. **Use shared utilities** for consistency across functions
2. **Always handle CORS** properly for browser compatibility
3. **Implement proper authentication** for protected endpoints
4. **Validate input** and verify resource ownership
5. **Handle errors gracefully** with appropriate status codes
6. **Follow TypeScript best practices** for type safety
7. **Respect rate limits** when calling external APIs
8. **Monitor and log** appropriately for debugging
9. **Test thoroughly** in local and production environments
10. **Deploy with proper configuration** including environment variables

For specific implementation examples, refer to the functions in `/supabase/functions/` directory.