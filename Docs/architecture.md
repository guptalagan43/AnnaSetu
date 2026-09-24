# Architecture — AnnaSetu
**Version:** 1.0  
**Repository:** https://github.com/guptalagan43/annasetu

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  Next.js 15 (App Router)                                        │
│  Tailwind CSS (custom brutalist config) · Custom UI Components  │
│  Leaflet.js (maps + heatmap) · React Email (email templates)    │
└──────────────────────────┬──────────────────────────────────────┘
                           │  REST (Next.js API Routes)
┌──────────────────────────▼──────────────────────────────────────┐
│                         API LAYER                               │
│  Next.js App Router API routes (/app/api/**)                    │
│  Zod (request validation) · JWT middleware (role-based guards)  │
│  Rate limiting (Upstash Redis)                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌─────────────────┼──────────────────┐
         │                 │                  │
┌────────▼───────┐ ┌───────▼──────┐  ┌───────▼──────────┐
│  BACKGROUND    │ │   AI LAYER   │  │  EXTERNAL APIs   │
│  JOBS (BullMQ) │ │              │  │                  │
│                │ │ Gemini Vision│  │ OSRM (routing)   │
│ ERS cron 15min │ │ Gemini Text  │  │ OpenWeatherMap   │
│ Agent cron 2min│ │ (CV + NLP)   │  │ Google Maps URL  │
│ SMTP queue     │ │              │  │                  │
│ Digest cron    │ └──────────────┘  └──────────────────┘
└────────┬───────┘
         │
┌────────▼──────────────────────────────────────────────────────┐
│                        DATA LAYER                             │
│  Supabase (PostgreSQL 15 + PostGIS)                           │
│  ├── Primary relational store (all entities)                  │
│  ├── PostGIS for geo-matching (ST_DWithin, ST_Distance)       │
│  ├── Supabase Auth (JWT issuance + refresh)                   │
│  ├── Supabase Storage (FSSAI docs, food photos)               │
│  └── Supabase Realtime (dashboard live polling fallback)      │
│                                                               │
│  Upstash Redis                                                │
│  ├── ERS cache (15-min TTL per listing)                       │
│  ├── BullMQ queue backend                                     │
│  └── Rate limiting (sliding window per IP)                    │
└───────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
annasetu/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (login, register, verify)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── verify-email/page.tsx
│   ├── (dashboard)/              # Protected route group
│   │   ├── layout.tsx            # Dashboard shell + nav
│   │   ├── donor/
│   │   │   ├── page.tsx          # Donor dashboard (active listings)
│   │   │   ├── new-listing/page.tsx
│   │   │   └── impact/page.tsx
│   │   ├── shelter/
│   │   │   ├── page.tsx          # Shelter dashboard (incoming matches)
│   │   │   ├── capacity/page.tsx
│   │   │   └── checklist/[id]/page.tsx
│   │   ├── driver/
│   │   │   ├── page.tsx          # Driver dashboard (assigned pickups)
│   │   │   └── route/[id]/page.tsx
│   │   └── admin/
│   │       ├── page.tsx          # Admin overview + health
│   │       ├── verification/page.tsx
│   │       ├── listings/page.tsx
│   │       └── agent-log/page.tsx
│   ├── public-impact/page.tsx    # Public impact dashboard (no auth)
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── refresh/route.ts
│   │   ├── listings/
│   │   │   ├── route.ts          # GET (list), POST (create)
│   │   │   └── [id]/route.ts     # GET, PATCH, DELETE
│   │   ├── matches/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── accept/route.ts
│   │   │       └── decline/route.ts
│   │   ├── verification/
│   │   │   ├── route.ts          # GET queue, POST submit
│   │   │   └── [id]/
│   │   │       ├── approve/route.ts
│   │   │       └── reject/route.ts
│   │   ├── ai/
│   │   │   ├── cv/route.ts       # POST: image → structured food data
│   │   │   └── nlp/route.ts      # POST: text → structured food data
│   │   ├── drivers/
│   │   │   ├── route.ts
│   │   │   └── [id]/route/route.ts  # GET optimized route for driver
│   │   ├── impact/route.ts       # GET public impact totals
│   │   ├── admin/
│   │   │   └── agent-log/route.ts
│   │   └── webhooks/
│   │       └── cron/route.ts     # Vercel cron webhook (ERS + dispatcher)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing / redirect
│
├── components/                   # Shared UI components
│   ├── ui/                       # Primitive brutalist components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx             # ERS urgency badge
│   │   ├── Modal.tsx
│   │   └── Toast.tsx
│   ├── listings/
│   │   ├── ListingCard.tsx
│   │   ├── ListingForm.tsx
│   │   ├── CVUploader.tsx        # Photo → Gemini Vision flow
│   │   └── ERSBadge.tsx
│   ├── maps/
│   │   ├── DonorMap.tsx
│   │   ├── DriverRouteMap.tsx
│   │   └── HeatmapLayer.tsx
│   ├── dashboards/
│   │   ├── ImpactCounter.tsx
│   │   ├── LiveTicker.tsx
│   │   └── AgentLogTable.tsx
│   └── emails/                   # React Email templates
│       ├── VerificationApproved.tsx
│       ├── MatchFound.tsx
│       ├── DeliveryConfirmed.tsx
│       └── ERSAlert.tsx
│
├── lib/                          # Core business logic
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server-side client
│   ├── auth/
│   │   ├── middleware.ts         # JWT validation + role extraction
│   │   └── guards.ts             # requireRole() HOF
│   ├── ers/
│   │   └── calculator.ts         # ERS formula implementation
│   ├── matching/
│   │   └── engine.ts             # PostGIS geo-match + scoring
│   ├── dispatcher/
│   │   └── agent.ts              # Agentic dispatcher logic
│   ├── routing/
│   │   └── osrm.ts               # OSRM API client + nearest-neighbor
│   ├── ai/
│   │   ├── gemini-vision.ts      # CV: photo → food data
│   │   └── gemini-nlp.ts         # NLP: text → food data
│   ├── email/
│   │   ├── mailer.ts             # Nodemailer + BullMQ queue wrapper
│   │   └── templates.ts          # Template dispatch
│   ├── pdf/
│   │   └── certificate.ts        # PDFKit tax certificate generator
│   ├── queue/
│   │   └── bullmq.ts             # BullMQ setup + worker definitions
│   └── validators/
│       ├── listing.schema.ts     # Zod schemas
│       ├── verification.schema.ts
│       └── match.schema.ts
│
├── types/
│   ├── database.types.ts         # Supabase-generated DB types
│   ├── api.types.ts
│   └── domain.types.ts           # ERS, Match, Listing, Driver etc.
│
├── hooks/
│   ├── useListings.ts
│   ├── useERS.ts
│   └── useImpact.ts
│
├── public/
│   ├── fonts/                    # Self-hosted fonts
│   └── illustrations/            # Hand-drawn SVG assets
│
├── scripts/
│   └── seed.ts                   # Demo data seeder
│
├── middleware.ts                 # Next.js edge middleware (auth guard)
├── tailwind.config.ts
├── next.config.ts
└── .env.local                    # See Section 5
```

---

## 3. Database Schema (PostgreSQL + PostGIS)

### Core Tables

```sql
-- USERS & AUTH (managed by Supabase Auth + custom profile table)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('super_admin','platform_admin','moderator','reporter','donor_admin','donor_staff','shelter_admin','shelter_coordinator','verified_driver','casual_volunteer','observer_gov','observer_esg')),
  display_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DONOR VERIFICATION
CREATE TABLE donor_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  fssai_number TEXT NOT NULL,
  fssai_expiry DATE NOT NULL,
  gst_number TEXT,
  pan_number TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  operating_hours_start TIME,
  operating_hours_end TIME,
  fssai_doc_url TEXT,
  gst_doc_url TEXT,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review','under_review','approved','rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  violation_count INTEGER DEFAULT 0,
  can_reapply_after DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LISTINGS
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID REFERENCES profiles(id) NOT NULL,
  donor_verification_id UUID REFERENCES donor_verifications(id),
  title TEXT NOT NULL,
  food_category TEXT NOT NULL,
  quantity_kg NUMERIC(8,2),
  estimated_servings INTEGER,
  packaging_type TEXT,
  allergens TEXT[],
  pickup_address TEXT NOT NULL,
  pickup_location GEOGRAPHY(POINT, 4326) NOT NULL,
  pickup_window_start TIMESTAMPTZ NOT NULL,
  pickup_window_end TIMESTAMPTZ NOT NULL,
  expiry_time TIMESTAMPTZ NOT NULL,
  donor_pin CHAR(4) NOT NULL,
  ers_score INTEGER DEFAULT 0 CHECK (ers_score BETWEEN 0 AND 100),
  ers_updated_at TIMESTAMPTZ,
  status TEXT DEFAULT 'listed' CHECK (status IN ('listed','matched','driver_assigned','in_transit','checklist','delivered','disputed','cancelled','expired')),
  cv_confidence NUMERIC(4,3),
  intake_method TEXT DEFAULT 'manual' CHECK (intake_method IN ('manual','cv','nlp','voice')),
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_listings_location ON listings USING GIST(pickup_location);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_ers ON listings(ers_score DESC);

-- SHELTERS
CREATE TABLE shelters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  capacity_kg NUMERIC(8,2) NOT NULL DEFAULT 0,
  current_load_kg NUMERIC(8,2) DEFAULT 0,
  food_preferences TEXT[],
  food_restrictions TEXT[],
  accepts_auto_confirm BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','unavailable','suspended')),
  reliability_score NUMERIC(4,3) DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_shelters_location ON shelters USING GIST(location);

-- MATCHES
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) NOT NULL,
  shelter_id UUID REFERENCES shelters(id) NOT NULL,
  match_score NUMERIC(5,3),
  distance_km NUMERIC(8,3),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','auto_confirmed','cancelled')),
  auto_confirmed BOOLEAN DEFAULT FALSE,
  shelter_response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DRIVERS & ASSIGNMENTS
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  vehicle_type TEXT,
  current_location GEOGRAPHY(POINT, 4326),
  is_available BOOLEAN DEFAULT TRUE,
  reliability_score NUMERIC(4,3) DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE driver_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id),
  listing_id UUID REFERENCES listings(id),
  route_stops JSONB,          -- ordered array of {listing_id, address, lat, lng, eta}
  assigned_by TEXT DEFAULT 'admin' CHECK (assigned_by IN ('admin','agent')),
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned','picked_up','delivered')),
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DELIVERY RECEIPTS (Acceptance Checklist)
CREATE TABLE delivery_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id),
  match_id UUID REFERENCES matches(id),
  driver_assignment_id UUID REFERENCES driver_assignments(id),
  completed_by UUID REFERENCES profiles(id),
  quantity_ok BOOLEAN NOT NULL,
  item_correct BOOLEAN NOT NULL,
  packaging_ok BOOLEAN NOT NULL,
  food_condition_ok BOOLEAN NOT NULL,
  pin_confirmed BOOLEAN NOT NULL,
  checklist_passed BOOLEAN GENERATED ALWAYS AS (quantity_ok AND item_correct AND packaging_ok AND food_condition_ok AND pin_confirmed) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AGENT LOG
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  listing_id UUID REFERENCES listings(id),
  match_id UUID REFERENCES matches(id),
  driver_id UUID REFERENCES drivers(id),
  reasoning TEXT,
  confidence NUMERIC(4,3),
  overridden_by UUID REFERENCES profiles(id),
  overridden_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IMPACT TOTALS
CREATE TABLE impact_totals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id),
  donor_id UUID REFERENCES profiles(id),
  shelter_id UUID REFERENCES shelters(id),
  meals_rescued INTEGER,
  weight_kg NUMERIC(8,2),
  co2e_avoided_kg NUMERIC(8,2),  -- EPA WARM: 2.5 kg CO2e per kg food waste diverted
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- EMAIL QUEUE LOG
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','bounced')),
  attempts INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. API Route Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Get JWT |
| POST | `/api/auth/refresh` | JWT | Refresh token |
| GET | `/api/listings` | JWT | List all (role-filtered) |
| POST | `/api/listings` | Donor | Create listing |
| PATCH | `/api/listings/[id]` | Donor/Admin | Update listing |
| DELETE | `/api/listings/[id]` | Donor/Admin | Cancel listing |
| GET | `/api/listings/[id]` | JWT | Get single listing |
| POST | `/api/ai/cv` | Donor | Photo → food data (Gemini Vision) |
| POST | `/api/ai/nlp` | Donor | Text → food data (Gemini Text) |
| GET | `/api/matches` | JWT | List matches (role-filtered) |
| POST | `/api/matches/[id]/accept` | Shelter | Accept a match |
| POST | `/api/matches/[id]/decline` | Shelter | Decline a match |
| GET | `/api/verification` | Admin | Pending queue |
| POST | `/api/verification` | Public | Submit verification |
| POST | `/api/verification/[id]/approve` | Admin | Approve donor |
| POST | `/api/verification/[id]/reject` | Admin | Reject donor |
| GET | `/api/drivers/[id]/route` | Driver | Get optimized route |
| GET | `/api/impact` | Public | Public impact counters |
| GET | `/api/admin/agent-log` | Admin | View agent decisions |
| POST | `/api/webhooks/cron` | Vercel Cron | ERS + dispatcher trigger |

---

## 5. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
JWT_SECRET=
JWT_ACCESS_EXPIRY=3600
JWT_REFRESH_EXPIRY=604800

# SMTP (Gmail or Brevo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="AnnaSetu <noreply@annasetu.in>"

# AI
GEMINI_API_KEY=

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# External APIs
OPENWEATHERMAP_API_KEY=
OSRM_BASE_URL=https://router.project-osrm.org

# Vercel Cron Secret
CRON_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://annasetu.vercel.app
NODE_ENV=production
```

---

## 6. Background Jobs (BullMQ)

| Queue | Schedule | Worker | Description |
|---|---|---|---|
| `ers-recalc` | Every 15 min | `lib/queue/workers/ers.ts` | Recalculate ERS for all `listed` and `matched` listings |
| `dispatcher` | Every 2 min | `lib/queue/workers/dispatcher.ts` | Agentic dispatcher — check ERS threshold, auto-match, auto-assign |
| `email` | On-demand | `lib/queue/workers/email.ts` | Async email send with retry (3 attempts, exponential backoff) |
| `digest` | Mon 08:00 | `lib/queue/workers/digest.ts` | Weekly summary email to shelter admins |

---

## 7. Data Flow — Happy Path

```
Donor uploads photo
       ↓
Gemini Vision API → food_category, servings, confidence
       ↓
Listing form pre-filled → Donor confirms
       ↓
POST /api/listings → DB insert + Donor PIN generated
       ↓
ERS calculated (initial score) + cached in Redis
       ↓
PostGIS geo-match → top shelter selected
       ↓
Match record created → SMTP email to shelter
       ↓
Shelter accepts match (or Agentic Dispatcher auto-confirms)
       ↓
Admin/Agent assigns driver → SMTP email to driver
       ↓
Driver picks up → status: in_transit → SMTP emails
       ↓
Driver delivers → Shelter completes 5-point Checklist
       ↓
Checklist passes + PIN confirmed → status: delivered
       ↓
Impact calculated → SMTP delivery summary to donor
       ↓
Tax certificate PDF generated (on demand)
```

---

## 8. Security Model

- All API routes protected by `lib/auth/middleware.ts` (JWT validation)
- Role checked per route using `requireRole(['donor_admin', 'donor_staff'])` guard
- Supabase Row Level Security (RLS) as second layer on DB
- File uploads go to Supabase Storage with signed URLs (private buckets)
- PAN and FSSAI numbers stored with AES-256 encryption at rest (Supabase handles)
- Rate limiting: 100 req/min per IP on public routes, 500 req/min for authenticated
- CRON routes protected by `CRON_SECRET` header check
- All AI API keys server-side only (never exposed to client)
