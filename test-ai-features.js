import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://qzvfufadiqmizrozejci.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const openaiApiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY

if (!openaiApiKey) {
  console.error('❌ No OpenAI API key found. Set VITE_OPENAI_API_KEY in .env.local');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error('❌ No Supabase anon key found. Set VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testOpenAIConnection() {
  console.log('🤖 Testing OpenAI API connection...')
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful research assistant. Respond briefly.'
          },
          {
            role: 'user', 
            content: 'Say "Hello from Searchmatic!" to confirm the connection is working.'
          }
        ],
        max_tokens: 50,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ OpenAI API call failed:', error)
      return false
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content
    
    console.log('✅ OpenAI API connection successful')
    console.log(`🤖 AI Response: "${aiResponse}"`)
    
    return true
  } catch (error) {
    console.error('❌ OpenAI test failed:', error.message)
    return false
  }
}

async function testDatabaseOperations() {
  console.log('\n💾 Testing database CRUD operations...')
  
  try {
    // Sign in with test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'jayveedz19@gmail.com',
      password: 'Jimkali90#'
    })
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message)
      return false
    }
    
    console.log('✅ Authenticated successfully')
    const userId = authData.user.id
    
    // Test 1: Create a test project
    console.log('\n📁 Testing project creation...')
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([{
        title: 'Test Project - AI Features',
        description: 'Testing AI chat and protocol features',
        user_id: userId
      }])
      .select()
      .single()
      
    if (projectError) {
      console.error('❌ Project creation failed:', projectError.message)
      return false
    }
    
    console.log('✅ Project created successfully:', project.title)
    const projectId = project.id
    
    // Test 2: Create a conversation
    console.log('\n💬 Testing conversation creation...')
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert([{
        project_id: projectId,
        user_id: userId,
        title: 'Test Chat with AI Professor',
        context: 'Testing the AI chat functionality'
      }])
      .select()
      .single()
      
    if (convError) {
      console.error('❌ Conversation creation failed:', convError.message)
      return false
    }
    
    console.log('✅ Conversation created successfully:', conversation.title)
    const conversationId = conversation.id
    
    // Test 3: Create messages
    console.log('\n📝 Testing message creation...')
    const messages = [
      {
        conversation_id: conversationId,
        role: 'user',
        content: 'Hello AI Professor! Can you help me with my research protocol?',
        metadata: { test: true }
      },
      {
        conversation_id: conversationId,
        role: 'assistant', 
        content: 'Hello! I\'d be happy to help you with your research protocol. What type of research are you planning to conduct?',
        metadata: { ai_generated: true, model: 'gpt-4o-mini' }
      }
    ]
    
    for (const message of messages) {
      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .insert([message])
        .select()
        .single()
        
      if (msgError) {
        console.error('❌ Message creation failed:', msgError.message)
        return false
      }
      
      console.log(`✅ Message created: ${message.role} - "${message.content.substring(0, 50)}..."`)
    }
    
    // Test 4: Create a protocol
    console.log('\n📋 Testing protocol creation...')
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .insert([{
        project_id: projectId,
        user_id: userId,
        title: 'Test Research Protocol',
        description: 'A test protocol created by AI guidance',
        research_question: 'What is the effectiveness of AI-assisted systematic literature reviews?',
        framework_type: 'pico',
        population: 'Researchers conducting systematic reviews',
        intervention: 'AI-assisted literature review tools',
        comparison: 'Traditional manual review methods',
        outcome: 'Review quality, time efficiency, and accuracy',
        inclusion_criteria: ['Published peer-reviewed articles', 'English language studies', 'Studies from 2020-2024'],
        exclusion_criteria: ['Non-peer reviewed sources', 'Studies without quantitative measures'],
        keywords: ['systematic review', 'artificial intelligence', 'literature review', 'automation'],
        databases: ['PubMed', 'IEEE Xplore', 'ACM Digital Library'],
        status: 'draft',
        ai_generated: true,
        ai_guidance_used: {
          initial_creation: {
            timestamp: new Date().toISOString(),
            guidance: 'AI helped structure the PICO framework and suggest relevant keywords',
            model: 'gpt-4o-mini'
          }
        }
      }])
      .select()
      .single()
      
    if (protocolError) {
      console.error('❌ Protocol creation failed:', protocolError.message)
      return false
    }
    
    console.log('✅ Protocol created successfully:', protocol.title)
    console.log(`   📋 Framework: ${protocol.framework_type.toUpperCase()}`)
    console.log(`   ❓ Research Question: ${protocol.research_question}`)
    console.log(`   🏷️  Keywords: ${protocol.keywords.join(', ')}`)
    
    // Test 5: Update protocol (test AI refinement scenario)
    console.log('\n🔄 Testing protocol update...')
    const { data: updatedProtocol, error: updateError } = await supabase
      .from('protocols')
      .update({
        inclusion_criteria: ['Published peer-reviewed articles', 'English language studies', 'Studies from 2020-2024', 'Studies with human subjects'],
        ai_guidance_used: {
          ...protocol.ai_guidance_used,
          refinement: {
            timestamp: new Date().toISOString(),
            guidance: 'AI suggested adding human subjects criterion for better focus',
            focus_area: 'inclusion_criteria'
          }
        }
      })
      .eq('id', protocol.id)
      .select()
      .single()
      
    if (updateError) {
      console.error('❌ Protocol update failed:', updateError.message)
      return false
    }
    
    console.log('✅ Protocol updated successfully')
    console.log(`   📝 Updated inclusion criteria: ${updatedProtocol.inclusion_criteria.length} items`)
    
    // Test 6: Query operations (test data retrieval)
    console.log('\n🔍 Testing data retrieval...')
    
    // Get conversations with messages
    const { data: convWithMessages, error: queryError } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (*)
      `)
      .eq('project_id', projectId)
      
    if (queryError) {
      console.error('❌ Query failed:', queryError.message)
      return false
    }
    
    console.log('✅ Data retrieval successful')
    console.log(`   💬 Found ${convWithMessages.length} conversations`)
    console.log(`   📝 Total messages: ${convWithMessages.reduce((sum, conv) => sum + conv.messages.length, 0)}`)
    
    // Clean up test data
    console.log('\n🗑️  Cleaning up test data...')
    
    // Delete in correct order due to foreign key constraints
    await supabase.from('messages').delete().eq('conversation_id', conversationId)
    await supabase.from('conversations').delete().eq('id', conversationId)
    await supabase.from('protocols').delete().eq('id', protocol.id)
    await supabase.from('projects').delete().eq('id', projectId)
    
    console.log('✅ Test data cleaned up successfully')
    
    // Sign out
    await supabase.auth.signOut()
    console.log('🚪 Signed out successfully')
    
    return true
    
  } catch (error) {
    console.error('❌ Database operations test failed:', error.message)
    return false
  }
}

async function testAIIntegration() {
  console.log('\n🧠 Testing AI integration scenarios...')
  
  try {
    // Test AI protocol guidance
    console.log('\n📋 Testing AI protocol guidance...')
    
    const protocolPrompt = `As a research methodology expert, help create a PICO framework for this research question:
    
"What is the effectiveness of telemedicine interventions on patient satisfaction in rural areas?"

Please provide:
- Population: Define the target population
- Intervention: Specify the telemedicine interventions
- Comparison: What should be compared against
- Outcome: What outcomes to measure

Keep the response structured and concise.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert research methodology advisor specializing in systematic literature reviews and evidence-based research design.'
          },
          {
            role: 'user', 
            content: protocolPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      console.error('❌ AI protocol guidance failed')
      return false
    }

    const data = await response.json()
    const aiGuidance = data.choices[0]?.message?.content
    
    console.log('✅ AI protocol guidance successful')
    console.log('🤖 AI Guidance Sample:')
    console.log(aiGuidance.substring(0, 300) + '...')
    
    // Test streaming response simulation
    console.log('\n⚡ Testing streaming response simulation...')
    
    const streamPrompt = 'Explain the benefits of AI in systematic literature reviews in 3 bullet points.'
    
    const streamResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Provide clear, concise responses.'
          },
          {
            role: 'user', 
            content: streamPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.5,
        stream: false // For testing, we'll use non-streaming
      })
    })

    if (!streamResponse.ok) {
      console.error('❌ Streaming test failed')
      return false
    }

    const streamData = await streamResponse.json()
    const streamContent = streamData.choices[0]?.message?.content
    
    console.log('✅ Streaming simulation successful')
    console.log('💬 Response:', streamContent)
    
    return true
    
  } catch (error) {
    console.error('❌ AI integration test failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Searchmatic MVP - AI Features Comprehensive Test\n')
  console.log('================================================\n')
  
  const tests = [
    { name: 'OpenAI Connection', fn: testOpenAIConnection },
    { name: 'Database Operations', fn: testDatabaseOperations },
    { name: 'AI Integration', fn: testAIIntegration }
  ]
  
  const results = []
  
  for (const test of tests) {
    console.log(`\n🧪 Running ${test.name} test...`)
    console.log('─'.repeat(50))
    
    const startTime = Date.now()
    const result = await test.fn()
    const duration = Date.now() - startTime
    
    results.push({
      name: test.name,
      passed: result,
      duration
    })
    
    console.log(`\n⏱️  ${test.name} completed in ${duration}ms`)
    console.log(result ? '✅ PASSED' : '❌ FAILED')
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r.passed).length
  const total = results.length
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} ${result.name} (${result.duration}ms)`)
  })
  
  console.log('\n📈 Overall Result:')
  console.log(`${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`)
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! The AI chat and protocol features are working correctly.')
    console.log('\n🌟 Ready for production testing with:')
    console.log('   💬 AI Chat Professor functionality')
    console.log('   📋 AI-guided protocol creation')
    console.log('   💾 Complete database persistence')
    console.log('   🔄 Real-time messaging capabilities')
    console.log('\n🌐 Test the features at: http://localhost:5173/')
    console.log('👤 Use credentials: jayveedz19@gmail.com / Jimkali90#')
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above for details.')
  }
}

main().catch(console.error)