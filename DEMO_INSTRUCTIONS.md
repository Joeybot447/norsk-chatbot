# Norsk Chatbot MVP - Demo Instructions

Welcome to Norsk Chatbot Sprint 2! This is a working MVP (Minimum Viable Product) with a functioning chat API, demo page, and embedded chat widget.

## Quick Start

### 1. Start the Server

From the repo root, run:

```bash
bash start.sh
```

This will:
- ✅ Install all dependencies
- ✅ Initialize the SQLite database (in-memory for MVP)
- ✅ Seed demo data (Fjordtech AS company)
- ✅ Start the API server on http://localhost:3000

### 2. Visit the Demo Page

Once the server is running, open your browser to:

```
http://localhost:3000/demo.html
```

You'll see a demo website for "Fjordtech AS" with:
- Company information about Fjordtech
- Service descriptions
- Pricing information
- A chat widget in the bottom-right corner

### 3. Test the Chat Widget

Click the 💬 button in the bottom-right corner to open the chat. Try asking:

```
"Hva gjør Fjordtech?"
"Hva er prisene?"
"Hva er tjenestene deres?"
```

The chatbot will answer based on the pre-loaded company knowledge base using Claude AI!

## Architecture

### Stack
- **Backend:** Node.js + Express
- **Database:** In-memory (MVP mode) - can switch to SQLite
- **LLM:** Anthropic Claude API
- **Frontend:** Simple embedded chat widget + HTML demo page

### API Endpoints

#### Chat Endpoints
- `POST /v1/chat/message` - Send a chat message
  - Header: `X-Site-Id: <site-id>`
  - Body: `{ "message": "your question" }`

#### Configuration
- `GET /v1/widget/:siteId` - Get widget configuration
- `GET /health` - Health check
- `GET /health/demo` - Get demo site ID
- `GET /health/ready` - Readiness check

#### Debug (MVP)
- `GET /debug/db` - View database contents

## Key Features

✅ **Working Chat API** - Full conversational interface with AI responses
✅ **Demo Data** - Pre-seeded knowledge base for Fjordtech AS
✅ **Embedded Widget** - Ready-to-embed chat widget with styling
✅ **RAG (Retrieval-Augmented Generation)** - Semantic search over company documents
✅ **Confidence Scoring** - AI responses include confidence metrics
✅ **Multi-tenant Ready** - Support for multiple sites/companies
✅ **No Dependencies** - Works without PostgreSQL, Redis, or Docker

## What's Different from Sprint 1

**Sprint 1:** Structure, schema, and component design
**Sprint 2:** ✨ Everything actually works and runs!

- Replaced PostgreSQL with in-memory database (no compilation needed)
- Replaced Redis with simple in-memory cache
- Simplified RAG to keyword matching (no vector embeddings)
- Built the widget bundle as standalone JavaScript
- Created demo page with embedded widget
- Added working start.sh script
- Integrated Anthropic Claude API for responses
- All endpoints tested and functional

## Environment Variables

The API uses the following environment variables:

```bash
# Anthropic API Key (required for chat)
export ANTHROPIC_API_KEY="sk-ant-..."

# Server port (optional, defaults to 3000)
export PORT=3000

# Node environment (optional, defaults to development)
export NODE_ENV=development
```

## Database

The MVP uses an **in-memory database** that:
- ✅ Initializes on startup
- ✅ Seeds demo data (Fjordtech company)
- ✅ Persists data during the session
- ✅ Resets when the server restarts

### Demo Data Includes:
- **Customer:** Fjordtech AS (fjordtech@demo.no)
- **Site:** With widget configuration
- **Documents:** 3 company info documents
- **Chunks:** 19 knowledge base chunks
- **Knowledge:** About, Services, Pricing information

## Testing the API

### Get Demo Site ID
```bash
curl http://localhost:3000/health/demo | jq .
```

### Send a Chat Message
```bash
SITE_ID="<site-id-from-demo-endpoint>"
curl -X POST http://localhost:3000/v1/chat/message \
  -H "X-Site-Id: $SITE_ID" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hva gjør Fjordtech?"}'
```

### View Database Contents
```bash
curl http://localhost:3000/debug/db | jq .
```

## File Structure

```
norsk-chatbot/
├── start.sh                          # MVP startup script
├── DEMO_INSTRUCTIONS.md              # This file
├── packages/
│   ├── api/
│   │   ├── src/
│   │   │   ├── index.js              # Main server
│   │   │   ├── db/
│   │   │   │   ├── client.js         # In-memory database
│   │   │   │   └── init.js           # Database initialization
│   │   │   ├── services/
│   │   │   │   ├── chatService.js    # Chat orchestration
│   │   │   │   ├── llmService.js     # Claude API integration
│   │   │   │   └── ragService.js     # Document retrieval
│   │   │   ├── routes/
│   │   │   │   ├── chat.js           # Chat endpoints
│   │   │   │   ├── widget.js         # Widget config
│   │   │   │   ├── health.js         # Health checks
│   │   │   │   └── debug.js          # Debug endpoints
│   │   │   ├── middleware/
│   │   │   │   ├── tenant.js         # Multi-tenancy
│   │   │   │   ├── rateLimit.js      # Rate limiting
│   │   │   │   └── auth.js           # Authentication
│   │   │   └── utils/
│   │   │       ├── logger.js         # Logging
│   │   │       └── redis.js          # In-memory cache
│   │   └── public/
│   │       ├── demo.html             # Demo website
│   │       └── widget.min.js         # Chat widget bundle
│   └── widget/
│       └── src/
│           ├── index.js              # Widget entry point
│           └── chat.js               # Widget component
```

## Troubleshooting

### Port Already in Use
```bash
# Kill existing Node processes
pkill -f "node src/index.js"

# Then run start.sh again
bash start.sh
```

### API Not Responding
- Check that the server is running: `curl http://localhost:3000/health`
- Check the logs in the terminal where start.sh is running
- Make sure port 3000 is available

### Chat Not Responding
- Verify `ANTHROPIC_API_KEY` environment variable is set
- Check that the API key has access to Claude models
- The API logs will show any LLM errors

### Widget Not Loading
- Open browser console (F12) to see any JavaScript errors
- Check that the `data-site-id` attribute matches an actual site ID
- Verify the API is running and accessible

## Next Steps (Post-MVP)

- [ ] Switch to persistent SQLite database
- [ ] Implement proper vector embeddings for RAG
- [ ] Add document upload and crawling
- [ ] Build the admin dashboard
- [ ] Implement billing and authentication
- [ ] Deploy to production
- [ ] Add more LLM model options

## Support

For issues or questions about the MVP:
1. Check the logs: Look at terminal output when running `start.sh`
2. Check `/debug/db` endpoint to see database contents
3. Review API responses with `curl` before debugging the UI

---

**Built with** ❤️ for Norsk Chatbot Sprint 2
**Last Updated:** March 9, 2026
