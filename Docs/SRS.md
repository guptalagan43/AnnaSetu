# Software Requirements Specification (SRS)
## AnnaSetu: Real-Time Food Rescue Routing Platform
### AmiHacks · Track A · NGO / Social Impact

---

| Field | Detail |
|---|---|
| **Document Title** | Software Requirements Specification — AnnaSetu |
| **| **Version** | 1.2 | |
| **Prepared For** | AmiHacks Hackathon — Track A (NGO / Social Impact) |
| **Event Duration** | 24 Hours |
| **Document Status** | v1.2 — Added Delivery Receipt & Food Acceptance Checklist + Volunteer Violation Policy; renamed project to AnnaSetu |
| **Notification Channels** | Email via SMTP only |
| **Donor Onboarding** | Admin-verified only (FSSAI / GST / Phone / Location) |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Problem Decomposition](#2-problem-decomposition)
3. [Target Users & Stakeholders](#3-target-users--stakeholders)
4. [Multi-Role Access Control](#4-multi-role-access-control)
5. [Donor Verification & Onboarding Flow](#5-donor-verification--onboarding-flow)
6. [Core Features — MVP Priority Order](#6-core-features--mvp-priority-order)
7. [Zero-Friction Donor Intake System](#7-zero-friction-donor-intake-system)
8. [Expiry Risk Scoring Engine](#8-expiry-risk-scoring-engine)
9. [AI-Powered Matching Engine](#9-ai-powered-matching-engine)
10. [Agentic Dispatcher](#10-agentic-dispatcher)
11. [CV-Based Intake (Computer Vision)](#11-cv-based-intake-computer-vision)
12. [Multi-Stop Route Optimization](#12-multi-stop-route-optimization)
13. [Delivery Receipt & Food Acceptance Checklist](#13-delivery-receipt--food-acceptance-checklist)
14. [Notification System (Email via SMTP)](#14-notification-system-email-via-smtp)
15. [All Dashboards — Detailed Specifications](#15-all-dashboards--detailed-specifications)
16. [NLP Free-Text Parser](#16-nlp-free-text-parser)
17. [Impact Reporting & Tax Documentation](#17-impact-reporting--tax-documentation)
18. [Data Models](#18-data-models)
19. [Non-Functional Requirements](#19-non-functional-requirements)
20. [Tech Stack Recommendation](#20-tech-stack-recommendation)
21. [24-Hour Build Plan](#21-24-hour-build-plan)
22. [What Makes This Win](#22-what-makes-this-win)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the complete functional, technical, and design requirements for **AnnaSetu** — a real-time food rescue and redistribution platform that connects surplus food from businesses (restaurants, grocers, caterers, campus dining) to shelters, NGOs, and food banks before the food expires.

This document serves as the authoritative reference for the development team during the AmiHacks 24-hour hackathon sprint, covering all features, system behaviors, user roles, data models, and build priorities.

### 1.2 Scope

The system will:
- Allow food businesses (post admin approval) to list surplus food within seconds
- Automatically match listings to the best-fit nearby shelter based on capacity, preferences, and distance
- Coordinate volunteer driver dispatch — autonomously where possible
- Track every donation from listing to delivery with real-time status updates via the pipeline: `Listed → Matched → Driver Assigned → In Transit → Checklist → Delivered / Disputed`
- Generate a unique 4-digit **Donor PIN** per confirmed listing for chain-of-custody verification at handover
- Require shelter volunteers to complete a mandatory **5-point Food Acceptance Checklist** at the point of delivery (quantity accuracy, food item correctness, packaging condition, visible food condition, donor PIN confirmation)
- Enforce a progressive **Donor Violation Policy**: first checklist failure = formal warning; second checklist failure = permanent account removal and cancellation of all active listings
- Notify all parties of status changes exclusively via **email (SMTP)**
- Calculate and display real-time Expiry Risk Scores (ERS) for all active listings
- Generate impact reports and tax-deductible donation certificates for donors
- Ensure no food business or entity can list food without prior admin verification

### 1.3 Definitions & Abbreviations

| Term | Definition |
|---|---|
| **ERS** | Expiry Risk Score — a 0–100 numerical urgency index per listing, recalculated every 15 minutes |
| **Listing** | A donor's posted surplus food item available for pickup |
| **Match** | A pairing between a listing and a recipient shelter |
| **Agentic Dispatcher** | Autonomous AI workflow that assigns drivers and confirms matches without human intervention |
| **FSSAI** | Food Safety and Standards Authority of India — regulatory body whose license validates a food business |
| **SMTP** | Simple Mail Transfer Protocol — the email delivery protocol used exclusively for all notifications |
| **CV** | Computer Vision — image-based food identification and quantity estimation |
| **NLP** | Natural Language Processing — free-text description to structured data parsing |
| **OSRM** | Open Source Routing Machine — free, open-source route planning engine |
| **NGO** | Non-Governmental Organization |
| **PostGIS** | Spatial extension for PostgreSQL enabling geo-queries |
| **ETA** | Estimated Time of Arrival |

### 1.4 System Overview

```
                        ┌──────────────────────────────────────────────┐
                        │           SURPLUS-TO-SHELTER PLATFORM          │
                        │                                                │
  [Food Donor]  ──────► │  Verification → Listing → ERS Scoring         │
                        │       ↓                                        │
  [Admin]       ──────► │  Approve/Reject Donors  │  Manage Platform    │
                        │       ↓                                        │
                        │  Matching Engine (Geo + Capacity + Preference) │
                        │       ↓                                        │
  [Shelter/NGO] ◄────── │  Accept/Decline Match   │  Capacity Mgmt      │
                        │       ↓                                        │
  [Driver]      ◄────── │  Agentic Dispatcher → Route Optimization      │
                        │       ↓                                        │
  [All Roles]   ◄────── │  SMTP Email Notifications (status pipeline)   │
                        │       ↓                                        │
  [Public]      ◄────── │  Impact Dashboard (live metrics)               │
                        └──────────────────────────────────────────────┘
```

---

## 2. Problem Decomposition

### 2.1 Core Problem

Every day, food businesses generate surplus edible food that goes to waste — not because no one wants it, but because there is no fast, reliable, and trustworthy channel to connect available food with nearby shelters before it spoils. Most surplus food has a **2–6 hour usable window**.

### 2.2 Sub-Problem Breakdown

| # | Sub-Problem | Why It Is Hard | This System's Solution |
|---|---|---|---|
| 1 | **Donor friction** | Businesses won't use a platform that feels like extra work | CV photo intake, NLP text parser, one-click relist — listing in under 60 seconds |
| 2 | **Time pressure** | 2–6 hr window means matching must be nearly instant | ERS engine + agentic dispatcher activates when urgency crosses threshold |
| 3 | **Trust and safety gap** | Unverified donors may list unsafe or fraudulent food | Admin verification gate (FSSAI, GST, phone, location) before any listing is allowed |
| 4 | **Data chaos** | Free-text descriptions, vague quantities, inconsistent inputs | CV + NLP parse messy inputs into structured, validated records |
| 5 | **Coordination overhead** | Phone calls, WhatsApp, spreadsheets break at scale | Automated status pipeline, SMTP notifications, and agentic dispatcher |
| 6 | **No impact visibility** | Donors, shelters, and funders have no data trail | Auto-calculated impact metrics, CO₂e tracking, tax certificates |
| 7 | **Driver inefficiency** | One driver per one pickup wastes volunteer capacity | Multi-stop route optimization bundles nearby pickups |

### 2.3 Why This Is Not a CRUD App

The system requires:
- **Real-time matching** under time constraints with geographic and preference constraints
- **Autonomous decision-making** (agentic dispatcher) when human response is too slow
- **Safety logic** (ERS, food category rules) preventing unsafe food routing
- **Trust infrastructure** (verification gate, accountability scores)
- **Logistics optimization** (multi-stop routing) beyond simple assignment

---

## 3. Target Users & Stakeholders

### 3.1 Primary Users

These users interact directly with the system through role-specific interfaces.

| Role | Who They Are | Primary Goal | Key Pain Point Solved |
|---|---|---|---|
| **Food Donor** | Restaurant owner, café manager, grocery store manager, campus dining head, caterer | Post verified surplus food in < 60 seconds | Lack of easy, compliance-friendly donation channel |
| **Donor Staff** | Individual branch employee of a chain (sub-account under Donor Admin) | Create listings on behalf of their location | No tool for chain-level coordination |
| **Shelter Admin** | Food bank coordinator, shelter manager, community kitchen head | Manage incoming food, set capacity and preferences | No real-time visibility into what's coming and when |
| **Shelter Coordinator** | On-ground staff accepting deliveries | Accept/decline matches, confirm receipt | Slow manual coordination via calls/WhatsApp |
| **Volunteer Driver** | Verified gig worker or NGO-attached volunteer | Know exactly where to go, in what order, when | No unified dispatch; multiple calls per pickup |
| **Platform Admin** | System operator (hackathon team / future operations team) | Verify donors, manage platform, intervene manually | No oversight layer in existing solutions |
| **Agentic Dispatcher** | Autonomous AI software agent (not a human role) | Negotiate, assign, and confirm pickups without human in the loop | No 24/7 autonomous dispatch exists today |

### 3.2 Secondary Stakeholders

These parties do not interact directly with core workflows but consume system data or are impacted by outcomes.

| Stakeholder | What They Need from the System |
|---|---|
| **Government / Health Department** | Food safety compliance logs, impact reports, verification data |
| **Corporate ESG Teams** | CO₂e avoided, meals rescued, diversion weight (for CSR/ESG reporting) |
| **Food Security Researchers** | Waste hotspot data, demand/supply patterns, timing analytics |
| **Tax Authorities** | Verifiable donation records for Section 80G / CSR claims |
| **General Public** | Live impact visibility (public dashboard) to build civic trust |

### 3.3 Indirect Beneficiaries

- **Shelter residents / food-insecure individuals** — receive rescued meals
- **Environment** — fewer emissions from food decomposing in landfills
- **Local municipalities** — lower waste management load

---

## 4. Multi-Role Access Control

### 4.1 Role Hierarchy

```
Super Admin
    └── Platform Admin
            ├── Moderator              (verify users, manage verification queue)
            └── Reporter               (read-only: analytics, impact, compliance)

Food Donor (Approved only)
    ├── Donor Admin                    (chain head office, manages sub-accounts)
    └── Donor Staff                    (branch-level, invited by Donor Admin)

Shelter / NGO (Approved only)
    ├── Shelter Admin                  (sets capacity, preferences, manages coordinators)
    └── Shelter Coordinator            (accepts/declines matches, confirms delivery)

Volunteer Driver
    ├── Verified Driver                (background-checked, full dispatch access)
    └── Casual Volunteer               (limited to manually assigned pickups only)

Observer
    ├── Government Official            (read-only compliance and safety reports)
    └── ESG Reporter                   (read-only impact dashboard and exports)
```

### 4.2 Permission Matrix

| Action | Super Admin | Platform Admin | Moderator | Donor Admin | Donor Staff | Shelter Admin | Shelter Coord. | Verified Driver | Casual Volunteer | Observer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Submit donor verification request | ✅ | ✅ | ❌ | Self | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve / reject donor verification | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Post donation listing | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit own active listing | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cancel own active listing | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete any listing (admin override) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View all listings on map | ✅ | ✅ | ✅ | Own only | Own only | ✅ | ✅ | Assigned only | Assigned only | ❌ |
| Set shelter capacity | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Set food preferences (shelter) | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Accept or decline a match | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Accept pickup assignment (driver) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Own only | ❌ |
| Mark food picked up | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Mark delivery complete | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View personal impact dashboard | ✅ | ✅ | ❌ | Own | Own | Own | Own | Own | Own | ❌ |
| View public impact dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Download tax certificate | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View waste hotspot heatmap | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View compliance / safety report | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Override agentic dispatch decision | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View agent action log | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Invite Donor Staff sub-accounts | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Invite Shelter Coordinators | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage platform settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Export all platform data | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 4.3 Authentication Rules

- **FR-AUTH-01:** All sessions use JWT tokens with role claims embedded in the payload.
- **FR-AUTH-02:** JWT access tokens expire in 1 hour; refresh tokens expire in 7 days.
- **FR-AUTH-03:** Donor Staff accounts may only be created via an invite link issued by a verified Donor Admin — no self-registration.
- **FR-AUTH-04:** Shelter Coordinators may only be created via an invite link issued by a verified Shelter Admin.
- **FR-AUTH-05:** Observer accounts (Government, ESG Reporter) are provisioned exclusively by Platform Admin — no self-service.
- **FR-AUTH-06:** Donor Admin, Shelter Admin, and Driver accounts require completing a platform-specific verification flow before any access to core features is granted (see Section 5).
- **FR-AUTH-07:** All password resets are handled via a time-limited SMTP email link (valid 30 minutes).

---

## 5. Donor Verification & Onboarding Flow

> **Core Rule:** No food business or individual entity may post a donation listing until their account has been explicitly approved by a Platform Admin or Moderator. This protects food safety, platform trust, and legal compliance.

### 5.1 Why Verification Is Required

- Ensures all listed food comes from legitimate, licensed food businesses
- Validates that the donor operates at the claimed location (preventing ghost listings)
- Creates an audit trail for food safety regulators (FSSAI compliance)
- Builds trust between shelters and donors — shelters know all donors are vetted
- Enables accurate tax certificate generation tied to a verified entity (PAN / GST)

### 5.2 Verification Flow — Step by Step

```
Step 1: Registration Request (by prospective donor)
        ↓
Step 2: Document Upload (FSSAI, GST, PAN, business address proof)
        ↓
Step 3: Admin Review Queue — admin receives email notification
        ↓
Step 4: Phone Verification — admin calls the listed business number
        ↓
Step 5: Location Verification — admin cross-checks address vs. Google Maps / FSSAI registry
        ↓
Step 6: Document Validation — admin checks FSSAI license number validity and GST active status
        ↓
Step 7: Decision
        ├── APPROVED → donor email notification → account activated → can now list food
        └── REJECTED → donor email notification → rejection reason provided → can reapply in 30 days
```

### 5.3 Registration Form (Prospective Donor)

The self-registration form must capture:

| Field | Type | Required | Notes |
|---|---|---|---|
| Business Name | Text | ✅ | Legal name as per FSSAI license |
| Business Type | Dropdown | ✅ | Restaurant / Grocery Store / Caterer / Campus Dining / Cloud Kitchen / Other |
| Contact Person Name | Text | ✅ | Owner or authorized manager |
| Contact Email | Email | ✅ | Primary email — all SMTP notifications will go here |
| Contact Phone | Phone | ✅ | Admin will call this number for phone verification |
| Business Address (full) | Text + Map Pin | ✅ | Must be pinnable on map |
| City / State / PIN | Text | ✅ | — |
| FSSAI License Number | Text | ✅ | 14-digit registration or license number |
| FSSAI License Document | PDF / Image | ✅ | Upload — must be valid and not expired |
| FSSAI Expiry Date | Date | ✅ | System flags if < 3 months to expiry |
| GST Registration Number | Text | ✅ (if applicable) | For tax certificate eligibility |
| GST Certificate | PDF | Conditional | Required if GST number provided |
| PAN Number | Text | ✅ | Required for tax certificate generation |
| Operating Hours | Time Range | ✅ | Helps admin and system understand donation availability windows |
| Avg. Daily Surplus (estimate) | Dropdown | Optional | < 5 kg / 5–20 kg / 20–50 kg / 50 kg+ |
| Why do you want to donate? | Text (200 chars) | Optional | Provides admin context |

### 5.4 Admin Verification Checklist

For each pending verification request, admin completes the following checklist in the Admin Dashboard before approving or rejecting:

```
VERIFICATION CHECKLIST — [Business Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

☐  1. FSSAI License — valid number format (14 digits)
☐  2. FSSAI License — not expired (check expiry date)
☐  3. FSSAI License — document matches the business name
☐  4. FSSAI — optionally cross-checked via FoSCoS public registry
☐  5. GST Number — valid format (15-character alphanumeric)
☐  6. GST Certificate — business name matches registration
☐  7. GST Status — active (not cancelled or suspended)
☐  8. PAN Number — valid format
☐  9. Phone Verification — admin called [phone number] on [date/time]
          Call notes: ____________________________
☐ 10. Location Verification — address mapped, pin confirmed on map
☐ 11. No duplicate account detected (same phone / FSSAI number)
☐ 12. No adverse findings in initial review

Decision:  [ APPROVE ]  [ REJECT — Reason: _________________________ ]
Verified by: [Admin Name]   Date: __________
```

### 5.5 Verification States & Email Triggers

| State | Description | Email Sent To |
|---|---|---|
| `PENDING_REVIEW` | Application submitted, awaiting admin | Admin (new application alert) |
| `UNDER_VERIFICATION` | Admin actively reviewing | Donor (acknowledgment: "We're reviewing your application") |
| `PHONE_CALL_SCHEDULED` | Admin has initiated phone contact | Donor (email: "Our team will call you at [phone] within 24 hours") |
| `APPROVED` | All checks passed | Donor (welcome email with login credentials and quick-start guide) |
| `REJECTED` | One or more checks failed | Donor (rejection email with specific reason and reapplication instructions) |
| `SUSPENDED` | Previously approved but flagged | Donor (suspension notice with reason and appeal process) |

### 5.6 Functional Requirements — Donor Verification

- **FR-VER-01:** A prospective donor cannot create any donation listing until their account status is `APPROVED`.
- **FR-VER-02:** Any attempt to access listing features with a non-approved account returns a UI message: "Your account is pending verification. You will receive an email once approved."
- **FR-VER-03:** The system sends an SMTP email to the Platform Admin and all Moderators when a new verification request is submitted.
- **FR-VER-04:** Admin can view all verification requests in a prioritized queue sorted by submission date.
- **FR-VER-05:** Admin can download uploaded documents (FSSAI, GST, PAN) directly from the verification queue.
- **FR-VER-06:** Admin must fill out the verification checklist before the approve/reject buttons become active.
- **FR-VER-07:** Admin approval email to the donor must include: login link, a quick-start guide PDF attachment, and a note about the SMTP notification system.
- **FR-VER-08:** Rejected donors may not resubmit a verification request for 30 days from the rejection date.
- **FR-VER-09:** FSSAI license expiry is tracked — system sends an SMTP reminder to donor and admin 60 days before expiry; account is auto-suspended if FSSAI lapses.
- **FR-VER-10:** Approved donor accounts are assigned a public "Verified Donor" badge on their profile.
- **FR-VER-11:** Shelter and Driver accounts go through a lighter verification (phone OTP + basic document check) but also require admin approval before listing access.

---

## 6. Core Features — MVP Priority Order

### 6.1 Phase 1 — Must Have (Hours 0–12 of sprint)

| # | Feature | Why It's P1 |
|---|---|---|
| F-01 | Donor verification request form + admin approval queue | Gate-keeps all listing activity |
| F-02 | Donation listing form (name, qty, expiry, location, photo) | Core of the platform |
| F-03 | ERS calculation on listing create + recalculation every 15 min | Drives urgency and priority |
| F-04 | Geo-matching engine (PostGIS: shelter within radius + capacity + preference) | Core matching logic |
| F-05 | Shelter accept / decline flow | Closes the match loop |
| F-06 | Driver assignment (manual first) | Enables delivery |
| F-07 | Status pipeline: `Listed → Matched → Driver Assigned → In Transit → Checklist → Delivered / Disputed` | Core tracking |
| F-08 | SMTP email notifications for all status transitions | Communication backbone |
| F-09 | Donor dashboard (active listings, ERS badges, status) | Donor-facing transparency |
| F-10 | Shelter dashboard (incoming listings sorted by ERS, capacity bar, accept/decline) | Shelter-facing transparency |
| F-11 | Driver view (assigned pickups, address, map link) | Driver-facing action |
| F-12 | Admin dashboard (verification queue, platform health, active listings map) | Operations control |

### 6.2 Phase 2 — Should Have (Hours 12–20 of sprint)

| # | Feature | Why It's P2 |
|---|---|---|
| F-13 | CV-based photo intake (LLM Vision API → auto-fills form) | Key differentiator for demo |
| F-14 | NLP free-text parser (voice / text → structured listing) | Reduces donor friction |
| F-15 | Agentic dispatcher (auto-assign when ERS > threshold or no response) | Core AI differentiator |
| F-16 | Multi-stop route optimization (OSRM + nearest-neighbor) | Logistics differentiator |
| F-17 | Shelter capacity management (real-time input, food type preferences) | Real-world readiness |
| F-18 | Public impact dashboard (live counters: meals, kg, CO₂e) | Demo visual impact |
| F-19 | ERS-escalated SMTP alerts (urgent email when ERS > 80) | Time-pressure automation |
| F-20 | Agentic dispatcher log (admin view of all autonomous decisions) | Transparency / trust |

### 6.3 Phase 3 — Nice to Have (Hours 20–24 of sprint)

| # | Feature | Why It's P3 |
|---|---|---|
| F-21 | Tax deduction certificate (auto-generated PDF) | Real-world donor value |
| F-22 | Waste hotspot heatmap | Research / admin insight |
| F-23 | Demand prediction (ML-based surplus forecasting) | Future-state innovation |
| F-24 | Donor recognition badges + gamification | Engagement / retention |
| F-25 | Driver accountability score | Quality assurance |
| F-26 | Weekly impact digest email (automated, per role) | Long-term engagement |
| F-27 | Chain-level donor analytics (multi-location donors) | Enterprise value |

---

## 7. Zero-Friction Donor Intake System

> **Design Principle:** Every second of friction in the listing process is food that ends up in a dumpster. If listing surplus feels like a task, businesses won't do it.

### 7.1 Target: Listing Completed in Under 60 Seconds

The intake system must support four channels, any one of which alone completes a listing:

### 7.2 Intake Channel 1 — Photo-First (CV-Powered) *(Primary Recommended)*

**Functional Requirements:**

- **FR-INTAKE-01:** A "Donate Now" button is the most prominent element on the donor dashboard and home screen.
- **FR-INTAKE-02:** Tapping "Donate Now" opens the camera or file picker as the first action — no form shown first.
- **FR-INTAKE-03:** Uploaded photo is sent to the CV module (see Section 11) which returns: food category, quantity estimate, and recommended safe window.
- **FR-INTAKE-04:** System pre-fills the listing form with CV output. Donor sees a pre-completed form, not a blank one.
- **FR-INTAKE-05:** Donor can adjust any CV-filled field before confirming.
- **FR-INTAKE-06:** A single "Confirm & List" button submits the listing — no multi-step wizard.
- **FR-INTAKE-07:** If CV confidence < 0.65, fields are left blank with a hint but the form still opens — the donor is never blocked by low CV confidence.
- **FR-INTAKE-08:** Total time from "Donate Now" tap to listing going live must be ≤ 45 seconds for the happy path.

**UX Flow:**
```
Donor taps "Donate Now"
    → Camera / file picker opens immediately
    → Donor takes photo
    → Spinner: "Identifying food..." (~2 seconds)
    → Form appears: pre-filled with "Biryani · ~20 servings · Safe window: 4 hrs"
    → Donor adjusts quantity if needed
    → Taps "Confirm & List"
    → Listing is live — confirmation screen shows ERS badge and "We're matching you now"
```

### 7.3 Intake Channel 2 — Quick Form (Manual, No Photo)

- **FR-INTAKE-09:** Donor can choose "Skip Photo" and fill a minimal form: food name (text), quantity (number + unit), expiry time (time picker), and pickup location (pre-filled from their registered address, adjustable).
- **FR-INTAKE-10:** "My Usual Surplus" template: donors can save up to 5 frequently donated items. Re-listing a template requires only confirming the expiry time.
- **FR-INTAKE-11:** "Same as Last Time" button appears on the dashboard when the donor's last listing was within the past 7 days — pre-fills everything except expiry time.
- **FR-INTAKE-12:** Quantity input uses a plain number field plus a unit dropdown (portions / trays / kg / boxes / litres) — no complicated volume calculators.
- **FR-INTAKE-13:** Pickup location defaults to the donor's verified registered address; donor can add a one-line note (e.g., "use back entrance, call on arrival").

### 7.4 Intake Channel 3 — NLP Text Parsing

- **FR-INTAKE-14:** A text field on the listing screen accepts free-form natural language: e.g., *"3 trays biryani and 2 pots dal, safe till 9pm"*.
- **FR-INTAKE-15:** On submission, text is passed to the NLP parser (see Section 15). Parser returns structured data that auto-fills the form.
- **FR-INTAKE-16:** Voice input is supported via the browser's Web Speech API — spoken words are transcribed and passed to the NLP parser.
- **FR-INTAKE-17:** NLP parser output is always shown to donor for review before listing is confirmed; auto-submission without review is not permitted.

### 7.5 Intake Channel 4 — Email-to-Listing (SMTP Inbound)

- **FR-INTAKE-18:** Each verified donor is assigned a unique inbound email address (e.g., `donor-[id]@annasetu.in`).
- **FR-INTAKE-19:** Donor emails their surplus description to this address — subject line or body text is parsed by the NLP module.
- **FR-INTAKE-20:** System creates a draft listing and emails the donor a confirmation link: "Your listing draft is ready — tap to confirm and it goes live."
- **FR-INTAKE-21:** Donor must click the confirmation link — no listing goes live from email without an explicit confirmation step.

### 7.6 Listing Post-Submission Experience

- **FR-INTAKE-22:** Immediately after listing, donor sees: ERS badge, a "Your listing is live — we're matching now" message, and an estimated time to match based on nearby shelter density.
- **FR-INTAKE-23:** A trust signal is shown: "X pickups successfully completed near you this week" — reduces donor anxiety about food being wasted anyway.
- **FR-INTAKE-24:** Listing confirmation email is sent immediately via SMTP with listing summary, ERS, and a tracking link.

---

## 8. Expiry Risk Scoring Engine

> **Purpose:** Convert the vague "food expires soon" problem into a concrete, actionable 0–100 urgency number that drives behavior across all roles, dashboards, and the agentic dispatcher.

### 8.1 ERS Formula

```
ERS = min(100, base_risk × category_multiplier + adjustment_factors)

Where:
  base_risk = (1 - time_remaining / max_safe_window) × 100
  time_remaining = expiry_time - now  (in hours)
  max_safe_window = lookup by food_category (see Table 8.2)
```

### 8.2 Food Category Safe Windows & Multipliers

| Food Category | Max Safe Window (unrefrigerated) | Risk Multiplier | Examples |
|---|---|---|---|
| Cooked meat / fish | 2 hours | 2.0× | Grilled chicken, fish curry, kebabs |
| Dairy-based dishes | 3 hours | 1.8× | Paneer dishes, raita, kheer |
| Cooked rice dishes / curries | 4 hours | 1.5× | Biryani, dal, rajma, sabzi |
| Cooked pasta / noodles | 4 hours | 1.4× | Pasta, noodles, fried rice |
| Soups / broths | 4 hours | 1.4× | Lentil soup, clear broth |
| Baked goods / bread | 8 hours | 1.0× | Roti, bread, buns, cakes |
| Fresh produce | 12 hours | 0.8× | Fruit salad, cut vegetables |
| Packaged / sealed items | 24+ hours | 0.5× | Unopened packets, canned goods |
| Beverages (opened) | 6 hours | 0.9× | Juices, cold drinks (opened) |

### 8.3 Adjustment Factors

| Condition | ERS Adjustment |
|---|---|
| Donor did not specify refrigeration availability | +10 |
| Outdoor temperature > 35°C (from OpenWeatherMap API) | +12 |
| Outdoor temperature > 40°C | +20 |
| Shelter has already confirmed match | −10 |
| Driver is actively en route (In Transit status) | −20 |
| Listing was posted by a donor with > 10 prior successful donations | −5 |
| Food is refrigerated (donor confirmed) | −15 |

### 8.4 ERS Alert Thresholds & System Responses

| Score Range | Color Label | System Action |
|---|---|---|
| 0–30 | 🟢 Safe | Normal matching flow; no escalation |
| 31–60 | 🟡 Moderate | Notify matched shelter via email; highlight in shelter dashboard |
| 61–80 | 🟠 Urgent | Broaden geo-search radius; email all shelters within 10 km |
| 81–95 | 🔴 Critical | Agentic dispatcher activates; escalation email sent to donor and admin |
| 96–100 | ⚫ Expiring | Listing auto-cancelled; waste event logged; admin email alert |

### 8.5 Functional Requirements — ERS Engine

- **FR-ERS-01:** ERS is calculated immediately when a listing is created.
- **FR-ERS-02:** ERS is recalculated every 15 minutes for all active listings via a background cron job.
- **FR-ERS-03:** ERS is recalculated immediately when a listing's status changes (match accepted, driver assigned, etc.).
- **FR-ERS-04:** ERS score and color badge are displayed on every listing card in every dashboard view.
- **FR-ERS-05:** Shelter dashboard sorts incoming listings by ERS descending by default.
- **FR-ERS-06:** When ERS crosses 81 (Critical threshold), an SMTP escalation email is sent to the donor and to Platform Admin within the next recalculation cycle (≤ 15 minutes).
- **FR-ERS-07:** When ERS reaches 96 (Expiring threshold), the listing is automatically cancelled, a waste event is logged with timestamp and reason, and an SMTP alert is sent to Platform Admin.
- **FR-ERS-08:** Historical ERS at time of match is stored per listing — this data feeds the admin analytics dashboard.
- **FR-ERS-09:** The ERS formula, category table, and thresholds are configurable by Super Admin without a code deployment.

---

## 9. AI-Powered Matching Engine

### 9.1 Matching Objective

For each active listing, identify the best-fit shelter from all registered and capacity-available shelters within the search radius, and notify them with an accept/decline decision window.

### 9.2 Match Score Formula

```
Match Score (0–1) =
    (distance_score     × 0.30) +
    (capacity_score     × 0.25) +
    (preference_score   × 0.25) +
    (reliability_score  × 0.10) +
    (urgency_weight     × 0.10)
```

**Distance Score:**
```
distance_score = max(0, 1 - (distance_km / max_radius_km))
Initial max_radius = 5 km. Expands to 10 km on first fallback, 15 km on second.
```

**Capacity Score:**
```
If listing.quantity_kg > shelter.available_capacity_kg → shelter is excluded entirely
Otherwise: capacity_score = shelter.available_capacity_kg / shelter.max_capacity_kg
```

**Preference Score:**
```
If any hard preference is violated (e.g., vegetarian-only shelter, non-veg listing) → excluded
Otherwise: preference_score = 1.0 (binary: compatible or not)
```

**Reliability Score:**
```
reliability_score = shelter.accepted_deliveries / shelter.total_matches_offered
New shelters: default = 0.70
```

**Urgency Weight (ERS-based):**
```
If ERS >= 80: match is routed to the fastest shelter regardless of score rank
Otherwise: urgency_weight = ERS / 100
```

### 9.3 Matching Cascade (Fallback Logic)

```
Trigger: new listing created OR ERS crosses 61 threshold

Round 1: Match within 5 km → top-scored shelter notified → 10-min response window
         ↓ (if declined or no response)
Round 2: Second-ranked shelter within 5 km → 5-min window
         ↓ (if declined or no response)
Round 3: Expand to 10 km → best match → 5-min window
         ↓ (if still no match)
Round 4 (ERS ≥ 80): Agentic Dispatcher takes over → auto-confirms next available shelter
         ↓ (if no shelter in 15 km)
Round 5: Admin alert via SMTP → "Listing needs manual intervention" flag on dashboard
```

### 9.4 Functional Requirements — Matching Engine

- **FR-MATCH-01:** Matching runs within 30 seconds of a new listing being created.
- **FR-MATCH-02:** Geo-matching uses PostGIS `ST_DWithin` for efficient spatial querying.
- **FR-MATCH-03:** Shelters with `available_capacity_kg = 0` are excluded from all match queries.
- **FR-MATCH-04:** Hard preference violations (e.g., vegetarian-only) are an absolute exclusion — not a score reduction.
- **FR-MATCH-05:** When a shelter declines, the system logs the reason (optional field for shelter: capacity change / food type / already full) and moves immediately to the next candidate.
- **FR-MATCH-06:** Match scores are stored per match attempt for analytics.
- **FR-MATCH-07:** A listing can only have one active match at a time — concurrent matches are prevented.
- **FR-MATCH-08:** When ERS ≥ 80 and no shelter has accepted after Round 2, the system flags this to the agentic dispatcher and does not wait for the full cascade.

---

## 10. Agentic Dispatcher

> An autonomous software agent that monitors the platform and takes time-critical dispatch actions without requiring human intervention — 24/7.

### 10.1 What the Agentic Dispatcher Is

The agentic dispatcher is a scheduled background service (not a chatbot, not a manual tool) that perceives system state, reasons about optimal actions, and executes dispatch decisions when human response time is insufficient. Every decision is logged with its reasoning for admin review and override.

### 10.2 Trigger Conditions

The agent activates for a listing when any of the following are true:

| Trigger | Condition | Priority |
|---|---|---|
| T-1 | ERS ≥ 75 and no shelter has accepted | High |
| T-2 | Listing has been live > 20 minutes without a match acceptance | Medium |
| T-3 | Shelter accepted but no driver has accepted within 15 minutes | High |
| T-4 | Driver cancels mid-route | Critical — immediate re-dispatch |
| T-5 | After-hours operation (no admin online) and ERS ≥ 60 | Medium |

### 10.3 Agent Perception → Reason → Act Loop

```
PERCEIVE:
  - Read all active listings with ERS status
  - Read all available drivers (location, capacity, current assignments)
  - Read all shelters (capacity, preferences, historical reliability)
  - Read pending matches awaiting response

REASON:
  - For each triggered listing, compute optimal (shelter, driver) pair
  - Rank options by: match score + driver ETA + driver route efficiency
  - Identify if current cascade round supports auto-confirmation

ACT:
  Action A — Auto-confirm shelter (when match cascade rounds exhausted)
    → Send SMTP email: "Auto-confirmed: [Shelter Name] — you have [X] minutes to opt out"
    → Opt-out window: 5 minutes
    → Log: {listing_id, shelter_id, reason, timestamp, was_auto}

  Action B — Assign driver
    → Send SMTP email to driver: "Urgent pickup assigned — [address] — ERS [X]"
    → If driver does not respond within 10 minutes → assign next available driver
    → Log: {listing_id, driver_id, action, timestamp}

  Action C — Re-dispatch (driver cancelled)
    → Immediately re-run driver selection excluding cancelled driver
    → Notify donor via SMTP: "Your driver changed — [new driver name] is on the way"
    → Log: {listing_id, previous_driver_id, new_driver_id, reason: 'cancellation'}

MONITOR:
  - Track driver GPS ping (if available) or status self-reports
  - If listing reaches ERS 96 with no pickup: auto-cancel, log waste event
```

### 10.4 Agent Decision Log (stored per action)

```json
{
  "agent_log_id": "uuid",
  "timestamp": "2025-01-15T14:32:00Z",
  "trigger": "ERS ≥ 75 — no shelter accepted after 15 min",
  "listing_id": "uuid",
  "listing_ers": 82,
  "action_type": "AUTO_CONFIRM_SHELTER",
  "selected_shelter_id": "uuid",
  "selected_shelter_name": "Hope Shelter",
  "match_score": 0.87,
  "reasoning": "Closest shelter (1.2 km) with 55 kg available capacity, vegetarian-compatible, reliability 0.91. No other shelter within 5 km has responded.",
  "email_sent_to": "hope.shelter@email.com",
  "opt_out_window_minutes": 5,
  "was_overridden_by_admin": false,
  "override_admin_id": null
}
```

### 10.5 Functional Requirements — Agentic Dispatcher

- **FR-AGENT-01:** Agent runs as a scheduled cron job every 2 minutes.
- **FR-AGENT-02:** All agent actions are logged to the `agent_logs` table with full reasoning.
- **FR-AGENT-03:** Admin can view the complete agent log on the Admin Dashboard, sorted by timestamp descending.
- **FR-AGENT-04:** Admin can override any agent action (cancel auto-assignment, reassign manually) at any time.
- **FR-AGENT-05:** Auto-confirmed shelter receives an SMTP email with an explicit opt-out option (reply with "DECLINE" or click a decline link) within a 5-minute window.
- **FR-AGENT-06:** Auto-confirmed shelters that opt out are excluded from agent re-selection for that listing.
- **FR-AGENT-07:** Agent never cancels an active listing or marks food as waste — that action requires either ERS reaching 96 or explicit admin action.
- **FR-AGENT-08:** When the agent re-dispatches due to driver cancellation, a new SMTP email is sent to the donor within 2 minutes of the cancellation event.
- **FR-AGENT-09:** Agent decisions that result in food waste (no pickup possible) trigger an immediate SMTP alert to Platform Admin.

---

## 11. CV-Based Intake (Computer Vision)

### 11.1 Purpose

Allow donors to list food by simply photographing it — the system identifies the food, estimates quantity, and fills the listing form automatically.

### 11.2 CV Module Inputs and Outputs

| Input | CV Output | Used For |
|---|---|---|
| Food photo | Food category label (e.g., "cooked rice dish") | Pre-fills food type, sets safe window |
| Food photo | Estimated servings / quantity (e.g., "~20 servings", "2 large pans") | Pre-fills quantity |
| Food photo | Safety concern flag (visible mold, obvious spoilage) | Warns donor; flags for admin review |
| Food photo | Confidence score (0–1) | Determines whether to pre-fill or show blank fields with hint |

### 11.3 Implementation Approach

**Recommended: Multimodal LLM API (GPT-4o or Gemini Vision)**

System prompt for the CV API call:
```
You are a food safety intake assistant for a food donation platform in India.
Analyze the provided food image and return ONLY valid JSON in this exact format:
{
  "food_category": "string — one of: cooked_meat_fish, dairy_dish, cooked_rice_curry,
                   cooked_pasta, soup_broth, baked_bread, fresh_produce,
                   packaged_sealed, beverage_opened, unknown",
  "food_name_suggested": "string — common name for the food visible (e.g., 'Biryani')",
  "estimated_servings": integer — number of individual portions visible or inferable,
  "portion_description": "string — natural description (e.g., '2 hotel pans, approx 20 servings')",
  "appears_refrigerated": boolean,
  "safety_concern_detected": boolean,
  "safety_concern_description": "string or null",
  "confidence": float (0.0 to 1.0)
}
Return ONLY the JSON object. No explanation, no markdown.
```

**Fallback Option:** Google Cloud Vision API → label detection → map to food categories.

### 11.4 Functional Requirements — CV Module

- **FR-CV-01:** Photo upload is accepted in JPEG, PNG, or HEIC format; files are compressed client-side to < 2 MB before upload.
- **FR-CV-02:** CV API call must complete within 5 seconds; a loading spinner with "Identifying food…" is shown.
- **FR-CV-03:** If CV confidence ≥ 0.65: pre-fill form fields; show confidence badge ("AI identified: Biryani · 87% confident").
- **FR-CV-04:** If CV confidence < 0.65: open form with blank or partial fields; show hint "We couldn't identify this clearly — please fill in the details."
- **FR-CV-05:** `safety_concern_detected = true` triggers a yellow warning banner: "This food may have a safety concern. Please verify it is safe to donate before confirming." The listing is still allowed but a flag is stored.
- **FR-CV-06:** Admin can see safety-flagged listings in a dedicated filter on the Admin Dashboard.
- **FR-CV-07:** Donor can always override any CV-filled field before confirming.
- **FR-CV-08:** The original photo is stored (Cloudinary or S3) and linked to the listing record.
- **FR-CV-09:** CV is not mandatory — donors can skip photo and proceed with manual input at any time.
- **FR-CV-10:** CV output (food_category, confidence) is stored with the listing for analytics and model improvement.

---

## 12. Multi-Stop Route Optimization

### 12.1 Problem Statement

Without optimization, a driver assigned to three pickups within 1 km of each other may be routed inefficiently — travelling back and forth — wasting time and increasing the chance of ERS hitting critical before pickup. One optimized route covers multiple donors and one or more drop-offs.

### 12.2 Route Optimization Scope

- **Inputs:** List of pickup locations (donor addresses), list of delivery locations (shelter addresses), driver start location, driver vehicle capacity (kg), time windows per stop (based on ERS)
- **Constraint:** A delivery stop cannot be visited before all its associated pickups are completed
- **Objective:** Minimize total route distance (or time) while respecting time windows and vehicle capacity
- **Scale:** Up to 8 stops per driver per route (practical hackathon scope)

### 12.3 Optimization Algorithm

**Step 1 — Bundle nearby listings**

When a driver is assigned a pickup, the system checks: Are there other `Listed` or `Matched` listings within 2 km that also need pickup within the next 2 hours? If yes, propose bundling.

**Step 2 — Build distance matrix**

Use OSRM's `/table` endpoint (free, no API key needed):
```
GET http://router.project-osrm.org/table/v1/driving/
    [lng1,lat1;lng2,lat2;lng3,lat3;lng4,lat4]
    ?sources=0&annotations=duration,distance
```

This returns a real-road distance/time matrix between all stops.

**Step 3 — Solve routing (Nearest Neighbor Heuristic)**

```python
def optimize_route(stops, distance_matrix, constraints):
    route = [driver_start]
    unvisited_pickups = [s for s in stops if s.type == 'pickup']
    unvisited_deliveries = [s for s in stops if s.type == 'delivery']
    
    while unvisited_pickups or unvisited_deliveries:
        # Prioritize pickups by ERS (highest first)
        eligible = [s for s in unvisited_pickups if s.ers >= 70] or unvisited_pickups
        
        # Among eligible, pick nearest to current position
        next_stop = min(eligible, key=lambda s: distance_matrix[route[-1]][s])
        route.append(next_stop)
        unvisited_pickups.remove(next_stop)
        
        # After all pickups, add deliveries
        if not unvisited_pickups:
            for delivery in unvisited_deliveries:
                route.append(delivery)
            break
    
    return route
```

**Advanced (if time permits):** Google OR-Tools `pywrapcp.RoutingModel` — solves full CVRP with time windows in < 1 second for ≤ 20 stops.

### 12.4 Driver-Facing Route Display

```
YOUR ROUTE — 3 stops · 8.4 km · Est. 35 min
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📦 PICKUP  1  MG Road Dhaba
             Biryani × 20  |  ERS 🔴 87  |  5 min away
             [Mark Picked Up]  [Navigate to Stop 1]

  📦 PICKUP  2  City Bakery
             Bread × 30    |  ERS 🟡 42  |  2.1 km
             [Navigate to Stop 2]

  🏠 DELIVER 3  Hope Shelter
             All items                   |  3.2 km
             [Mark Delivered]  [Navigate to Shelter]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Open Full Route in Google Maps]   [I Need Help]
```

### 12.5 Functional Requirements — Route Optimization

- **FR-ROUTE-01:** When a driver is assigned their first pickup, the system checks for bundling opportunities within 2 km and a 2-hour window.
- **FR-ROUTE-02:** Driver is shown bundling suggestions ("2 more pickups nearby — add them to your route?") with ERS badges for each.
- **FR-ROUTE-03:** Route is computed using real road distances (OSRM) not straight-line Euclidean distance.
- **FR-ROUTE-04:** Route respects the hard constraint: delivery cannot be visited before the associated pickups.
- **FR-ROUTE-05:** Pickup stops are ordered with highest-ERS pickups first when time windows are similar.
- **FR-ROUTE-06:** Driver receives a "Navigate" button for each stop that deep-links to Google Maps with the destination pre-filled.
- **FR-ROUTE-07:** Driver can mark each stop as complete individually ("Mark Picked Up", "Mark Delivered") — full route completion is not required in one action.
- **FR-ROUTE-08:** If driver deviates significantly from the route, the system flags this on the Admin Dashboard (future enhancement; noted but not required for MVP).

---

## 13. Delivery Receipt & Food Acceptance Checklist

> **Purpose:** Ensure every food delivery received by a shelter/NGO volunteer is physically verified at the point of handover — protecting food safety, validating donor accuracy, and enforcing accountability across the platform.

### 13.1 Overview

When a driver arrives at a shelter and the food is being handed over, the **Shelter Coordinator or Shelter Volunteer** (collectively referred to as the "receiving volunteer") must complete a mandatory 5-point Food Acceptance Checklist on the AnnaSetu platform before the delivery can be marked as "Delivered." The checklist confirms that the food received matches what was listed by the donor, is in acceptable condition, and that the handover is authenticated via a donor-generated PIN.

No delivery can transition to `Delivered` status without checklist completion. A driver cannot unilaterally mark a delivery complete — the final confirmation requires the shelter side to complete and submit this checklist.

---

### 13.2 The 5-Point Food Acceptance Checklist

The checklist is presented to the receiving volunteer on their mobile/web interface when the driver taps "I Have Arrived at Shelter." Each item must be explicitly checked (Yes / No / Issue Found) before submission.

```
┌──────────────────────────────────────────────────────────────────┐
│  🍱 FOOD ACCEPTANCE CHECKLIST                                     │
│  Delivery: Biryani × 20 from MG Road Dhaba                       │
│  Driver: Priya S.  |  Arrived: 10:42 AM                          │
│  Donor PIN: [ _ _ _ _ ]  ← Enter PIN provided by donor           │
│──────────────────────────────────────────────────────────────────│
│                                                                   │
│  ☐  1. FOOD QUANTITY ACCURATE                                     │
│        Is the quantity received the same as listed on the app?    │
│        Listed: 20 portions                                        │
│        Received: [ ______ ] portions  (enter actual count)        │
│        ○ Yes — matches listing                                    │
│        ○ No — quantity is different (describe below)              │
│                                                                   │
│  ☐  2. FOOD ITEMS CORRECT                                         │
│        Are the food items received the same type as listed?       │
│        Listed: Biryani                                            │
│        ○ Yes — items match                                        │
│        ○ No — different items received (describe below)           │
│                                                                   │
│  ☐  3. CONTAINER / PACKAGING CONDITION                            │
│        Are all containers/packaging intact, sealed, and undamaged?│
│        ○ Yes — all containers are in good condition               │
│        ○ No — damaged, leaking, or open containers found          │
│                                                                   │
│  ☐  4. VISIBLE CONDITION OF FOOD                                  │
│        Does the food appear safe, fresh, and suitable for serving?│
│        (Check for: unusual color, smell, mold, spoilage)          │
│        ○ Yes — food looks safe and acceptable                     │
│        ○ No — food appears unsafe or spoiled                      │
│                                                                   │
│  ☐  5. DONOR PIN CONFIRMATION                                     │
│        Enter the 4-digit PIN provided by the donor at pickup:     │
│        [ _ _ _ _ ]                                                │
│        ○ PIN verified ✅                                           │
│        ○ PIN incorrect or not provided ❌                          │
│                                                                   │
│  NOTES (optional): ___________________________________________    │
│                                                                   │
│  [ ACCEPT DELIVERY ✅ ]        [ REJECT DELIVERY ❌ ]             │
│                                                                   │
│  * All 5 items must be checked to enable Accept or Reject.        │
└──────────────────────────────────────────────────────────────────┘
```

---

### 13.3 Donor PIN System

To authenticate the physical handover, each confirmed listing generates a unique **4-digit Donor PIN** that:

- Is generated automatically when a listing's status changes to `Driver Assigned`
- Is visible only to the **verified donor** (shown prominently on their Donor Dashboard under the active listing)
- Is communicated by the donor to the driver at the point of pickup (verbally or via the app's chat/note feature)
- Must be entered by the **shelter volunteer** on the checklist screen to confirm the food chain of custody

The PIN serves as a lightweight chain-of-custody token — it proves that the food the driver delivers came from the correct donor pickup, not a substitution or counterfeit handover.

**PIN Display on Donor Dashboard:**
```
  ACTIVE LISTING — Biryani × 20
  Status: Driver Assigned — Priya S. en route
  ┌─────────────────────────────────────┐
  │  🔐 Donor Handover PIN:  7 4 2 9   │
  │  Share this PIN with the driver     │
  │  when food is picked up.            │
  └─────────────────────────────────────┘
```

---

### 13.4 Checklist Outcomes

#### Outcome A — All Checks Pass → Accept Delivery

If all 5 checklist items are confirmed (Yes) and the PIN is verified:
- Volunteer taps **"Accept Delivery ✅"**
- Listing status transitions to `Delivered`
- Impact metrics are calculated (meals rescued, kg diverted, CO₂e avoided)
- SMTP email sent to donor: "Your food has been received and accepted — [X] meals rescued!"
- SMTP email sent to driver: "Delivery confirmed — great work!"
- Tax certificate generation is triggered
- No violation recorded against the donor

---

#### Outcome B — One or More Checks Fail → Reject Delivery

If any checklist item is marked "No" (quantity mismatch, wrong items, damaged packaging, unsafe food appearance, or PIN failure):
- Volunteer taps **"Reject Delivery ❌"** and must provide a brief reason/description
- The system records a **Discrepancy Event** against the donor's record
- Listing status transitions to `Disputed` (new status)
- Platform Admin is notified immediately via SMTP: "[Dispute] Delivery rejected at [Shelter Name] — Listing [ID] — Donor: [Name]"
- The system then checks the donor's **violation history** and applies the appropriate response (see Section 13.5)

---

### 13.5 Donor Violation Policy

The platform enforces a progressive accountability policy for donors whose food fails the acceptance checklist. The violation counter tracks **confirmed discrepancy events** per donor account.

#### First Violation — Warning

**Trigger:** Donor's first checklist rejection (discrepancy confirmed by shelter volunteer).

**System Response:**
1. A formal **Warning Email** is sent to the donor immediately via SMTP
2. A warning flag is added to the donor's profile (visible to Admin only)
3. The listing is marked `Disputed — First Warning Issued`
4. Admin is notified to review the dispute and decide if any food rescue is still possible
5. The donor's violation count is incremented to 1

**Warning Email to Donor:**
```
Subject: ⚠️ Important Notice — Discrepancy Reported for Your Listing

Hi [Donor Name],

We're writing to inform you that a discrepancy was reported by the receiving
volunteer at [Shelter Name] for your recent donation.

  Listing: [Food Name] × [Quantity]
  Date: [Date]
  Reported Issue: [Reason from volunteer checklist]

This is a formal first warning. Our platform requires that food listed on
AnnaSetu matches what is actually donated in terms of quantity, type, and
condition. Accurate listings build trust and ensure shelters can plan
their meals effectively.

Please review your listing practices and ensure:
  • Quantities listed match what you actually have
  • Food type and items are correctly described
  • Food is in safe and acceptable condition before pickup
  • Packaging is intact and suitable for transport

No further action is required from you at this time. However, a second
discrepancy will result in permanent removal of your account from the
AnnaSetu platform.

If you believe this report is incorrect, please reply to this email
with your explanation within 7 days. Our team will review.

— The AnnaSetu Trust & Safety Team
```

---

#### Second Violation — Account Removal

**Trigger:** Donor's second checklist rejection (any subsequent confirmed discrepancy after the first warning).

**System Response:**
1. Donor account status is immediately set to `Suspended` (blocking all listing activity)
2. Admin receives a Priority SMTP alert to review and confirm permanent removal
3. Admin confirms → account status is updated to `Removed` → donor is locked out of the platform
4. A **Removal Notification Email** is sent to the donor
5. All active listings by this donor are cancelled immediately
6. Any pending matches for this donor's listings are cancelled and shelters are notified
7. The removal is logged in the platform's compliance record

**Removal Email to Donor:**
```
Subject: 🚫 Your AnnaSetu Account Has Been Removed

Hi [Donor Name],

Following a second confirmed discrepancy report against your account,
your access to AnnaSetu has been permanently removed in accordance
with our Donor Accountability Policy.

  First Incident: [Date] — [Brief reason]
  Second Incident: [Date] — [Brief reason]

AnnaSetu exists to build trust between food donors and the shelters
that depend on accurate, safe donations. Repeated discrepancies
undermine this trust and put food safety at risk for vulnerable
communities.

This decision is final. You may not create a new account on AnnaSetu.

If you believe this decision was made in error, you may submit a
formal appeal to: appeals@annasetu.in within 14 days. Appeals are
reviewed by a panel of two admins and are final.

Thank you for your past contributions to the platform.

— The AnnaSetu Trust & Safety Team
```

---

### 13.6 Edge Cases & Special Rules

| Scenario | System Behaviour |
|---|---|
| Shelter volunteer forgets/loses PIN | Volunteer can tap "PIN not available" — dispute is logged but Admin can manually override after reviewing evidence (photos, driver notes) |
| Minor quantity variation (≤ 10% difference) | System flags it but auto-suggests "Accept with note" — Admin reviews; not automatically treated as a violation |
| Food partially acceptable (some items OK, some spoiled) | Volunteer can do partial acceptance — accept the safe items, reject the spoiled ones. Only the rejected portion triggers a discrepancy review |
| Driver substituted food without donor knowledge | Discrepancy recorded against the **driver** (not the donor) — Admin investigates; driver accountability score is reduced |
| Donor disputes the volunteer's report | Donor has 7 days to contest via email; Admin reviews checklist evidence and photos; Admin decision is final |
| New restaurant / first-time donor with checklist failure | First violation = warning (same policy — no special grace period for first-time donors beyond the standard first-warning rule) |
| Donor's FSSAI-verified account is removed | Platform Admin flags FSSAI removal in compliance record; does not notify FSSAI directly (future integration) |

---

### 13.7 Checklist Data Model

```sql
-- Food acceptance checklist records
CREATE TABLE delivery_checklists (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id               UUID REFERENCES deliveries(id) NOT NULL,
  listing_id                UUID REFERENCES listings(id) NOT NULL,
  shelter_id                UUID REFERENCES shelters(id) NOT NULL,
  donor_id                  UUID REFERENCES donors(id) NOT NULL,
  completed_by_user_id      UUID REFERENCES users(id) NOT NULL,  -- shelter volunteer
  completed_at              TIMESTAMPTZ DEFAULT NOW(),

  -- Checklist Items
  quantity_accurate         BOOLEAN NOT NULL,
  quantity_listed           NUMERIC(8,2) NOT NULL,
  quantity_received         NUMERIC(8,2) NOT NULL,
  quantity_notes            TEXT,

  food_items_correct        BOOLEAN NOT NULL,
  food_items_notes          TEXT,

  packaging_condition_ok    BOOLEAN NOT NULL,
  packaging_notes           TEXT,

  food_visible_condition_ok BOOLEAN NOT NULL,
  food_condition_notes      TEXT,

  donor_pin_verified        BOOLEAN NOT NULL,

  -- Overall outcome
  overall_result            TEXT NOT NULL CHECK (overall_result IN (
                              'accepted', 'rejected', 'partial_acceptance', 'disputed'
                            )),
  rejection_reason          TEXT,
  volunteer_notes           TEXT,

  -- Violation tracking
  discrepancy_recorded      BOOLEAN DEFAULT FALSE,
  discrepancy_type          TEXT CHECK (discrepancy_type IN (
                              'quantity_mismatch', 'wrong_items', 'packaging_damaged',
                              'food_unsafe', 'pin_failure', 'multiple'
                            )),
  violation_number          INTEGER  -- 1 = first warning, 2 = removal
);

-- Donor violation log
CREATE TABLE donor_violations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id              UUID REFERENCES donors(id) NOT NULL,
  checklist_id          UUID REFERENCES delivery_checklists(id) NOT NULL,
  listing_id            UUID REFERENCES listings(id) NOT NULL,
  violation_number      INTEGER NOT NULL,  -- 1 or 2
  violation_type        TEXT NOT NULL,
  action_taken          TEXT NOT NULL CHECK (action_taken IN ('warning_issued', 'account_removed')),
  admin_reviewed_by     UUID REFERENCES users(id),
  admin_reviewed_at     TIMESTAMPTZ,
  donor_contested       BOOLEAN DEFAULT FALSE,
  contest_outcome       TEXT CHECK (contest_outcome IN ('upheld', 'overturned', 'pending')),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 13.8 Functional Requirements — Delivery Checklist

- **FR-CHECK-01:** The 5-point checklist must be completed by the shelter volunteer before the delivery status can be changed to `Delivered` or `Disputed`. The driver cannot change the status to `Delivered` unilaterally.
- **FR-CHECK-02:** A unique 4-digit Donor PIN is generated automatically when a listing's status changes to `Driver Assigned` and is displayed only to the verified donor on their dashboard.
- **FR-CHECK-03:** The Donor PIN must be entered correctly on the checklist for `donor_pin_verified` to be marked `true`. If entered incorrectly, the volunteer is prompted to re-enter up to 3 times before a PIN failure is flagged.
- **FR-CHECK-04:** All 5 checklist items must be explicitly responded to (Yes / No / Issue Found) before the "Accept Delivery" or "Reject Delivery" buttons become active.
- **FR-CHECK-05:** If all 5 items are confirmed affirmatively, only the "Accept Delivery" button is highlighted; the "Reject" button remains available but secondary.
- **FR-CHECK-06:** If any item is flagged as an issue, the volunteer must provide a written description (minimum 10 characters) before submission.
- **FR-CHECK-07:** On acceptance, the system immediately triggers impact calculation and sends SMTP confirmation emails to donor, driver, and shelter.
- **FR-CHECK-08:** On rejection, the system immediately creates a `donor_violations` record, determines the violation number, and dispatches the appropriate SMTP email (warning or removal) to the donor within 5 minutes.
- **FR-CHECK-09:** A **first violation** triggers a warning email to the donor and a priority notification to Platform Admin; the donor's account remains active.
- **FR-CHECK-10:** A **second (or subsequent) violation** triggers immediate account suspension, a Platform Admin alert for confirmation, and — upon admin confirmation — permanent account removal and cancellation of all active listings.
- **FR-CHECK-11:** A quantity variance of ≤ 10% between listed and received quantity is flagged as a note but does not automatically trigger a discrepancy — the shelter volunteer has the discretion to accept with a note.
- **FR-CHECK-12:** All checklist submissions (accepted or rejected) are stored permanently in `delivery_checklists` for compliance audit purposes.
- **FR-CHECK-13:** Admin can view all checklist records, filter by outcome (accepted / rejected / disputed), and review discrepancy details from the Admin Dashboard.
- **FR-CHECK-14:** Donors can view their own checklist history (accepted deliveries only) from their Donor Dashboard — they cannot see the detailed rejection notes unless a violation was recorded against them.
- **FR-CHECK-15:** The system prevents double-submission of a checklist for the same delivery — idempotent submission is enforced.

---

## 14. Notification System (Email via SMTP)

> **Scope:** All platform notifications are delivered exclusively via email using SMTP. No SMS, no push notifications, no in-app pop-ups in the MVP. Every role's email is their primary notification channel.

### 14.1 SMTP Configuration

| Parameter | Value |
|---|---|
| Protocol | SMTP with STARTTLS |
| Port | 587 (STARTTLS) or 465 (SSL) |
| Auth | SMTP username + password (app-specific password recommended) |
| From Address | `noreply@annasetu.in` (or equivalent) |
| Reply-To | `support@annasetu.in` |
| Provider Options | Gmail SMTP (free, 500/day) · SendGrid SMTP relay · Resend · Mailgun |
| Queue | Async job queue (BullMQ) — emails are queued, not sent synchronously |
| Retry Policy | 3 retries with exponential backoff on delivery failure |
| Bounce Handling | Log failed deliveries; flag user account if email bounces 3 times |

### 14.2 Complete Notification Event Matrix

| Event | Recipient | Subject Line | Priority |
|---|---|---|---|
| Verification request submitted | Admin / Moderator | `[Action Required] New donor verification: [Business Name]` | High |
| Verification: Under Review | Donor | `Your application is under review — AnnaSetu` | Medium |
| Verification: Phone Call Scheduled | Donor | `We'll call you within 24 hours — [Phone Number]` | Medium |
| Verification: Approved | Donor | `✅ Welcome to AnnaSetu — Your account is active` | High |
| Verification: Rejected | Donor | `Your application was not approved — next steps inside` | High |
| Listing Created | Donor | `Your listing is live — [Food Name] · ERS [Score]` | Medium |
| Match Found | Donor | `✅ Match found — [Shelter Name] is ready for your donation` | High |
| Match Found | Shelter | `New donation available near you — [Food Name] · ERS [Score]` | High |
| Shelter Accepted Match | Donor | `[Shelter Name] accepted! Assigning a driver now...` | High |
| Shelter Declined Match | Donor | `Looking for the next available shelter...` | Medium |
| Driver Assigned | Donor | `Driver [Name] is on the way to pick up your donation` | High |
| Driver Assigned | Shelter | `Driver [Name] assigned — ETA [X] minutes` | High |
| Driver Assigned | Driver | `New pickup assigned — [Address] — ERS [Score]` | High |
| Food Picked Up | Donor | `Your donation has been picked up — thank you! 🎉` | High |
| Food Picked Up | Shelter | `Your delivery is on its way — ETA [X] minutes` | Medium |
| Food Delivered | Donor | `Delivered ✅ — [X] meals rescued today from your kitchen` | High |
| Food Delivered | Shelter | `Delivery confirmed — [Food Name] received` | High |
| Food Delivered | Driver | `Delivery logged — great work! [Trip summary]` | Low |
| Checklist Completed — Accepted | Donor | `✅ Your food was accepted — [X] meals rescued!` | High |
| Checklist Completed — Accepted | Shelter | `Delivery accepted and logged — thank you!` | Medium |
| Checklist Rejected — Dispute Filed | Admin | `[Dispute] Delivery rejected at [Shelter] — Listing [ID]` | Critical |
| Checklist Rejected — First Violation | Donor | `⚠️ Important Notice — Discrepancy Reported for Your Listing` | Critical |
| Checklist Rejected — Second Violation | Donor | `🚫 Your AnnaSetu Account Has Been Removed` | Critical |
| Checklist Rejected — Second Violation | Admin | `[Account Removed] Donor [Name] — second discrepancy confirmed` | Critical |
| ERS Crosses 61 (Urgent) | Shelter (all within 10 km) | `⚠️ Urgent listing nearby — [Food Name] — [X] hrs left` | High |
| ERS Crosses 81 (Critical) | Donor | `🔴 Your listing is expiring in under [X] minutes — act now` | Critical |
| ERS Crosses 81 (Critical) | Admin | `[CRITICAL] Listing [ID] ERS 81+ — no match accepted yet` | Critical |
| No Match Found (30 min) | Admin | `[Action Needed] Listing [ID] unmatched for 30 minutes` | High |
| Auto-confirm (Agent) | Shelter | `[Auto-confirmed] Incoming donation — opt out within 5 min` | Critical |
| Driver Re-assigned (Agent) | Donor | `Your driver changed — [New Driver Name] is on the way` | High |
| Listing Expired (Waste) | Donor | `Unfortunately, [Food Name] listing expired with no pickup` | Medium |
| Listing Expired (Waste) | Admin | `[Waste Event] Listing [ID] expired — [Food Name] — [Donor]` | High |
| FSSAI Expiry Warning (60 days) | Donor | `⚠️ Your FSSAI license expires on [Date] — update required` | High |
| FSSAI Expiry Warning (60 days) | Admin | `FSSAI warning — [Donor Name] license expires [Date]` | Medium |
| Account Suspended (FSSAI Lapsed) | Donor | `Your account has been suspended — FSSAI license expired` | Critical |
| Weekly Impact Digest | Donor | `Your weekly impact — [X] meals rescued this week 🌱` | Low |
| Weekly Impact Digest | Shelter | `Weekly summary — [X] meals received from [N] donors` | Low |
| Weekly Impact Digest | Driver | `Your week — [X] deliveries · [Y] km · [Z] meals rescued` | Low |
| Password Reset | Any | `Reset your AnnaSetu password (expires in 30 min)` | Critical |
| New Coordinator Invite | Shelter Coordinator | `You've been invited to join [Shelter Name] on AnnaSetu` | High |
| New Staff Invite | Donor Staff | `You've been invited to manage [Business Name] donations` | High |

### 14.3 Email Template Architecture

All emails share a base template:

```
┌────────────────────────────────────────────┐
│   [Logo]  SURPLUS-TO-SHELTER               │
│   ─────────────────────────────────────    │
│                                            │
│   [Contextual emoji + headline]            │
│                                            │
│   Hi [First Name],                         │
│                                            │
│   [Event-specific body — 2–4 sentences]   │
│                                            │
│   [Key data block — food name, ERS,        │
│    address, shelter name, etc.]            │
│                                            │
│   [Primary CTA Button]                     │
│   [Secondary CTA — text link]              │
│                                            │
│   [Footer: impact stat of the day]         │
│   [Unsubscribe — digest emails only]       │
│   [Legal footer]                           │
└────────────────────────────────────────────┘
```

### 14.4 Sample Email: Verification Approved (Donor)

```
Subject: ✅ Welcome to AnnaSetu — Your account is active

Hi Ravi,

Your business, MG Road Dhaba, has been verified and your account is now active.
You can start listing surplus food immediately.

  Business: MG Road Dhaba
  Type: Restaurant
  FSSAI License: 10025064001150 ✅ Valid
  Verified by: [Admin Name], [Date]

[Start Listing Food →]

What happens next:
  • Post a donation in under 60 seconds using a photo
  • Our system matches you with a nearby shelter instantly
  • A driver picks up your food and we track it to delivery
  • You receive an impact summary and tax certificate monthly

If you have questions, reply to this email.

You've joined 142 businesses saving food and feeding communities.
— The AnnaSetu Team
```

### 14.5 Sample Email: ERS Critical Alert (Donor)

```
Subject: 🔴 Your Biryani listing is expiring — 42 minutes left

Hi Ravi,

Your donation of Biryani × 20 has reached a critical expiry window.

  Food: Biryani × 20 portions
  Safe time remaining: 42 minutes
  Risk Score: 🔴 84 / 100 — CRITICAL
  Status: Matching in progress

Our agentic dispatcher has taken over and is actively assigning
a shelter and driver. No action is needed from you — but please
keep the food accessible for pickup in the next 30 minutes.

[View Listing Status →]

If you need to cancel this listing, you can do so from your dashboard.

— AnnaSetu Dispatch Team
```

### 14.6 Functional Requirements — Notification System

- **FR-NOTIF-01:** All notifications are sent asynchronously via a job queue — email sending does not block the API response.
- **FR-NOTIF-02:** Failed email deliveries are retried up to 3 times with exponential backoff (1 min, 5 min, 15 min).
- **FR-NOTIF-03:** Every sent email is logged in the `notification_logs` table with: recipient, event type, listing ID, timestamp, delivery status, and retry count.
- **FR-NOTIF-04:** Critical-priority emails (ERS Critical, verification approved/rejected, waste events) skip the queue and are sent immediately (or placed at queue head).
- **FR-NOTIF-05:** Weekly digest emails are scheduled via a cron job running every Monday at 8:00 AM local time.
- **FR-NOTIF-06:** Digest emails (weekly summaries) have an unsubscribe link. Transactional emails (status updates, verifications) do not, as they are essential.
- **FR-NOTIF-07:** The system must not send duplicate emails for the same event-listing combination within a 10-minute window (deduplication key: event_type + listing_id + recipient_id + window).
- **FR-NOTIF-08:** Email template updates can be made by Super Admin without a code deployment.

---

## 15. All Dashboards — Detailed Specifications

### 15.1 Dashboard 1 — Donor Dashboard

**Accessible to:** Donor Admin, Donor Staff (own listings only)  
**Core goal:** Post new listings quickly, monitor active listing status and ERS, view impact

#### Layout & Sections

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER: [MG Road Dhaba]  [Verified ✅]  [Notifications Bell] │
├──────────────────────────────────────────────────────────────┤
│ QUICK ACTIONS                                                 │
│  [📸 Donate by Photo]  [✏️ Quick Form]  [⭐ My Templates]   │
│  [🔁 Same as Last Time]  (shown if last listing < 7 days)    │
├──────────────────────────────────────────────────────────────┤
│ ACTIVE LISTINGS                   Filter: [All | Urgent | ▼] │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 🔴 Biryani × 20    ERS: 84/100  ⏱ 42 min remaining     │ │
│ │ Status: ● Agentic Dispatch Active                        │ │
│ │ [View Status]  [Cancel Listing]                          │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ 🟡 Bread × 30      ERS: 43/100  ⏱ 3 hrs 20 min        │ │
│ │ Status: ✅ Matched → Hope Shelter · Driver being assigned│ │
│ │ [View Status]  [Cancel]                                  │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ MY IMPACT THIS MONTH                                         │
│  🍽️ 340 Meals Rescued   ♻️ 124 kg Diverted from Landfill    │
│  🌱 89 kg CO₂e Avoided  💰 Est. ₹4,200 Tax Deduction       │
│  [Download Monthly Tax Certificate (PDF)]                    │
├──────────────────────────────────────────────────────────────┤
│ LISTING HISTORY (last 30 days)          [Export CSV]         │
│ Date | Food | Qty | Shelter | ERS at Match | Status | Action │
│ ─────────────────────────────────────────────────────────── │
│ Jan 14 | Biryani | 25 | Hope Shelter | 🟡 52 | Delivered ✅  │
│ Jan 13 | Dal | 15 | City Food Bank | 🟢 28 | Delivered ✅    │
│ Jan 12 | Bread | 40 | — | 🔴 91 | Expired ⚫                 │
└──────────────────────────────────────────────────────────────┘
```

**Functional Requirements:**
- **FR-DASH-D01:** ERS badges update in real time on the donor dashboard (WebSocket or 30-second polling).
- **FR-DASH-D02:** "Same as Last Time" button is shown only if the donor's previous listing was created within the last 7 days.
- **FR-DASH-D03:** "Cancel Listing" is only available when listing status is `Listed` or `Matched` — not when driver is assigned or in transit.
- **FR-DASH-D04:** Listing history defaults to 30 days; donor can change date range.
- **FR-DASH-D05:** Impact statistics (meals, kg, CO₂e, tax estimate) are calculated in real time from delivered listings.

---

### 15.2 Dashboard 2 — Shelter / NGO Dashboard

**Accessible to:** Shelter Admin, Shelter Coordinator  
**Core goal:** See and accept incoming donations sorted by urgency, manage capacity, track deliveries

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER: [Hope Shelter]  [Verified ✅]                        │
├──────────────────────────────────────────────────────────────┤
│ CAPACITY STATUS                    [Update Capacity]         │
│  Available: ████████████░░░░░░░░░░░  55/100 kg free          │
│  [Set Food Preferences]  [Mark Unavailable Today]            │
├──────────────────────────────────────────────────────────────┤
│ INCOMING DONATIONS                Sort: [ERS ↓] [Distance ↓]│
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 🔴 Biryani × 20   ERS: 84    1.2 km    42 min left     │ │
│ │ From: MG Road Dhaba (⭐ Verified · 18 donations)         │ │
│ │ Fits your capacity: ✅  (8 kg / 55 kg available)        │ │
│ │ [✅ Accept]  [❌ Decline]  [View Details]               │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ 🟢 Bread × 30     ERS: 28    0.8 km    5.5 hrs left    │ │
│ │ From: City Bakery (⭐ Verified · 6 donations)            │ │
│ │ [✅ Accept]  [❌ Decline]  [View Details]               │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ SCHEDULED — Accepted, Awaiting Delivery                      │
│ Dal × 15  from Campus Café  ·  Driver Priya S. · ETA 25 min │
├──────────────────────────────────────────────────────────────┤
│ FOOD PREFERENCES                  [Edit]                     │
│  ✅ Vegetarian    ✅ Baked Goods   ✅ Packaged                │
│  ❌ Non-Veg       ❌ Dairy         ✅ Fresh Produce           │
├──────────────────────────────────────────────────────────────┤
│ THIS WEEK'S IMPACT                                           │
│  🍽️ 890 meals served from rescued food                      │
│  🏆 Top donor this week: MG Road Dhaba (18 donations)       │
└──────────────────────────────────────────────────────────────┘
```

**Functional Requirements:**
- **FR-DASH-S01:** Incoming listings sorted by ERS descending by default — most urgent at top.
- **FR-DASH-S02:** "Fits your capacity" indicator is calculated live: if listing quantity > available capacity, a warning "⚠️ May exceed capacity" is shown instead.
- **FR-DASH-S03:** "Mark Unavailable Today" sets `available_capacity = 0` for the remainder of the day — shelter is excluded from all matches until capacity is restored.
- **FR-DASH-S04:** Shelter Coordinator can accept/decline; Shelter Admin can additionally edit preferences and capacity.
- **FR-DASH-S05:** Auto-confirmed listings (by agentic dispatcher) appear with a banner: "Auto-matched by system — [opt out within X minutes]" with a decline button.

---

### 15.3 Dashboard 3 — Driver Dashboard

**Accessible to:** Verified Driver, Casual Volunteer  
**Core goal:** View and accept pickups, navigate the optimized route, mark stops complete

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER: [Priya Sharma · Driver]  [● Available]  [Go Offline] │
├──────────────────────────────────────────────────────────────┤
│ MY ACTIVE ROUTE        Est. Total: 8.4 km · 35 min           │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 📦 PICKUP  Stop 1  MG Road Dhaba          ERS 🔴 84     │ │
│ │            Biryani × 20 · 5 min away                    │ │
│ │            [Mark Picked Up ✅]  [Navigate 🗺️]           │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ 📦 PICKUP  Stop 2  City Bakery            ERS 🟡 43     │ │
│ │            Bread × 30 · 2.1 km from Stop 1              │ │
│ │            [Navigate 🗺️]                                 │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ 🏠 DELIVER Stop 3  Hope Shelter                         │ │
│ │            All items · 3.2 km from Stop 2               │ │
│ │            [Mark Delivered ✅]  [Call Shelter 📞]        │ │
│ └──────────────────────────────────────────────────────────┘ │
│ [Open Full Route in Google Maps]                             │
├──────────────────────────────────────────────────────────────┤
│ AVAILABLE NEARBY (unassigned)                                │
│  🔴 ERS 79 · Pasta × 15 · 0.3 km · MG Road               │
│  [Accept This Pickup]                                        │
├──────────────────────────────────────────────────────────────┤
│ MY STATS (This Month)                                        │
│  🚗 28 trips   🍽️ 480 meals   ⭐ 4.9/5   🏆 Top Driver    │
└──────────────────────────────────────────────────────────────┘
```

**Functional Requirements:**
- **FR-DASH-DR01:** Driver must be in "Available" status to appear in agentic dispatcher selection.
- **FR-DASH-DR02:** "Go Offline" removes driver from all dispatch pools immediately.
- **FR-DASH-DR03:** Each "Mark Picked Up" action updates the listing status in real time and triggers SMTP emails to donor and shelter.
- **FR-DASH-DR04:** "Navigate" button opens Google Maps deep link with the stop's address pre-filled.
- **FR-DASH-DR05:** Casual Volunteers only see listings manually assigned to them — they do not see the "Available Nearby" pool.

---

### 15.4 Dashboard 4 — Admin Dashboard

**Accessible to:** Super Admin, Platform Admin, Moderator  
**Core goal:** Platform operations — verification queue, live status, agent oversight, manual intervention

```
┌──────────────────────────────────────────────────────────────┐
│ PLATFORM HEALTH (live)                                       │
│  🟢 Active Listings: 12   🔴 Critical (ERS>80): 3           │
│  🚗 Drivers Online: 8     🏠 Shelters Available: 14         │
│  ⚠️ Needs Intervention: 1  ⚫ Waste Events Today: 2         │
│  🔺 Disputed Deliveries: 1  🚫 Violations Pending Review: 1 │
├──────────────────────────────────────────────────────────────┤
│ VERIFICATION QUEUE               [Sort: Newest ▼]           │
│  📋 3 pending donor applications                             │
│  🏠 1 pending shelter application                            │
│  🚗 2 pending driver verifications                           │
│  [Open Queue →]                                              │
├──────────────────────────────────────────────────────────────┤
│ LIVE LISTINGS MAP                                            │
│  [City map with color-coded markers by ERS level]            │
│  [Filter: All | ERS >60 | ERS >80 | Unmatched]              │
├──────────────────────────────────────────────────────────────┤
│ AGENTIC DISPATCHER LOG                                       │
│ 10:42 ─ Auto-assigned Priya S. to Listing #L-042 (ERS 84)   │
│ 10:38 ─ Auto-confirmed Hope Shelter (10-min timeout)        │
│ 10:21 ─ Re-dispatched after driver cancellation (L-039)     │
│ 09:55 ─ Escalated L-031 to admin — no shelter in 15 km      │
│  [Override] buttons on each entry   [View Full Log →]       │
├──────────────────────────────────────────────────────────────┤
│ WASTE EVENTS TODAY (failed rescues)                          │
│  ⚫ Biryani × 25 — Andheri West — 8:30 PM (no driver avail.) │
│  ⚫ Dal × 10  — Powai — 7:10 PM (shelter declined, no fallbk)│
├──────────────────────────────────────────────────────────────┤
│ PLATFORM METRICS (last 7 days)                               │
│  [Bar chart: daily meals rescued vs. waste events]           │
│  [Line chart: avg ERS at time of match (lower = faster)]    │
│  [Pie chart: listings by food category]                      │
└──────────────────────────────────────────────────────────────┘
```

**Functional Requirements:**
- **FR-DASH-A01:** Platform health counts update every 60 seconds.
- **FR-DASH-A02:** Admin can click any agent log entry and override the agent's decision (reassign driver, reassign shelter, cancel listing).
- **FR-DASH-A03:** Live listings map shows all active listings as map markers; clicking a marker opens the full listing detail with all status history.
- **FR-DASH-A04:** Admin can filter the verification queue by type (donor / shelter / driver) and status (pending / under-review / approved / rejected).
- **FR-DASH-A05:** Admin can view, download, and approve/reject verification documents directly from the queue without leaving the dashboard.

---

### 15.5 Dashboard 5 — Public Impact Dashboard

**Accessible to:** Anyone (unauthenticated), all logged-in roles  
**Core goal:** Show real-world impact, build public trust, attract new donors

```
┌──────────────────────────────────────────────────────────────┐
│ SURPLUS-TO-SHELTER · LIVE IMPACT COUNTER                     │
│                                                              │
│   🍽️  48,320  Meals Rescued                                 │
│   ♻️  17,842 kg  Food Diverted from Landfill                 │
│   🌱  12,489 kg  CO₂e Emissions Avoided                     │
│   🏪  142  Verified Businesses Donating                     │
│   🏠  38  Shelters Served                                   │
│   🚗  89  Volunteer Drivers Active                          │
│                                                              │
│   Live ticker: "Just now — Hope Shelter received 20 meals   │
│   from MG Road Dhaba"                                        │
├──────────────────────────────────────────────────────────────┤
│ CITY WASTE & RESCUE HEATMAP                                  │
│  [Map with two overlays: surplus generation density /        │
│   rescue success rate per area]                              │
│  [Toggle: Show Hotspots | Show Success Rate]                 │
├──────────────────────────────────────────────────────────────┤
│ TOP DONORS THIS MONTH  (opt-in for public recognition)       │
│  🥇 MG Road Dhaba — 48 donations — 890 meals                │
│  🥈 Campus Café — 32 donations — 640 meals                  │
│  🥉 Fresh Mart Grocers — 28 donations — 560 meals           │
├──────────────────────────────────────────────────────────────┤
│ IMPACT TREND (last 6 months)                                 │
│  [Line chart: meals rescued per month — upward trend]        │
├──────────────────────────────────────────────────────────────┤
│ [Become a Donor — Apply Now]  [Volunteer to Drive]          │
└──────────────────────────────────────────────────────────────┘
```

---

### 15.6 Dashboard 6 — Donor ESG / Tax Dashboard

**Accessible to:** Donor Admin only  
**Core goal:** Corporate impact reporting, CSR documentation, tax deduction certificates

- Monthly donation summary table (date, food, qty, shelter, weight, meals, CO₂e, tax value)
- Chain-level aggregation (for multi-location Donor Admins across branches)
- Cumulative CO₂e calculation with methodology footnote (EPA WARM model: 2.5 kg CO₂e per kg food waste diverted)
- Estimated tax deduction value field (for guidance only — not legal advice)
- [Download Tax Certificate — PDF] per listing or per month
- [Download ESG Report — PDF / CSV] for quarterly CSR disclosure
- FSSAI license status and expiry reminder

---

## 16. NLP Free-Text Parser

### 16.1 Purpose

Allow donors to describe surplus food in natural language — typed or spoken — and have it converted to a structured listing record automatically.

### 16.2 Sample Input → Output

**Input:** *"we have 3 trays of paneer butter masala, around 15 rotis, and some dal left from lunch, safe maybe till 9 pm tonight"*

**Output:**
```json
{
  "items": [
    {
      "food_name": "paneer butter masala",
      "category": "dairy_dish",
      "quantity": 3,
      "unit": "trays",
      "estimated_servings": 18,
      "safe_until": "21:00",
      "safe_window_hours": 2.5
    },
    {
      "food_name": "roti",
      "category": "baked_bread",
      "quantity": 15,
      "unit": "pieces",
      "estimated_servings": 15,
      "safe_until": "21:00",
      "safe_window_hours": 3.5
    },
    {
      "food_name": "dal",
      "category": "cooked_rice_curry",
      "quantity": 1,
      "unit": "pot",
      "estimated_servings": 10,
      "safe_until": "21:00",
      "safe_window_hours": 3.0
    }
  ],
  "pickup_notes": "leftover from lunch service",
  "confidence": 0.88,
  "ambiguities": ["quantity of dal described as 'some' — defaulted to 1 pot"]
}
```

### 16.3 Implementation

**LLM API System Prompt:**
```
You are a food donation intake assistant for a food rescue platform in India.
Parse the user's free-text message into a structured JSON object.

Rules:
- Extract each food item separately.
- Classify food_category using: cooked_meat_fish, dairy_dish, cooked_rice_curry,
  cooked_pasta, soup_broth, baked_bread, fresh_produce, packaged_sealed, beverage_opened, unknown
- Estimate servings based on units (1 hotel pan ≈ 10-12 servings, 1 tray ≈ 6-8 servings)
- Parse time references relative to current time: "9 pm tonight", "in 2 hours", "before closing"
- Flag any ambiguities in the "ambiguities" array
- Return ONLY valid JSON, no explanation, no markdown

Current time: {current_time}
```

### 16.4 Functional Requirements — NLP Parser

- **FR-NLP-01:** NLP parsing is triggered from: (a) the free-text field on the listing form, (b) voice input via Web Speech API, (c) inbound email-to-listing channel.
- **FR-NLP-02:** Parser output is always shown to donor for review — auto-submission without review is not permitted.
- **FR-NLP-03:** If multiple food items are detected, the system creates multiple listing records (one per item), linked as a "bundle" with a shared session ID.
- **FR-NLP-04:** Ambiguities surfaced by the parser are shown to the donor as inline hints next to the relevant fields.
- **FR-NLP-05:** If confidence < 0.70, the pre-filled fields are shown in yellow with a note: "We're not fully sure about this — please verify."
- **FR-NLP-06:** NLP API call must complete within 3 seconds; a spinner is shown during processing.
- **FR-NLP-07:** Parser input and output are logged (without PII) for model performance analytics.

---

## 17. Impact Reporting & Tax Documentation

### 17.1 Impact Calculation Logic

Per confirmed and delivered listing, the system auto-calculates:

| Metric | Formula | Data Source |
|---|---|---|
| Meals rescued | `quantity_kg ÷ 0.4` (avg 400g per meal) or by serving count if available | Listing data |
| Weight diverted (kg) | `quantity × weight_per_unit` (lookup table by food category and unit) | Listing + category lookup |
| CO₂e avoided (kg) | `weight_kg × 2.5` (EPA WARM Model standard for food waste diversion) | Calculated |
| Disposal cost saved (₹) | `weight_kg × local_disposal_rate_per_kg` | Configurable constant |
| Tax deduction estimate (₹) | `weight_kg × fair_market_value_per_kg_by_category × applicable_tax_rate` | Lookup table (guidance only) |

### 17.2 Tax Deduction Certificate

Auto-generated PDF per listing or per month containing:

| Field | Source |
|---|---|
| Certificate Number | System-generated, sequential |
| Date of Donation | Delivery confirmed timestamp |
| Donor Legal Name | From verified registration |
| Donor PAN | From verified registration |
| Donor GSTIN | From verified registration |
| Donor FSSAI License No. | From verified registration |
| Food Description | From listing |
| Quantity | From listing |
| Estimated Fair Market Value (₹) | Calculated from category lookup |
| Receiving Organization Name | From shelter record |
| Receiving Organization Reg. No. | From shelter record |
| Platform Verification Statement | "This donation was verified, tracked, and confirmed delivered by AnnaSetu." |
| QR Code | Links to verifiable delivery record on platform |
| Authorized Signatory Block | Shelter Admin name + timestamp |

### 17.3 Functional Requirements — Impact Reporting

- **FR-IMPACT-01:** Impact metrics are calculated in real time and updated on donor and public dashboards upon delivery confirmation.
- **FR-IMPACT-02:** Tax certificate PDF is generated on demand via the Donor Dashboard — donor clicks "Download Certificate."
- **FR-IMPACT-03:** Monthly impact digest email includes a PDF certificate as an attachment.
- **FR-IMPACT-04:** Admin can generate a city-level aggregate impact report (all donors, all listings, configurable date range) as CSV and PDF.
- **FR-IMPACT-05:** CO₂e calculation methodology is documented in a footnote on all reports: "Based on EPA WARM Model — 2.5 kg CO₂e per kg food waste diverted from landfill."
- **FR-IMPACT-06:** Tax value is shown as an estimate only, with a disclaimer: "This estimate is for guidance only and does not constitute tax advice. Consult a qualified CA."

---

## 18. Data Models

### 18.1 Entity Relationship Overview

```
Users ──────────────────────── Roles (user_roles)
  │                                    │
  ├── Donors ──────────────── DonorVerification
  │       │
  │       └── Listings ──── Matches ── Deliveries
  │               │              │           │
  │               │          Shelters     Drivers
  │               │
  │               └── NotificationLogs
  │
  ├── Shelters ─────────────── ShelterPreferences
  │
  ├── Drivers
  │
  └── AgentLogs ─────────────── Listings
```

### 18.2 Core Table Schemas

```sql
-- Users and authentication
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN (
                    'super_admin','platform_admin','moderator','reporter',
                    'donor_admin','donor_staff',
                    'shelter_admin','shelter_coordinator',
                    'verified_driver','casual_volunteer',
                    'government_observer','esg_reporter'
                  )),
  is_active       BOOLEAN DEFAULT TRUE,
  email_verified  BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ
);

-- Donor business profiles
CREATE TABLE donors (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name         TEXT NOT NULL,
  business_type         TEXT NOT NULL CHECK (business_type IN (
                          'restaurant','grocery','caterer','campus_dining',
                          'cloud_kitchen','other'
                        )),
  contact_name          TEXT NOT NULL,
  contact_phone         TEXT NOT NULL,
  address               TEXT NOT NULL,
  location              GEOGRAPHY(POINT, 4326) NOT NULL,  -- PostGIS
  city                  TEXT NOT NULL,
  state                 TEXT NOT NULL,
  pin_code              TEXT NOT NULL,
  fssai_license_number  TEXT NOT NULL,
  fssai_expiry_date     DATE NOT NULL,
  fssai_document_url    TEXT NOT NULL,
  gst_number            TEXT,
  gst_certificate_url   TEXT,
  pan_number            TEXT NOT NULL,
  operating_hours_start TIME,
  operating_hours_end   TIME,
  verification_status   TEXT NOT NULL DEFAULT 'pending_review' CHECK (
                          verification_status IN (
                            'pending_review','under_verification',
                            'phone_call_scheduled','approved',
                            'rejected','suspended'
                          )
                        ),
  verified_by_admin_id  UUID REFERENCES users(id),
  verified_at           TIMESTAMPTZ,
  rejection_reason      TEXT,
  can_reapply_after     DATE,
  total_meals_donated   INTEGER DEFAULT 0,
  total_weight_donated  NUMERIC(10,2) DEFAULT 0,
  is_public_badge       BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Shelters / NGOs
CREATE TABLE shelters (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES users(id) ON DELETE CASCADE,
  org_name                TEXT NOT NULL,
  contact_name            TEXT NOT NULL,
  contact_phone           TEXT NOT NULL,
  address                 TEXT NOT NULL,
  location                GEOGRAPHY(POINT, 4326) NOT NULL,
  registration_number     TEXT,
  max_capacity_kg         NUMERIC(8,2) NOT NULL,
  available_capacity_kg   NUMERIC(8,2) NOT NULL,
  food_preferences        TEXT[] DEFAULT '{}',  -- ['vegetarian','baked','packaged']
  allergen_restrictions   TEXT[] DEFAULT '{}',
  operating_hours_start   TIME,
  operating_hours_end     TIME,
  verification_status     TEXT NOT NULL DEFAULT 'pending_review',
  reliability_score       NUMERIC(3,2) DEFAULT 0.70,
  total_donations_received INTEGER DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers / Volunteers
CREATE TABLE drivers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name             TEXT NOT NULL,
  phone                 TEXT NOT NULL,
  vehicle_type          TEXT CHECK (vehicle_type IN ('bike','car','van','bicycle')),
  vehicle_capacity_kg   NUMERIC(6,2),
  current_location      GEOGRAPHY(POINT, 4326),
  is_available          BOOLEAN DEFAULT FALSE,
  verification_status   TEXT NOT NULL DEFAULT 'pending_review',
  accountability_score  NUMERIC(3,2) DEFAULT 0.70,
  total_deliveries      INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Food donation listings
CREATE TABLE listings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id              UUID REFERENCES donors(id) NOT NULL,
  food_name             TEXT NOT NULL,
  food_category         TEXT NOT NULL,
  quantity              NUMERIC(8,2) NOT NULL,
  unit                  TEXT NOT NULL CHECK (unit IN (
                          'portions','trays','kg','boxes','litres','pieces','pots'
                        )),
  estimated_servings    INTEGER,
  estimated_weight_kg   NUMERIC(8,2),
  pickup_location       GEOGRAPHY(POINT, 4326) NOT NULL,
  pickup_address        TEXT NOT NULL,
  pickup_notes          TEXT,
  expiry_time           TIMESTAMPTZ NOT NULL,
  max_safe_window_hours NUMERIC(4,2) NOT NULL,
  is_refrigerated       BOOLEAN DEFAULT FALSE,
  photo_url             TEXT,
  cv_food_category      TEXT,
  cv_confidence         NUMERIC(3,2),
  cv_safety_flagged     BOOLEAN DEFAULT FALSE,
  nlp_source_text       TEXT,
  ers_score             INTEGER NOT NULL DEFAULT 0,
  ers_updated_at        TIMESTAMPTZ DEFAULT NOW(),
  status                TEXT NOT NULL DEFAULT 'listed' CHECK (status IN (
                          'listed','matched','driver_assigned',
                          'in_transit','delivered','disputed',
                          'expired','cancelled'
                        )),
  -- 'disputed' = checklist rejected by shelter volunteer; pending admin review
  matched_shelter_id    UUID REFERENCES shelters(id),
  assigned_driver_id    UUID REFERENCES drivers(id),
  bundle_session_id     UUID,
  donor_pin             CHAR(4),      -- 4-digit PIN generated on driver assignment for handover verification
  donor_pin_generated_at TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for geo-matching performance
CREATE INDEX idx_listings_location ON listings USING GIST (pickup_location);
CREATE INDEX idx_shelters_location ON shelters USING GIST (location);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_ers ON listings(ers_score DESC);

-- Matches (each attempt in the cascade)
CREATE TABLE matches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id          UUID REFERENCES listings(id) NOT NULL,
  shelter_id          UUID REFERENCES shelters(id) NOT NULL,
  match_score         NUMERIC(4,3) NOT NULL,
  distance_km         NUMERIC(6,2),
  cascade_round       INTEGER NOT NULL DEFAULT 1,
  was_agentic         BOOLEAN DEFAULT FALSE,
  shelter_response    TEXT DEFAULT 'pending' CHECK (
                        shelter_response IN ('pending','accepted','declined','auto_confirmed','timed_out')
                      ),
  response_reason     TEXT,
  matched_at          TIMESTAMPTZ DEFAULT NOW(),
  responded_at        TIMESTAMPTZ
);

-- Delivery tracking
CREATE TABLE deliveries (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id              UUID REFERENCES listings(id) NOT NULL,
  driver_id               UUID REFERENCES drivers(id) NOT NULL,
  shelter_id              UUID REFERENCES shelters(id) NOT NULL,
  route_stops             JSONB,
  route_distance_km       NUMERIC(6,2),
  route_estimated_mins    INTEGER,
  picked_up_at            TIMESTAMPTZ,
  delivered_at            TIMESTAMPTZ,
  actual_quantity_kg      NUMERIC(8,2),
  driver_notes            TEXT,
  shelter_receipt_notes   TEXT,
  meals_rescued           INTEGER,
  co2e_avoided_kg         NUMERIC(8,2),
  status_updates          JSONB DEFAULT '[]'::JSONB
  -- status_updates format: [{"status":"picked_up","at":"ISO8601","by":"driver_id"}]
);

-- Impact aggregations (denormalized for fast dashboard queries)
CREATE TABLE impact_totals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope               TEXT NOT NULL,  -- 'donor_id:uuid' | 'shelter_id:uuid' | 'platform'
  period              TEXT NOT NULL,  -- 'all_time' | 'YYYY-MM'
  meals_rescued       INTEGER DEFAULT 0,
  weight_diverted_kg  NUMERIC(12,2) DEFAULT 0,
  co2e_avoided_kg     NUMERIC(12,2) DEFAULT 0,
  deliveries_count    INTEGER DEFAULT 0,
  waste_events_count  INTEGER DEFAULT 0,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Agentic dispatcher audit log
CREATE TABLE agent_logs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp               TIMESTAMPTZ DEFAULT NOW(),
  trigger_condition       TEXT NOT NULL,
  listing_id              UUID REFERENCES listings(id),
  listing_ers             INTEGER,
  action_type             TEXT NOT NULL CHECK (action_type IN (
                            'AUTO_CONFIRM_SHELTER','ASSIGN_DRIVER',
                            'REDISPATCH_DRIVER','ESCALATE_TO_ADMIN',
                            'AUTO_CANCEL_LISTING'
                          )),
  selected_entity_id      UUID,
  selected_entity_type    TEXT,
  match_score             NUMERIC(4,3),
  reasoning               TEXT NOT NULL,
  email_sent_to           TEXT,
  opt_out_window_minutes  INTEGER,
  was_overridden          BOOLEAN DEFAULT FALSE,
  overridden_by_admin_id  UUID REFERENCES users(id),
  overridden_at           TIMESTAMPTZ
);

-- Donor verification document tracking
CREATE TABLE donor_verifications (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id                UUID REFERENCES donors(id) NOT NULL,
  submitted_at            TIMESTAMPTZ DEFAULT NOW(),
  fssai_check_passed      BOOLEAN,
  gst_check_passed        BOOLEAN,
  pan_check_passed        BOOLEAN,
  phone_verified          BOOLEAN,
  phone_call_notes        TEXT,
  location_verified       BOOLEAN,
  duplicate_check_passed  BOOLEAN,
  checklist_completed_by  UUID REFERENCES users(id),
  decision                TEXT CHECK (decision IN ('approved','rejected')),
  decision_at             TIMESTAMPTZ,
  decision_reason         TEXT
);

-- Notification delivery log
CREATE TABLE notification_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id    UUID REFERENCES users(id),
  event_type      TEXT NOT NULL,
  listing_id      UUID REFERENCES listings(id),
  channel         TEXT DEFAULT 'email',
  recipient_email TEXT NOT NULL,
  subject         TEXT,
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'queued' CHECK (
                    delivery_status IN ('queued','sent','delivered','bounced','failed')
                  ),
  retry_count     INTEGER DEFAULT 0,
  error_message   TEXT
);
```

---

## 19. Non-Functional Requirements

### 19.1 Performance

| Requirement | Target |
|---|---|
| Listing creation → ERS calculated | < 2 seconds |
| Matching engine response (first match found) | < 30 seconds |
| Email notification dispatch (non-critical) | < 2 minutes from trigger event |
| Email notification dispatch (critical: ERS > 80) | < 5 minutes from trigger event |
| Dashboard page load (authenticated) | < 3 seconds on standard 4G |
| CV photo processing (photo upload → form pre-fill) | < 5 seconds |
| NLP text parsing (text input → structured output) | < 3 seconds |
| Route optimization (up to 8 stops) | < 2 seconds |
| ERS recalculation cron (all active listings) | Completes within 5 minutes cycle |

### 19.2 Reliability

- **NFR-R01:** SMTP email delivery retries up to 3 times with exponential backoff.
- **NFR-R02:** Agentic dispatcher cron must continue running if the web server restarts — run independently.
- **NFR-R03:** ERS cron recalculation is idempotent — re-running it does not cause duplicate notifications.
- **NFR-R04:** All database operations that mutate state use transactions to prevent partial updates.

### 19.3 Security

- **NFR-S01:** Passwords are hashed using bcrypt (minimum 12 rounds).
- **NFR-S02:** SMTP credentials are stored as environment variables — never in code or version control.
- **NFR-S03:** JWT secrets are stored as environment variables with a minimum 256-bit entropy.
- **NFR-S04:** FSSAI, GST, and PAN document URLs are stored as signed, time-limited URLs (not publicly accessible).
- **NFR-S05:** All API endpoints enforce role-based authorization — role claim is validated on every request.
- **NFR-S06:** Location data (pickup addresses, shelter addresses) is accessible only to matched parties and admins.
- **NFR-S07:** Inbound email parsing validates sender against registered donor email before creating a draft listing.

### 19.4 Accessibility

- **NFR-A01:** All dashboards must be usable on mobile (≥ 375px viewport) — shelter staff and drivers primarily use mobile devices.
- **NFR-A02:** Core donor listing flow (photo upload → confirm) must work on a 4G mobile connection.
- **NFR-A03:** All form inputs must have accessible labels for screen readers.
- **NFR-A04:** Color-coded ERS badges must include a text label — do not rely on color alone (accessibility for color-blind users).

### 19.5 Scalability (Design Intent)

- **NFR-SC01:** Database queries for geo-matching use PostGIS spatial indexes — designed to scale to 10,000+ shelters.
- **NFR-SC02:** Email notifications are queued asynchronously — rate limits are handled at the queue layer, not the application layer.
- **NFR-SC03:** ERS cron is designed as a batch job over active listings — adding more listings does not block real-time requests.
- **NFR-SC04:** The system is stateless at the application layer — horizontal scaling is possible without session state migration.

---

## 20. Tech Stack Recommendation

### 20.1 Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  Next.js 14 (App Router)  ·  Tailwind CSS  ·  shadcn/ui      │
│  Leaflet.js (maps)  ·  React Email (email templates)         │
└─────────────────────────┬────────────────────────────────────┘
                          │  REST API (Next.js API routes)
┌─────────────────────────▼────────────────────────────────────┐
│                         API LAYER                            │
│  Next.js API Routes (or Express)  ·  Zod (validation)        │
│  JWT auth middleware  ·  Role-based guards                   │
└─────────────────────────┬────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                     BACKGROUND JOBS                          │
│  BullMQ (job queue)                                          │
│  ├── ERS recalculation cron (every 15 min)                   │
│  ├── Agentic dispatcher cron (every 2 min)                   │
│  ├── SMTP email queue (async send + retry)                   │
│  └── Weekly digest cron (Monday 8 AM)                        │
└─────────────────────────┬────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                        DATA LAYER                            │
│  PostgreSQL + PostGIS (geo-matching, listings, matches)      │
│  Redis (ERS cache, BullMQ queue backend, rate limiting)      │
└──────────────────────────────────────────────────────────────┘
```

### 20.2 Service Selection

| Layer | Service / Tool | Purpose | Free Tier |
|---|---|---|---|
| **Frontend** | Next.js 14 | Full-stack React framework | ✅ Open source |
| **Styling** | Tailwind CSS + shadcn/ui | UI components | ✅ Open source |
| **Maps** | Leaflet.js + OpenStreetMap | Donor map, driver route, heatmap | ✅ Free |
| **Hosting** | Vercel | Next.js deployment, zero config | ✅ Hobby tier |
| **Database** | Supabase (PostgreSQL + PostGIS) | Listings, users, geo-matching | ✅ 500 MB free |
| **Auth** | Supabase Auth | JWT, email verification, sessions | ✅ Included |
| **Realtime** | Supabase Realtime | Dashboard live updates | ✅ Included |
| **File Storage** | Supabase Storage or Cloudinary | FSSAI docs, food photos | ✅ 1 GB free |
| **Job Queue** | BullMQ + Redis (Upstash) | Async jobs, email queue, cron | ✅ Free tier |
| **SMTP Email** | Gmail SMTP (dev) / Brevo SMTP | All email notifications | ✅ 300/day free |
| **Email Templates** | React Email | Responsive email components | ✅ Open source |
| **CV / NLP** | Google Gemini API (vision + text) | Food photo classification, NLP parse | ✅ Free quota |
| **Routing** | OSRM public API | Real-road distance matrix | ✅ Free |
| **Route Opt.** | Google OR-Tools | CVRP solver (Python) | ✅ Open source |
| **PDF Generation** | PDFKit or `@react-pdf/renderer` | Tax certificates, impact reports | ✅ Open source |
| **Weather** | OpenWeatherMap API | Temperature data for ERS | ✅ 60 calls/min free |
| **Validation** | Zod | Runtime schema validation | ✅ Open source |

### 20.3 SMTP Email Configuration (Gmail)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false          # STARTTLS
SMTP_USER=your-app@gmail.com
SMTP_PASS=your-app-password  # Use Gmail App Password, not account password
EMAIL_FROM="AnnaSetu <noreply@annasetu.in>"
EMAIL_REPLY_TO=support@annasetu.in
```

**For production volume:** Use Brevo (formerly Sendinblue) SMTP — free tier allows 300 emails/day, no credit card required, and SMTP relay is drop-in compatible.

---

## 21. 24-Hour Build Plan

### 21.1 Pre-Hack Checklist (Before Clock Starts)

```
Infrastructure
  ☐ Supabase project created — project URL and anon key noted
  ☐ Database schema SQL ready to run (from Section 17)
  ☐ Vercel project created and linked to GitHub repo
  ☐ Gmail App Password or Brevo SMTP credentials ready
  ☐ Gemini API key (or OpenAI key) obtained
  ☐ .env.local file prepared with all secrets

Design
  ☐ Figma wireframes for: Donor Dashboard, Shelter Dashboard, Driver View, Admin Queue
  ☐ Color system decided: primary (green), urgency colors (green/yellow/orange/red/black)
  ☐ shadcn/ui components installed: Card, Badge, Button, Dialog, Form, Table, Toast

Repository
  ☐ Next.js 14 project initialized (npx create-next-app@latest)
  ☐ Tailwind CSS + shadcn/ui configured
  ☐ Supabase client installed (@supabase/supabase-js)
  ☐ BullMQ + Upstash Redis connected
  ☐ Nodemailer installed for SMTP
```

### 21.2 Hour-by-Hour Sprint Plan

#### Hours 0–4: Foundation & Auth

| Task | Owner Suggestion | Output |
|---|---|---|
| Run database schema SQL on Supabase | Backend dev | All tables created with PostGIS indexes |
| Set up Next.js middleware for JWT role-based auth | Backend dev | Protected route wrapper working |
| Donor verification request form (registration page) | Frontend dev | Form submits → `pending_review` record created |
| Admin verification queue page (list of pending donors) | Frontend dev | Admin can see and open verification requests |
| SMTP mailer module (Nodemailer wrapper with queue) | Backend dev | Test email sends successfully |
| Email: verification submitted (to admin) | Backend dev | Admin receives email on new request |
| Basic layout shell + navigation per role | Frontend dev | Role-specific nav renders correctly |

**Hour 4 Checkpoint:** Admin can receive a donor application. Email notifications fire. Auth middleware is protecting routes by role.

---

#### Hours 4–8: Core Listing & Matching

| Task | Owner Suggestion | Output |
|---|---|---|
| Donor listing form (manual path — no CV yet) | Frontend dev | Listing creates record in DB |
| ERS calculation function (triggered on insert) | Backend dev | ERS score appears on listing |
| PostGIS geo-matching query | Backend dev | Returns top-scored shelter list |
| Match creation and notification (email to shelter) | Backend dev | Shelter receives "new donation" email |
| Shelter dashboard: view incoming + Accept/Decline | Frontend dev | Shelter can accept/decline a match |
| Status pipeline state machine | Backend dev | Status transitions correctly on accept |
| SMTP emails: match found, accepted, declined | Backend dev | All 3 status emails firing |
| ERS recalculation cron (BullMQ, every 15 min) | Backend dev | ERS updates without manual trigger |

**Hour 8 Checkpoint:** Full listing-to-match flow works. Emails fire at each step. ERS updates automatically.

---

#### Hours 8–12: Driver Flow & Dashboard Polish

| Task | Owner Suggestion | Output |
|---|---|---|
| Driver assignment (admin assigns manually) | Backend dev | Driver linked to listing |
| Driver dashboard: view assigned pickups + map link | Frontend dev | Driver sees address and navigate button |
| Mark Picked Up / Mark Delivered buttons | Frontend dev | Status updates to in_transit / delivered |
| SMTP emails: driver assigned, picked up, delivered | Backend dev | All 3 fire correctly |
| Donor dashboard: active listings with ERS badges | Frontend dev | Real-time-ish ERS shown (30s polling) |
| Shelter dashboard: upcoming + accepted donations | Frontend dev | Shelter sees scheduled deliveries |
| Admin dashboard: platform health counters + live map | Frontend dev | Admin sees active listing markers on map |
| Impact calculation (on delivery confirmed) | Backend dev | meals_rescued, co2e saved written to impact_totals |

**Hour 12 Checkpoint:** End-to-end happy path works. Donor lists → shelter accepts → driver picks up → delivery confirmed. All emails fire. Dashboards show live data.

---

#### Hours 12–16: AI Features

| Task | Owner Suggestion | Output |
|---|---|---|
| CV module: photo upload → Gemini Vision API call | Full-stack | Returns food_category, servings, confidence |
| Pre-fill listing form from CV output | Frontend dev | Form auto-populates on photo upload |
| NLP parser: free-text → Gemini text API | Backend dev | Structured JSON returned from natural language |
| Wire NLP to listing form text field + voice input | Frontend dev | Voice transcription → NLP → form pre-fill |
| Agentic dispatcher: cron job skeleton | Backend dev | Runs every 2 min, reads active listings |
| Agentic dispatcher: AUTO_CONFIRM_SHELTER action | Backend dev | Auto-confirms when timeout + ERS threshold |
| Agentic dispatcher: ASSIGN_DRIVER action | Backend dev | Auto-assigns available driver |
| Agent log storage + admin view | Full-stack | Admin sees all agent decisions |
| SMTP: critical ERS alert (ERS > 80) | Backend dev | Escalation email fires |
| SMTP: auto-confirm email to shelter with opt-out link | Backend dev | Shelter receives auto-confirm with 5-min opt-out |

**Hour 16 Checkpoint:** CV intake works. NLP works. Agentic dispatcher activates on ERS threshold. All agent actions logged. Admin can see and override agent decisions.

---

#### Hours 16–20: Route Optimization + Advanced Features

| Task | Owner Suggestion | Output |
|---|---|---|
| OSRM distance matrix API call | Backend dev | Real road distances between stops |
| Nearest-neighbor route optimizer | Backend dev | Ordered stop list returned |
| Driver dashboard: multi-stop route display | Frontend dev | Driver sees numbered stops with ERS badges |
| Google Maps deep-link "Navigate" button | Frontend dev | Opens Maps with pre-filled address |
| Shelter capacity management (edit, Mark Unavailable) | Frontend dev | Capacity updates exclude shelter from matches |
| Food preference management (shelter settings) | Frontend dev | Preferences stored, respected in matching |
| Public impact dashboard (live counters, live ticker) | Frontend dev | Public page with animated counters |
| Donor verification: full checklist UI for admin | Frontend dev | Admin can check all items before approving |
| Verification SMTP emails: approved + welcome | Backend dev | Donor receives complete welcome email |
| Donor ESG dashboard: tax estimate + download trigger | Frontend dev | Donor sees impact stats and cert button |

**Hour 20 Checkpoint:** Route optimization shown to driver. Capacity and preferences working in matching. Public dashboard looks great. Admin verification flow is complete end-to-end.

---

#### Hours 20–23: Polish & Demo Prep

| Task | Owner Suggestion | Output |
|---|---|---|
| Seed demo data: 3 donors, 4 shelters, 2 drivers, 5 listings | Any | Realistic demo environment |
| Tax certificate PDF generation (PDFKit) | Backend dev | Downloadable PDF with all fields |
| Waste hotspot heatmap on admin + public dashboard | Frontend dev | Leaflet heatmap layer with seeded data |
| Mobile responsiveness check (all dashboards) | Frontend dev | Works on 375px viewport |
| ERS badge animation (CSS pulse on Critical/Expiring) | Frontend dev | Visual urgency in demo |
| Weekly digest email template | Backend dev | Preview in email client |
| Error handling: graceful fallbacks on CV/NLP failure | Frontend dev | Never blocks listing on AI failure |
| Deploy to Vercel, test full flow on production URL | Any | Live URL ready for judges |

**Hour 23–24: Demo Rehearsal**
- Rehearse the demo flow (below) at least twice
- Prepare fallback screenshots in case live demo fails
- Write a 1-page demo script with talking points

### 21.3 Demo Flow (5 Minutes)

```
0:00 — Open public impact dashboard:
       "48,000 meals rescued. This is what we're building toward."

0:40 — Admin verification:
       Show a pending donor application → walk through checklist → 
       click Approve → show the welcome email that fired.
       "No food business can list without going through this gate."

1:20 — Donor flow (photo intake):
       Logged in as MG Road Dhaba → tap "Donate Now" → take photo of food
       → watch CV fill in "Biryani · 20 servings · 4-hour window"
       → tap Confirm → listing goes live with ERS badge 🟢 28

1:50 — ERS live update:
       Fast-forward ERS to 84 (tweak the expiry time in demo data)
       → badge flips to 🔴 84 — show the escalation email that fired.

2:20 — Shelter view:
       Switch to Hope Shelter dashboard → see the listing at top (ERS sorted)
       → click Accept → watch status pipeline update in real time.

2:50 — Driver route:
       Switch to driver dashboard → show 3-stop optimized route with ERS badges
       → click Navigate → Google Maps opens with the route pre-loaded.

3:20 — Agentic dispatcher:
       Reset, set a listing with ERS 82 and no shelter response → 
       wait 10 seconds (demo timer compressed) → agent fires →
       show the agent log: "Auto-confirmed Hope Shelter — reasoning: closest, 
       capacity available, reliability 0.91"

4:00 — Delivery confirmation:
       Mark delivered → show the donor's impact email:
       "20 meals rescued · 8 kg diverted · 20 kg CO₂e avoided"
       → show the tax certificate PDF.

4:30 — Admin waste heatmap:
       "This is where the city is losing food every day.
        This is where we need more drivers."

4:50 — Close:
       "Zero friction for donors. Autonomous dispatch for urgency.
        Real impact for shelters. And verified at every step."
```

---

## 22. What Makes This Win

### 22.1 Against Other Teams on Track A

Most teams will build a listing board with a map and basic matching. Here is what differentiates this submission:

| Differentiator | What Other Teams Build | What This System Builds |
|---|---|---|
| **Donor Onboarding** | Self-register and list immediately | Admin-verified FSSAI/GST/Phone gate — no unvetted food on platform |
| **Intake UX** | A form | Photo → CV → pre-filled form — listing in 25 seconds |
| **Urgency logic** | "Expires tonight" label | ERS: a 0–100 live score driving sorting, emails, and agent triggers |
| **Dispatch** | Admin manually assigns drivers | Agentic dispatcher activates autonomously when ERS crosses threshold |
| **Driver routing** | One pickup per driver | Multi-stop route optimization with OSRM — more food rescued per trip |
| **Trust** | Anyone can list anything | Every donor verified; every delivery tracked; agent decisions audited |
| **Impact** | "Thank you for donating" | Tax certificate PDF, CO₂e calculation, ESG report, public dashboard |

### 22.2 The Core Thesis

> **Friction = food in the dumpster. The system that reduces friction the most wins — not just the hackathon, but the real problem.**

The verification gate seems to add friction, but it does the opposite: shelters trust verified donors, so they accept faster — which means more food rescued. The CV intake removes the friction of filling forms. The agentic dispatcher removes the friction of waiting for human coordination at 10 PM when no admin is online.

Every design decision in this system asks: *whose friction is this, and how do we move it to the system instead of the human?*

### 22.3 Real-World Readiness Signals (What Judges Notice)

- **Verified donor pipeline** — shows understanding that real food safety compliance is non-negotiable
- **FSSAI + GST tracking** — shows India-specific regulatory knowledge
- **Agent decision audit log** — shows understanding that autonomous systems need human oversight
- **CO₂e calculation with EPA WARM footnote** — shows understanding of ESG reporting standards
- **Tax certificate with QR code** — shows understanding of what actually incentivizes donors
- **SMTP retry logic with bounce handling** — shows production-thinking, not just a happy-path demo

---

*Software Requirements Specification — AnnaSetu · AmiHacks · Track A*  
*Version 1.0 · SMTP-only notifications · Admin-verified donor onboarding*
