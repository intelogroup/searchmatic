#!/bin/bash

echo "🚀 Deploying Supabase Edge Functions"
echo "====================================="
echo ""

# Set project details
PROJECT_ID="qzvfufadiqmizrozejci"
SUPABASE_URL="https://${PROJECT_ID}.supabase.co"

echo "📦 Project ID: $PROJECT_ID"
echo "🌐 Supabase URL: $SUPABASE_URL"
echo ""

# List of edge functions to deploy
FUNCTIONS=(
  "hello-world"
  "chat-completion"
  "analyze-literature"
  "duplicate-detection"
  "export-data"
  "process-document"
  "protocol-guidance"
  "search-articles"
)

echo "📋 Functions to deploy:"
for func in "${FUNCTIONS[@]}"; do
  echo "   • $func"
done
echo ""

# Check if we need to login first
echo "🔐 Checking Supabase authentication..."
if ! npx supabase projects list 2>/dev/null | grep -q "$PROJECT_ID"; then
  echo "❌ Not authenticated. Please run:"
  echo "   npx supabase login"
  echo "Then link your project:"
  echo "   npx supabase link --project-ref $PROJECT_ID"
  exit 1
fi

# Link to the project
echo "🔗 Linking to Supabase project..."
npx supabase link --project-ref $PROJECT_ID 2>/dev/null || true

# Deploy each function
echo ""
echo "🚀 Starting deployment..."
echo ""

for func in "${FUNCTIONS[@]}"; do
  echo "📤 Deploying: $func"
  
  # Check if function directory exists
  if [ ! -d "supabase/functions/$func" ]; then
    echo "   ⚠️  Function directory not found: supabase/functions/$func"
    continue
  fi
  
  # Deploy the function
  if npx supabase functions deploy $func --project-ref $PROJECT_ID; then
    echo "   ✅ Successfully deployed: $func"
  else
    echo "   ❌ Failed to deploy: $func"
  fi
  echo ""
done

echo "✨ Edge functions deployment complete!"
echo ""
echo "📊 To verify deployment, run:"
echo "   npx supabase functions list --project-ref $PROJECT_ID"
echo ""
echo "🧪 To test a function, run:"
echo "   npx supabase functions invoke <function-name> --project-ref $PROJECT_ID"