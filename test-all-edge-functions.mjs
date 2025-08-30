import https from 'https';
import fs from 'fs';

// Supabase configuration
const SUPABASE_URL = 'https://qzvfufadiqmizrozejci.supabase.co';
const ANON_KEY = 'sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS';
const SERVICE_KEY = 'sb_secret_0HF5k5_nhplbINXe-IL9zA_gZQjDN8p';

// JWT Key Information
const JWT_KEYS = {
  active: {
    kid: 'ee8e6058-6e20-48ff-b3df-5229b6f97809',
    x: 'RVEQ9uGlchYQLvzJNvcT1j1pgYjfky0l0IA3m4wuNp4',
    y: 'wNoZzJM81WM8Y5GT6Gj26MnvkhdlmTlEg3X3-Bep_9w'
  },
  standby: {
    kid: '92028fb7-7a2d-4314-9f84-ce5ab7293bcb',
    x: 'REGKht3ZRqTrOlWHVsEQIRrTfjbQ0FIL4pckW5m9YDs',
    y: 'fRRBc8h5ykvrw5o4VWo5I4TT0LnAzL3obdw68ciAN-M'
  }
};

// List of all functions found in supabase/functions
const FUNCTIONS = [
  'analyze-literature',
  'chat-completion',
  'duplicate-detection',
  'export-data',
  'hello-world',
  'process-document',
  'protocol-guidance',
  'search-articles',
  'test-simple'
];

function makeRequest(path, method = 'POST', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testFunction(functionName, authKey, authType) {
  try {
    console.log(`  🔑 Testing with ${authType} key...`);
    
    // Prepare test payload based on function type
    let payload = { test: true };
    
    if (functionName === 'chat-completion') {
      payload = {
        messages: [{ role: 'user', content: 'Hello, this is a test' }],
        model: 'gpt-3.5-turbo'
      };
    } else if (functionName === 'search-articles') {
      payload = {
        query: 'test search',
        databases: ['pubmed'],
        limit: 5
      };
    } else if (functionName === 'duplicate-detection') {
      payload = {
        articles: [
          { title: 'Test Article 1', abstract: 'This is a test abstract' },
          { title: 'Test Article 2', abstract: 'This is another test abstract' }
        ]
      };
    } else if (functionName === 'export-data') {
      payload = {
        projectId: 'test-project-id',
        format: 'csv'
      };
    } else if (functionName === 'process-document') {
      payload = {
        documentUrl: 'https://example.com/test.pdf',
        documentType: 'pdf'
      };
    } else if (functionName === 'protocol-guidance') {
      payload = {
        researchQuestion: 'What is the effectiveness of intervention X?',
        frameworkType: 'pico'
      };
    } else if (functionName === 'analyze-literature') {
      payload = {
        articles: [
          { title: 'Test Article', abstract: 'Test abstract content' }
        ],
        analysisType: 'themes'
      };
    }
    
    const response = await makeRequest(
      `/functions/v1/${functionName}`,
      'POST',
      payload,
      {
        'Authorization': `Bearer ${authKey}`,
        'apikey': authKey
      }
    );

    if (response.status === 200 || response.status === 201) {
      console.log(`    ✅ Success (Status: ${response.status})`);
      const preview = response.body.substring(0, 150);
      console.log(`    Response preview: ${preview}${response.body.length > 150 ? '...' : ''}`);
      return { status: 'success', code: response.status };
    } else if (response.status === 404) {
      console.log(`    ⚠️  Not deployed (404)`);
      return { status: 'not_found', code: 404 };
    } else if (response.status === 401) {
      console.log(`    🔒 Unauthorized (401)`);
      return { status: 'unauthorized', code: 401 };
    } else if (response.status === 403) {
      console.log(`    🚫 Forbidden (403)`);
      return { status: 'forbidden', code: 403 };
    } else if (response.status === 500) {
      console.log(`    💥 Server error (500)`);
      let errorMsg = response.body.substring(0, 150);
      console.log(`    Error: ${errorMsg}${response.body.length > 150 ? '...' : ''}`);
      return { status: 'error', code: 500 };
    } else {
      console.log(`    ❌ Error (Status: ${response.status})`);
      const preview = response.body.substring(0, 150);
      console.log(`    Response: ${preview}${response.body.length > 150 ? '...' : ''}`);
      return { status: 'error', code: response.status };
    }
  } catch (error) {
    console.log(`    💥 Request failed: ${error.message}`);
    return { status: 'failed', error: error.message };
  }
}

async function testAllFunctions() {
  console.log('🚀 Testing All Edge Functions');
  console.log('==============================');
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log(`🌐 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 JWT Key IDs: Active: ${JWT_KEYS.active.kid}, Standby: ${JWT_KEYS.standby.kid}`);
  console.log('');

  const results = {
    deployed: [],
    not_deployed: [],
    requires_auth: [],
    errors: []
  };

  for (const func of FUNCTIONS) {
    console.log(`\n📡 Testing: ${func}`);
    console.log('─'.repeat(40));
    
    // Test with service key first
    const serviceResult = await testFunction(func, SERVICE_KEY, 'service');
    
    if (serviceResult.code === 404) {
      results.not_deployed.push(func);
    } else if (serviceResult.code === 401 || serviceResult.code === 403) {
      results.requires_auth.push(func);
      
      // Try with anon key
      console.log('');
      const anonResult = await testFunction(func, ANON_KEY, 'anon');
      
      if (anonResult.status === 'success') {
        results.deployed.push(func);
      }
    } else if (serviceResult.status === 'success') {
      results.deployed.push(func);
    } else {
      results.errors.push({ function: func, error: serviceResult });
    }
  }

  console.log('\n\n📊 Test Summary');
  console.log('================');
  console.log(`✅ Successfully accessed: ${results.deployed.length}`);
  if (results.deployed.length > 0) {
    results.deployed.forEach(f => console.log(`   - ${f}`));
  }
  
  console.log(`\n🔒 Requires authentication: ${results.requires_auth.length}`);
  if (results.requires_auth.length > 0) {
    results.requires_auth.forEach(f => console.log(`   - ${f}`));
  }
  
  console.log(`\n⚠️  Not deployed: ${results.not_deployed.length}`);
  if (results.not_deployed.length > 0) {
    results.not_deployed.forEach(f => console.log(`   - ${f}`));
  }
  
  console.log(`\n❌ Errors: ${results.errors.length}`);
  if (results.errors.length > 0) {
    results.errors.forEach(e => console.log(`   - ${e.function}: ${e.error.status || e.error.error}`));
  }

  // Save results
  fs.writeFileSync('edge-functions-test-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    supabase_url: SUPABASE_URL,
    jwt_keys: JWT_KEYS,
    results: results
  }, null, 2));
  
  console.log('\n💾 Results saved to edge-functions-test-results.json');
}

// Run the tests
testAllFunctions().then(() => {
  console.log('\n✨ Testing complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});