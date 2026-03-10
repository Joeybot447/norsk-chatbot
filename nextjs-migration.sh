#!/bin/bash
set -e

echo "🚀 PHASE 1: Creating Next.js monorepo structure..."

# Backup original packages for reference
mkdir -p .migration-backup
cp -r packages .migration-backup/

# Update root package.json for Next.js
cat > package.json << 'PKGJSON'
{
  "name": "norsk-chatbot-nextjs",
  "version": "0.2.0",
  "description": "Norwegian B2B AI Chatbot - Next.js Edition",
  "private": true,
  "engines": {
    "node": ">=18"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "@anthropic-ai/sdk": "^0.78.0",
    "axios": "^1.6.2",
    "bcryptjs": "^2.4.3",
    "better-sqlite3": "^12.6.2",
    "cheerio": "^1.0.0-rc.12",
    "jsonwebtoken": "^9.0.0",
    "multer": "^2.1.1",
    "pdf-parse": "^2.4.5",
    "pino": "^8.17.2",
    "zod": "^3.22.4",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.6",
    "eslint": "^8.54.0",
    "eslint-config-next": "^14.0.0"
  }
}
PKGJSON

echo "✅ Updated root package.json"
