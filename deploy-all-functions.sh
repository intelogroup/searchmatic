#!/bin/bash

# Deploy all edge functions with --no-verify-jwt flag
# This bypasses Supabase platform JWT validation while allowing functions to handle auth internally

echo "🚀 Deploying all edge functions with --no-verify-jwt flag..."

# Array of all functions
functions=(
    "analyze-literature"
    "chat-completion"
    "chat-completion-v2"
    "duplicate-detection"
    "export-data"
    "hello-world"
    "process-document"
    "professor-ai-chat"
    "protocol-guidance"
    "public-test"
    "search-articles"
    "test-simple"
    "test-simple-v2"
)

# Deploy each function
for func in "${functions[@]}"; do
    echo "📦 Deploying $func..."
    if npx supabase functions deploy "$func" --no-verify-jwt; then
        echo "✅ $func deployed successfully"
    else
        echo "❌ Failed to deploy $func"
    fi
    echo "---"
done

echo "🏁 All functions deployment completed!"
echo ""
echo "🧪 Test the functions:"
echo "curl -X POST https://qzvfufadiqmizrozejci.supabase.co/functions/v1/test-simple -H 'Content-Type: application/json' -d '{\"name\":\"test\"}'"