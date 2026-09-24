# Phases — AnnaSetu Build Plan
**Repository:** https://github.com/guptalagan43/annasetu  
**Total Phases:** 22  
**Strategy:** Base web application first → features layered phase by phase → AI last → polish & demo prep

> Each phase corresponds to one GitHub PR into `main`.  
> Branch naming: `phase/XX-slug`  
> Commit prefix: `[Phase XX]`

---

## Phase 00 — Project Scaffold & Infrastructure Setup
**Branch:** `phase/00-scaffold`  
**Goal:** Repository is initialized, all services connected, CI/CD live.

### Tasks
- [ ] Initialize Next.js 15 project with TypeScript strict mode
- [ ] Configure Tailwind CSS 4 with brutalist custom config (from `design.md`)
- [ ] Set up ESLint + Prettier
- [ ] Create Supabase project — note URL + anon key
- [ ] Run initial PostGIS schema SQL (all tables from `architecture.md`)
- [ ] Connect Vercel to GitHub repo — set env vars in dashboard
- [ ] Create `.env.local` from `.env.example`
- [ ] Create `vercel.json` with cron job definitions
- [ ] Confirm Vercel deploy succeeds (blank Next.js home page)
- [ ] Set up Upstash Redis instance — test connection

### Deliverable
Live URL on Vercel, blank app, all services connected.

---

## Phase 01 — Design System & Base UI Components
**Branch:** `phase/01-design-system`  
**Goal:** Brutalist UI component library built. Every page will use these primitives.

### Tasks
- [ ] Create `components/ui/Button.tsx` — brutalist thick-border, bold style
- [ ] Create `components/ui/Card.tsx` — hard shadow, no border-radius
- [ ] Create `components/ui/Badge.tsx` — ERS urgency colour variants (green/yellow/orange/red/black)
- [ ] Create `components/ui/Modal.tsx`
- [ ] Create `components/ui/Toast.tsx` (Sonner wrapper styled to match design)
- [ ] Create `components/ui/Input.tsx` — bold border, oversized typography
- [ ] Create `cn()` utility in `lib/utils.ts`
- [ ] Self-host fonts (Space Grotesk + Bebas Neue from design.md)
- [ ] Create landing page shell (`app/page.tsx`) with brutalist hero section
- [ ] Storybook-style dev route at `/dev/components` to preview all components

### Deliverable
All base components renderable. Landing page has the brutalist aesthetic.

---

## Phase 02 — Auth System (Register, Login, JWT Middleware)
**Branch:** `phase/02-auth`  
**Goal:** Full multi-role auth working. Every protected route is guarded.

### Tasks
- [ ] Set up Supabase Auth config (email/password provider)
- [ ] Create `lib/supabase/client.ts` and `lib/supabase/server.ts`
- [ ] Create `middleware.ts` (Next.js edge middleware — JWT check on all `/dashboard/*` routes)
- [ ] Create `lib/auth/guards.ts` — `requireRole()` higher-order function
- [ ] Build register page (`/register`) — captures role, name, phone
- [ ] Build login page (`/login`)
- [ ] Create `profiles` table trigger (auto-insert on Supabase auth signup)
- [ ] Set up Supabase Auth email templates (confirm email)
- [ ] Create `POST /api/auth/register` route
- [ ] Create `POST /api/auth/login` route
- [ ] Create `POST /api/auth/refresh` route
- [ ] Test: 5 different role accounts can log in and see role-specific redirects

### Deliverable
Auth fully working. Role-based routing works. Unauthenticated users redirected to `/login`.

---

## Phase 03 — Dashboard Shell & Role-Based Navigation
**Branch:** `phase/03-dashboard-shell`  
**Goal:** Dashboard layout exists with navigation for every role.

### Tasks
- [ ] Create `app/(dashboard)/layout.tsx` — sidebar navigation + top bar
- [ ] Role-conditional nav items (donor sees donor nav, shelter sees shelter nav, etc.)
- [ ] Create placeholder pages for all dashboards:
  - `/donor` — Donor Dashboard
  - `/shelter` — Shelter Dashboard
  - `/driver` — Driver Dashboard
  - `/admin` — Admin Dashboard
  - `/public-impact` — Public Impact Dashboard (no auth)
- [ ] Breadcrumb component
- [ ] Mobile-responsive sidebar (hamburger on < 768px)
- [ ] User profile menu (logout, role badge)

### Deliverable
All dashboard routes accessible. Navigation renders correctly per role.

---

## Phase 04 — Donor Verification — Registration Form
**Branch:** `phase/04-donor-verification-form`  
**Goal:** Any food business can submit a verification request.

### Tasks
- [ ] Build multi-step verification form (`/register/donor-verify`):
  - Step 1: Business Info (name, type, contact person)
  - Step 2: Documents (FSSAI number, upload FSSAI PDF, GST, PAN)
  - Step 3: Location (address + map pin via Leaflet click)
  - Step 4: Operating hours + daily surplus estimate
- [ ] Zod schema for all fields (`lib/validators/verification.schema.ts`)
- [ ] `POST /api/verification` route — saves to `donor_verifications` table
- [ ] Supabase Storage bucket for document uploads (private)
- [ ] Progress indicator (step 1 of 4)
- [ ] Save-and-resume: store draft in `localStorage`

### Deliverable
A prospective donor can submit a full verification request with documents.

---

## Phase 05 — Donor Verification — Admin Queue & Approval Flow
**Branch:** `phase/05-admin-verification-queue`  
**Goal:** Admin can review, approve, and reject donor applications.

### Tasks
- [ ] Admin verification queue page (`/admin/verification`) — list of `pending_review` entries
- [ ] Individual verification review page — shows all submitted fields + document links
- [ ] Admin checklist UI (7-item checklist from SRS §5.4)
- [ ] Phone verification note field
- [ ] `POST /api/verification/[id]/approve` route
- [ ] `POST /api/verification/[id]/reject` route (requires rejection reason)
- [ ] Status badge on each application (pending / under review / approved / rejected)
- [ ] Filter by status, search by business name
- [ ] FSSAI expiry warning flag (< 90 days)

### Deliverable
Admin can approve or reject donors. Status updates in DB. Applications paginated.

---

## Phase 06 — SMTP Email System (Nodemailer + BullMQ Queue)
**Branch:** `phase/06-email-system`  
**Goal:** Email infrastructure working. First 4 email templates live.

### Tasks
- [ ] Set up Nodemailer with SMTP config (Gmail / Brevo)
- [ ] Set up BullMQ + Upstash Redis for email queue
- [ ] Create `lib/email/mailer.ts` — `queueEmail()` wrapper
- [ ] Create BullMQ worker (`lib/queue/workers/email.ts`) with retry policy (3 attempts, exponential backoff)
- [ ] Log every email attempt to `email_logs` table
- [ ] Create React Email templates:
  - `VerificationSubmitted` (to admin)
  - `VerificationApproved` (to donor)
  - `VerificationRejected` (to donor, with reason)
  - `WelcomeDonor` (post-approval onboarding)
- [ ] Wire emails to verification API routes
- [ ] Email preview route at `/dev/email-preview` (dev only)

### Deliverable
Verification emails fire end-to-end. Admin receives email on new application. Donor receives result.

---

## Phase 07 — Food Listing Form (Manual Intake)
**Branch:** `phase/07-listing-form-manual`  
**Goal:** A verified donor can post a food listing manually in under 60 seconds.

### Tasks
- [ ] Build listing form (`/donor/new-listing`):
  - Food name, category (dropdown), quantity (kg + servings)
  - Packaging type, allergens (multi-select tags)
  - Pickup address (manual + map pin)
  - Pickup window (start/end time pickers)
  - Expiry datetime
  - Optional notes
- [ ] Zod schema (`lib/validators/listing.schema.ts`)
- [ ] `POST /api/listings` route — verifies donor is approved before accepting
- [ ] Auto-generate 4-digit Donor PIN on create
- [ ] One-click relist (copy last listing)
- [ ] Donor dashboard shows active listings with status badges

### Deliverable
Verified donor can post a listing. Listing appears in dashboard with Donor PIN.

---

## Phase 08 — Expiry Risk Score (ERS) Engine
**Branch:** `phase/08-ers-engine`  
**Goal:** Every listing has a live ERS score. Score auto-updates every 15 minutes.

### Tasks
- [ ] Implement ERS formula in `lib/ers/calculator.ts`
- [ ] Calculate initial ERS on listing creation
- [ ] Cache ERS per listing in Redis (15-min TTL)
- [ ] BullMQ cron job (`lib/queue/workers/ers.ts`) — runs every 15 min
- [ ] Vercel cron trigger (`/api/webhooks/cron?job=ers`)
- [ ] ERS badge component with colour coding + pulsing animation on Red/Black
- [ ] ERS score visible on: listing cards, donor dashboard, admin map
- [ ] Weather-adjusted ERS factor (OpenWeatherMap API — temperature penalty)
- [ ] ERS > 80 triggers escalation email queue

### Deliverable
ERS scores visible on all listings. Auto-update confirmed via cron log.

---

## Phase 09 — Geo-Matching Engine
**Branch:** `phase/09-matching-engine`  
**Goal:** Every new listing is automatically matched to the best-fit shelter.

### Tasks
- [ ] Implement matching query in `lib/matching/engine.ts` using `ST_DWithin` + `ST_Distance`
- [ ] Match scoring formula: ERS weight + distance weight + capacity fit + preference match
- [ ] `POST /api/listings` — triggers match attempt after listing creation
- [ ] Create match record in `matches` table
- [ ] Shelter filtering: capacity check, food preference check, status = active
- [ ] Handle "no shelter found" gracefully — listing stays `listed` with admin alert
- [ ] Re-match on shelter decline (pick next in ranked list)
- [ ] `GET /api/matches` — role-filtered (shelter sees own, admin sees all)

### Deliverable
New listings automatically match to a shelter. Match records visible in DB and admin panel.

---

## Phase 10 — Shelter Dashboard & Match Accept/Decline
**Branch:** `phase/10-shelter-dashboard`  
**Goal:** Shelter can see incoming matches, accept or decline, manage capacity.

### Tasks
- [ ] Shelter dashboard (`/shelter`) — incoming matches sorted by ERS desc
- [ ] Match card: food details, quantity, ERS badge, donor name, pickup address
- [ ] `POST /api/matches/[id]/accept` route
- [ ] `POST /api/matches/[id]/decline` route (requires reason)
- [ ] On accept: listing status → `matched`; send SMTP to donor
- [ ] On decline: trigger re-match to next shelter
- [ ] Capacity management page (`/shelter/capacity`) — edit current load, mark unavailable
- [ ] Food preference settings (multi-select checkboxes)
- [ ] Shelter coordinator invite flow (email invite link)

### Deliverable
Shelter can accept/decline matches. Capacity and preferences persist. Status pipeline advances.

---

## Phase 11 — Driver Dashboard & Assignment
**Branch:** `phase/11-driver-dashboard`  
**Goal:** Admin assigns drivers. Driver sees their pickups and can update status.

### Tasks
- [ ] Driver registration + verification flow (simpler than donor — name, vehicle, phone)
- [ ] Admin: assign driver to a matched listing (`/admin/listings`)
- [ ] `POST /api/driver-assignments` route
- [ ] Driver dashboard (`/driver`) — list of assigned pickups with ERS badges
- [ ] `PATCH /api/driver-assignments/[id]/pickup` — Mark Picked Up
- [ ] `PATCH /api/driver-assignments/[id]/deliver` — Mark Delivered
- [ ] Status pipeline: `matched → driver_assigned → in_transit → checklist`
- [ ] SMTP emails: driver assigned (to driver + shelter), picked up (to donor + shelter)

### Deliverable
Admin can assign drivers. Driver can mark pickups and deliveries. Status pipeline advances.

---

## Phase 12 — Route Optimization (OSRM + Multi-Stop)
**Branch:** `phase/12-route-optimization`  
**Goal:** Driver sees an optimized multi-stop route for all their active pickups.

### Tasks
- [ ] Implement OSRM client in `lib/routing/osrm.ts` — distance matrix API call
- [ ] Nearest-neighbor optimizer for stop ordering
- [ ] `GET /api/drivers/[id]/route` — returns ordered stops with ETAs
- [ ] Driver route map (`/driver/route/[id]`) — Leaflet map with numbered stop markers
- [ ] Stop cards with: address, ERS badge, estimated arrival, Navigate button
- [ ] Navigate button: Google Maps deep-link with pre-filled address
- [ ] ETA calculation per stop (road distance / average speed)

### Deliverable
Driver sees numbered stop list on map. ETA per stop. Navigate button opens Google Maps.

---

## Phase 13 — Delivery Receipt & Food Acceptance Checklist
**Branch:** `phase/13-delivery-checklist`  
**Goal:** Shelter completes 5-point checklist on delivery. PIN confirmed. Violation policy enforced.

### Tasks
- [ ] Checklist page (`/shelter/checklist/[listing_id]`)
- [ ] 5-point checklist form (all must be true to pass)
- [ ] Donor PIN entry field — validates against listing `donor_pin`
- [ ] `POST /api/delivery-receipts` route
- [ ] On pass: listing status → `delivered`; write impact record
- [ ] On fail: listing status → `disputed`
- [ ] Violation policy: check `donor_verifications.violation_count`
  - First failure: increment count + send formal warning email to donor
  - Second failure: set account status to `suspended` + cancel all active listings
- [ ] SMTP: checklist result email to donor and admin

### Deliverable
Delivery confirmed via checklist. PIN verified. Violation policy enforced automatically.

---

## Phase 14 — Agentic Dispatcher
**Branch:** `phase/14-agentic-dispatcher`  
**Goal:** When ERS is critical and no human acts, the AI dispatcher takes over.

### Tasks
- [ ] Implement dispatcher logic in `lib/dispatcher/agent.ts`
- [ ] BullMQ cron worker (`lib/queue/workers/dispatcher.ts`) — every 2 minutes
- [ ] Vercel cron trigger (`/api/webhooks/cron?job=dispatcher`)
- [ ] Trigger conditions: ERS > 80 AND match pending > configured timeout AND shelter `accepts_auto_confirm = true`
- [ ] `AUTO_CONFIRM_SHELTER` action: pick highest-ranked available shelter
- [ ] `ASSIGN_DRIVER` action: pick nearest available verified driver
- [ ] `ESCALATE_TO_ADMIN` action: if no shelter or driver available
- [ ] All actions logged to `agent_logs` with reasoning + confidence score
- [ ] Admin can override any agent decision from admin panel
- [ ] SMTP: auto-confirmation email to shelter with 5-minute opt-out link

### Deliverable
Dispatcher fires on ERS threshold. Actions logged. Admin override works. Demo-able in < 30 seconds.

---

## Phase 15 — Computer Vision Intake (Gemini Vision)
**Branch:** `phase/15-cv-intake`  
**Goal:** Donor uploads a food photo and the form auto-fills.

### Tasks
- [ ] `POST /api/ai/cv` route — receives image, calls Gemini Vision API
- [ ] Gemini prompt: return JSON with `food_category`, `estimated_servings`, `confidence_score`
- [ ] `sharp` pre-processing: resize image to 1024px before API call
- [ ] Graceful fallback: if CV fails, return `{ ai_error: "..." }` — never block listing
- [ ] Show confidence badge on CV output (Low / Medium / High)
- [ ] CV uploader component (`components/listings/CVUploader.tsx`)
- [ ] Photo uploaded to Supabase Storage + URL saved to listing
- [ ] Display: "Analysed by AI — please verify before confirming" warning for confidence < 0.6

### Deliverable
Photo upload → AI fills form fields in < 8 seconds. Low confidence shows warning. Failure falls back to manual.

---

## Phase 16 — NLP Free-Text Parser (Gemini Text)
**Branch:** `phase/16-nlp-parser`  
**Goal:** Donor types or speaks a description and the form auto-fills.

### Tasks
- [ ] `POST /api/ai/nlp` route — receives text string, calls Gemini Text API
- [ ] Gemini prompt: parse text into listing JSON fields
- [ ] Voice input: browser `SpeechRecognition` API → transcript → NLP route
- [ ] Wire to listing form: text area with "Parse with AI" button
- [ ] Side-by-side: raw text on left, parsed fields on right for confirmation
- [ ] Zod validation on NLP output before pre-filling form
- [ ] Graceful fallback: if NLP fails, text stays in description field

### Deliverable
Donor types "I have 5kg of biryani expiring at 8pm" → form fills automatically.

---

## Phase 17 — Public Impact Dashboard
**Branch:** `phase/17-public-impact-dashboard`  
**Goal:** A public-facing page showing live impact metrics. No login required.

### Tasks
- [ ] `/public-impact` page (accessible without auth)
- [ ] Animated counter components: meals rescued, kg diverted, CO₂e avoided, active donors/shelters
- [ ] Live activity ticker (last 5 deliveries — donor name, shelter name, meals)
- [ ] Waste hotspot heatmap (`leaflet.heat` layer) — plotted from `listings.pickup_location` clustering
- [ ] `GET /api/impact` route — returns aggregated totals from `impact_totals`
- [ ] 30-second polling for live updates
- [ ] CO₂e calculation: weight_kg × 2.5 (EPA WARM methodology)
- [ ] Mobile-first layout — wide enough to display on a projector

### Deliverable
Public URL shows live impact. Heatmap shows donation density. Looks great for demo.

---

## Phase 18 — Agent Log & Admin Override Panel
**Branch:** `phase/18-admin-agent-log`  
**Goal:** Admin has full visibility into AI decisions and can override any of them.

### Tasks
- [ ] Admin agent log page (`/admin/agent-log`) — table of all dispatcher actions
- [ ] Columns: timestamp, action type, listing, shelter, driver, reasoning, confidence, override status
- [ ] Filter by: action type, date range, overridden/not
- [ ] Override button per row — admin can reverse any agent action
- [ ] `POST /api/admin/agent-log/[id]/override` route
- [ ] Override confirmation modal with reason field
- [ ] SMTP email to affected parties when override fires
- [ ] Admin platform health page — active listings, pending matches, queue depths

### Deliverable
Admin can see every AI decision. Override works. Audit trail complete.

---

## Phase 19 — Tax Certificate & Impact Reporting
**Branch:** `phase/19-tax-certificate`  
**Goal:** Donors can download a tax certificate PDF. ESG data available for export.

### Tasks
- [ ] Tax certificate PDF generator (`lib/pdf/certificate.ts`) using PDFKit
- [ ] Fields: donor name, FSSAI number, PAN, total donations this FY, total kg, total meals, CO₂e, Section 80G advisory
- [ ] QR code on certificate (links to verification page)
- [ ] `GET /api/donors/[id]/certificate` route — generates and streams PDF
- [ ] Donor impact page (`/donor/impact`) — graphical summary of all-time donations
- [ ] Recharts bar chart: donations per month
- [ ] Download certificate button
- [ ] Admin: bulk export all donor impact data as CSV

### Deliverable
Donor downloads a professional PDF tax certificate. Impact page has charts.

---

## Phase 20 — Demo Data Seed & End-to-End Testing
**Branch:** `phase/20-seed-and-test`  
**Goal:** Realistic demo data loaded. Full happy-path tested live.

### Tasks
- [ ] Write `scripts/seed.ts` with:
  - 3 verified donor businesses (MG Road Dhaba, Green Grocers, Campus Canteen)
  - 4 shelters (Hope Shelter, City Food Bank, Children's Home, Community Kitchen)
  - 2 verified drivers
  - 5 listings at different ERS stages (one at 28, one at 62, one at 84, one delivered, one disputed)
  - Pre-loaded impact totals (48,000 meals for public dashboard wow factor)
- [ ] Full end-to-end test run of demo flow (from SRS §21.3)
- [ ] Test all 15 SMTP email types fire correctly
- [ ] Test agentic dispatcher fires in < 30s (adjusted timeout for demo)
- [ ] Confirm CV intake works on a biryani photo
- [ ] Confirm tax certificate PDF generates correctly

### Deliverable
Demo environment seeded. All flows work on production Vercel URL.

---

## Phase 21 — Mobile Responsiveness & UI Polish
**Branch:** `phase/21-polish`  
**Goal:** Everything works on 375px. UI matches the brutalist design spec exactly.

### Tasks
- [ ] Audit all dashboard pages at 375px, 768px, 1280px
- [ ] Fix any overflow, truncation, or layout issues at mobile
- [ ] ERS badge pulse animation (CSS `@keyframes` — no framer-motion)
- [ ] Loading skeleton screens for all data-fetch states
- [ ] Empty states for all lists (no listings, no matches, etc.)
- [ ] Error boundary on all dashboard routes
- [ ] Favicon + Open Graph meta tags
- [ ] `robots.txt` (allow public-impact, disallow all else)
- [ ] Performance: all pages score > 80 on Vercel speed insights

### Deliverable
App is polished, mobile-friendly, and matches design spec.

---

## Phase 22 — Final Deploy, Demo Rehearsal & Documentation
**Branch:** `phase/22-final`  
**Goal:** Production deploy live. README complete. Demo script rehearsed.

### Tasks
- [ ] `README.md` — project overview, setup instructions, env vars, seed command, demo script
- [ ] Update `memory.md` to reflect all completed phases
- [ ] Verify all Vercel env vars are set correctly in production
- [ ] Full deploy to `annasetu.vercel.app` — confirm from a fresh incognito window
- [ ] Run demo script (SRS §21.3) from start to finish — time it
- [ ] Prepare fallback screenshots for each demo step
- [ ] Tag release `v1.0.0` on GitHub
- [ ] Add judges' note to README: known limitations, what would come next

### Deliverable
`https://annasetu.vercel.app` is live, seeded, and demo-ready. Judges can explore every flow.

---

## Phase Dependency Map

```
00 (scaffold)
  └── 01 (design system)
        └── 02 (auth)
              └── 03 (dashboard shell)
                    ├── 04 (verification form)
                    │     └── 05 (admin queue)
                    │           └── 06 (email system) ← wired into 05
                    ├── 07 (listing form)
                    │     └── 08 (ERS engine)
                    │           └── 09 (matching engine)
                    │                 └── 10 (shelter dashboard)
                    │                       └── 11 (driver dashboard)
                    │                             └── 12 (route optimization)
                    │                                   └── 13 (checklist)
                    │                                         └── 14 (agentic dispatcher)
                    ├── 15 (CV intake) ← plugs into 07
                    ├── 16 (NLP parser) ← plugs into 07
                    ├── 17 (public impact dashboard)
                    ├── 18 (agent log) ← depends on 14
                    └── 19 (tax certificate) ← depends on 13
20 (seed + test) ← depends on all above
21 (polish) ← depends on 20
22 (final) ← depends on 21
```
