# CTO Audit — NorskBot AI

## Date: 2026-03-10

## Executive Summary

The project has a functional core — auth, landing page, and legal pages are reasonably solid — but suffers from **three systemic problems**: (1) massive design inconsistency across dashboard pages, with at least 4 different sidebar implementations using different colors, nav items, and styling approaches; (2) pervasive English text on pages that should be fully Norwegian; (3) emoji icons used throughout the UI as navigation and status indicators, which reads as amateur. The landing page and auth pages are the most polished; the analytics, sites, and settings pages look like they were built by a different team in a different era.

## Critical Issues

1. **4 different sidebar implementations** — `dashboard/layout.tsx` has a dark professional sidebar (#0f172a), but `analytics/page.tsx`, `sites/page.tsx`, and `settings/page.tsx` each render their OWN sidebar (#1f2937) with different nav items, English labels, and fewer routes. Meanwhile `billing/page.tsx`, `knowledge/upload/page.tsx`, `widget/page.tsx`, and `sites/new/page.tsx` render a THIRD sidebar variant (#0f172a with emoji icons). The `knowledge/page.tsx` renders a FOURTH sidebar using Tailwind classes instead of inline styles. **These inner-page sidebars fight with the dashboard layout sidebar, creating double sidebars.**

2. **English text everywhere** — `settings/page.tsx` is 100% English. `analytics/page.tsx` is 95% English. `sites/page.tsx` is 90% English. Root `layout.tsx` has `lang="en"` instead of `lang="no"`.

3. **Emoji icons in navigation** — 📊🌐📚💬📈💳⚙️ used as nav icons across multiple sidebar implementations. Also 🤖 used in widget previews, 📁 in upload zone, ✅⏳❌ as status indicators, 🍪 in cookie consent, 🎯🚀 in chat messages and feature cards.

4. **Dashboard page has its own full navigation system** — `dashboard/page.tsx` renders a complete top nav + left sidebar + conversation list + chat area + right panel, which will be NESTED inside `dashboard/layout.tsx`'s sidebar, creating a broken double-nav layout.

5. **Metadata says English** — `layout.tsx` metadata title is "NorskBot - AI Chatbot for Norwegian Businesses" (English), and `<html lang="en">`.

6. **Mixed styling approaches** — `knowledge/page.tsx` uses Tailwind classes while every other file uses inline styles. No shared style constants file.

7. **Hardcoded mock data dates** — "23. mai 2023", "2024-03-01", etc. scattered across pages. Not critical but looks sloppy.

---

## Developer 1: Design System & Landing Page

**Scope:** Create a shared design system, fix the landing page emoji/polish issues, fix root layout metadata.

### File: `app/layout.tsx`

| Line | Issue | Fix |
|------|-------|-----|
| 7 | `title: 'NorskBot - AI Chatbot for Norwegian Businesses'` | Change to `'NorskBot AI — KI-drevet chatbot for norske bedrifter'` |
| 15 | `<html lang="en">` | Change to `<html lang="no">` |
| 16 | `<body>` has no style reset | Add `<body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>` |

### New File: `app/styles/constants.ts`

Create a shared design token file used by ALL pages. This eliminates the duplicated `fontFamily`, color values, and style objects across 15+ files.

```typescript
// app/styles/constants.ts
export const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const colors = {
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryLight: '#eff6ff',
  dark: '#0f172a',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  white: '#ffffff',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  dangerBorder: '#fecaca',
  success: '#16a34a',
  successLight: '#f0fdf4',
  successBorder: '#bbf7d0',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
  card: '0 1px 3px rgba(0,0,0,0.04)',
} as const;
```

### File: `app/page.tsx` (Landing Page)

| Line | Issue | Fix |
|------|-------|-----|
| ~723 | `icon="📚"` on FeatureCard "RAG Kunnskapsbase" | Replace emoji prop with SVG icon or remove icon entirely. Use a simple text badge or SVG `<path>` for the book icon |
| ~743 | `icon="🚀"` on FeatureCard "Produksjonsklar" | Same — replace with SVG or nothing |
| ~709 | `icon="🧠"` on FeatureCard "Claude AI-motor" | Replace with SVG |
| ~731 | `icon="🏢"` on FeatureCard "Flertenant-arkitektur" | Replace with SVG |
| ~735 | `icon="⚡"` on FeatureCard | Replace with SVG |
| ~739 | `icon="🔒"` on FeatureCard | Replace with SVG |

**FeatureCard component** (approximately line 240–290 in page.tsx): The `icon` prop renders emojis at `fontSize: 28`. Change the FeatureCard interface to accept either a `d` SVG path string or remove icon entirely. Replace with a small accent-colored dot or line, or an SVG icon from the same icon set used in the dashboard sidebar.

**Landing page is otherwise well-built** — good color usage, responsive layout, professional pricing section, clean footer. No other structural changes needed.

### File: `app/components/CookieConsent.tsx`

| Line | Issue | Fix |
|------|-------|-----|
| ~73 | `<span style={{ fontSize: 28 }}>🍪</span>` | Remove the cookie emoji entirely. The dark bar with text is enough. Or replace with a small SVG shield/lock icon |

### Design Specifications for New `constants.ts`

- **Sidebar background:** `#0f172a` (always — not `#1f2937`)
- **Sidebar active item bg:** `rgba(37,99,235,0.2)`
- **Sidebar text:** `#94a3b8` (inactive), `#fff` (active)
- **Sidebar active icon stroke:** `#2563eb`
- **Sidebar width:** `260px`
- **Primary button:** `bg: #2563eb`, `hover: #1d4ed8`, `radius: 8px`, `height: 48px`
- **Card:** `bg: #fff`, `border: 1px solid #e2e8f0`, `radius: 12px`, `shadow: 0 1px 3px rgba(0,0,0,0.04)`
- **Form input:** `height: 48px`, `border: 1px solid #e2e8f0`, `radius: 8px`, `bg: #f8fafc`, `focus-border: #2563eb`
- **Label:** `fontSize: 13`, `fontWeight: 600`, `color: #64748b`
- **Page background:** `#f8fafc`
- **Body font size:** `14px`
- **Section heading:** `fontSize: 24px`, `fontWeight: 700`, `color: #0f172a`

---

## Developer 2: Dashboard Polish & Consistency

**Scope:** Remove all per-page sidebar implementations, make every dashboard page work with the shared `dashboard/layout.tsx` layout, fix the dashboard main page, translate billing page, remove all emojis from dashboard.

### CRITICAL: Double-Sidebar Problem

`dashboard/layout.tsx` already renders a sidebar with navigation. But these pages render their OWN sidebar:
- `dashboard/analytics/page.tsx` — has its own `SidebarNav` component
- `dashboard/sites/page.tsx` — has its own `SidebarNav` component
- `dashboard/settings/page.tsx` — has its own `SidebarNav` component
- `dashboard/billing/page.tsx` — has its own `SidebarNav` component
- `dashboard/knowledge/upload/page.tsx` — has its own `SidebarNav` component
- `dashboard/widget/page.tsx` — has its own `SidebarNav` component
- `dashboard/sites/new/page.tsx` — has its own `SidebarNav` component
- `dashboard/knowledge/page.tsx` — has its own top nav AND sidebar (Tailwind)

**FIX for ALL of the above:** Remove the `SidebarNav` component and its `<div style={{ display: 'flex' }}>` wrapper from each file. Each page should export ONLY its main content — it will be placed inside `dashboard/layout.tsx`'s `<main>` tag automatically.

### File: `app/dashboard/layout.tsx`

This is the canonical sidebar. It's well-built and should be the ONLY sidebar. However:

| Issue | Fix |
|-------|-----|
| Nav items don't include all routes — missing: `/dashboard/billing`, `/dashboard/widget` | Add: `{ label: 'Widget', href: '/dashboard/widget', icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' }` and `{ label: 'Fakturering', href: '/dashboard/billing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' }` |
| Hardcoded user name `'Ola Nordmann'` | Should pull from auth context/localStorage in future. Acceptable for now but add a `// TODO: pull from auth context` comment |

### File: `app/dashboard/page.tsx`

**This is the biggest problem.** It renders a complete UI with its own top nav, sidebar, conversation list, chat area, and detail panel. This will be rendered INSIDE `dashboard/layout.tsx`, causing:
- Double logo/branding
- Double navigation
- Broken layout

**Fix:** This page needs a complete rewrite. It should ONLY contain the dashboard content — NOT its own top nav or sidebar. Options:

**Option A (recommended):** Convert it to a proper dashboard overview page with:
- Welcome header ("Velkommen tilbake, {userName}")
- Stat cards (total samtaler, aktive nettsteder, meldinger denne måneden, gjennomsnittlig responstid)
- Recent conversations list
- Quick action buttons

**Option B:** If the chat/conversation view IS the dashboard, remove the top nav bar and sidebar from within the component (lines rendering the top bar and left sidebar), keep only the conversation list + chat area + detail panel.

**Regardless of option:** Remove ALL lines rendering the top nav bar (approx. lines rendering the `<div style={{ height: 56, ... }}>` top bar) and the left sidebar column (the one with `navItems` like Kontrollpanel, Lenker, Filer, etc.).

Also in `dashboard/page.tsx`:
| Line | Issue | Fix |
|------|-------|-----|
| 71 | `'🎯 VENNLIG TONE VALGT'` system message emoji | Change to `'VENNLIG TONE VALGT'` — no emoji |
| 123 | `norskbot.no/registrer 🚀` in mock message | Remove 🚀 emoji |

### File: `app/dashboard/analytics/page.tsx`

| Line | Issue | Fix |
|------|-------|-----|
| ALL | Entire page is in English | Translate every string to Norwegian |
| 1-40 | Own `SidebarNav` with English labels ("Sites", "Analytics", "Settings") and emojis (📊🌐📈⚙️) | **Delete entire SidebarNav component and the flex wrapper** |
| 56 | `<h1>Analytics</h1>` | → `Analyse` |
| 62-63 | `<option>Last 7 days</option>` etc. | → `Siste 7 dager`, `Siste 30 dager`, `Siste 90 dager` |
| 70 | `"Key Metrics"` | → `Nøkkeltall` |
| MetricCard labels | "Total Conversations", "Avg Message Length", "User Satisfaction", "Response Time" | → `Totale samtaler`, `Gj.snittlig meldingslengde`, `Brukertilfredshet`, `Responstid` |
| MetricCard trends | "↑ 12% from last week", "chars per message", "out of 5.0", "ms average" | Translate all. Remove 📈📉 emojis from MetricCard trend display |
| 87 | `"Conversations by Site (Last 7 Days)"` | → `Samtaler per nettsted (siste 7 dager)` |
| Table headers | "Site", "Conversations", "Messages", "Avg Duration" | → `Nettsted`, `Samtaler`, `Meldinger`, `Gj.snittlig varighet` |
| 109 | `"Top Conversation Topics"` | → `Mest populære samtaleemner` |
| Topic labels | "Product Features", "Pricing & Plans", etc. | → `Produktfunksjoner`, `Priser og planer`, `Kontoadministrasjon`, `Teknisk support`, `Faktureringsproblemer`, `Annet` |
| Sidebar bg | `#1f2937` | Not applicable — remove sidebar entirely |

### File: `app/dashboard/sites/page.tsx`

| Line | Issue | Fix |
|------|-------|-----|
| ALL | Own `SidebarNav` with English labels + emojis | **Delete SidebarNav and flex wrapper** |
| 52 | `<h1>Sites</h1>` | → `Nettsteder` |
| 53-62 | Button text `"+ Add Site"` | → `+ Legg til nettsted` |
| 68 | `"Customer Sites (6)"` | → `Kundens nettsteder (${sites.length})` |
| Table headers | "Site Name", "Domain", "Status", "Conversations", "Created", "Actions" | → `Nettsted`, `Domene`, `Status`, `Samtaler`, `Opprettet`, `Handlinger` |
| Status badges | `'🟢 Active'` / `'⚫ Inactive'` | → `'Aktiv'` / `'Inaktiv'` — use colored dot CSS instead of emoji: `<span style={{width:8,height:8,borderRadius:'50%',backgroundColor:site.status==='active'?'#22c55e':'#94a3b8',display:'inline-block',marginRight:6}} />` |
| Action buttons | `"Edit"` / `"Delete"` | → `Rediger` / `Slett` |
| Mock data | "Company A", "Company B" etc. | → Use Norwegian company names: "Fjordtech AS", "Bergen Shipping", "Norsk Digital", "Stavanger Energi", "Oslo Media", "Tromsø Helse" |

### File: `app/dashboard/settings/page.tsx`

| Line | Issue | Fix |
|------|-------|-----|
| ALL | **100% English** — every label, every heading, every button | Full translation needed |
| 1-40 | Own `SidebarNav` with English labels + emojis | **Delete SidebarNav and flex wrapper** |
| Sidebar bg | `#1f2937` (wrong shade) | Not applicable — remove sidebar |
| 57 | `"Settings"` | → `Innstillinger` |
| 65 | `"Account Settings"` | → `Kontoinnstillinger` |
| 66 | `"Manage your account information"` | → `Administrer kontoinformasjonen din` |
| 70 | `"Email Address"` | → `E-postadresse` |
| 87 | `"Full Name"` | → `Fullt navn` |
| 90 | `defaultValue="Admin User"` | → `'Ola Nordmann'` |
| 103 | `"Organization"` | → `Organisasjon` |
| 106 | `"NorskBot Inc."` | → `'NorskBot AS'` |
| 124 | `"API Settings"` | → `API-innstillinger` |
| 125 | `"Manage your API keys and access"` | → `Administrer API-nøkler og tilgang` |
| 133 | `"Production API Key"` | → `Produksjons-API-nøkkel` |
| 147 | `"Copy"` buttons (×2) | → `Kopier` |
| 152 | `"Created on March 1, 2024"` | → `Opprettet 1. mars 2024` |
| 165 | `"Development API Key"` | → `Utviklings-API-nøkkel` |
| 179 | `"Created on February 15, 2024"` | → `Opprettet 15. februar 2024` |
| 201 | `"+ Generate New API Key"` | → `+ Generer ny API-nøkkel` |
| 209 | `"Preferences"` | → `Preferanser` |
| 210 | `"Customize your experience"` | → `Tilpass din opplevelse` |
| 215 | `"Email Notifications"` | → `E-postvarsler` |
| 216 | `"Receive email updates about your account"` | → `Motta e-postoppdateringer om kontoen din` |
| 237 | Theme options: `"Light"`, `"Dark"`, `"Auto"` | → `Lyst`, `Mørkt`, `Auto` |
| 250 | `"Danger Zone"` | → `Faresone` |
| 251 | `"Irreversible actions"` | → `Irreversible handlinger` |
| 269 | `"Delete Account"` | → `Slett konto` |
| 292 | `"Save Changes"` | → `Lagre endringer` |
| 313 | `"Cancel"` | → `Avbryt` |
| 47 | `alert('Settings saved successfully!')` | → `alert('Innstillinger lagret!')` or better: use inline success message like profile page |

### File: `app/dashboard/billing/page.tsx`

| Line | Issue | Fix |
|------|-------|-----|
| 1-40 | Own `SidebarNav` with emojis (📊🌐📚💬📈💳⚙️) | **Delete SidebarNav and flex wrapper** |
| ~79 | `⚠️` emoji in UsageMeter warning | Replace with text "Advarsel:" or an SVG warning icon, or just the text without emoji |
| ~201 | `✏️ Endre betalingsmetode` button | Remove ✏️ emoji, just text "Endre betalingsmetode" |

The billing page is otherwise well-translated and well-designed — it just needs the sidebar removed and emoji cleanup.

### File: `app/dashboard/knowledge/page.tsx`

| Line | Issue | Fix |
|------|-------|-----|
| ALL | Uses Tailwind classes instead of inline styles | Convert to inline styles for consistency, OR (better) create a proper CSS module. But for immediate consistency: convert to inline styles matching the project pattern |
| 15-28 | Own top nav bar (fixed position) | **Delete** — layout.tsx handles this |
| 31-50 | Own sidebar using Tailwind with emoji icons (📚, ⚙️) | **Delete** — layout.tsx handles this |
| 54 | `className="ml-56 mt-14"` on main content | Remove — will be positioned by layout.tsx |

### File: `app/dashboard/knowledge/upload/page.tsx`

| Line | Issue | Fix |
|------|-------|-----|
| 1-30 | Own `SidebarNav` with emojis | **Delete SidebarNav and flex wrapper** |
| ~84 | `<div style={{ fontSize: '48px' }}>📁</div>` upload zone icon | Replace with SVG upload icon (cloud-arrow-up or similar) |
| ~103 | `ℹ️` info icon | Replace with SVG info circle icon |
| Status emojis | `✅` (Klar), `⏳` (Behandler), `❌` (Feil) | Replace with colored dots or SVG checkmarks: green dot for Klar, yellow dot for Behandler, red dot for Feil |
| Document type emojis | `📄` (PDF), `📝` (TXT), `📃` (DOCX) | Replace with styled text badges: `<span style={{...}}>PDF</span>` with appropriate background colors |

### File: `app/dashboard/widget/page.tsx`

| Line | Issue | Fix |
|------|-------|-----|
| 1-30 | Own `SidebarNav` with emojis | **Delete SidebarNav and flex wrapper** |
| Widget preview | `🤖` emoji used as bot avatar in multiple places | Replace with a styled initial letter div: `<div style={{...}}>N</div>` (for NorskBot) using the theme color |
| ~215 | `'📋 Kopier kode'` button text | → `'Kopier kode'` — no emoji |
| ~243 | `'🚀 Test widget'` / `'✕ Lukk test-widget'` | → `'Test widget'` / `'Lukk test-widget'` — no emojis |

### File: `app/dashboard/sites/new/page.tsx`

| Line | Issue | Fix |
|------|-------|-----|
| 1-30 | Own `SidebarNav` with emojis | **Delete SidebarNav and flex wrapper** |
| Widget preview | `🤖` emoji as bot avatar | Replace with styled letter div |

### File: `app/dashboard/profile/page.tsx`

This page is **well-built** — proper Norwegian, clean design, no emoji, uses the layout correctly (no own sidebar). It should be the template for all other dashboard pages. **No changes needed.**

---

## Developer 3: Auth, Legal Pages & Navigation

**Scope:** Fix auth page navigation issues, ensure legal pages have consistent navigation, fix cookie consent, verify all cross-page links work.

### File: `app/auth/page.tsx`

**Status:** Well-built, properly Norwegian, clean design. Minor issues:

| Line | Issue | Fix |
|------|-------|-----|
| Footer links | `/personvern` and `/brukervilkar` | These are correct and match existing routes ✓ |
| Social login buttons | `onClick={() => {}}` — GitHub and Google do nothing | Add `// TODO: Implement OAuth` comment, or disable buttons with a tooltip "Kommer snart" |
| Missing `@keyframes spin` | Defined in inline `<style>` tag | This works but consider moving to a global CSS file or `layout.tsx` |
| No terms acceptance checkbox | Registration form lacks "I accept terms" checkbox | Add: `<label><input type="checkbox" required /> Jeg godtar <a href="/brukervilkar">brukervilkårene</a> og <a href="/personvern">personvernerklæringen</a></label>` before the submit button |

### File: `app/auth/forgot-password/page.tsx`

**Status:** Well-built, properly Norwegian. Minor issues:

| Line | Issue | Fix |
|------|-------|-----|
| ~27 | `await new Promise((r) => setTimeout(r, 1200))` — fake API call | Add comment `// TODO: Replace with actual password reset API call` |
| Missing footer | Page has "← Tilbake til innlogging" but no privacy/terms links | Add minimal footer matching auth page: `© 2026 NorskBot — Personvern · Vilkår` |

### File: `app/personvern/page.tsx`

**Status:** Excellent. Professional Norwegian legal text, proper GDPR references, clean layout with nav + footer. Issues:

| Issue | Fix |
|-------|-----|
| Nav links only "Hjem" and "Kontrollpanel" | Add "Logg inn" link: `<Link href="/auth" style={navLinkStyle}>Logg inn</Link>` |
| Massive duplicated style objects (~80 lines of style definitions) | Extract to shared styles file. The nav, footer, section styles are identical across personvern, brukervilkar, and cookies pages |

### File: `app/brukervilkar/page.tsx`

**Status:** Excellent. Same quality as personvern.

| Issue | Fix |
|-------|-----|
| Nav links missing "Logg inn" | Same as personvern — add auth link |
| Duplicated style objects | ~80 lines identical to personvern. Extract to `app/styles/legalPageStyles.ts` |

### File: `app/cookies/page.tsx`

**Status:** Excellent. Same quality.

| Issue | Fix |
|-------|-----|
| Nav links missing "Logg inn" | Same fix |
| Duplicated styles | Same fix |

### New File: `app/styles/legalPageStyles.ts`

Create shared styles for the 3 legal pages. Extract these identical objects:
- `navStyle`, `logoStyle`, `navLinksStyle`, `navLinkStyle`
- `containerStyle`, `h1Style`, `h2Style`, `h3Style`
- `sectionStyle`, `lastSectionStyle`, `updatedStyle`
- `ulStyle`, `liStyle`, `linkStyle`
- `footerStyle`, `footerInnerStyle`, `footerColStyle`, `footerLabelStyle`, `footerLinkStyle`, `footerCopyStyle`

This eliminates ~80 lines of duplicated code from each of the 3 files.

### Navigation Audit — Cross-Page Links

| From | To | Status |
|------|----|--------|
| Landing (/) → /auth | ✓ Works (CTA buttons link to /auth) |
| Landing (/) → /personvern | ✓ Works (footer) |
| Landing (/) → /brukervilkar | ✓ Works (footer) |
| Auth → / | ✓ Works ("← Tilbake til forsiden") |
| Auth → /auth/forgot-password | ✓ Works |
| Auth → /personvern | ✓ Works (footer) |
| Auth → /brukervilkar | ✓ Works (footer) |
| Forgot password → /auth | ✓ Works |
| Auth → /dashboard | ✓ Works (after login) |
| Dashboard sidebar → /dashboard/knowledge | ✓ Route exists |
| Dashboard sidebar → /dashboard/sites | ✓ Route exists |
| Dashboard sidebar → /dashboard/analytics | ✓ Route exists |
| Dashboard sidebar → /dashboard/settings | ✓ Route exists |
| Dashboard sidebar → /dashboard/profile | ✓ Route exists |
| Dashboard sidebar → /dashboard/widget | ✗ **MISSING from layout.tsx sidebar** |
| Dashboard sidebar → /dashboard/billing | ✗ **MISSING from layout.tsx sidebar** |
| Legal pages → / | ✓ Works |
| Legal pages → /auth | ✗ **Missing — add "Logg inn" to nav** |
| Legal pages → /cookies | ✓ Works (cross-links) |
| Legal pages → /personvern | ✓ Works (cross-links) |
| Legal pages → /brukervilkar | ✓ Works (cross-links) |

### File: `app/components/CookieConsent.tsx`

| Issue | Fix |
|-------|-----|
| 🍪 emoji (line ~73) | Remove — see Developer 1 |
| Otherwise well-built | ✓ Good Norwegian, clean animation, proper consent handling |

### API Routes — Quick Review

**All API routes** (`auth`, `chat`, `health`, `ingest`, `widget`) are structurally sound but have English error messages that should ideally be Norwegian for user-facing errors:

| File | Issue |
|------|-------|
| `api/auth/route.ts` | Error messages are English: "Email is required", "Password must be at least 8 characters", etc. |
| `api/chat/route.ts` | Mixed — some Norwegian (`'Ugyldig forespørsel'`, `'Beklager, noe gikk galt'`), some English (`'messageId is required'`, `'Rating must be -1 or 1'`) |
| `api/ingest/route.ts` | All English errors |
| `api/widget/route.ts` | All English errors |
| `api/health/route.ts` | English (OK for health checks — not user-facing) |

**Priority:** Low — API errors are typically not shown directly to end users. But for consistency, user-facing error messages in auth and chat should be Norwegian. Health and ingest can stay English since they're developer-facing.

### Auth route structural issue

`app/api/auth/route.ts` uses pathname-based routing (`pathname.endsWith('/register')`, `/login`, `/verify`) but all live at `/api/auth`. The login and register routes won't match because `/api/auth` doesn't end with `/register` or `/login`. These should be separate route files:
- `app/api/auth/login/route.ts`
- `app/api/auth/register/route.ts`
- `app/api/auth/verify/route.ts`

Or the frontend `fetch('/api/auth/login')` calls won't hit the right handler.

---

## Summary

| Developer | Files | Issues |
|-----------|-------|--------|
| **Dev 1: Design System & Landing** | 4 files (layout.tsx, page.tsx, CookieConsent.tsx, new constants.ts) | 12 issues |
| **Dev 2: Dashboard Polish** | 10 files (all dashboard pages) | 47+ issues (dominated by English→Norwegian translation and sidebar removal) |
| **Dev 3: Auth, Legal & Navigation** | 7 files (auth, legal pages, new shared styles) | 18 issues |

**Total estimated effort:**
- Dev 1: ~4 hours
- Dev 2: ~12 hours (biggest workload — translation + structural fixes)
- Dev 3: ~6 hours

**Priority order:** Dev 2 first (fixes the broken double-sidebar rendering), then Dev 1 (design system), then Dev 3 (polish).
