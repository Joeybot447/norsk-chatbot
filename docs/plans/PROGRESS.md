# NorskBot Commercial Product — Progress Tracker

## Phase A: URL Scraping (Day 1) — COMPLETE ✅
- [x] A1: `POST /api/ingest/scrape` endpoint (ScrapingBee + cheerio + OpenAI embeddings)
- [x] A2: `GET /api/ingest/scrape/status` endpoint
- [x] A3: UI in site editor Knowledge tab (URL input + progress polling)
- [x] A4: End-to-end test (scrape → widget answers from content) — TESTED: autolx.no scraped successfully
- [x] RLS policies applied (24 policies, all 9 tables) — Batch 4 complete
- [x] Knowledge page fixed (API route for sites instead of direct supabase client)

## Phase B: Lead Capture & Quick Prompts (Day 2) — NOT STARTED
- [ ] B1: Lead capture form in widget (name/email/company)
- [ ] B2: `leads` table + dashboard leads page
- [ ] B3: Quick prompts wired to widget
- [ ] B4: Escalate to human (email notification + dashboard filter)

## Phase C: Analytics & Email Summaries (Day 3) — NOT STARTED
- [ ] C1: Real analytics dashboard (charts, top questions)
- [ ] C2: Daily email summary to site owner (Mailjet)
- [ ] C3: Thumbs up/down feedback in widget + dashboard

## Phase D: Onboarding & Billing (Day 4-5) — NOT STARTED
- [ ] D1: Onboarding wizard (5-step guided setup)
- [ ] D2: Stripe billing (3 tiers, checkout, webhooks)
- [ ] D3: Usage limits enforcement

## Phase E: Polish & Launch (Day 6-7) — NOT STARTED
- [ ] E1: Widget logo upload + "Powered by NorskBot"
- [ ] E2: Loading/error states audit
- [ ] E3: Mobile responsive audit
- [ ] E4: SEO + OG images + favicon
- [ ] E5: Rate limiting + error monitoring
- [ ] E6: Performance audit

---
*Last updated: March 10, 2026 18:00 UTC*
*Status: Phase A COMPLETE (commits ba5343a, e409f35) — URL scraping fully working. RLS policies applied. Knowledge page fixed.*
