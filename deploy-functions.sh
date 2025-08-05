#!/bin/bash

# Supabase Edge Functions Deployment Script
# This script deploys all edge functions using the Supabase CLI

set -e

echo "🚀 Deploying Supabase Edge Functions..."

# Check if Supabase CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx is not installed. Please install Node.js and npm."
    exit 1
fi

# Set environment variables
export SUPABASE_ACCESS_TOKEN="sbp_99c994d6970e1d4cb36d4cb8caae9e120e499337"
export SUPABASE_PROJECT_REF="qzvfufadiqmizrozejci"

echo "📋 Environment configured:"
echo "  - Project: qzvfufadiqmizrozejci"
echo "  - Functions directory: ./supabase/functions"

# Login to Supabase (if not already logged in)
echo "🔐 Authenticating with Supabase..."
npx supabase auth login --token "$SUPABASE_ACCESS_TOKEN" || true

# Link to the project
echo "🔗 Linking to Supabase project..."
npx supabase link --project-ref "$SUPABASE_PROJECT_REF" || true

# Deploy all functions
echo "📦 Deploying functions..."

# Deploy hello-world function
if [ -d "./supabase/functions/hello-world" ]; then
    echo "  📤 Deploying hello-world function..."
    npx supabase functions deploy hello-world --project-ref "$SUPABASE_PROJECT_REF"
    echo "  ✅ hello-world deployed"
else
    echo "  ⚠️  hello-world function not found"
fi

# Deploy analyze-literature function
if [ -d "./supabase/functions/analyze-literature" ]; then
    echo "  📤 Deploying analyze-literature function..."
    npx supabase functions deploy analyze-literature --project-ref "$SUPABASE_PROJECT_REF"
    echo "  ✅ analyze-literature deployed"
else
    echo "  ⚠️  analyze-literature function not found"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📊 Function URLs:"
echo "  • hello-world: https://qzvfufadiqmizrozejci.supabase.co/functions/v1/hello-world"
echo "  • analyze-literature: https://qzvfufadiqmizrozejci.supabase.co/functions/v1/analyze-literature"
echo ""
echo "💡 To test functions locally:"
echo "  npx supabase functions serve --env-file .env.local"
echo ""
echo "🔧 To view logs:"
echo "  npx supabase functions logs --project-ref $SUPABASE_PROJECT_REF"

# Set executable permissions
chmod +x "$0"