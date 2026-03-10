# NorskBot — AI Chatbot for Norwegian Businesses

> Embeddable AI-powered customer service chatbot with RAG (Retrieval-Augmented Generation) knowledge base.

## Quick Start

### Prerequisites
- Node.js 18+
- Anthropic API key

### Setup

```bash
# Clone and install
git clone <repo-url>
cd norsk-chatbot

# Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Install dependencies
cd packages/api
npm install

# Start the server
npm start
```

The API starts on `http://localhost:4000` (or whatever `PORT` is set to).

### Demo
Open `http://localhost:4000/demo.html` to see the chatbot in action with demo data.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | ✅ | — | Claude API key for chat responses |
| `PORT` | No | `3000` | Server port |
| `JWT_SECRET` | ⚠️ | `dev-secret...` | JWT signing secret (change in production!) |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `API_URL` | No | auto-detect | Public API URL for widget embed codes |
| `LOG_LEVEL` | No | `info` | Pino log level |

## Architecture

```
norsk-chatbot/
├── packages/
│   ├── api/          # Express API server
│   │   ├── src/
│   │   │   ├── config.js          # Centralized configuration
│   │   │   ├── index.js           # Entry point
│   │   │   ├── db/                # SQLite database
│   │   │   ├── middleware/        # Auth, rate limiting, tenant isolation
│   │   │   ├── routes/            # API endpoints
│   │   │   ├── services/          # Business logic (chat, RAG, LLM)
│   │   │   └── utils/             # Logger, cache
│   │   └── public/                # Static files (widget.min.js, demo)
│   ├── dashboard/    # Admin dashboard (HTML)
│   ├── landing/      # Landing page
│   └── widget/       # Widget source (builds to public/)
└── .env              # Environment config
```

## API Endpoints

### Public
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Basic health check |
| `GET` | `/health/ready` | Database readiness check |
| `GET` | `/health/detailed` | Full system health (DB size, counts, memory) |

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, returns JWT |
| `POST` | `/api/auth/verify` | Verify JWT token |

### Chat (requires `X-Site-Id` header)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/chat/message` | Send message, get AI response |
| `POST` | `/v1/chat/feedback` | Submit feedback on a message |
| `GET` | `/v1/chat/history?sessionId=xxx` | Get conversation history |

### Knowledge Ingestion (requires Bearer token)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/ingest/url` | Ingest content from a URL |
| `POST` | `/v1/ingest/text` | Ingest raw text |
| `POST` | `/v1/ingest/upload` | Upload file (PDF, TXT, DOCX) |
| `GET` | `/v1/ingest/sources?siteId=xxx` | List knowledge sources |
| `DELETE` | `/v1/ingest/sources/:id` | Delete a source |

### Dashboard (requires JWT)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dashboard/sites` | List user's sites |
| `POST` | `/api/dashboard/sites` | Create new site |
| `PUT` | `/api/dashboard/sites/:id` | Update site settings |
| `GET` | `/api/dashboard/stats` | Dashboard statistics |
| `GET` | `/api/dashboard/conversations/:site_id` | List conversations |

### Widget
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/widget/:siteId` | Get widget configuration |
| `GET` | `/v1/widget/script/:siteId` | Get embed code |

## Widget Integration

Add this to any website:

```html
<script 
  src="https://your-api.com/widget.min.js" 
  data-site="YOUR_SITE_ID"
  data-api-url="https://your-api.com"
  data-color="#0066cc"
  data-position="bottom-right">
</script>
```

### Widget Options (data attributes)
- `data-site` — Site ID (required)
- `data-api-url` — API URL (defaults to current origin)
- `data-color` — Primary color (hex)
- `data-position` — `bottom-right` or `bottom-left`

## Security Features

- **Helmet.js** security headers
- **Rate limiting** — 30 req/min on chat, 100 req/min on auth
- **JWT** with proper expiry validation
- **Input sanitization** — script tags stripped from ingested content
- **CORS** configured for widget cross-origin embedding
- **No credential leaks** — API keys never in error responses

## Database

Uses SQLite (via better-sqlite3) with WAL mode for concurrent read performance.
Data stored in `packages/api/data/norskbot.db`.

## Demo Credentials

- **Email:** `fjordtech@demo.no`
- **Password:** `demo123`

## License

Proprietary
