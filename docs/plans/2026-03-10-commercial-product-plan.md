# NorskBot AI — Commercial Product Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform NorskBot from a demo into a commercial product that competes with SiteGPT.ai ($39-259/mo pricing)

**Architecture:** Next.js 14 + Supabase (auth, DB, pgvector) + ScrapingBee (crawl) + OpenAI (embeddings) + Anthropic Claude (chat)

**Tech Stack:** Next.js 14, Supabase, OpenAI text-embedding-3-small, Claude claude-sonnet-4-20250514, ScrapingBee, Shadow DOM widget

---

## Competitive Analysis: SiteGPT.ai vs NorskBot (current state)

| Feature | SiteGPT | NorskBot | Status |
|---------|---------|----------|--------|
| URL scraping → knowledge base | ✅ | ❌ | **CRITICAL — Build first** |
| File upload (PDF/TXT/DOCX) | ✅ | ✅ | Done (Phase 4) |
| Raw text input | ✅ | ✅ | Done |
| Embeddable widget | ✅ | ✅ | Done (Shadow DOM) |
| Widget customization (colors/logo) | ✅ | 🟡 Partial | Colors done, logo missing |
| Quick prompts / ice breakers | ✅ | ❌ | **Need** |
| Chat history / conversation log | ✅ | 🟡 Partial | DB tables exist, dashboard basic |
| Escalate to human (email/live) | ✅ | ❌ | **Need** |
| Lead capture (name/email form) | ✅ | ❌ | **Need** |
| Email summaries (daily digest) | ✅ | ❌ | **Need** |
| Multi-language support | ✅ (95 langs) | 🟡 Norwegian focus | Claude handles multilingual |
| Q&A training (feedback loop) | ✅ | ❌ | **Need** |
| Functions / automations | ✅ | ❌ | Later phase |
| Integrations (Zendesk/Crisp) | ✅ | ❌ | Later phase |
| API access | ✅ | ✅ | Done |
| Multi-site support | ✅ | ✅ | Done |
| GPT-4 model choice | ✅ | ✅ | Claude claude-sonnet-4-20250514 |
| Custom branding | ✅ | 🟡 | Partial |
| Stripe billing | ✅ | ❌ | **Need** |
| Onboarding flow | ✅ | ❌ | **Need** |
| GDPR/Privacy pages | ✅ | ✅ | Done (Norwegian) |

## Priority: What makes this LAUNCHABLE

### Phase A: URL Scraping (makes product USEFUL) — Day 1
Without this, customers can't get started. This is the #1 blocker.

**Tasks:**
1. Create `POST /api/ingest/scrape` endpoint
   - Accepts `{ url: string, siteId: string, maxPages?: number }`
   - Uses ScrapingBee API to crawl homepage
   - Extracts all same-domain links
   - Crawls each page (max 50), extracts clean text via cheerio
   - Chunks text (~2000 chars, ~200 overlap)
   - Generates OpenAI embeddings (text-embedding-3-small, 1536 dims)
   - Stores in `knowledge_sources` + `knowledge_chunks`
   - Returns progress/status

2. Create `GET /api/ingest/scrape/status?sourceId=xxx` endpoint
   - Returns scraping progress (pages found, pages scraped, chunks created)

3. Add URL scrape UI in site editor Knowledge tab
   - Input field for URL
   - "Skann nettside" button
   - Progress indicator (pages scraped, chunks created)
   - Show results in knowledge sources table

4. Test end-to-end: paste URL → see knowledge chunks → ask widget a question → get answer from scraped content

### Phase B: Lead Capture & Quick Prompts (makes product VALUABLE) — Day 2
These are the features customers actually pay for.

**Tasks:**
1. Lead capture in widget
   - Before first message, show optional form: Navn (name), E-post (email), Bedrift (company)
   - Store in new `leads` table: `id, site_id, name, email, company, conversation_id, created_at`
   - Configurable: on/off, required/optional fields
   - Dashboard page to view/export leads

2. Quick prompts in widget
   - Site owner configures 3-5 suggested questions
   - Shown as clickable buttons in widget before user types
   - Stored in site's `theme_config.quickPrompts`
   - Already partially built in Automation tab — wire to widget

3. Escalate to human
   - "Snakk med et menneske" button in widget
   - Creates email notification to site owner with conversation transcript
   - Marks conversation as `needs_human: true`
   - Dashboard filter for conversations needing human response

### Phase C: Dashboard Analytics & Email Summaries (makes product STICKY) — Day 3
Retention features — why customers stay.

**Tasks:**
1. Real analytics dashboard
   - Conversations per day (line chart)
   - Messages per day
   - Average messages per conversation
   - Top questions asked (word cloud or list)
   - Lead conversion rate
   - Response satisfaction (thumbs up/down from widget)

2. Email summaries
   - Daily digest email to site owner
   - Yesterday's conversations count, new leads, top questions
   - "Needs human" flagged conversations
   - Uses Mailjet to send

3. Conversation quality feedback
   - Thumbs up/down on each bot response in widget
   - Store in `messages` table (`feedback` column)
   - Show in dashboard conversations view

### Phase D: Onboarding & Billing (makes product SELLABLE) — Day 4-5
Can't charge money without these.

**Tasks:**
1. Onboarding wizard (after signup)
   - Step 1: Opprett nettsted (Create site — name + domain)
   - Step 2: Legg til innhold (Add content — URL scrape or file upload)
   - Step 3: Tilpass widget (Customize widget — color, welcome message)
   - Step 4: Installer widget (Install — copy embed code)
   - Step 5: Test (Send a test message)

2. Stripe billing integration
   - 3 tiers: Starter (299 kr/mo), Vekst (599 kr/mo), Bedrift (1499 kr/mo)
   - Stripe Checkout for subscription
   - Usage limits per tier (conversations/mo, sites, knowledge sources)
   - Upgrade/downgrade in dashboard
   - Webhook for payment events

3. Usage limits enforcement
   - Track monthly conversations per site
   - Show usage bar in dashboard
   - Soft limit warning at 80%
   - Hard limit blocks new conversations with friendly message

### Phase E: Polish & Launch Readiness — Day 6-7
Final touches before going live.

**Tasks:**
1. Custom domain support (CNAME setup guide)
2. Widget logo upload (site owner's brand)
3. Widget "Powered by NorskBot" footer (free plan) / removable (paid)
4. Loading/error states everywhere (no more "Laster..." forever)
5. Mobile responsive audit
6. SEO meta tags on landing page
7. Favicon + OG images
8. Rate limiting on all API endpoints
9. Error monitoring (Sentry or similar)
10. Performance audit (Lighthouse score)

---

## Execution Order

| Day | Phase | Deliverable | Verification |
|-----|-------|-------------|-------------|
| 1 | A | URL scraping works end-to-end | Scrape a real site → widget answers questions from it |
| 2 | B | Lead capture + quick prompts + escalation | Widget collects lead → shows in dashboard |
| 3 | C | Analytics + email summaries + feedback | Dashboard shows real data, email arrives |
| 4 | D.1 | Onboarding wizard | New user → guided setup → working chatbot |
| 5 | D.2 | Stripe billing | Subscribe → access granted → usage tracked |
| 6-7 | E | Polish + launch | All routes work, mobile tested, production ready |

## Success Criteria
- A customer can: sign up → paste their URL → get a working AI chatbot in under 5 minutes
- We can charge money via Stripe
- Dashboard shows real analytics
- Widget looks professional on any site
- Zero "Laster..." or broken pages

---

*Created: March 10, 2026 by Q (CEO)*
*Competitor benchmark: SiteGPT.ai*
