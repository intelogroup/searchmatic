#!/bin/bash

# Netlify Deployment Script for Searchmatic MVP
# Usage: ./deploy-to-netlify.sh

set -e

echo "🚀 Starting Netlify deployment for Searchmatic MVP..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${YELLOW}Installing Netlify CLI...${NC}"
    npm install -g netlify-cli
fi

# Set the access token
export NETLIFY_AUTH_TOKEN="nfp_SaEtsmo5KvBxBy8v5WxtiSJmyrf8hRrLece0"

echo -e "${BLUE}✅ Netlify CLI configured with access token${NC}"

# Build the project
echo -e "${BLUE}Building project...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Check if site is already linked
if [ -f ".netlify/state.json" ]; then
    echo -e "${BLUE}Site already linked, using existing configuration...${NC}"
    SITE_ID=$(cat .netlify/state.json | grep -o '"siteId":"[^"]*"' | cut -d'"' -f4)
    echo -e "${BLUE}Site ID: ${SITE_ID}${NC}"
else
    echo -e "${YELLOW}No existing site configuration found.${NC}"
    echo -e "${YELLOW}You'll need to run 'netlify link' or 'netlify sites:create' first${NC}"
    
    # Try to list sites to help user identify correct site
    echo -e "${BLUE}Available sites:${NC}"
    netlify sites:list
    
    echo -e "${YELLOW}Please run one of these commands:${NC}"
    echo -e "${YELLOW}1. netlify link (to connect to existing site)${NC}"
    echo -e "${YELLOW}2. netlify sites:create --name searchmatic-mvp (to create new site)${NC}"
    exit 1
fi

# Set environment variables
echo -e "${BLUE}Setting environment variables...${NC}"

ENV_VARS=(
    "VITE_SUPABASE_URL=https://qzvfufadiqmizrozejci.supabase.co"
    "VITE_SUPABASE_ANON_KEY=sb_publishable_mzJORjzXGOboCWSdwDJPkw__LX9UgLS"
    "NODE_ENV=production"
    "VITE_ENABLE_DEV_TOOLS=false"
)

for env_var in "${ENV_VARS[@]}"; do
    IFS='=' read -r key value <<< "$env_var"
    echo -e "${YELLOW}Setting $key...${NC}"
    netlify env:set "$key" "$value" --silent
done

echo -e "${GREEN}✅ Environment variables configured${NC}"

# Deploy to production
echo -e "${BLUE}Deploying to production...${NC}"
netlify deploy --prod --dir=dist

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    
    # Get site info
    SITE_INFO=$(netlify sites:list --json | grep -A 10 -B 10 "$SITE_ID")
    SITE_URL=$(netlify sites:list --json | jq -r ".[] | select(.id==\"$SITE_ID\") | .ssl_url // .url")
    
    echo -e "${GREEN}🌐 Site URL: $SITE_URL${NC}"
    echo -e "${GREEN}📊 Build stats:${NC}"
    ls -la dist/
    echo ""
    echo -e "${GREEN}🔍 Next steps:${NC}"
    echo -e "${GREEN}1. Visit your site: $SITE_URL${NC}"
    echo -e "${GREEN}2. Test authentication flow${NC}"
    echo -e "${GREEN}3. Verify Supabase connection${NC}"
    echo -e "${GREEN}4. Run Lighthouse audit${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi