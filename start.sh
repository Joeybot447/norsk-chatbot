#!/bin/bash

# Norsk Chatbot - MVP Startup Script
# Usage: bash start.sh

set -e

echo "🚀 Starting Norsk Chatbot MVP..."
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load .env from project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
  echo -e "${BLUE}📄 Loading environment from .env${NC}"
  set -a
  source "$SCRIPT_DIR/.env"
  set +a
fi

# Check for API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  Warning: ANTHROPIC_API_KEY is not set"
    echo "   Set it in .env or: export ANTHROPIC_API_KEY='your-key-here'"
    echo ""
fi

# Install dependencies if needed
if [ ! -d "$SCRIPT_DIR/packages/api/node_modules" ]; then
  echo -e "${BLUE}📦 Installing dependencies...${NC}"
  cd "$SCRIPT_DIR"
  npm install --workspace=packages/api
fi

# Create required directories
mkdir -p "$SCRIPT_DIR/packages/api/data"
mkdir -p "$SCRIPT_DIR/packages/api/uploads"

# Set defaults
export PORT=${PORT:-3000}
export NODE_ENV=${NODE_ENV:-development}

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${GREEN}Starting server on http://localhost:${PORT}${NC}"
echo ""
echo "📱 Demo page: http://localhost:${PORT}/demo.html"
echo "🤖 The chatbot is ready to use!"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the API server from project root
cd "$SCRIPT_DIR"
node packages/api/src/index.js
