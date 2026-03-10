# NorskBot API

Backend API for the Norwegian B2B Chatbot SaaS platform.

## Quick Start

### Development

```bash
npm install
npm run dev      # Start development server with hot reload
```

The API will be available at `http://localhost:3000`

### Production

```bash
npm install
npm start        # Start production server
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret key for JWT signing (min 32 chars)
- `ANTHROPIC_API_KEY` - Claude API key
- `OPENAI_API_KEY` - OpenAI API key (for embeddings)

## Database Setup

Initialize the database:

```bash
npm run migrate
```

This will:
1. Create all tables
2. Set up pgvector extension
3. Create indexes
4. Set up triggers for auto-updated timestamps

## API Endpoints

### Health Checks

```
GET /health          - Liveness check
GET /health/ready    - Readiness check (all dependencies)
```

### Chat

```
POST /v1/chat/message    - Send message and get AI response
POST /v1/chat/feedback   - Submit feedback (1 or -1)
Headers: X-Site-Id: <site_id>
```

Request:
```json
{
  "message": "Hva er prisen?",
  "sessionId": "optional",
  "visitorName": "optional",
  "visitorEmail": "optional"
}
```

Response:
```json
{
  "message": "Prisen starter på...",
  "confidence": 0.92,
  "sources": [
    {
      "title": "Pricing Page",
      "url": "https://...",
      "relevance": 0.95
    }
  ],
  "sessionId": "...",
  "conversationId": "..."
}
```

### Widget Config

```
GET /v1/widget/:siteId   - Get widget configuration
```

Response:
```json
{
  "id": "...",
  "name": "Support Bot",
  "config": {
    "theme": "light",
    "primary_color": "#007bff",
    "position": "bottom-right",
    "welcome_message": "Hej! Hvordan kan jeg hjelpe deg?"
  }
}
```

### Document Ingestion

```
POST /v1/ingest/crawl         - Queue website crawl
POST /v1/ingest/document      - Upload a document
GET /v1/ingest/documents/:siteId - List documents
Headers: Authorization: Bearer <token>
```

## Architecture

### Core Services

- **chatService** - RAG pipeline: retrieve docs → generate response
- **llmService** - Claude API integration with streaming
- **ragService** - Vector similarity search, chunking, embeddings
- **guardrailsService** - Input/output validation, safety checks
- **crawlerService** - Website crawling and content extraction

### Middleware

- **authMiddleware** - JWT token validation
- **rateLimitMiddleware** - Rate limiting per session
- **tenantMiddleware** - Multi-tenant isolation

### Database

PostgreSQL with pgvector for vector search.

Key tables:
- `customers` - SaaS customers
- `sites` - Chatbot instances
- `conversations` - Chat sessions
- `messages` - Individual messages
- `chunks` - Document chunks with embeddings
- `documents` - Source documents
- `guardrail_rules` - Safety rules per site

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes and test**
   ```bash
   npm run test
   npm run lint
   ```

3. **Commit with descriptive message**
   ```bash
   git commit -m "Add feature: description"
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/my-feature
   ```

## Docker

Build and run with Docker:

```bash
docker build -t norsk-chatbot-api .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  norsk-chatbot-api
```

Or use docker-compose:

```bash
docker-compose up api
```

## Testing

Run tests:

```bash
npm test
```

## Performance

- Response time: < 5 seconds (p95)
- Rate limit: 100 requests/minute per session
- Database: Optimized with indexes on frequently queried columns
- Caching: Redis for sessions and rate limiting

## Monitoring

### Health Checks

```bash
# Liveness
curl http://localhost:3000/health

# Readiness
curl http://localhost:3000/health/ready
```

### Logs

Structured JSON logs with Pino:

```bash
npm run dev  # Pretty-printed logs
```

### Sentry Integration

Error tracking is configured via `SENTRY_DSN` environment variable.

## Security

- API key validation on all protected endpoints
- JWT token expiration (1 hour)
- CORS enabled for customer domains
- Input validation with Zod
- Rate limiting to prevent abuse
- Profanity filtering and prompt injection detection
- PII detection on inputs and outputs

## Deployment

### Railway

```bash
railway link
railway up
```

### Self-hosted

```bash
# Build and push Docker image
docker build -t myregistry/norsk-chatbot-api:latest .
docker push myregistry/norsk-chatbot-api:latest

# Deploy to your server
docker pull myregistry/norsk-chatbot-api:latest
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=... \
  -e REDIS_URL=... \
  myregistry/norsk-chatbot-api:latest
```

## Troubleshooting

**Database connection fails:**
- Check `DATABASE_URL` format
- Verify PostgreSQL is running
- Check network connectivity

**Widget not loading:**
- Check CORS settings
- Verify API is running (`/health`)
- Check browser console for errors

**Messages not being processed:**
- Verify Redis is running
- Check API logs for errors
- Verify LLM API keys are correct

## Contributing

1. Follow the code style (ESLint config included)
2. Add tests for new features
3. Update documentation
4. Create PR with clear description

## License

Proprietary - All rights reserved
