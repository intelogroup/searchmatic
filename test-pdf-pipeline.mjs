import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import { config } from 'dotenv'

config()

// Test the PDF processing pipeline
async function testPDFPipeline() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

  console.log('🧪 Testing PDF Processing Pipeline')
  console.log('==================================\n')

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 1. Test authentication
    console.log('1. Testing authentication...')
    
    // Generate a test JWT token
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    })

    if (authError) {
      console.log('   ⚠️  No existing test user, creating one...')
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpassword123'
      })

      if (signUpError) {
        throw new Error(`Authentication failed: ${signUpError.message}`)
      }
      
      console.log('   ✅ Test user created')
    } else {
      console.log('   ✅ Authentication successful')
    }

    // 2. Use existing project for testing
    console.log('\n2. Testing project setup...')
    
    // Use the first existing project
    const projectId = '409111b3-e749-4b15-b396-a742317cd7aa'
    console.log(`   ✅ Using existing project: ${projectId}`)

    // 3. Create a test text document
    console.log('\n3. Creating test document...')
    const testDocument = `
Research Paper: Effects of Caffeine on Cognitive Performance

Abstract:
This study examines the effects of caffeine consumption on cognitive performance in adults aged 18-65.

Methods:
- Participants: 120 healthy adults
- Design: Randomized controlled trial
- Intervention: 200mg caffeine vs placebo
- Outcome measures: Reaction time, memory, attention

Results:
Caffeine group showed significant improvement in reaction time (p<0.001) and sustained attention (p<0.01).
No significant differences in memory tasks were observed.

Conclusions:
Moderate caffeine consumption enhances certain aspects of cognitive performance, particularly reaction time and attention.

Authors: Smith, J., Johnson, M., Davis, K.
Journal: Journal of Cognitive Science
Year: 2023
DOI: 10.1234/jcs.2023.001
    `

    // Convert to base64
    const base64Content = Buffer.from(testDocument, 'utf-8').toString('base64')

    // 4. Test document processing
    console.log('\n4. Testing document processing...')
    
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (!currentSession) {
      throw new Error('No active session for testing')
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentSession.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        fileName: 'test-research-paper.txt',
        fileContent: base64Content,
        processType: 'text_extraction',
        language: 'en'
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Edge function failed: ${errorData.error}`)
    }

    const result = await response.json()
    console.log('   ✅ Document processed successfully')
    console.log(`   📄 Article ID: ${result.articleId}`)
    console.log(`   🗂️  PDF File ID: ${result.pdfFileId}`)
    console.log(`   📝 Extracted ${result.result.extractedText?.length || 0} characters`)

    // 5. Test database records
    console.log('\n5. Verifying database records...')
    
    // Check article record
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, title, status, full_text, metadata')
      .eq('id', result.articleId)
      .single()

    if (articleError || !article) {
      throw new Error('Article record not found in database')
    }
    console.log(`   ✅ Article record verified: ${article.title}`)
    console.log(`   📊 Status: ${article.status}`)

    // Check PDF file record  
    if (result.pdfFileId) {
      const { data: pdfFile, error: pdfError } = await supabase
        .from('pdf_files')
        .select('id, file_name, processing_status, file_size')
        .eq('id', result.pdfFileId)
        .single()

      if (pdfError || !pdfFile) {
        throw new Error('PDF file record not found in database')
      }
      console.log(`   ✅ PDF file record verified: ${pdfFile.file_name}`)
      console.log(`   📈 Processing status: ${pdfFile.processing_status}`)
    }

    // 6. Test extraction templates
    console.log('\n6. Testing extraction templates...')
    
    const { data: templates, error: templateError } = await supabase
      .from('extraction_templates')
      .select('*')
      .eq('project_id', projectId)

    if (templateError) {
      throw new Error(`Template query failed: ${templateError.message}`)
    }

    console.log(`   ✅ Found ${templates?.length || 0} extraction templates`)

    // 7. Test full analysis with AI (if OpenAI key available)
    if (process.env.OPENAI_API_KEY) {
      console.log('\n7. Testing AI analysis...')
      
      const aiResponse = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          fileName: 'test-research-paper-ai.txt',
          fileContent: base64Content,
          processType: 'full_analysis',
          language: 'en'
        })
      })

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json()
        console.log(`   ⚠️  AI analysis failed: ${errorData.error}`)
      } else {
        const aiResult = await aiResponse.json()
        console.log('   ✅ AI analysis completed')
        console.log(`   🤖 Analysis length: ${aiResult.result.analysis?.length || 0} characters`)
      }
    } else {
      console.log('\n7. Skipping AI analysis (no OpenAI API key)')
    }

    console.log('\n🎉 PDF Processing Pipeline Test Complete!')
    console.log('=====================================')
    console.log('✅ All core components working correctly')
    console.log('✅ Database schema integration verified')
    console.log('✅ Edge function deployment successful')
    console.log('✅ File processing and storage working')

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message)
    console.log('\nDebugging information:')
    console.log('- Supabase URL:', supabaseUrl)
    console.log('- Database connection: Check network and credentials')
    console.log('- Edge functions: Verify deployment status')
    process.exit(1)
  }
}

// Run the test
testPDFPipeline()