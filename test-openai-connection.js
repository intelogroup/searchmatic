#!/usr/bin/env node

/**
 * Quick OpenAI API Connection Test
 */

import axios from 'axios';
import { readFileSync } from 'fs';

// Load environment variables
function loadEnvVariables() {
  try {
    const envContent = readFileSync('.env.local', 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        env[key.trim()] = value.trim();
      }
    });
    return env;
  } catch (error) {
    console.warn('Could not load .env.local file');
    return {};
  }
}

const envVars = loadEnvVariables();
const OPENAI_API_KEY = envVars.VITE_OPENAI_API_KEY;

console.log('Testing OpenAI API Connection...');
console.log('API Key present:', !!OPENAI_API_KEY);
console.log('API Key starts with:', OPENAI_API_KEY?.substring(0, 10) + '...');

if (!OPENAI_API_KEY) {
  console.error('❌ No OpenAI API key found in .env.local');
  process.exit(1);
}

try {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Say "OpenAI connection successful" if you can read this message.'
        }
      ],
      max_tokens: 20
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );
  
  console.log('✅ OpenAI API Connection Successful!');
  console.log('Response:', response.data.choices[0].message.content);
  console.log('Model used:', response.data.model);
  console.log('Tokens used:', response.data.usage.total_tokens);
  
} catch (error) {
  console.error('❌ OpenAI API Connection Failed:');
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Error:', error.response.data.error?.message || error.response.data);
  } else {
    console.error('Error:', error.message);
  }
}