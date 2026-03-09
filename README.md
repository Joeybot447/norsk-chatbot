# NorskBot - AI Chatbot for Norwegian Businesses

A lightweight, GDPR-compliant AI chatbot platform for Norwegian SMBs. Embed a 24/7 customer service chatbot on your website in 5 minutes.

## Features

- **Norwegian Language Native:** Built specifically for Norwegian businesses, with full Norwegian language support
- **No Coding Required:** Embed via a single line of JavaScript, customize via dashboard
- **GDPR Compliant:** EU data residency, full compliance with Norwegian/EU data protection laws
- **Intelligent RAG:** Automatically learns from your website and documents using vector embeddings
- **Streaming Responses:** Real-time response generation with Claude AI
- **Easy Setup:** Website crawl → Customize colors → Live in minutes
- **Human Handoff:** Seamlessly escalate complex questions to your team
- **Analytics:** Track conversations, satisfaction, top questions, and more

## Tech Stack

- **Frontend Widget:** Vanilla JavaScript (< 30KB bundled)
- **Backend API:** Node.js + Express.js
- **Database:** PostgreSQL + pgvector (vector search)
- **LLM:** Claude 3.5 Sonnet (Anthropic)
- **Dashboard:** React + TypeScript
- **Hosting:** Docker + Railway/Vercel

## Quick Start

### For Developers (Local Setup)

```bash
git clone https://github.com/Joeybot447/norsk-chatbot.git
cd norsk-chatbot

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Run services
npm run dev:api
npm run dev:widget
npm run dev:dashboard
```

### For Customers (One-Line Install)

```html
<!-- Add this to your website -->
<script src="https://api.norsk-chatbot.no/widget.js" data-site-id="YOUR_SITE_ID"></script>
```

## Project Structure

```
norsk-chatbot/
├── README.md
├── package.json (workspace root)
├── .env.example
├── .gitignore
├── docker-compose.yml
└── packages/
    ├── api/          # Express backend server
    ├── widget/       # Embeddable chat widget
    └── dashboard/    # Customer dashboard (React)
```

## Documentation

- **API Documentation:** `packages/api/README.md`
- **Widget Documentation:** `packages/widget/README.md`
- **Dashboard Documentation:** `packages/dashboard/README.md`
- **Full Technical Plan:** `CHATBOT_SAAS_PLAN.md` (internal)

## Pricing

- **Starter:** 599 NOK/month (€60) - 1 website, basic features
- **Pro:** 1,999 NOK/month (€200) - 3 websites, advanced features
- **Enterprise:** Custom - unlimited everything

## Support

- Email: support@norsk-chatbot.no
- Documentation: https://docs.norsk-chatbot.no
- Status: https://status.norsk-chatbot.no

## License

Proprietary - All rights reserved

## Contributing

Internal development only (not open source).

---

**Built with ❤️ for Norwegian businesses**
