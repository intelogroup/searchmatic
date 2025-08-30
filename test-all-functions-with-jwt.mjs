import fs from 'fs';
import https from 'https';

// Load generated tokens
const tokenData = JSON.parse(fs.readFileSync('generated-tokens.json', 'utf8'));
const { anon_token, service_token, supabase_url } = tokenData;

// All functions to test
const FUNCTIONS = [
  { name: 'test-simple', payload: { name: 'Terry', test: true } },
  { name: 'hello-world', payload: { message: 'Test from Terry' } },
  { name: 'analyze-literature', payload: { 
    articles: [{ title: 'Test Article', abstract: 'Test abstract' }],
    analysisType: 'themes'
  }},
  { name: 'chat-completion', payload: {
    messages: [{ role: 'user', content: 'Hello, test message' }],
    model: 'gpt-3.5-turbo'
  }},
  { name: 'duplicate-detection', payload: {
    articles: [
      { title: 'Article 1', abstract: 'First abstract' },
      { title: 'Article 2', abstract: 'Second abstract' }
    ]
  }},
  { name: 'export-data', payload: {
    projectId: 'test-project',
    format: 'csv'
  }},
  { name: 'process-document', payload: {
    documentUrl: 'https://example.com/test.pdf',
    documentType: 'pdf'
  }},
  { name: 'protocol-guidance', payload: {
    researchQuestion: 'What is the effectiveness of X?',
    frameworkType: 'pico'
  }},
  { name: 'search-articles', payload: {
    query: 'test search',
    databases: ['pubmed'],
    limit: 5
  }}
];

function makeRequest(functionName, payload, token, tokenType) {
  return new Promise((resolve) => {
    const url = new URL(`/functions/v1/${functionName}`, supabase_url);
    const postData = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          function: functionName,
          tokenType,
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        function: functionName,
        tokenType,
        status: 'error',
        error: error.message
      });
    });

    req.write(postData);
    req.end();
  });
}

async function testAllFunctions() {
  console.log('🚀 Testing All Edge Functions with JWT Tokens');
  console.log('==============================================');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🌐 URL: ${supabase_url}`);
  console.log(`🔑 Tokens generated at: ${tokenData.generated_at}\n`);

  const results = {
    success: [],
    failures: [],
    errors: []
  };

  for (const func of FUNCTIONS) {
    console.log(`\n📡 Testing: ${func.name}`);
    console.log('─'.repeat(50));

    // Test with service token (should have more permissions)
    const serviceResult = await makeRequest(func.name, func.payload, service_token, 'service');
    
    if (serviceResult.status === 200 || serviceResult.status === 201) {
      console.log(`  ✅ Success with service token (${serviceResult.status})`);
      let preview = serviceResult.body;
      try {
        const parsed = JSON.parse(serviceResult.body);
        preview = JSON.stringify(parsed, null, 2);
      } catch {}
      console.log(`  Response: ${preview.substring(0, 200)}${preview.length > 200 ? '...' : ''}`);
      results.success.push({ ...func, tokenType: 'service' });
    } else if (serviceResult.status === 'error') {
      console.log(`  💥 Request error: ${serviceResult.error}`);
      results.errors.push({ ...func, error: serviceResult.error });
    } else {
      console.log(`  ❌ Failed with service token (${serviceResult.status})`);
      console.log(`  Response: ${serviceResult.body.substring(0, 200)}...`);
      
      // Try with anon token
      console.log('\n  🔄 Trying with anon token...');
      const anonResult = await makeRequest(func.name, func.payload, anon_token, 'anon');
      
      if (anonResult.status === 200 || anonResult.status === 201) {
        console.log(`  ✅ Success with anon token (${anonResult.status})`);
        results.success.push({ ...func, tokenType: 'anon' });
      } else {
        console.log(`  ❌ Failed with anon token (${anonResult.status})`);
        results.failures.push({ ...func, serviceStatus: serviceResult.status, anonStatus: anonResult.status });
      }
    }
  }

  // Summary
  console.log('\n\n📊 Final Summary');
  console.log('================');
  console.log(`✅ Successful: ${results.success.length}/${FUNCTIONS.length}`);
  if (results.success.length > 0) {
    results.success.forEach(f => {
      console.log(`   - ${f.name} (${f.tokenType} token)`);
    });
  }

  console.log(`\n❌ Failed: ${results.failures.length}/${FUNCTIONS.length}`);
  if (results.failures.length > 0) {
    results.failures.forEach(f => {
      console.log(`   - ${f.name} (service: ${f.serviceStatus}, anon: ${f.anonStatus})`);
    });
  }

  console.log(`\n💥 Errors: ${results.errors.length}/${FUNCTIONS.length}`);
  if (results.errors.length > 0) {
    results.errors.forEach(f => {
      console.log(`   - ${f.name}: ${f.error}`);
    });
  }

  // Save detailed results
  const detailedResults = {
    timestamp: new Date().toISOString(),
    summary: {
      total: FUNCTIONS.length,
      successful: results.success.length,
      failed: results.failures.length,
      errors: results.errors.length
    },
    results
  };

  fs.writeFileSync('edge-functions-jwt-test-results.json', JSON.stringify(detailedResults, null, 2));
  console.log('\n💾 Detailed results saved to edge-functions-jwt-test-results.json');

  // Token expiry reminder
  const tokenPayload = JSON.parse(Buffer.from(anon_token.split('.')[1], 'base64').toString());
  const expiryTime = new Date(tokenPayload.exp * 1000);
  const remainingTime = Math.floor((expiryTime - new Date()) / 1000 / 60);
  
  console.log('\n⏰ Token Information:');
  console.log(`   Expires at: ${expiryTime.toISOString()}`);
  console.log(`   Time remaining: ${remainingTime} minutes`);
  
  if (remainingTime < 30) {
    console.log('   ⚠️  Tokens will expire soon! Regenerate with: node generate-jwt-token.mjs');
  }
}

// Run tests
testAllFunctions().then(() => {
  console.log('\n✨ All tests complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});