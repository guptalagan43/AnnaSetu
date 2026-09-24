# Rules — AnnaSetu
**Libraries, Constraints, Error Handling & AI Boundaries**  
**Version:** 1.0

---

## 1. Allowed Libraries & Tools

### Frontend
| Library | Version | Purpose | Notes |
|---|---|---|---|
| `next` | 15.x | Full-stack React framework | App Router only — no Pages Router |
| `react` | 19.x | UI library | — |
| `tailwindcss` | 4.x | Utility CSS | Use custom brutalist config from `design.md` |
| `leaflet` | 1.9.x | Maps + heatmap | Import with `dynamic()` (no SSR) |
| `react-leaflet` | 4.x | Leaflet React wrapper | — |
| `leaflet.heat` | 0.2.x | Heatmap layer | — |
| `react-email` | Latest | Email component templates | Server-side render only |
| `lucide-react` | Latest | Icons | Minimal use only — prefer custom SVG |
| `recharts` | 2.x | Charts on impact dashboard | Only where data visualization is essential |
| `react-dropzone` | 14.x | File upload UX | For FSSAI docs and food photos |
| `react-hook-form` | 7.x | Form state management | Required for all forms |
| `zod` | 3.x | Client-side validation | Mirror server schemas |
| `sonner` | Latest | Toast notifications | Minimal use |
| `clsx` + `tailwind-merge` | Latest | Conditional classnames | Use `cn()` utility |

### Backend / Server
| Library | Purpose | Notes |
|---|---|---|
| `@supabase/supabase-js` | DB client + Auth | Use server client in API routes |
| `@supabase/ssr` | Server-side Supabase | Cookie-based auth in middleware |
| `jsonwebtoken` | JWT sign/verify | Wrap in `lib/auth/` module |
| `zod` | API request validation | Validate every incoming body |
| `nodemailer` | SMTP email sending | Always queue via BullMQ, never send inline |
| `bullmq` | Job queues + cron | All background work goes through queues |
| `@upstash/redis` | Redis client | ERS cache + BullMQ backend |
| `@upstash/ratelimit` | Rate limiting | Apply to all public routes |
| `@google/generative-ai` | Gemini API (CV + NLP) | Always wrap in try/catch with fallback |
| `pdfkit` | PDF generation | Tax certificates only |
| `sharp` | Image resize before CV | Resize to 1024px before sending to Gemini |

### Dev / Tooling
| Tool | Purpose |
|---|---|
| TypeScript 5.x | Strict mode enabled (`strict: true`) |
| ESLint + `eslint-config-next` | Linting |
| Prettier | Formatting |
| `tsx` | Run TypeScript scripts (seed, migrations) |

---

## 2. Prohibited Libraries & Patterns

### Never Use
| Prohibited | Why | Use Instead |
|---|---|---|
| `shadcn/ui` | Generic look conflicts with brutalist design | Custom components from `components/ui/` |
| `@radix-ui/*` (direct) | Over-engineered for this scope | Plain HTML + CSS |
| `prisma` | Adds migration overhead; Supabase client is sufficient | `@supabase/supabase-js` |
| `axios` | Unnecessary wrapper | Native `fetch` |
| `moment.js` | Deprecated, bloated | `date-fns` or native `Intl` |
| `lodash` | Bundle weight | Inline utilities |
| `styled-components` / `emotion` | Runtime CSS-in-JS | Tailwind classes only |
| `next-auth` | Conflicts with Supabase Auth | Supabase Auth + custom JWT middleware |
| `socket.io` | WebSocket server complexity | 30-second polling or Supabase Realtime |
| `redux` / `zustand` | Overkill for this scope | React context + `useState` / `useReducer` |
| `framer-motion` | Performance overhead; excessive animation | CSS transitions only |
| `openai` SDK | Not using OpenAI | `@google/generative-ai` |
| Any CDN-loaded scripts in HTML | CSP violations | npm packages only |
| `eval()` / `Function()` | XSS risk | Never |
| `dangerouslySetInnerHTML` | XSS risk | Never (except sanitized email preview) |

### Never Do
- Never store secrets in client-side code or expose API keys in the browser
- Never call AI APIs directly from the client — always proxy through API routes
- Never block the main thread with heavy computation — use BullMQ workers
- Never skip Zod validation on API route inputs
- Never bypass RLS by using the service role key on the client
- Never commit `.env.local` — use `.env.example` with placeholder values
- Never run `npm install` for a library without first checking the allowed list above
- Never use `any` TypeScript type — use `unknown` and narrow properly
- Never use synchronous SMTP sends inline in API routes — always queue

---

## 3. Code Style Rules

### TypeScript
```typescript
// ✅ CORRECT — explicit return types on all functions
export async function calculateERS(listing: Listing): Promise<number> { ... }

// ✅ CORRECT — Zod validation at route entry
const body = ListingSchema.parse(await request.json())

// ❌ WRONG — no validation
const body = await request.json()

// ✅ CORRECT — narrow unknown errors
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  return NextResponse.json({ error: message }, { status: 500 })
}

// ❌ WRONG — catch any
} catch (error: any) {
  return NextResponse.json({ error: error.message })
}
```

### API Routes
- All routes return `{ data, error }` shaped responses
- HTTP status codes must be meaningful (201 for created, 422 for validation, 403 for auth)
- All routes must be wrapped in a try/catch
- Log errors with context (listing_id, user_id) before returning error response

### Components
- One component per file
- Props typed with `interface`, not `type` (prefer interface for extendable shapes)
- No inline styles — Tailwind classes only
- `"use client"` directive only on components that need browser APIs or event handlers
- Everything else is a Server Component by default

---

## 4. Error Handling Rules

### Hierarchy

```
Level 1: Zod validation (before any processing)
Level 2: Business logic validation (e.g., listing not found, donor not verified)
Level 3: External service errors (Supabase, Gemini, SMTP, OSRM)
Level 4: Unexpected errors (catch-all with logging)
```

### Standard Error Response Shape
```typescript
interface ApiError {
  error: string        // Human-readable message (never expose stack traces)
  code?: string        // Machine-readable code (e.g., "DONOR_NOT_VERIFIED")
  field?: string       // For validation errors: which field failed
}
```

### AI Fallback Rules (Critical)
The AI (CV + NLP) must NEVER block a user from listing food. If AI fails:

```typescript
// ✅ CORRECT — graceful degradation
try {
  const result = await geminiVision(imageBuffer)
  return { ...result, intake_method: 'cv' }
} catch (error) {
  console.error('[CV] Gemini Vision failed:', error)
  // Return empty pre-fill — user fills form manually
  return {
    food_category: null,
    estimated_servings: null,
    confidence: 0,
    intake_method: 'manual',
    ai_error: 'Photo analysis unavailable — please fill in manually'
  }
}
```

### SMTP Error Rules
- All emails go through BullMQ email queue — never inline `sendMail()`
- Retry policy: 3 attempts, exponential backoff (1min → 4min → 9min)
- After 3 failures: log to `email_logs` table with `status: 'failed'`
- Critical emails (verification approved/rejected, ERS alert) get priority queue
- Never throw if email fails — log and continue

### Database Error Rules
- Always check for `error` from Supabase before accessing `data`
- Use typed error codes for known Supabase errors (e.g., unique violation = 23505)
- Never expose raw PostgreSQL error messages to clients

### Cron / Queue Job Rules
- Each job must be idempotent (safe to run twice)
- Each job logs its start, completion, and any per-item errors
- ERS cron processes listings in batches of 50 max per run
- Dispatcher cron checks `agent_logs` before acting to prevent duplicate actions

---

## 5. AI Boundaries (Gemini API)

### What AI May Do
- Parse a food photo and return: `food_category`, `estimated_servings`, `confidence_score`
- Parse free-text description and return: structured `listing` fields as JSON
- Support the Agentic Dispatcher's reasoning for match selection (advisory only)

### What AI Must NOT Do
- AI must never have write access to the database directly
- AI reasoning must never override human admin decisions
- AI must never expose personal data (donor PAN, FSSAI number) in prompts
- AI must never be used to evaluate food safety compliance — that requires human checklist
- AI confidence < 0.5 must display a warning: *"Low confidence — please verify before confirming"*
- AI output must always be validated through Zod before being used

### Agentic Dispatcher Boundaries
```
The dispatcher MAY:
  - AUTO_CONFIRM_SHELTER: if ERS > 80, timeout exceeded, shelter has accepts_auto_confirm = true
  - ASSIGN_DRIVER: if a verified driver is available and within range
  - ESCALATE_TO_ADMIN: if no shelter or driver is available

The dispatcher MUST NOT:
  - Override an admin's manual rejection
  - Reassign a driver who has already confirmed a pickup
  - Auto-confirm a shelter that has set accepts_auto_confirm = false
  - Take any action when admin has manually locked a listing

Every action the dispatcher takes MUST:
  - Be logged in agent_logs with reasoning + confidence
  - Be reversible by an admin within 5 minutes
  - Send an SMTP notification to all affected parties
```

### Prompt Rules
- System prompts must not include user PII
- Always include a JSON-only output instruction: *"Respond ONLY with valid JSON. No markdown, no explanation."*
- Always include a fallback instruction: *"If you cannot determine a field, return null for that field."*
- Max token budget: 1000 for CV, 500 for NLP
- Model: `gemini-2.0-flash` (fastest + free quota)

---

## 6. Environment & Deployment Rules

- Vercel is the only deployment target — no Docker, no self-hosting for hackathon
- All environment variables must be set in Vercel Dashboard before deploy
- Supabase migrations run via Supabase CLI (`supabase db push`) — never raw psql in prod
- Vercel Cron Jobs (in `vercel.json`) trigger the ERS and dispatcher queues
- Never use `process.env` on the client — use `NEXT_PUBLIC_` prefix and only for non-sensitive config

```json
// vercel.json — cron configuration
{
  "crons": [
    { "path": "/api/webhooks/cron?job=ers", "schedule": "*/15 * * * *" },
    { "path": "/api/webhooks/cron?job=dispatcher", "schedule": "*/2 * * * *" },
    { "path": "/api/webhooks/cron?job=digest", "schedule": "0 8 * * 1" }
  ]
}
```

---

## 7. Git Rules (for Hackathon Documentation)

- Branch naming: `phase/XX-feature-name` (e.g., `phase/03-listing-form`)
- Commit message format: `[Phase XX] Short description`
- Each phase ends with a PR into `main` (for judge visibility)
- `main` must always be deployable
- Never force-push to `main`
- Seed data script committed to `scripts/seed.ts` — runnable independently
