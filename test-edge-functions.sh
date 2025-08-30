#!/bin/bash

# Configuration
SUPABASE_URL="https://qzvfufadiqmizrozejci.supabase.co"
ANON_KEY="sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS"
SERVICE_KEY="sb_secret_0HF5k5_nhplbINXe-IL9zA_gZQjDN8p"

echo "🔍 Testing Edge Functions"
echo "=========================="
echo ""

# Test functions that might be deployed
FUNCTIONS=("articles" "projects" "search" "test-simple" "protocols" "analytics" "extraction")

for func in "${FUNCTIONS[@]}"; do
    echo "📡 Testing function: $func"
    echo "---"
    
    # Try with service key
    echo "  Using service key..."
    response=$(curl -s -w "\n%{http_code}" \
        "${SUPABASE_URL}/functions/v1/${func}" \
        -H "Authorization: Bearer ${SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -d '{"test": true}')
    
    # Split response and status code
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "200" ] || [ "$status" = "201" ]; then
        echo "  ✅ Success (Status: $status)"
        echo "  Response: $body" | head -c 200
        echo ""
    elif [ "$status" = "404" ]; then
        echo "  ⚠️  Function not found (404)"
    elif [ "$status" = "401" ] || [ "$status" = "403" ]; then
        echo "  🔒 Authentication required (Status: $status)"
    else
        echo "  ❌ Error (Status: $status)"
        echo "  Response: $body" | head -c 200
        echo ""
    fi
    
    echo ""
done

echo "📊 Summary"
echo "=========="
echo "Tested ${#FUNCTIONS[@]} potential functions"
echo ""
echo "Note: Functions returning 404 are not deployed."
echo "Functions returning 401/403 require proper authentication."