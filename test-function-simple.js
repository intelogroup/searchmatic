import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔐 Creating Authenticated Session and Testing Functions')
console.log('=====================================================\n')

async function testWithRealAuth() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Sign in the test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'testuser1756538797112@example.com',
      password: 'TestPassword123!'
    })

    if (authError) {
      console.log(`❌ Auth failed: ${authError.message}`)
      return
    }

    console.log('✅ User authenticated successfully')
    console.log(`   User: ${authData.user.email}`)
    console.log('')

    // Create a new Supabase client with the authenticated session
    const authenticatedSupabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    })

    // Get fresh session to ensure we have valid tokens
    const { data: session } = await authenticatedSupabase.auth.getSession()
    
    if (!session.session) {
      console.log('❌ No valid session found')
      return
    }

    console.log('🔑 Testing with fresh session token...')
    const token = session.session.access_token
    console.log(`   Token preview: ${token.substring(0, 50)}...`)
    console.log('')

    // Test the functions with the authenticated token
    const functionsToTest = [
      { name: 'hello-world', body: { name: 'Authenticated Test' } }
    ]

    for (const func of functionsToTest) {
      console.log(`📤 Testing: ${func.name}`)
      
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/${func.name}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'apikey': supabaseKey
          },
          body: JSON.stringify(func.body)
        })

        console.log(`   Status: ${response.status} ${response.statusText}`)
        
        if (response.ok) {
          const result = await response.text()
          try {
            const json = JSON.parse(result)
            console.log(`   ✅ Success:`, json)
          } catch {
            console.log(`   ✅ Success: ${result}`)
          }
        } else {
          const error = await response.text()
          console.log(`   ❌ Error: ${error}`)
          
          // Try to understand the error better
          console.log(`   Debug info:`)
          console.log(`     URL: ${supabaseUrl}/functions/v1/${func.name}`)
          console.log(`     Auth header: Bearer ${token.substring(0, 30)}...`)
        }
      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`)
      }
      
      console.log('')
    }

    // Test using Supabase client invoke method if available
    console.log('🧪 Testing with Supabase Client Function Call:')
    console.log('==============================================')
    
    try {
      const { data, error } = await authenticatedSupabase.functions.invoke('hello-world', {
        body: { name: 'Via Supabase Client' }
      })
      
      if (error) {
        console.log(`   ❌ Supabase client error:`, error)
      } else {
        console.log(`   ✅ Supabase client success:`, data)
      }
    } catch (error) {
      console.log(`   ❌ Supabase client exception: ${error.message}`)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testWithRealAuth()