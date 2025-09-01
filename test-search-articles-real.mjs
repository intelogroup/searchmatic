import fs from 'fs';
import https from 'https';

// Load generated tokens
const tokenData = JSON.parse(fs.readFileSync('generated-tokens.json', 'utf8'));
const { service_token, supabase_url } = tokenData;

function makeRequest(functionName, payload, token) {
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
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 'error',
        error: error.message
      });
    });

    req.write(postData);
    req.end();
  });
}

async function testSearchArticles() {
  console.log('🔬 Testing PubMed Article Search');
  console.log('===============================');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🌐 URL: ${supabase_url}\n`);

  // Test cases with different search queries
  const testCases = [
    {
      name: 'Simple keyword search',
      payload: {
        projectId: 'test-project-12345',
        query: 'diabetes exercise',
        options: { limit: 5 }
      }
    },
    {
      name: 'Protocol-based search',
      payload: {
        projectId: 'test-project-12345',
        protocol: {
          keywords: ['machine learning', 'artificial intelligence'],
          dateRange: {
            startDate: '2023/01/01',
            endDate: '2024/12/31'
          },
          studyTypes: ['Review'],
          languages: ['english'],
          includeHumans: true
        },
        options: { limit: 3 }
      }
    },
    {
      name: 'Medical condition search',
      payload: {
        projectId: 'test-project-12345',
        query: 'COVID-19 vaccination effectiveness',
        options: { limit: 10 }
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📡 Testing: ${testCase.name}`);
    console.log('─'.repeat(60));
    
    console.log('Request payload:');
    console.log(JSON.stringify(testCase.payload, null, 2));
    
    const startTime = Date.now();
    const result = await makeRequest('search-articles', testCase.payload, service_token);
    const duration = Date.now() - startTime;
    
    console.log(`\n⏱️  Response time: ${duration}ms`);
    console.log(`📊 Status: ${result.status}`);
    
    if (result.status === 200) {
      try {
        const responseData = JSON.parse(result.body);
        
        console.log('✅ Success! Response summary:');
        console.log(`   - Success: ${responseData.success}`);
        console.log(`   - Articles found: ${responseData.articles?.length || 0}`);
        console.log(`   - Total count: ${responseData.totalCount || 0}`);
        console.log(`   - Database: ${responseData.database || 'N/A'}`);
        console.log(`   - Query used: ${responseData.query || 'N/A'}`);
        
        if (responseData.articles && responseData.articles.length > 0) {
          console.log('\n📄 First article example:');
          const firstArticle = responseData.articles[0];
          console.log(`   Title: ${firstArticle.title}`);
          console.log(`   PMID: ${firstArticle.pmid}`);
          console.log(`   Authors: ${firstArticle.authors?.map(a => `${a.foreName} ${a.lastName}`).join(', ') || 'N/A'}`);
          console.log(`   Journal: ${firstArticle.journal?.name || 'N/A'}`);
          console.log(`   Publication Date: ${firstArticle.publicationDate || 'N/A'}`);
          console.log(`   DOI: ${firstArticle.doi || 'N/A'}`);
          console.log(`   Abstract: ${firstArticle.abstract ? firstArticle.abstract.substring(0, 150) + '...' : 'N/A'}`);
          
          // Show MeSH terms if available
          if (firstArticle.meshTerms && firstArticle.meshTerms.length > 0) {
            console.log(`   MeSH Terms: ${firstArticle.meshTerms.slice(0, 3).map(m => m.descriptorName).join(', ')}`);
          }
        }
        
        // Save results for inspection
        const filename = `search-results-${testCase.name.replace(/\s+/g, '-').toLowerCase()}.json`;
        fs.writeFileSync(filename, JSON.stringify(responseData, null, 2));
        console.log(`\n💾 Full response saved to: ${filename}`);
        
      } catch (parseError) {
        console.log('❌ Failed to parse response as JSON');
        console.log('Raw response:', result.body.substring(0, 500));
      }
    } else if (result.status === 'error') {
      console.log(`💥 Request error: ${result.error}`);
    } else {
      console.log(`❌ HTTP Error ${result.status}`);
      console.log('Response:', result.body.substring(0, 500));
    }
    
    // Wait between requests to be respectful to the API
    if (testCase !== testCases[testCases.length - 1]) {
      console.log('\n⏸️  Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n\n🎯 Summary');
  console.log('===========');
  console.log('The search-articles function integrates with PubMed\'s E-utilities API');
  console.log('to fetch real scientific articles. Key features:');
  console.log('• Support for both simple keyword and protocol-based searches');
  console.log('• Proper XML parsing of PubMed article metadata');
  console.log('• Rate limiting to respect NCBI guidelines');
  console.log('• Batch processing for efficient data retrieval');
  console.log('• Storage of search results in the database');
  console.log('\nCheck the generated JSON files for detailed article data!');
}

testSearchArticles().then(() => {
  console.log('\n✨ Search article test complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});