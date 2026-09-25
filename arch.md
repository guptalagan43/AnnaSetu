# AnnaSetu — End-to-End System Architecture

**Platform:** Real-Time AI-Powered Surplus Food Redistribution & Rescue Network  
**Technology Stack:** Next.js 15 (App Router, React 19, TypeScript), Tailwind CSS v4 (Neo-brutalist design system), Leaflet.js, Supabase (PostgreSQL 15 + PostGIS), Upstash Redis, BullMQ, Google Gemini 1.5, OSRM Routing Engine, React Email, PDFKit.

---

## 1. High-Level Architecture Diagram

```mermaid
graph TB
    subgraph CLIENT_LAYER["1. CLIENT & PRESENTATION LAYER (Next.js 15 App Router)"]
        direction TB
        subgraph PUBLIC_SURFACE["Public Web Portal"]
            P1["Landing Page with 3D Canvas<br/>(Hero3DCanvas & Dispatch HUD)"]
            P2["ERS Interactive Simulator<br/>(ErsInteractiveSimulator)"]
            P3["Public Impact Heatmap<br/>(ImpactHeatmap - Leaflet.heat)"]
            P4["Interactive FAQ & Legal<br/>(Terms & Privacy Policies)"]
        end

        subgraph ROLE_DASHBOARDS["Role-Gated Dashboards"]
            D1["Donor Dashboard (/donor)<br/>- AI Food Lister & Relist<br/>- 80G Tax Certificates<br/>- Live ERS Countdown Badges"]
            D2["Shelter / NGO Dashboard (/shelter)<br/>- Incoming Match Acceptance<br/>- Dedicated Capacity Mgmt<br/>- Preferences & Inspection"]
            D3["Volunteer Driver (/driver)<br/>- Online/Offline Toggle<br/>- Embedded Live Route Map<br/>- Fullscreen Route (/driver/route/me)"]
            D4["Network Coordinator (/coordinator)<br/>- Multi-NGO Network Overview<br/>- Redistribution Analytics<br/>- Capacity & Delivery Monitoring"]
            D5["Platform Admin (/admin)<br/>- FSSAI Verification Queue<br/>- Autonomous Agent Logs<br/>- System Health & Listings"]
        end
    end

    subgraph GATEWAY_LAYER["2. ROUTING, AUTH & EDGE MIDDLEWARE"]
        MW["Next.js Edge Middleware (src/middleware.ts)<br/>- Role Guard Matrix & Path Protection<br/>- JWT Verification (Supabase Auth / LocalStore HMAC)<br/>- Route Canonicalization & Redirects"]
    end

    subgraph API_LAYER["3. API & BUSINESS LOGIC LAYER (/api/**)"]
        direction TB
        subgraph AUTH_APIS["Authentication & Accounts"]
            API_AUTH["/api/auth/[login | register | refresh]"]
            API_DRIVER["/api/drivers/[availability | route]"]
            API_SHELTER["/api/shelter (Capacity & Preferences)"]
        end

        subgraph RESCUE_APIS["Core Rescue Operations"]
            API_LIST["/api/listings (Create, Relist, Lifecycle)"]
            API_MATCH["/api/matches/[accept | decline]"]
            API_ASSIGN["/api/driver-assignments/[pickup | deliver]"]
            API_RECEIPT["/api/delivery-receipts (5-Point Checklist + PIN)"]
        end

        subgraph INTELLIGENCE_APIS["AI & Reporting APIs"]
            API_AI["/api/ai/[parse-image | parse-text]"]
            API_TAX["/api/donors/[id]/certificate (PDFKit 80G)"]
            API_IMPACT["/api/impact (Real-time Analytics)"]
        end
    end

    subgraph CORE_ENGINES["4. DOMAIN ENGINES & ALGORITHMS"]
        direction LR
        ENG_ERS["ERS Engine (0-100)<br/>- Base Decay Rates<br/>- OpenWeatherMap Ambient Temp<br/>- Storage & Time Decay Multipliers"]
        ENG_MATCH["Matching Engine<br/>- PostGIS / Haversine Distance<br/>- Capacity & Diet Fit<br/>- Urgency & Proximity Scoring"]
        ENG_ROUTE["OSRM Routing Optimizer<br/>- Road Matrix Calculation<br/>- Pickup-Before-Delivery Precedence<br/>- ERS Urgency Prioritization"]
        ENG_IMPACT["Impact & ESG Engine<br/>- kg Food Rescued<br/>- Meals Served (0.35kg/meal)<br/>- CO2e Avoided (2.5kg/kg)"]
        ENG_AGENT["Autonomous Dispatcher Agent<br/>- Background Watchdog (2-min cron)<br/>- Critical ERS Auto-Confirm<br/>- Autonomous Driver Dispatch"]
    end

    subgraph AI_SERVICES["5. EXTERNAL AI & EXTERNAL SERVICES"]
        GEMINI_V["Google Gemini 1.5 Vision<br/>(Computer Vision Food Classifier)"]
        GEMINI_T["Google Gemini 1.5 Flash<br/>(NLP Voice & Text Listing Parser)"]
        OSRM["OSRM Project API<br/>(OpenStreetMap Road Distance Matrix)"]
        WEATHER["OpenWeatherMap API<br/>(Live Ambient Metro Temperature)"]
        SMTP["SMTP Transporter<br/>(Nodemailer & React Email Templates)"]
    end

    subgraph QUEUE_JOBS["6. ASYNCHRONOUS WORKERS & QUEUES"]
        REDIS["Upstash Redis<br/>(BullMQ Job Store & Rate Limiter)"]
        BULLMQ["BullMQ Queue Workers<br/>- ERS Re-index Cron (15 min)<br/>- Autonomous Dispatch Agent Cron (2 min)<br/>- Email Dispatch Queue<br/>- Donor Impact Digest Cron"]
    end

    subgraph DATA_LAYER["7. PERSISTENCE & DATA STORAGE LAYER"]
        direction TB
        subgraph SUPABASE_LIVE["Supabase (Production / Live Cloud)"]
            PG["PostgreSQL 15 + PostGIS<br/>(Entities: Profiles, Listings, Shelters, Drivers, Matches, Receipts)"]
            SB_AUTH["Supabase Auth (JWT & GoTrue)"]
            SB_STORAGE["Supabase Storage (FSSAI Docs & Food Photos)"]
            SB_RLS["Row-Level Security Policies"]
        end
        subgraph LOCAL_STORE["Zero-Dependency Local Fallback (Offline / Dev)"]
            MOCK_CLIENT["Mock Supabase Client (src/lib/supabase/mockClient.ts)"]
            LOCAL_STORE_JWT["LocalStore In-Memory State & HMAC JWTs"]
        end
    end

    %% Wiring Connections
    CLIENT_LAYER --> MW
    MW --> API_LAYER

    API_AI --> GEMINI_V
    API_AI --> GEMINI_T
    API_LIST --> ENG_ERS
    API_LIST --> ENG_MATCH
    API_DRIVER --> ENG_ROUTE
    API_RECEIPT --> ENG_IMPACT

    ENG_ERS --> WEATHER
    ENG_ROUTE --> OSRM
    ENG_AGENT --> API_MATCH
    ENG_AGENT --> API_ASSIGN

    API_LAYER --> BULLMQ
    BULLMQ --> REDIS
    BULLMQ --> SMTP

    API_LAYER --> DATA_LAYER
```

---

## 2. Real-Time Food Rescue Data Flow Sequence

The diagram below details the entire operational lifecycle of a surplus food donation—from initial post to final shelter inspection and carbon accounting.

```mermaid
sequenceDiagram
    autonumber
    actor Donor as Food Donor (Restaurant/Hotel)
    participant UI as AnnaSetu Web App (Next.js 15)
    participant AI as Gemini Vision & NLP API
    participant ERS as ERS Calculator
    participant DB as Database (PostGIS/Supabase)
    participant Dispatcher as Autonomous Dispatch Agent
    actor Driver as Volunteer Rescue Driver
    actor Shelter as Shelter / NGO Admin

    %% Step 1: Donor Posting
    Note over Donor, UI: Phase 1: Listing Creation & AI Extraction
    Donor->>UI: Snap photo or speak surplus details
    UI->>AI: POST /api/ai/parse-image or parse-text
    AI-->>UI: Return extracted title, category, quantity_kg, perishable flags
    Donor->>UI: Confirm pickup address & storage condition (ambient/chilled/hot)
    UI->>ERS: Compute initial Expiry Risk Score (Base decay + Temp + Prep time)
    ERS-->>UI: Initial ERS Score (e.g., 68 - CAUTION)
    UI->>DB: Insert listing with status = 'available'

    %% Step 2: Auto-Matching
    Note over UI, DB: Phase 2: Autonomous Geo-Matching
    UI->>DB: Query nearby shelters within radius with capacity (PostGIS ST_DWithin)
    DB-->>UI: Candidate shelters ranked by compatibility score
    UI->>DB: Create match record (status = 'pending')
    UI->>Shelter: Notify shelter of incoming surplus batch

    %% Step 3: Auto-Escalation & Dispatch
    Note over Dispatcher, Driver: Phase 3: Autonomous Dispatch & OSRM Routing
    alt Shelter accepts match within 15 minutes
        Shelter->>UI: Click "ACCEPT SURPLUS"
        UI->>DB: Update match status = 'accepted'
    else Match pending > 15 mins OR ERS > 70 (CRITICAL)
        Dispatcher->>DB: Scan pending critical matches
        Dispatcher->>DB: Auto-confirm match (prevents food spoilage)
    end

    Dispatcher->>DB: Allocate to nearest available volunteer driver
    DB->>Driver: Dispatch Alert & Push Notification
    Driver->>UI: View Live Route Map (/driver/route/me)
    UI->>DB: Fetch multi-stop waypoints
    UI-->>Driver: Optimized turn-by-turn route with OSRM road geometry

    %% Step 4: Physical Pickup & Transit
    Note over Driver, Donor: Phase 4: Verification & Transport
    Driver->>Donor: Arrive at Donor Location
    Driver->>UI: Click "MARK PICKED UP"
    UI->>DB: Update assignment status = 'picked_up', listing = 'in_transit'
    UI-->>Shelter: Notify: Driver is en route with surplus

    %% Step 5: Shelter Acceptance & Physical Checklist
    Note over Driver, Shelter: Phase 5: 5-Point Physical Inspection & PIN Handover
    Driver->>Shelter: Arrive at Shelter Destination
    Shelter->>UI: Open Inspection Checklist (/shelter/checklist/[id])
    Shelter->>UI: Verify 5 points: Packaging, Temperature, Odor, Hygiene, Quantity
    Donor-->>Shelter: 4-digit Donor PIN provided upon handover
    Shelter->>UI: Input Donor PIN & Click "ACCEPT & VERIFY"
    UI->>DB: POST /api/delivery-receipts (validate PIN & checklist)
    DB-->>UI: Delivery confirmed, status = 'delivered'

    %% Step 6: Impact & Certificate Generation
    Note over DB, Donor: Phase 6: Carbon Accounting & Section 80G Tax Exemption
    DB->>DB: Record impact metrics (kg rescued, meals served, CO2e avoided)
    DB->>Donor: Instant Section 80G PDF Tax Receipt available
    DB->>UI: Update Public Impact Dashboard & Heatmap in real-time
```

---

## 3. Core Subsystems & Component Topology

```mermaid
graph TD
    subgraph UI_MODULES["Frontend Components (src/components)"]
        direction TB
        COMP_ROUTING["routing/RouteMap.tsx<br/>Leaflet dynamic polyline, numbered stop pins, popups"]
        COMP_HEATMAP["impact/ImpactHeatmap.tsx<br/>Leaflet.heat density map of rescued food hotspots"]
        COMP_NLP["listings/NLPParser.tsx<br/>AI voice/text parser with fallback to raw notes"]
        COMP_CV["listings/CVUploader.tsx<br/>Drag-and-drop food image analyzer"]
        COMP_HUD["landing/SimulatedDispatchHUD.tsx<br/>Live brutalist terminal showing simulated dispatches"]
        COMP_3D["landing/Hero3DCanvas.tsx<br/>Dynamic HTML5 canvas food rescue visualization"]
        COMP_SIDEBAR["dashboards/Sidebar.tsx<br/>Role-filtered brutalist navigation sidebar"]
    end

    subgraph ENGINE_MODULES["Core Engine Modules (src/lib)"]
        direction TB
        LIB_ERS["ers/calculator.ts<br/>Calculates 0-100 score: decay rate * temperature * time"]
        LIB_MATCH["matching/engine.ts<br/>Ranks shelters: Distance (40%) + Capacity (30%) + Diet (30%)"]
        LIB_OSRM["routing/osrm.ts<br/>Multi-stop road matrix, nearest neighbor sequencing"]
        LIB_IMPACT["impact/calculator.ts<br/>kg * 2.857 meals/kg * 2.5 kg CO2e/kg"]
        LIB_AGENT["agent/dispatcher.ts<br/>Autonomous cron watchdog for critical match auto-confirm"]
        LIB_PDF["tax/pdfGenerator.ts<br/>PDFKit generator for Indian Section 80G Tax Certificates"]
    end

    subgraph DB_SCHEMA["Database Tables (Supabase PostgreSQL)"]
        direction TB
        T_PROFILES["profiles (id, email, role, full_name, phone)"]
        T_DONORS["donors (id, profile_id, business_name, fssai_license, verified)"]
        T_SHELTERS["shelters (id, profile_id, name, capacity_kg, current_occupancy_kg, preferences)"]
        T_DRIVERS["drivers (id, profile_id, vehicle_type, is_available, reliability_score)"]
        T_LISTINGS["listings (id, donor_id, title, category, quantity_kg, ers_score, status, donor_pin)"]
        T_MATCHES["matches (id, listing_id, shelter_id, status, compatibility_score)"]
        T_ASSIGN["driver_assignments (id, driver_id, listing_id, status, route_stops)"]
        T_RECEIPTS["delivery_receipts (id, match_id, checklist_answers, pin_verified, co2_avoided)"]
    end

    UI_MODULES --> ENGINE_MODULES
    ENGINE_MODULES --> DB_SCHEMA
```

---

## 4. Entity-Relationship Data Model (ERD)

```mermaid
erDiagram
    PROFILES ||--o| DONORS : "has role donor_admin"
    PROFILES ||--o| SHELTERS : "has role shelter_admin"
    PROFILES ||--o| DRIVERS : "has role verified_driver"
    
    DONORS ||--o{ LISTINGS : "posts surplus"
    LISTINGS ||--o{ MATCHES : "generates candidate"
    SHELTERS ||--o{ MATCHES : "receives match"
    
    MATCHES ||--o| DRIVER_ASSIGNMENTS : "triggers dispatch"
    DRIVERS ||--o{ DRIVER_ASSIGNMENTS : "executes delivery"
    
    MATCHES ||--o| DELIVERY_RECEIPTS : "concludes with"
    DELIVERY_RECEIPTS }o--|| IMPACT_METRICS : "tallies into"

    PROFILES {
        uuid id PK
        string email
        string role "donor_admin | shelter_admin | shelter_coordinator | verified_driver | platform_admin"
        string full_name
        string phone
        timestamp created_at
    }

    DONORS {
        uuid id PK
        uuid profile_id FK
        string business_name
        string fssai_license
        string verification_status "verified | pending | rejected"
        geometry location "Point (lon, lat)"
    }

    SHELTERS {
        uuid id PK
        uuid profile_id FK
        string name
        float capacity_kg
        float current_occupancy_kg
        jsonb preferences "accepted categories, dietary restrictions"
        geometry location "Point (lon, lat)"
    }

    DRIVERS {
        uuid id PK
        uuid profile_id FK
        string vehicle_type "bike | scooter | auto | car | van | tempo | truck"
        boolean is_available
        float reliability_score
        geometry current_location
    }

    LISTINGS {
        uuid id PK
        uuid donor_id FK
        string title
        string food_category "cooked_meals | raw_produce | dairy | bakery | packaged"
        float quantity_kg
        float ers_score "0 to 100"
        string status "available | matched | in_transit | delivered | expired | disputed"
        string donor_pin "4-digit verification code"
        timestamp expiry_time
    }

    MATCHES {
        uuid id PK
        uuid listing_id FK
        uuid shelter_id FK
        string status "pending | accepted | auto_confirmed | declined | expired"
        float compatibility_score
        timestamp accepted_at
    }

    DRIVER_ASSIGNMENTS {
        uuid id PK
        uuid driver_id FK
        uuid listing_id FK
        string status "assigned | picked_up | delivered"
        jsonb route_stops "ordered waypoints"
        timestamp picked_up_at
        timestamp delivered_at
    }

    DELIVERY_RECEIPTS {
        uuid id PK
        uuid match_id FK
        jsonb checklist "5-point inspection responses"
        boolean pin_verified
        float food_rescued_kg
        float co2e_avoided_kg
        timestamp created_at
    }
```

---

## 5. Security, Role-Based Access Control (RBAC) & Route Matrix

| Role | Permitted Route Prefixes | Destination on Login | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Food Donor** (`donor_admin`, `donor_staff`) | `/donor/*`, `/profile`, `/settings` | `/donor` | Post surplus food, view listings, print 80G tax exemptions |
| **Shelter Admin** (`shelter_admin`) | `/shelter/*`, `/profile`, `/settings` | `/shelter` | Accept matches, update intake capacity & dietary preferences, inspect food |
| **Network Coordinator** (`shelter_coordinator`) | `/coordinator/*`, `/shelter/*`, `/profile` | `/coordinator` | Regional oversight across multiple shelters & donor networks, redistribution telemetry |
| **Volunteer Driver** (`verified_driver`, `casual_volunteer`) | `/driver/*`, `/profile`, `/settings` | `/driver` | Toggle availability, follow optimized multi-stop route map, confirm pickups |
| **Platform Admin** (`platform_admin`, `super_admin`) | `/admin/*`, `/donor/*`, `/shelter/*`, `/driver/*` | `/admin` | Verify FSSAI licenses, monitor autonomous dispatcher logs, audit system health |
| **Public / Anonymous** | `/`, `/login`, `/register`, `/public-impact`, `/terms`, `/privacy` | `/` | Explore mission, test ERS simulator, view live impact, register account |

---

## 6. Resilience, Fallback & Offline Strategies

1. **Routing Engine Resilience**:
   - **Primary**: OSRM Driving Matrix API computes exact road travel distances and traffic durations.
   - **Fallback**: Haversine formula augmented with an urban winding factor of `1.35x` and an average speed of `25 km/h` kicks in immediately if OSRM times out (3-second circuit breaker).
2. **AI Engine Graceful Degradation**:
   - **Vision**: If `GEMINI_API_KEY` is not present, image upload alerts user and opens form with manual category selection.
   - **NLP**: If Gemini API is unreachable or key is absent, the parser returns a structured fallback that places the entire typed/spoken text into the "Notes" field and presents an **"APPLY RAW TEXT AS NOTES"** action.
3. **Database & Dev Mode Independence**:
   - **Live Cloud**: Fully wired to Supabase with Row Level Security (RLS) policies.
   - **Offline / Local Dev**: If Supabase credentials are placeholders, the system activates an in-memory client (`mockClient.ts`) backed by `localStore.ts` with local HMAC JWT verification—allowing the entire 44-route platform to operate without external dependencies.
4. **Map Rendering Integrity**:
   - Leaflet CSS is bundled directly into the global CSS pipeline to eliminate external unpkg CDN latency, race conditions, and unstyled tile flickering. Map lifecycle includes automatic resize invalidation (`map.invalidateSize()`) and unmount garbage collection.
