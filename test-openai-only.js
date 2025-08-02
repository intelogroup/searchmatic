// Quick test of just the OpenAI API connection
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const openaiApiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.error('❌ No OpenAI API key found. Set VITE_OPENAI_API_KEY in .env.local');
  process.exit(1);
}

async function testOpenAI() {
  console.log('🤖 Testing OpenAI API with full key...');
  
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
            role: 'user',
            content: 'Say "OpenAI connection successful!" to confirm this works.'
          }
        ],
        max_tokens: 20
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API Error:', error);
      return;
    }

    const data = await response.json();
    const message = data.choices[0]?.message?.content;
    
    console.log('✅ OpenAI API Key Working!');
    console.log(`🤖 Response: "${message}"`);
    console.log('💡 AI features will work once database migration is applied');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOpenAI();