# NorskBot Dashboard

Customer portal for managing chatbots.

## Status

**Sprint 2 - Coming Soon**

This is a placeholder for the React-based customer dashboard. Development starts in Sprint 2 after the core API and widget are completed.

## Planned Features

### Setup & Onboarding
- [ ] Add website domain
- [ ] Install widget on site
- [ ] Configure basic settings
- [ ] Test widget

### Knowledge Management
- [ ] View crawled pages
- [ ] Upload documents (PDF, DOCX, TXT)
- [ ] Edit/delete documents
- [ ] Re-crawl schedule
- [ ] Document quality check

### Customization
- [ ] Chat widget branding (colors, avatar)
- [ ] Tone and language settings
- [ ] Welcome message
- [ ] Topic boundaries

### Analytics
- [ ] Conversations dashboard
- [ ] Average response time
- [ ] Satisfaction rating
- [ ] Top questions
- [ ] Language breakdown
- [ ] Source popularity

### Conversation Management
- [ ] View past conversations
- [ ] Search conversations
- [ ] Export transcripts
- [ ] Feedback review

### Team & Access
- [ ] Invite team members
- [ ] Role-based access (Owner, Admin, Analyst, Agent)
- [ ] Audit log

### Billing
- [ ] Plan selection
- [ ] Usage tracking
- [ ] Payment method
- [ ] Invoice history

## Quick Start (Sprint 2)

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

## Tech Stack

- React 18
- TypeScript
- React Router
- Tailwind CSS
- Vite

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview build locally
```

## API Integration

The dashboard communicates with the backend API:

```
Base URL: http://localhost:3000/api
```

Key endpoints:
- `GET /v1/sites` - List customer's sites
- `POST /v1/sites` - Create new site
- `GET /v1/sites/:id/documents` - List documents
- `POST /v1/sites/:id/documents` - Upload document
- `GET /v1/sites/:id/analytics` - Get analytics data

## Contributing

Development starts in Sprint 2. See main README.md for contribution guidelines.

## License

Proprietary - All rights reserved
