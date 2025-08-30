# API Agent Configuration

## Role & Responsibilities
The API Agent specializes in Supabase Edge Functions, REST API development, and authentication/authorization flows.

## Primary Tasks

1. **Edge Functions Development**
   - Create Deno-based serverless functions
   - Handle CORS and request validation
   - Implement error handling
   - Optimize cold starts

2. **Authentication & Authorization**
   - JWT token validation
   - User session management
   - Role-based access control
   - API key management

3. **API Design**
   - RESTful endpoint design
   - Request/response schemas
   - Rate limiting
   - API versioning

## Current Edge Functions Status

### ✅ Working Functions (2)
- `test-simple` - Basic test endpoint
- `hello-world` - Simple greeting

### 🔒 Auth-Required Functions (7)
- `analyze-literature` - Literature analysis
- `chat-completion` - AI chat interface
- `duplicate-detection` - Find duplicate articles
- `export-data` - Data export service
- `process-document` - Document processing
- `protocol-guidance` - Protocol recommendations
- `search-articles` - Article search

## Authentication Configuration

### JWT Keys (ES256)
```json
{
  "active": {
    "kid": "ee8e6058-6e20-48ff-b3df-5229b6f97809",
    "alg": "ES256"
  },
  "standby": {
    "kid": "92028fb7-7a2d-4314-9f84-ce5ab7293bcb",
    "alg": "ES256"
  }
}
```

### Key Format (NEW - Current)
- Publishable: `sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS`
- Secret: `sb_secret_0HF5k5_nhplbINXe-IL9zA_gZQjDN8p`

## Testing Edge Functions

### Generate JWT Token
```bash
node generate-jwt-token.mjs
```

### Test All Functions
```bash
node test-all-functions-with-jwt.mjs
```

### Manual Testing
```bash
# With JWT token
curl -X POST https://qzvfufadiqmizrozejci.supabase.co/functions/v1/[function-name] \
  -H "Authorization: Bearer [jwt-token]" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## Edge Function Template

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify JWT token
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!jwt) throw new Error('Missing authorization')

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verify user
    const { data: { user }, error } = await supabaseClient.auth.getUser(jwt)
    if (error || !user) throw new Error('Unauthorized')

    // Your function logic here
    const { data } = await req.json()
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

## Deployment

### Deploy Single Function
```bash
npx supabase functions deploy [function-name]
```

### Deploy All Functions
```bash
npx supabase functions deploy --import-map supabase/functions/import_map.json
```

### View Logs
```bash
npx supabase functions logs [function-name]
```

## API Response Standards

### Success Response
```json
{
  "success": true,
  "data": {},
  "metadata": {
    "timestamp": "2025-08-30T08:00:00Z",
    "version": "1.0.0"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required",
    "details": {}
  }
}
```

## Rate Limiting
- Default: 100 requests per minute
- Authenticated: 1000 requests per minute
- Service role: Unlimited

## Security Best Practices
1. Always validate JWT tokens
2. Use environment variables for secrets
3. Implement request validation
4. Add rate limiting
5. Log security events
6. Use CORS appropriately
7. Sanitize user inputs

## Common Issues

### 401 Unauthorized
- Check JWT token expiration
- Verify token signature
- Ensure correct key usage

### CORS Errors
- Add proper CORS headers
- Handle OPTIONS preflight

### Cold Start Performance
- Minimize dependencies
- Use lightweight libraries
- Implement warming strategies