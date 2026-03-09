#!/bin/bash

# Norsk Chatbot - MVP Startup Script
# Usage: bash start.sh

set -e

echo "🚀 Starting Norsk Chatbot MVP..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install --workspace=packages/api

# Step 2: Create API directory structure
echo -e "${BLUE}📁 Setting up directories...${NC}"
mkdir -p packages/api/public

# Step 3: Start the API server
echo -e "${BLUE}🔧 Starting API server...${NC}"
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${GREEN}Starting server on http://localhost:3000${NC}"
echo ""
echo "📱 Demo page: http://localhost:3000/demo.html"
echo ""
echo "🤖 The chatbot is ready to use!"
echo "  - Try asking: 'Hva gjør Fjordtech?'"
echo "  - Or: 'Hva er prisene?'"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Set default PORT if not already set
export PORT=${PORT:-3000}

# Set NODE_ENV to development
export NODE_ENV=development

# Set default Anthropic API key if provided in environment
# If not set, the app will try to use ANTHROPIC_API_KEY from .env or environment
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  Note: ANTHROPIC_API_KEY is not set"
    echo "   Set it with: export ANTHROPIC_API_KEY='your-key-here'"
    echo ""
fi

# Start the API server
cd packages/api
node src/index.js
