# Development Guide

Complete guide to developing the Norwegian B2B Chatbot SaaS MVP.

## Prerequisites

- Node.js 22 LTS
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (for local development)

## Project Structure

```
norsk-chatbot/
├── packages/
│   ├── api/              # Backend API (Express.js, Node.js)
│   ├── widget/           # Embeddable chat widget (vanilla JS)
│   └── dashboard/        # Customer dashboard (React)
├── docker-compose.yml    # Local development environment
└── README.md
```

## Quick Start (Using Docker)

**Fastest way to get started:**

```bash
# Clone the repository
git clone https://github.com/Joeybot447/norsk-chatbot.git
cd norsk-chatbot

# Copy environment files
cp .env.example .env
cp packages/api/.env.example packages/api/.env

# Start all services (PostgreSQL, Redis, API, Dashboard)
docker-compose up

# In another terminal, install dependencies
npm install
npm install --workspace=packages/api
npm install --workspace=packages/widget
npm install --workspace=packages/dashboard
```

Services will be available at:
- **API:** http://localhost:3000
- **Dashboard:** http://localhost:5173
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

## Local Development (Without Docker)

### 1. Install Dependencies

```bash
npm install

# Install workspace dependencies
npm install --workspace=packages/api
npm install --workspace=packages/widget
npm install --workspace=packages/dashboard
```

### 2. Set Up Database

```bash
# Create PostgreSQL database
createdb norsk_chatbot

# Run schema
psql norsk_chatbot < packages/api/src/db/schema.sql
```

### 3. Environment Variables

```bash
cp .env.example .env
cp packages/api/.env.example packages/api/.env
```

Edit `.env` and `packages/api/.env` with your values:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `ANTHROPIC_API_KEY`: Your Claude API key
- `OPENAI_API_KEY`: Your OpenAI API key

### 4. Start Services

In separate terminals:

```bash
# Terminal 1: API Server
npm run dev:api

# Terminal 2: Widget Dev Server
npm run dev:widget

# Terminal 3: Dashboard Dev Server
npm run dev:dashboard
```

## API Development

### File Structure

```
packages/api/src/
├── index.js              # Express app & server startup
├── routes/               # API endpoint handlers
│   ├── chat.js          # Chat messages
│   ├── widget.js        # Widget configuration
│   ├── ingest.js        # Document upload & crawling
│   └── health.js        # Health checks
├── services/            # Business logic
│   ├── chatService.js   # RAG pipeline
│   ├── llmService.js    # Claude integration
│   ├── ragService.js    # Vector search & embeddings
│   ├── guardrailsService.js  # Input/output validation
│   └── crawlerService.js     # Website crawling
├── middleware/          # Express middleware
│   ├── auth.js         # JWT validation
│   ├── rateLimit.js    # Rate limiting
│   └── tenant.js       # Multi-tenant isolation
├── db/
│   ├── client.js       # Database client
│   ├── schema.sql      # Database schema
│   └── migrate.js      # Migration runner (future)
└── utils/
    ├── logger.js       # Pino logging
    └── redis.js        # Redis client
```

### Adding a New Endpoint

1. **Create route handler** in `src/routes/myroute.js`:

```javascript
import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.post('/my-endpoint', async (req, res) => {
  try {
    // Your logic here
    res.json({ success: true });
  } catch (err) {
    logger.error(`Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

2. **Import in `src/index.js`**:

```javascript
import myRouter from './routes/myroute.js';
app.use('/v1/my-path', myRouter);
```

3. **Test locally**:

```bash
curl -X POST http://localhost:3000/v1/my-path
```

### Testing

```bash
npm test --workspace=packages/api
```

## Widget Development

### File Structure

```
packages/widget/src/
├── index.js      # Entry point, initialization
├── chat.js       # ChatWidget class
└── styles.css    # Widget styles
```

### Development Workflow

1. **Start dev server**:
   ```bash
   npm run dev:widget
   ```

2. **Create test HTML** (`test.html`):
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <title>Widget Test</title>
   </head>
   <body>
     <h1>Test Page</h1>
     <script src="http://localhost:5173/src/index.js" data-site-id="test-site"></script>
   </body>
   </html>
   ```

3. **Open in browser**: `file://path/to/test.html`

4. **Build for production**:
   ```bash
   npm run build:widget
   # Output: packages/widget/build/widget.min.js (~25KB)
   ```

### Customizing Widget

Edit `packages/widget/src/chat.js`:
- Colors: Update in `createWidget()` method
- Messages: Update in `loadConfig()` or hardcode
- Behavior: Modify event listeners

Update `packages/widget/src/styles.css`:
- Responsive breakpoints
- Colors and animations
- Z-index and positioning

## Dashboard Development

### File Structure

```
packages/dashboard/src/
├── index.jsx     # React entry point
├── App.jsx       # Main app component
└── index.css     # Global styles
```

### Development Workflow

1. **Start dev server**:
   ```bash
   npm run dev:dashboard
   ```

2. **Visit**: http://localhost:5173

3. **Add pages** in `src/pages/`:
   ```javascript
   // src/pages/Dashboard.jsx
   export default function Dashboard() {
     return <div>Welcome to Dashboard</div>;
   }
   ```

4. **Build for production**:
   ```bash
   npm run build:dashboard
   # Output: packages/dashboard/dist/
   ```

## Database Operations

### View Database

```bash
psql norsk_chatbot

# List tables
\dt

# Query a table
SELECT * FROM sites;
```

### Reset Database (⚠️ Careful!)

```bash
# Drop and recreate
dropdb norsk_chatbot
createdb norsk_chatbot
psql norsk_chatbot < packages/api/src/db/schema.sql
```

### Migration Workflow (Future)

When schema changes are needed:

1. **Create migration file**:
   ```bash
   touch packages/api/src/db/migrations/001_add_column.sql
   ```

2. **Write SQL**:
   ```sql
   ALTER TABLE documents ADD COLUMN status VARCHAR(50) DEFAULT 'active';
   ```

3. **Run migration**:
   ```bash
   npm run migrate
   ```

## Testing Workflow

### Unit Tests

```bash
# Test a specific service
npm test --workspace=packages/api -- src/services/chatService.test.js

# Run all tests
npm test
```

### Manual Testing

**Test chat endpoint:**

```bash
curl -X POST http://localhost:3000/v1/chat/message \
  -H "Content-Type: application/json" \
  -H "X-Site-Id: test-site" \
  -d '{"message": "Hva er prisen?", "sessionId": "test-session"}'
```

**Test widget config:**

```bash
curl http://localhost:3000/v1/widget/test-site
```

**Test health:**

```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/ready
```

## Git Workflow

### Branch Strategy

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and test locally
npm run lint
npm test

# Commit with clear message
git commit -m "feat: add my feature"

# Push to remote
git push origin feature/my-feature

# Create PR on GitHub
```

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(api): add RAG retrieval for chat

- Implement vector similarity search
- Add pgvector queries
- Cache results in Redis

Closes #123
```

## Debugging

### API Logs

Logs are printed with Pino. Set log level:

```bash
LOG_LEVEL=debug npm run dev:api
```

### Database Debugging

Enable query logging in `packages/api/src/db/client.js`:

```javascript
dbClient.on('query', (query) => {
  console.log('SQL:', query.text, query.values);
});
```

### Browser DevTools

**For widget:**
- Open browser DevTools (F12)
- Check Console for errors
- Network tab shows API calls

**For dashboard:**
- React DevTools extension recommended
- Check Network tab for API calls
- Console for JS errors

### VS Code Debug

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "API Debug",
      "program": "${workspaceFolder}/packages/api/src/index.js",
      "restart": true,
      "console": "integratedTerminal"
    }
  ]
}
```

Press F5 to debug.

## Performance Tips

1. **Database**
   - Use indexes for frequently queried columns (already done in schema)
   - Paginate results in list endpoints
   - Cache with Redis

2. **API**
   - Enable gzip compression
   - Use HTTP/2
   - Set appropriate timeouts

3. **Widget**
   - Lazy load widget script
   - Cache configuration in localStorage
   - Minimize bundle size

4. **Dashboard**
   - Code splitting with React Router
   - Lazy load pages
   - Use React.memo for expensive components

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Linting passes (`npm run lint`)
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] API health checks pass
- [ ] Widget builds successfully
- [ ] Dashboard builds successfully
- [ ] HTTPS enabled
- [ ] CORS configured for customer domains
- [ ] Rate limiting enabled
- [ ] Monitoring configured (Sentry)
- [ ] Database backups configured

## Useful Commands

```bash
# Lint all code
npm run lint

# Format code
npm run format

# Build all packages
npm run build:all

# Test all
npm test

# Docker
docker-compose up       # Start all services
docker-compose down     # Stop all services
docker-compose logs api # View API logs

# Database
psql norsk_chatbot      # Connect to DB
npm run migrate         # Run migrations
```

## Getting Help

1. **Check documentation**: See README.md files in each package
2. **Check existing code**: Look at similar implementations
3. **Check logs**: Enable debug logging
4. **Ask the team**: Post in #development Slack channel

## References

- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [pgvector Docs](https://github.com/pgvector/pgvector)
- [Claude API Docs](https://docs.anthropic.com/)
- [Vite Docs](https://vitejs.dev/)

---

Happy coding! 🚀
