#!/usr/bin/env node

/**
 * Test script for edge functions
 * Tests all the edge functions we created to ensure they work correctly
 */

const fetch = require('node-fetch'); // You might need to install: npm install node-fetch

// Configuration - UPDATE THESE VALUES
const SUPABASE_URL = 'https://searchmatic-mvp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlYXJjaG1hdGljLW12cCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzI1Mjc3ODcwLCJleHAiOjIwNDA4NTM4NzB9.T2qzlPJJ4EhPMG7aLXH7YPl8J4R8hiRnfaYKKLm7XbQ';
const TEST_JWT_TOKEN = 'your-test-jwt-token-here'; // You'll need to get this from a login

class EdgeFunctionTester {
    constructor() {
        this.baseUrl = SUPABASE_URL;
        this.headers = {
            'Authorization': `Bearer ${TEST_JWT_TOKEN}`,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
        };
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🧪 Starting Edge Function Tests\n');

        // Test 1: Chat Completion (existing secure function)
        await this.testFunction('chat-completion', {
            conversationId: 'test-conv-id',
            messages: [
                { role: 'user', content: 'Hello, this is a test message' }
            ],
            options: { stream: false }
        });

        // Test 2: Literature Analysis (existing function)  
        await this.testFunction('analyze-literature', {
            articleText: 'This is a test research article about machine learning in healthcare.',
            analysisType: 'summary',
            projectId: 'test-project-id'
        });

        // Test 3: Search Articles
        await this.testFunction('search-articles', {
            projectId: 'test-project-id',
            query: 'systematic review diabetes',
            databases: ['pubmed'],
            maxResults: 10
        });

        // Test 4: Process Document
        await this.testFunction('process-document', {
            projectId: 'test-project-id',
            fileName: 'test-document.txt',
            fileContent: btoa('This is a test document content for processing.'),
            processType: 'text_extraction'
        });

        // Test 5: Export Data
        await this.testFunction('export-data', {
            projectId: 'test-project-id',
            exportType: 'json',
            includeFields: ['title', 'authors', 'journal'],
            filters: {}
        });

        // Test 6: Duplicate Detection
        await this.testFunction('duplicate-detection', {
            projectId: 'test-project-id',
            threshold: 0.85,
            method: 'rule_based',
            autoMerge: false
        });

        // Test 7: Protocol Guidance
        await this.testFunction('protocol-guidance', {
            type: 'framework',
            researchQuestion: 'What is the effectiveness of mindfulness interventions for anxiety?',
            focusArea: 'pico',
            reviewType: 'systematic_review'
        });

        // Print results
        this.printResults();
    }

    async testFunction(functionName, payload) {
        console.log(`📡 Testing ${functionName}...`);

        try {
            const response = await fetch(`${this.baseUrl}/functions/v1/${functionName}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(payload)
            });

            const statusCode = response.status;
            let responseData;

            try {
                responseData = await response.json();
            } catch {
                responseData = await response.text();
            }

            const success = statusCode >= 200 && statusCode < 300;
            
            this.testResults.push({
                function: functionName,
                success,
                statusCode,
                response: responseData,
                error: success ? null : responseData.error || 'Unknown error'
            });

            if (success) {
                console.log(`   ✅ ${functionName}: SUCCESS (${statusCode})`);
                if (responseData.success !== false) {
                    console.log(`   📊 Response: ${JSON.stringify(responseData).substring(0, 100)}...`);
                }
            } else {
                console.log(`   ❌ ${functionName}: FAILED (${statusCode})`);
                console.log(`   🔍 Error: ${responseData.error || responseData}`);
            }

        } catch (error) {
            console.log(`   ❌ ${functionName}: NETWORK ERROR`);
            console.log(`   🔍 Error: ${error.message}`);
            
            this.testResults.push({
                function: functionName,
                success: false,
                statusCode: 0,
                response: null,
                error: error.message
            });
        }

        console.log('');
    }

    printResults() {
        console.log('📊 Test Results Summary\n');
        
        const successful = this.testResults.filter(r => r.success).length;
        const total = this.testResults.length;
        
        console.log(`Overall: ${successful}/${total} functions working\n`);
        
        console.log('Detailed Results:');
        this.testResults.forEach(result => {
            const status = result.success ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${result.function} (${result.statusCode})`);
            if (!result.success) {
                console.log(`      Error: ${result.error}`);
            }
        });

        console.log('\n🎯 Next Steps:');
        
        if (successful === 0) {
            console.log('❗ No functions working - Check JWT token and Supabase URL');
        } else if (successful < total) {
            console.log('⚠️  Some functions failing:');
            this.testResults.filter(r => !r.success).forEach(result => {
                console.log(`   - Fix ${result.function}: ${result.error}`);
            });
        } else {
            console.log('🎉 All functions working! Ready for production.');
        }

        console.log('\n📋 Deployment Commands:');
        console.log('1. Deploy functions: supabase functions deploy');
        console.log('2. Set secrets: supabase secrets set OPENAI_API_KEY=your-key');  
        console.log('3. Run migration: Apply 20250109_edge_functions_support.sql');
        console.log('4. Test in production with real authentication');
    }
}

// Usage instructions
function printUsageInstructions() {
    console.log(`
🔧 Setup Instructions:

1. Get a test JWT token:
   - Login to your app
   - Open browser dev tools
   - Find the JWT token in localStorage or session
   - Update TEST_JWT_TOKEN constant in this script

2. Update configuration:
   - Verify SUPABASE_URL is correct
   - Verify SUPABASE_ANON_KEY is correct

3. Install dependencies (if needed):
   npm install node-fetch

4. Run tests:
   node scripts/test-edge-functions.js

Note: Some tests may fail if:
- JWT token is invalid/expired
- OpenAI API key not set in Supabase secrets  
- Database migration not applied
- Functions not deployed yet
`);
}

// Run tests if JWT token is configured
if (TEST_JWT_TOKEN === 'your-test-jwt-token-here') {
    printUsageInstructions();
} else {
    const tester = new EdgeFunctionTester();
    tester.runAllTests().catch(console.error);
}