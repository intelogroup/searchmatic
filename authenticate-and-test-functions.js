import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

// Test user credentials (from our signup test)
const testUser = {
  email: 'testuser1756538797112@example.com',
  password: 'TestPassword123!'
}

console.log('🔐 Authenticating Test User and Testing Edge Functions')
console.log('====================================================\n')

const supabase = createClient(supabaseUrl, supabaseKey)

async function authenticateAndTestFunctions() {
  try {
    // Step 1: Authenticate the test user
    console.log('🔑 Step 1: Authenticating test user...')
    console.log(`   Email: ${testUser.email}`)
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    })

    if (authError) {
      console.log(`❌ Authentication failed: ${authError.message}`)
      return
    }

    console.log('✅ Authentication successful!')
    console.log(`   User ID: ${authData.user.id}`)
    console.log(`   Email: ${authData.user.email}`)
    console.log(`   JWT Token: ${authData.session.access_token.substring(0, 50)}...`)
    console.log('')

    const jwtToken = authData.session.access_token

    // Step 2: Test edge functions with authenticated token
    const functionsToTest = [
      {
        name: 'hello-world',
        body: { name: 'Authenticated User' }
      },
      {
        name: 'chat-completion',
        body: { 
          messages: [
            { role: 'user', content: 'Hello from authenticated user!' }
          ]
        }
      },
      {
        name: 'protocol-guidance',
        body: {
          question: 'How do I create a PICO research protocol?',
          context: 'systematic literature review'
        }
      }
    ]

    console.log('🧪 Step 2: Testing Edge Functions with Authentication...')
    console.log('======================================================\n')

    for (const func of functionsToTest) {
      console.log(`📤 Testing: ${func.name}`)
      
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/${func.name}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(func.body)
        })

        console.log(`   Status: ${response.status} ${response.statusText}`)
        
        if (response.ok) {
          const result = await response.text()
          console.log(`   ✅ Response: ${result.substring(0, 200)}${result.length > 200 ? '...' : ''}`)
        } else {
          const error = await response.text()
          console.log(`   ❌ Error: ${error}`)
        }
      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`)
      }
      
      console.log('')
    }

    // Step 3: Test with service role key for comparison
    console.log('🔧 Step 3: Testing with Service Role Key...')
    console.log('===========================================\n')

    const serviceKey = process.env.SUPABASE_SECRET_KEY
    if (serviceKey) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/hello-world`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'Service Role' })
        })

        console.log(`📤 Service Role Test:`)
        console.log(`   Status: ${response.status} ${response.statusText}`)
        
        if (response.ok) {
          const result = await response.text()
          console.log(`   ✅ Response: ${result}`)
        } else {
          const error = await response.text()
          console.log(`   ❌ Error: ${error}`)
        }
      } catch (error) {
        console.log(`   ❌ Service role test failed: ${error.message}`)
      }
    } else {
      console.log('   ⚠️  No service role key found in environment')
    }

    // Step 4: Test Supabase client functions
    console.log('\n💾 Step 4: Testing Database Access...')
    console.log('====================================\n')

    // Test reading profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)

    if (profileError) {
      console.log(`❌ Profile query error: ${profileError.message}`)
    } else {
      console.log(`✅ Profiles query successful: ${profiles.length} records`)
      if (profiles.length > 0) {
        console.log(`   Sample: ${profiles[0].email} (${profiles[0].full_name || 'No name'})`)
      }
    }

    // Test reading user's own data
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (userError) {
      console.log(`❌ User profile error: ${userError.message}`)
    } else {
      console.log(`✅ User profile: ${userProfile.email} - ${userProfile.full_name || 'No name'}`)
    }

    console.log('\n🎉 Authentication and function testing completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

authenticateAndTestFunctions()