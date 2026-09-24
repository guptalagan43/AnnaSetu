# Memory — AnnaSetu Progress Tracker
**Repository:** https://github.com/guptalagan43/annasetu  
**Last Updated:** 2026-09-24  
**Current Status:** 🟡 Phase 09 — Geo-Matching Engine

> Update this file at the END of every phase and at the START of every working session.  
> Format: check off tasks as they complete. Add notes on blockers, decisions made, or deviations.

---

## 🗂️ Planning Documents Status

| File | Status | Notes |
|---|---|---|
| `prd.md` | ✅ Complete | v1.0 |
| `architecture.md` | ✅ Complete | v1.0 |
| `rules.md` | ✅ Complete | v1.0 |
| `phases.md` | ✅ Complete | 22 phases defined |
| `memory.md` | ✅ Active | This file |
| `design.md` | ✅ Complete | v1.0 |

---

## 🔄 Currently Working On

**Phase:** 09 — Geo-Matching Engine  
**File being worked:** (not started)  
**Last action:** Phase 08 complete — Expiry Risk Scoring (ERS) Engine implemented in src/lib/ers/calculator.ts, weather penalty with OpenWeatherMap, Redis 15-min TTL cache, BullMQ 15-min repeatable cron queue/worker, Vercel cron trigger at /api/webhooks/cron?job=ers, ERSAlert React Email template, listings POST initial ERS calculation, admin map radar with ERS filters, 17 automated tests passing.

---

## ✅ Completed Phases

| Phase | Name | Branch | PR | Notes |
|---|---|---|---|---|
| 00 | Scaffold & Infrastructure | — | — | Next.js 15, Tailwind 4, Supabase schema, Vercel cron, Upstash Redis config, brutalist design system base |
| 01 | Design System & Base UI | — | — | All base components (Button, Card, Badge, Modal, Toast, Input, ERSBadge), cn() utility, fonts, landing page, dev preview |
| 02 | Auth System | — | — | Register/login pages, API routes (register, login, refresh, logout), role-based middleware |
| 03 | Dashboard Shell & Nav | — | — | Dashboard layout with sidebar, topbar, role-conditional nav, placeholder pages for all 5 dashboards |
| 04 | Donor Verification Form | — | — | 4-step form with Leaflet map pin, file upload (Supabase Storage), Zod validation, localStorage draft, POST /api/verification, approve/reject routes, updated donor dashboard |
| 05 | Admin Verification Queue | — | — | Admin queue with filters, search, pagination; review page with checklist, approve/reject |
| 06 | SMTP Email System | phase/06-email-system | — | Nodemailer + BullMQ email queue, Upstash Redis TLS, 4 brutalist React Email templates, verification API integration, /dev/email-preview |
| 07 | Food Listing Form (Manual) | phase/07-listing-form-manual | — | Under-60s listing form at /donor/new-listing, Zod schema, POST /api/listings with verified guard, 4-digit PIN, one-click relist, real listings on donor dashboard |
| 08 | ERS Engine | phase-08-ers-engine | — | Live ERS formula in lib/ers/calculator.ts, OpenWeatherMap penalty, Redis 15-min TTL cache, BullMQ worker + 15-min cron, /api/webhooks/cron?job=ers, ERSAlert template, admin map radar, 17 tests |

---

## 📋 Phase Status Overview

| Phase | Name | Status | Branch | PR | Notes |
|---|---|---|---|---|---|
| 00 | Scaffold & Infrastructure | ✅ Complete | — | — | All services connected, build passes |
| 01 | Design System & Base UI | ✅ Complete | — | — | All components created and previewable at /dev/components |
| 02 | Auth System | ✅ Complete | — | — | Auth pages and API routes working |
| 03 | Dashboard Shell & Nav | ✅ Complete | — | — | Dashboard layout with role-based nav, all 5 placeholder dashboards |
| 04 | Donor Verification Form | ✅ Complete | — | 4-step form, Leaflet map, file upload, Zod validation, localStorage draft, API routes |
| 05 | Admin Verification Queue | ✅ Complete | — | — | Admin queue with filters, search, pagination; review page with checklist, approve/reject |
| 06 | SMTP Email System | ✅ Complete | phase/06-email-system | — | BullMQ queue, 4 email templates, wired to verification API routes |
| 07 | Listing Form (Manual) | ✅ Complete | phase/07-listing-form-manual | — | Manual intake form, Zod schema, POST /api/listings, 4-digit PIN, one-click relist, dashboard integration |
| 08 | ERS Engine | ✅ Complete | phase-08-ers-engine | — | ERS calculator, weather factor, Redis cache, BullMQ worker & 15-min cron, ERSAlert email, admin map radar |
| 09 | Geo-Matching Engine | ⬜ Not started | — | — | — |
| 10 | Shelter Dashboard | ⬜ Not started | — | — | — |
| 11 | Driver Dashboard | ⬜ Not started | — | — | — |
| 12 | Route Optimization | ⬜ Not started | — | — | — |
| 13 | Delivery Checklist | ⬜ Not started | — | — | — |
| 14 | Agentic Dispatcher | ⬜ Not started | — | — | — |
| 15 | CV Intake (Gemini Vision) | ⬜ Not started | — | — | — |
| 16 | NLP Parser (Gemini Text) | ⬜ Not started | — | — | — |
| 17 | Public Impact Dashboard | ⬜ Not started | — | — | — |
| 18 | Agent Log & Admin Override | ⬜ Not started | — | — | — |
| 19 | Tax Certificate & Reports | ⬜ Not started | — | — | — |
| 20 | Seed Data & E2E Testing | ⬜ Not started | — | — | — |
| 21 | Mobile Polish | ⬜ Not started | — | — | — |
| 22 | Final Deploy & Demo Prep | ⬜ Not started | — | — | — |

---

## 🔑 Keys & Credentials Status

| Service | Setup | Notes |
|---|---|---|
| Supabase project | ⬜ Not done | Create at supabase.com |
| Vercel project | ⬜ Not done | Link to GitHub repo |
| Upstash Redis | ⬜ Not done | Free tier at upstash.com |
| Gmail App Password | ⬜ Not done | Enable 2FA first |
| Gemini API key | ⬜ Not done | console.cloud.google.com |
| OpenWeatherMap API | ⬜ Not done | openweathermap.org/api |

---

## 🔧 Environment Variables Status

| Variable | Status |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ⬜ Not set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⬜ Not set |
| `SUPABASE_SERVICE_ROLE_KEY` | ⬜ Not set |
| `JWT_SECRET` | ⬜ Not set |
| `SMTP_HOST` | ⬜ Not set |
| `SMTP_USER` | ⬜ Not set |
| `SMTP_PASS` | ⬜ Not set |
| `GEMINI_API_KEY` | ⬜ Not set |
| `UPSTASH_REDIS_REST_URL` | ⬜ Not set |
| `UPSTASH_REDIS_REST_TOKEN` | ⬜ Not set |
| `OPENWEATHERMAP_API_KEY` | ⬜ Not set |
| `CRON_SECRET` | ⬜ Not set |

---

## 🐛 Known Issues / Blockers

*(None yet)*

---

## 📝 Decisions Log

| Date | Decision | Reason |
|---|---|---|
| 2026-09-24 | Use Next.js 15 App Router | Latest stable, best DX for hackathon |
| 2026-09-24 | No shadcn/ui — custom brutalist components | Design system requires unique aesthetic |
| 2026-09-24 | Gemini `gemini-2.0-flash` model for CV + NLP | Free quota, fastest for demo |
| 2026-09-24 | 30-second polling instead of WebSockets | Lower complexity, sufficient for 24hr hack |
| 2026-09-24 | BullMQ + Upstash Redis for queues | Free tier, Vercel-compatible |
| 2026-09-24 | OSRM public API for routing | Free, no key required |
| 2026-09-24 | React 19 with legacy-peer-deps | Some deps not yet compatible with React 19 |
| 2026-09-24 | Phases 00 & 01 merged | Design system components built during scaffold |
| 2026-09-24 | Consolidated `/app` to `/src/app` | Fix Next.js App Router root conflict preventing compilation of src/app |
| 2026-09-24 | Lazy BullMQ worker initialization | Avoids blocking test runner and app import when Redis local server is offline |

---

## 📁 File Index (Created Files)

### Planning Docs (committed to repo root `/docs/`)
- `docs/prd.md` — Product Requirements Document
- `docs/architecture.md` — System Architecture
- `docs/rules.md` — Library rules, error handling, AI boundaries
- `docs/phases.md` — 22-phase build plan
- `docs/memory.md` — This file
- `docs/design.md` — Design system & visual spec

### Key Source Files (Phase 00-03)
- `package.json` — Dependencies & scripts
- `tsconfig.json` — TypeScript strict config with path aliases
- `tailwind.config.ts` — Brutalist design tokens
- `postcss.config.mjs` — PostCSS config
- `next.config.ts` — Next.js config
- `vercel.json` — Cron job definitions (ERS 15min, dispatcher 2min, digest weekly)
- `.env.example` — Environment variable template
- `.env.local` — Local environment (gitignored)
- `middleware.ts` — Auth guard for dashboard routes
- `scripts/schema.sql` — Complete PostGIS schema with RLS policies
- `src/lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)
- `src/lib/supabase/client.ts` — Browser Supabase client
- `src/lib/supabase/server.ts` — Server Supabase client (async cookies)
- `src/lib/supabase/admin.ts` — Service role client
- `src/lib/auth/guards.ts` — Role-based auth guards & `requireRole()`
- `src/app/globals.css` — Global styles with brutalist design system
- `src/app/layout.tsx` — Root layout with font imports (Bebas Neue, Space Grotesk, JetBrains Mono)
- `src/app/page.tsx` — Brutalist landing page with hero, marquee, impact counters
- `src/app/dev/layout.tsx` — Dev section layout
- `src/app/dev/components/page.tsx` — Component library preview
- `src/app/api/webhooks/cron/route.ts` — Vercel cron handler (ERS + dispatcher)
- `src/app/(auth)/layout.tsx` — Auth layout wrapper
- `src/app/(auth)/login/page.tsx` — Login page
- `src/app/(auth)/register/page.tsx` — Register page with role selection
- `src/app/api/auth/register/route.ts` — Registration API
- `src/app/api/auth/login/route.ts` — Login API
- `src/app/api/auth/refresh/route.ts` — Token refresh API
- `src/app/api/auth/logout/route.ts` — Logout API
- `src/app/api/auth/me/route.ts` — Current user session API
- `src/app/(dashboard)/layout.tsx` — Dashboard layout with sidebar & topbar
- `src/app/(dashboard)/donor/page.tsx` — Donor dashboard placeholder
- `src/app/(dashboard)/shelter/page.tsx` — Shelter dashboard placeholder
- `src/app/(dashboard)/driver/page.tsx` — Driver dashboard placeholder
- `src/app/(dashboard)/admin/page.tsx` — Admin dashboard placeholder
- `src/app/(dashboard)/public-impact/page.tsx` — Public impact dashboard
- `src/components/dashboards/Sidebar.tsx` — Role-based sidebar navigation
- `src/components/dashboards/TopBar.tsx` — Top bar with user menu
- `src/components/ui/Button.tsx` — Brutalist button variants
- `src/components/ui/Card.tsx` — Card components
- `src/components/ui/Badge.tsx` — ERS urgency badges
- `src/components/ui/ERSBadge.tsx` — ERS score badge with pulse
- `src/components/ui/Input.tsx` — Form input with label/error/hint
- `src/components/ui/Modal.tsx` — Modal + ConfirmModal
### Key Source Files (Phase 05)
- `src/app/(dashboard)/admin/verification/page.tsx` — Admin verification queue with filtering, search, pagination
- `src/app/(dashboard)/admin/verification/[id]/page.tsx` — Individual review page with checklist, document links, approve/reject actions

### Key Source Files (Phase 06)
- `src/lib/email/mailer.ts` — Nodemailer SMTP transport setup
- `src/lib/email/templates.ts` — Central async email template render helpers
- `src/emails/BaseEmail.tsx` — Brutalist base email layout
- `src/emails/VerificationSubmitted.tsx` — New verification application admin alert
- `src/emails/VerificationApproved.tsx` — Donor verification approval notification
- `src/emails/VerificationRejected.tsx` — Donor verification rejection with reason
- `src/emails/WelcomeDonor.tsx` — Post-approval onboarding with 3-step guide
- `src/lib/queue/redis.ts` — Redis connection config for BullMQ with Upstash Redis TLS support
- `src/lib/queue/emailQueue.ts` — BullMQ queue instance with exponential backoff & priority
- `src/lib/queue/workers/email.ts` — BullMQ worker with 3 attempts & Supabase `email_logs` logging
- `src/app/dev/email-preview/route.ts` — Dev-only HTML preview route for all 4 templates

### Key Source Files (Phase 07)
- `src/lib/validators/listing.schema.ts` — Zod listing validation schema, food categories, packaging, allergens
- `src/app/api/listings/route.ts` — Listings API: GET (with status & latest filter) and POST (verified guard, 4-digit PIN, initial ERS, PostGIS EWKT)
- `src/app/(dashboard)/donor/new-listing/page.tsx` — Food listing form: one-click relist, quick time presets, Leaflet location picker, success PIN screen
- `src/app/(dashboard)/donor/page.tsx` — Real database integration for donor listings, status badges, PIN display, empty state, and relist button

### Key Source Files (Phase 08)
- `src/lib/ers/calculator.ts` — Complete ERS formula (SRS §8.1-§8.3): category safe windows, base risk, multipliers, adjustments
- `src/lib/ers/weather.ts` — OpenWeatherMap temperature penalty integration with 1-hour cache
- `src/lib/ers/cache.ts` — Upstash Redis listing ERS cache with 15-minute TTL & memory fallback
- `src/lib/ers/coordinates.ts` — Coordinate parser for PostGIS representations (GeoJSON, WKT, object)
- `src/lib/queue/ersQueue.ts` — BullMQ queue definition with 15-minute repeatable cron schedule
- `src/lib/queue/workers/ers.ts` — Background worker for batch recalculations, email escalations, and auto-expirations
- `src/emails/ERSAlert.tsx` — Brutalist email template for critical/emergency ERS alerts
- `src/components/listings/ListingCard.tsx` — Reusable listing card with ERS badge and time remaining
- `tests/ers.test.ts` — 17 unit and integration tests covering ERS calculation, adjustments, triggers, and templates

---

## 🎯 Demo Checklist (Final Verification Before Presentation)

- [ ] Live URL accessible: `https://annasetu.vercel.app`
- [ ] Public impact dashboard shows seeded data (48,000 meals)
- [ ] Admin can approve a donor (demo account: admin@annasetu.in)
- [ ] Donor can list food with photo (CV fills form)
- [ ] ERS badge pulses red when score > 80
- [ ] Shelter accepts match (demo account: shelter@annasetu.in)
- [ ] Driver sees route map with numbered stops
- [ ] Agentic dispatcher fires in < 30s (compressed timeout in demo seed)
- [ ] Delivery checklist + PIN confirmation works
- [ ] Tax certificate PDF downloads successfully
- [ ] All demo emails fire (check test inbox)
- [ ] Mobile layout works on phone (375px)

---

## 🔄 Update Instructions

When starting a new phase:
1. Update "Currently Working On" section
2. Change phase status to 🟡 In Progress

When completing a phase:
1. Change phase status to ✅ Complete
2. Add PR link
3. Add any notes/deviations
4. List new files created in File Index
5. Update "Currently Working On" to next phase