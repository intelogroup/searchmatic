import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🧪 Testing Edge Functions with Anon Key')
console.log('======================================\n')
console.log(`URL: ${supabaseUrl}`)
console.log(`Key: ${anonKey.substring(0, 20)}...\n`)

async function testFunctionsWithAnon() {
  const functionsToTest = [
    {
      name: 'hello-world',
      body: { name: 'Anonymous User' }
    },
    {
      name: 'chat-completion',
      body: { 
        messages: [
          { role: 'user', content: 'Hello from edge functions test!' }
        ]
      }
    }
  ]

  for (const func of functionsToTest) {
    console.log(`📤 Testing: ${func.name}`)
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/${func.name}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(func.body)
      })

      console.log(`   Status: ${response.status} ${response.statusText}`)
      console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers))}`)
      
      if (response.ok) {
        const result = await response.text()
        try {
          const json = JSON.parse(result)
          console.log(`   ✅ JSON Response:`, json)
        } catch {
          console.log(`   ✅ Text Response: ${result}`)
        }
      } else {
        const error = await response.text()
        console.log(`   ❌ Error Response: ${error}`)
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`)
    }
    
    console.log('')
  }

  // Test with no auth to see what happens
  console.log('🔓 Testing without authentication:')
  console.log('=================================\n')

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/hello-world`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'No Auth User' })
    })

    console.log(`📤 No Auth Test:`)
    console.log(`   Status: ${response.status} ${response.statusText}`)
    
    const result = await response.text()
    console.log(`   Response: ${result}`)
  } catch (error) {
    console.log(`   ❌ No auth test failed: ${error.message}`)
  }

  console.log('\n🔧 Testing OPTIONS preflight:')
  console.log('=============================\n')

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/hello-world`, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    console.log(`📤 OPTIONS Test:`)
    console.log(`   Status: ${response.status} ${response.statusText}`)
    console.log(`   CORS Headers:`)
    console.log(`     Access-Control-Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin')}`)
    console.log(`     Access-Control-Allow-Headers: ${response.headers.get('Access-Control-Allow-Headers')}`)
  } catch (error) {
    console.log(`   ❌ OPTIONS test failed: ${error.message}`)
  }
}

testFunctionsWithAnon()