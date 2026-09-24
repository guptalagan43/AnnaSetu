# Memory — AnnaSetu Progress Tracker
**Repository:** https://github.com/guptalagan43/annasetu  
**Last Updated:** 2026-09-24  
**Current Status:** 🟡 Phase 01 — Design System & Base UI

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

**Phase:** 01 — Design System & Base UI  
**File being worked:** components/ui/*.tsx  
**Last action:** Phase 00 complete — scaffold & infrastructure ready

---

## ✅ Completed Phases

| Phase | Name | Branch | PR | Notes |
|---|---|---|---|---|
| 00 | Scaffold & Infrastructure | phase/00-scaffold | — | Next.js 15, Tailwind 4, Supabase schema, Vercel cron, Upstash Redis config, brutalist design system base |

---

## 📋 Phase Status Overview

| Phase | Name | Status | Branch | PR | Notes |
|---|---|---|---|---|---|
| 00 | Scaffold & Infrastructure | ✅ Complete | phase/00-scaffold | — | All services connected, build passes |
| 01 | Design System & Base UI | 🟡 In Progress | — | — | Components created, need to verify |
| 02 | Auth System | ⬜ Not started | — | — | — |
| 03 | Dashboard Shell & Nav | ⬜ Not started | — | — | — |
| 04 | Donor Verification Form | ⬜ Not started | — | — | — |
| 05 | Admin Verification Queue | ⬜ Not started | — | — | — |
| 06 | SMTP Email System | ⬜ Not started | — | — | — |
| 07 | Listing Form (Manual) | ⬜ Not started | — | — | — |
| 08 | ERS Engine | ⬜ Not started | — | — | — |
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

---

## 📁 File Index (Created Files)

### Planning Docs (committed to repo root `/docs/`)
- `docs/prd.md` — Product Requirements Document
- `docs/architecture.md` — System Architecture
- `docs/rules.md` — Library rules, error handling, AI boundaries
- `docs/phases.md` — 22-phase build plan
- `docs/memory.md` — This file
- `docs/design.md` — Design system & visual spec

### Key Source Files (Phase 00)
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
- `src/components/ui/Button.tsx` — Brutalist button variants (primary/secondary/ghost/destructive)
- `src/components/ui/Card.tsx` — Card, CardHeader, CardContent, CardFooter
- `src/components/ui/Badge.tsx` — ERS urgency badges (safe/caution/warning/critical/emergency)
- `src/components/ui/ERSBadge.tsx` — ERS score badge with pulse animation
- `src/components/ui/Input.tsx` — Form input with label/error/hint
- `src/components/ui/Modal.tsx` — Modal + ConfirmModal with brutalist styling
- `src/components/ui/Toast.tsx` — Sonner wrapper styled to match design

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