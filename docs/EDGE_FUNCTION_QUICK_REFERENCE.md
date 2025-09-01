# Edge Function Quick Reference

## Creating a New Edge Function

### Step 1: Choose the Right Template

```bash
# For authenticated endpoints (user data, protected resources)
cp supabase/functions/_templates/authenticated-function.ts \
   supabase/functions/your-function-name/index.ts

# For public endpoints (no auth required)
cp supabase/functions/_templates/public-function.ts \
   supabase/functions/your-function-name/index.ts
```

### Step 2: Implement Your Logic

```typescript
// Replace the business logic section
const result = {
  // Your implementation here
}
```

### Step 3: Deploy

```bash
# Authenticated function
supabase functions deploy your-function-name

# Public function
supabase functions deploy your-function-name --no-verify-jwt
```

### Step 4: Test

```bash
# Generate JWT token for testing
node generate-jwt-token.mjs

# Test the function
# Set JWT token environment variable first: export JWT_TOKEN='your-token-here'
curl -X POST https://your-project.supabase.co/functions/v1/your-function-name \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId": "test-uuid"}'
```

---

## Common Patterns

### Pattern 1: Database Query with Auth

```typescript
const { user, supabase } = await authenticateUser(req)

const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('user_id', user.id)
  
if (error) throw error
```

### Pattern 2: External API Call

```typescript
const response = await fetch('https://api.example.com/endpoint', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
})

if (!response.ok) {
  throw new Error(`API error: ${response.statusText}`)
}

const data = await response.json()
```

### Pattern 3: Batch Database Insert

```typescript
const records = items.map(item => ({
  project_id: projectId,
  user_id: user.id,
  ...item
}))

const { error } = await supabase
  .from('table')
  .insert(records)
  .select()
```

### Pattern 4: Error Handling

```typescript
try {
  // Your code
} catch (error) {
  const status = 
    error.message.includes('Unauthorized') ? 401 :
    error.message.includes('not found') ? 404 :
    error.message.includes('Invalid') ? 400 : 500
    
  return createErrorResponse(error, status)
}
```

### Pattern 5: Resource Ownership Check

```typescript
const { data: resource } = await supabase
  .from('resources')
  .select('id')
  .eq('id', resourceId)
  .eq('user_id', user.id)
  .single()

if (!resource) {
  throw new Error('Resource not found or access denied')
}
```

---

## Utility Functions

### CORS Handling
```typescript
import { handleCors } from '../_shared/cors.ts'

const corsResponse = handleCors(req)
if (corsResponse) return corsResponse
```

### Authentication
```typescript
import { authenticateUser } from '../_shared/auth.ts'

const { user, supabase } = await authenticateUser(req)
```

### Response Creation
```typescript
import { createSuccessResponse, createErrorResponse } from '../_shared/auth.ts'

// Success
return createSuccessResponse({ result: data })

// Error
return createErrorResponse(new Error('Something went wrong'))
```

---

## Environment Variables

### Required for All Functions
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Optional API Keys
```env
OPENAI_API_KEY=your-openai-key
PUBMED_API_KEY=your-pubmed-key
DEEPSEEK_API_KEY=your-deepseek-key
```

### Setting Secrets
```bash
supabase secrets set KEY_NAME=value
supabase secrets list
```

---

## Testing Commands

### Local Development
```bash
# Start local function server
supabase functions serve your-function-name --env-file .env.local

# Test locally
curl -X POST http://localhost:54321/functions/v1/your-function-name \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Production Testing
```bash
# View logs
supabase functions logs your-function-name --follow

# Test with real JWT
node test-all-functions-with-jwt.mjs
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Unauthorized: Invalid or expired token" | Generate fresh JWT with `node generate-jwt-token.mjs` |
| CORS errors | Ensure `handleCors(req)` is called first |
| "Project not found" | Check projectId and user ownership |
| Rate limit exceeded | Implement delay between API calls |
| Function timeout | Reduce payload size or implement pagination |
| Database connection error | Check Supabase status, retry with exponential backoff |

---

## File Structure

```
supabase/functions/
├── _shared/              # Shared utilities
│   ├── auth.ts          # Authentication helpers
│   └── cors.ts          # CORS configuration
├── _templates/          # Function templates
│   ├── authenticated-function.ts
│   └── public-function.ts
└── your-function/       # Your function
    └── index.ts         # Function implementation
```

---

## Deployment Checklist

- [ ] Choose correct template (authenticated vs public)
- [ ] Implement business logic
- [ ] Add proper error handling
- [ ] Test locally with `supabase functions serve`
- [ ] Set required environment variables
- [ ] Deploy with appropriate flags
- [ ] Test in production
- [ ] Monitor logs for errors
- [ ] Document API endpoints

---

## Quick Links

- [Full Documentation](./EDGE_FUNCTION_PATTERNS.md)
- [Supabase Docs](https://supabase.com/docs/guides/functions)
- [Template Files](../supabase/functions/_templates/)
- [Shared Utilities](../supabase/functions/_shared/)
- [Test Scripts](../scripts/)