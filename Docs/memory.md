# Memory — AnnaSetu Progress Tracker
**Repository:** https://github.com/guptalagan43/annasetu  
**Last Updated:** 2026-09-25
**Current Status:** ✅ Phases 14, 15, 16 Complete

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

**Phase:** — (all three phases complete)  
**File being worked:** —  
**Last action:** Phase 16 complete — POST /api/ai/nlp with Gemini Text + date context for relative time parsing ("expiring at 8pm"); NLPParser component with textarea + browser SpeechRecognition voice input; side-by-side raw/parsed view with confidence badge; medium-confidence warning; fallback puts raw text in notes field; intake_method tracks nlp; schema constants deduplicated from listing.schema; 18 tests. Total: 111 tests passing across all phases.

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
| 09 | Geo-Matching Engine | phase-09-matching-engine | — | Haversine distance, match scoring formula (SRS §9.2), 5-10-15km cascade, hard dietary/allergen & capacity exclusions, findAndCreateMatch & rematchListing, /api/matches, 13 tests |
| 10 | Shelter Dashboard | phase-10-shelter-dashboard | — | Incoming matches sorted by ERS desc, MatchCard with capacity fit indicator, POST /api/matches/[id]/accept (listing matched, shelter load updated, donor notified via SMTP), POST /api/matches/[id]/decline with required reason & rematch cascade, /shelter/capacity page, coordinator invite flow, 11 tests |
| 11 | Driver Dashboard | phase-11-driver-dashboard | — | Driver registration (/register/driver), admin listings dispatch (/admin/listings), POST /api/driver-assignments, driver dashboard (/driver) with active stops and navigation, PATCH /api/driver-assignments/[id]/pickup, PATCH /api/driver-assignments/[id]/deliver (advancing pipeline matched -> driver_assigned -> in_transit -> checklist), driver availability toggle, SMTP notifications, 8 tests |
| 12 | Route Optimization | phase-12-route-optimization | — | OSRM client with 3s timeout & Haversine fallback (* 1.35 urban factor), nearest-neighbor optimizer enforcing pickup-before-delivery & ERS >= 70 urgency, GET /api/drivers/[id]/route, interactive Leaflet route map (/driver/route/[id]), numbered stop markers, Google Maps deep-link navigation, cumulative ETAs with 10-min handover buffer, 10 tests |
| 13 | Delivery Checklist | phase-13-delivery-checklist | — | 5-point physical verification, 4-digit Donor PIN verification, POST & GET /api/delivery-receipts, status update to delivered (with impact recording) or disputed, two-strike violation policy (warning on 1st strike, suspension + cancellation on 2nd strike), DeliveryAccepted & DeliveryDisputed emails, 11 tests |

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
| 09 | Geo-Matching Engine | ✅ Complete | phase-09-matching-engine | — | Haversine distance, 5/10/15km cascade, match scoring, exclusions, decline re-matching |
| 10 | Shelter Dashboard | ✅ Complete | phase-10-shelter-dashboard | — | Match accept/decline UI, countdown timer, shelter capacity tracker, preferences & coordinator invite |
| 11 | Driver Dashboard | ✅ Complete | phase-11-driver-dashboard | — | Driver registration, assignment, pickup/delivery status pipeline (matched -> driver_assigned -> in_transit -> checklist) |
| 12 | Route Optimization | ✅ Complete | phase-12-route-optimization | — | OSRM client, nearest-neighbor stop ordering, route map, ETAs, Google Maps deep links |
| 13 | Delivery Checklist | ✅ Complete | phase-13-delivery-checklist | — | 5-point checklist, PIN verification, violation policy enforcement |
| 14 | Agentic Dispatcher | ✅ Complete | phase/14-agentic-dispatcher | — | AUTO_CONFIRM_SHELTER, ASSIGN_DRIVER, ESCALATE_TO_ADMIN; 2-min idempotency guard; 5-min opt-out |
| 15 | CV Intake (Gemini Vision) | ✅ Complete | phase/15-cv-intake | — | Gemini Vision, sharp resize, CVUploader, confidence badge, Storage upload, form pre-fill |
| 16 | NLP Parser (Gemini Text) | ✅ Complete | phase/16-nlp-parser | — | Gemini Text, date context, NLPParser, voice input (SpeechRecognition), side-by-side view, fallback |
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
| 2026-09-24 | OSRM Table routing with 1.35x Haversine fallback & Nearest-Neighbor pickup-first sequencing | Provides robust real-road routing with offline fallback (25km/h speed, 10-min handover buffer) and hard constraint that pickups precede deliveries |
| 2026-09-24 | Two-strike donor violation policy | 1st strike issues formal warning via email; 2nd strike immediately suspends donor verification status and cancels all active listings |

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

### Key Source Files (Phase 09)
- `src/lib/matching/engine.ts` — Geo-matching engine: Haversine distance, match scoring formula, cascade (5/10/15km), hard dietary/allergen & capacity exclusions, findAndCreateMatch & rematchListing
- `src/app/api/matches/route.ts` — Role-filtered matches list endpoint (Shelter, Donor, Admin) with count and pagination
- `src/app/api/matches/[id]/decline/route.ts` — Match decline endpoint triggering immediate cascade re-matching (FR-MATCH-05)
- `tests/matching.test.ts` — 13 unit and integration tests covering distance calculations, hard exclusions, scoring formula, and radius cascade

### Key Source Files (Phase 10)
- `src/app/(dashboard)/shelter/page.tsx` — Real-time Shelter Dashboard with capacity gauge, incoming matches sorted by ERS desc / distance, scheduled delivery tracking, and auto-poll
- `src/app/(dashboard)/shelter/capacity/page.tsx` — Storage capacity & load editor, availability toggle, category preference and restriction checklists, coordinator invite form
- `src/components/matches/MatchCard.tsx` — Reusable brutalist MatchCard with ERSBadge, live capacity fit indicator, accept action, and decline modal with required reason
- `src/app/api/matches/[id]/accept/route.ts` — Match accept endpoint updating match status, listing status to matched, shelter load, and queuing donor notification email
- `src/app/api/matches/[id]/decline/route.ts` — Match decline endpoint with strict reason validation and automated rematch cascade
- `src/app/api/shelter/route.ts` — Shelter configuration GET & PATCH for capacity, load, preferences, restrictions, and availability toggle
- `src/app/api/shelter/invite/route.ts` — Coordinator invite endpoint generating secure invite link and queuing invitation email
- `src/emails/MatchAccepted.tsx` — Brutalist email template notifying donor of shelter acceptance
- `src/emails/CoordinatorInvite.tsx` — Brutalist email template inviting team members as shelter coordinators
- `tests/shelter.test.ts` — 11 unit and integration tests for capacity fit, decline reason validation, preference enforcement, invite URLs, and email rendering

### Key Source Files (Phase 11)
- `src/app/(dashboard)/driver/page.tsx` — Real-time Driver Dashboard with active route cards, pickup/delivery confirmation buttons, navigation links, and online/offline toggle
- `src/app/register/driver/page.tsx` — Zero-friction volunteer driver signup with vehicle selection (bike, scooter, auto, car, van) and phone
- `src/app/(dashboard)/admin/listings/page.tsx` — Admin donation listings monitor and driver dispatch interface
- `src/app/api/drivers/route.ts` — Driver profile fetch & registration API
- `src/app/api/drivers/availability/route.ts` — Driver online/offline status toggle endpoint
- `src/app/api/driver-assignments/route.ts` — Assignment creation and role-filtered list API
- `src/app/api/driver-assignments/[id]/pickup/route.ts` — Status update to picked_up (advancing listing to in_transit) + SMTP notifications
- `src/app/api/driver-assignments/[id]/deliver/route.ts` — Status update to delivered (advancing listing to checklist)
- `src/emails/DriverAssigned.tsx` — Brutalist email template for driver dispatch (to driver & shelter)
- `src/emails/DriverPickedUp.tsx` — Brutalist email template for pickup completion (to donor & shelter)
- `tests/driver.test.ts` — 8 unit and integration tests covering pipeline transitions, availability toggles, navigation URLs, and email rendering

### Key Source Files (Phase 12)
- `src/lib/routing/osrm.ts` — OSRM Table and Route client with Haversine * 1.35 urban fallback, nearest-neighbor stop optimizer enforcing pickup-before-delivery (FR-ROUTE-04) and ERS urgency (FR-ROUTE-05), cumulative ETAs & distances
- `src/app/api/drivers/[id]/route/route.ts` — Optimized multi-stop route endpoint resolving driver/assignment ID and persisting route_stops JSONB
- `src/components/routing/RouteMap.tsx` — Dynamic Leaflet route map with numbered SVG/HTML divIcon markers, polyline rendering, and stop popups
- `src/app/(dashboard)/driver/route/[id]/page.tsx` — Driver route view with summary metrics, numbered stop cards, real-time GPS detection, and Google Maps deep-link navigation
- `tests/routing.test.ts` — 10 unit and integration tests covering OSRM distance matrix, geometry, constraints, and ETAs

### Key Source Files (Phase 13)
- `src/lib/validators/checklist.schema.ts` — Zod schema for 5-point inspection checklist with min 10-char note requirement on issues
- `src/app/api/delivery-receipts/route.ts` — Delivery receipts endpoint verifying 4-digit Donor PIN, advancing listing status (delivered vs disputed), recording impact, and enforcing two-strike donor violation policy
- `src/app/(dashboard)/shelter/checklist/[listing_id]/page.tsx` — Shelter delivery acceptance checklist interface with 5-point physical verification, PIN input, and dispute submission
- `src/emails/DeliveryAccepted.tsx` — Brutalist email template confirming rescue completion with food rescued, meals served, and CO2e avoided metrics
- `src/emails/DeliveryDisputed.tsx` — Brutalist email template for warning notice (strike 1) and account suspension notice (strike 2)
- `tests/checklist.test.ts` — 11 unit and integration tests covering 5-point criteria, PIN verification, status pipeline transitions, violation policy, and email rendering

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