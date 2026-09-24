# Product Requirements Document — AnnaSetu
**Version:** 1.0  
**Hackathon:** AmiHacks · Track A · NGO / Social Impact  
**Repository:** https://github.com/guptalagan43/annasetu  
**Event Duration:** 24 Hours  

---

## 1. Product Vision

> **"Turn a restaurant's unsold food into a shelter's next meal — before it hits the dumpster."**

AnnaSetu (अन्नसेतु — "Food Bridge" in Sanskrit) is a real-time food rescue and redistribution platform. It eliminates the coordination friction between food businesses with surplus food and shelters/NGOs who need it — using AI-assisted intake, autonomous dispatch, and a verified trust layer.

---

## 2. Problem Statement

Every day, food businesses generate surplus edible food that goes to waste — not because no one wants it, but because there is no fast, reliable channel to connect available food with nearby shelters before it spoils. Most surplus food has a **2–6 hour usable window**.

Current coordination happens via phone calls, WhatsApp, and spreadsheets — breaking down at scale, leaving no data trail, and offering zero impact reporting for donors.

---

## 3. Target Users

| Role | Primary Job To Be Done |
|---|---|
| **Food Donor** (restaurant, caterer, grocery) | Post surplus food in under 60 seconds |
| **Donor Staff** | List on behalf of their branch |
| **Shelter Admin** | Manage incoming food, set capacity & preferences |
| **Shelter Coordinator** | Accept/decline matches, confirm delivery receipt |
| **Volunteer Driver** | Know exactly where to go, in optimized order |
| **Platform Admin** | Verify donors, manage platform health, override AI |
| **Agentic Dispatcher** | Autonomous AI agent — matches & dispatches without human delay |
| **Observer** (Gov / ESG) | Read-only compliance and impact data |

---

## 4. Core Product Goals

### P0 — Must Have (Demo-Critical)
- [ ] Admin-verified donor onboarding (FSSAI, GST, phone, location)
- [ ] Food listing form (manual + CV photo intake)
- [ ] Expiry Risk Score (ERS) engine — 0-100 urgency score, updated every 15 min
- [ ] Geo-matching engine — PostGIS spatial match to nearest suitable shelter
- [ ] Status pipeline: `Listed → Matched → Driver Assigned → In Transit → Checklist → Delivered`
- [ ] Donor PIN generation per listing (4-digit chain-of-custody code)
- [ ] 5-point Food Acceptance Checklist at delivery
- [ ] SMTP email notifications for every status transition
- [ ] Agentic Dispatcher — autonomous match + driver assignment when ERS > threshold
- [ ] Driver dashboard with multi-stop route optimization (OSRM)
- [ ] Public impact dashboard (live counters)
- [ ] Role-based access control (10 roles)

### P1 — Should Have (Judge Impressors)
- [ ] NLP free-text parser (Gemini text API → structured listing data)
- [ ] Computer Vision intake (Gemini Vision → food category, quantity, confidence)
- [ ] Waste hotspot heatmap (Leaflet.js heatmap layer)
- [ ] Tax certificate PDF generation (PDFKit)
- [ ] Agent decision audit log (admin-viewable)
- [ ] Donor violation policy enforcement (warning → account removal)
- [ ] Weekly email digest for shelter admins

### P2 — Nice To Have (Time Permitting)
- [ ] Voice-to-text listing input
- [ ] CO₂e savings calculation with EPA WARM methodology
- [ ] QR code on tax certificate
- [ ] Shelter sub-account (coordinator invite system)
- [ ] ESG report export (CSV/PDF)
- [ ] Weather-adjusted ERS (temperature data from OpenWeatherMap)

---

## 5. Feature Specifications

### 5.1 Donor Verification Flow
- Self-registration form captures: Business Name, Type, FSSAI License (14-digit), GST, PAN, operating hours, address with map pin
- Documents uploaded: FSSAI PDF, GST certificate
- Admin review queue — checklist-based approval UI
- Phone verification step (admin calls registered number)
- States: `pending_review → under_review → approved / rejected`
- System flags FSSAI licenses expiring within 90 days
- Rejected donors may reapply after 30 days

### 5.2 Food Listing (Donor)
- Manual form: food name, category, quantity (weight + servings), expiry datetime, packaging, allergens, pickup window, address
- CV path: Upload photo → Gemini Vision returns food_category, estimated_servings, confidence_score → pre-fill form
- NLP path: Free-text description → Gemini text returns structured JSON → pre-fill form
- One-click relist from previous listings
- Each listing generates a 4-digit Donor PIN on confirmation

### 5.3 Expiry Risk Score (ERS)
```
ERS = (Time_Urgency × 0.5) + (Food_Category_Risk × 0.25) + (No_Taker_Penalty × 0.15) + (Temperature_Factor × 0.10)
Range: 0–100
```
- Recalculated every 15 minutes via BullMQ cron
- Cached in Redis
- Thresholds: Green (0–39) | Yellow (40–59) | Orange (60–79) | Red (80–94) | Black (95–100)
- ERS > 80 triggers escalation email to all parties
- ERS > 80 + no shelter acceptance → Agentic Dispatcher activates

### 5.4 Geo-Matching Engine
- PostGIS `ST_DWithin` query for shelters within radius
- Match score = `(ERS_weight × 0.4) + (distance_weight × 0.3) + (capacity_fit × 0.2) + (preference_match × 0.1)`
- Returns ranked shelter list
- Shelter must have: available capacity > listing quantity, food preferences that include listing category, status = Active
- Auto-creates match record, sends SMTP email to top-ranked shelter

### 5.5 Agentic Dispatcher
- Runs every 2 minutes via BullMQ cron
- Triggers: ERS > 80 AND shelter has not responded in configured timeout
- Actions: `AUTO_CONFIRM_SHELTER` | `ASSIGN_DRIVER` | `ESCALATE_TO_ADMIN`
- Every action logged with timestamp, reasoning, confidence score
- Admin can override any agent decision from dashboard

### 5.6 Driver Flow
- Driver dashboard shows assigned pickups with ERS badges
- Multi-stop route via OSRM distance matrix + nearest-neighbor optimizer
- Numbered stop list with addresses and time estimates
- Google Maps deep-link "Navigate" button per stop
- Status buttons: `Mark Picked Up` | `Mark Delivered`

### 5.7 Food Acceptance Checklist (Shelter)
Required on delivery confirmation — 5 points:
1. Quantity matches listing (within 10%)
2. Food item matches what was listed
3. Packaging intact and clean
4. Food visually safe (no mold, odor, discoloration)
5. Donor PIN confirmed (4-digit match)

Failure policy:
- First failure → formal warning email to donor
- Second failure → account permanent suspension + all active listings cancelled

### 5.8 SMTP Notification Triggers
| Event | Recipients |
|---|---|
| Verification submitted | Admin |
| Verification approved | Donor |
| Verification rejected | Donor |
| Listing posted | Admin (digest) |
| Match found | Shelter |
| Match accepted | Donor, Driver |
| Match declined | System (re-match) |
| Driver assigned | Driver, Donor, Shelter |
| Food picked up | Donor, Shelter |
| Delivery confirmed | Donor (+ impact summary) |
| ERS > 80 alert | Donor, Shelter, Admin |
| Checklist failure | Donor, Admin |
| Weekly digest | Shelter Admins |

### 5.9 Impact Dashboard (Public)
Live counters:
- Total meals rescued
- Total kg food diverted
- CO₂e avoided (kg)
- Active donors / shelters / drivers
- Live donation activity ticker
- Waste hotspot heatmap (Leaflet)

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | ERS recalculation < 500ms per listing; geo-match query < 1s |
| **Uptime** | 99.9% target during 24-hour hackathon window |
| **Security** | JWT with role claims; HTTPS only; env secrets via Vercel env |
| **Scalability** | Stateless API layer; horizontal-ready; PostGIS indexed for 10k+ shelters |
| **Accessibility** | WCAG 2.1 AA minimum on public-facing pages |
| **Mobile** | All dashboards usable at 375px viewport minimum |
| **Email** | Async queue with retry (3 attempts, exponential backoff) |
| **Data Privacy** | PAN / FSSAI numbers stored encrypted at rest |

---

## 7. Success Metrics (Hackathon Demo)

- End-to-end donation flow completes in < 3 minutes (live demo)
- CV intake fills form from photo in < 8 seconds
- Agentic dispatcher fires and logs decision within configured timeout
- All 5 SMTP emails in the happy path fire correctly
- Public dashboard shows live counter updates
- Tax certificate PDF downloads successfully

---

## 8. Out of Scope (v1.0 / Hackathon)

- Mobile app (iOS / Android)
- Payment processing
- Real FSSAI API integration (manual verification only)
- Multi-language support (English + Hindi UI strings only)
- Push notifications (SMTP email only)
- Real-time WebSocket updates (30-second polling acceptable)
