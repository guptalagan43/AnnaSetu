# Design System — AnnaSetu
**Visual Reference:** https://dribbble.com/shots/26920639  
**Design Philosophy:** Brutalist Web Design × Maximalist Retro Collage × Social Impact  
**Version:** 1.0

---

## 1. Design Philosophy

AnnaSetu's UI is built on **Brutalist Web Design** principles with strong **Retro Collage** maximalism — the same energy as the Chompo restaurant site reference. This is a bold, loud, unapologetic aesthetic that communicates **urgency, trust, and community** — perfectly suited to a food rescue platform where seconds matter.

### Core Principles
- **Raw honesty** — no rounded corners, no drop shadows, hard visible borders
- **Oversized typography** — headlines dominate space, numbers shout
- **High contrast** — maximum legibility, maximum visual impact
- **Irregularity** — intentional asymmetry, organic layout breaks
- **Utility over decoration** — every visual element earns its place
- **Urgency through colour** — the ERS colour system IS the design language

---

## 2. Colour Palette

### Primary Palette
```css
:root {
  /* Core Brand */
  --color-black: #0A0A0A;           /* Nearly-black — primary text, borders */
  --color-white: #F5F0E8;           /* Warm off-white — background base */
  --color-red: #D42B2B;             /* AnnaSetu red — primary accent, CTAs */
  --color-red-dark: #A01E1E;        /* Darker red — hover state */
  --color-cream: #EDE8DC;           /* Secondary background */
  --color-ink: #1A1A1A;             /* Body text */

  /* ERS Urgency System (the UI's most important colour grammar) */
  --ers-green: #2D8A3E;             /* ERS 0–39 — Safe */
  --ers-green-bg: #E8F5EA;
  --ers-yellow: #C8961A;            /* ERS 40–59 — Caution */
  --ers-yellow-bg: #FEF7E0;
  --ers-orange: #D4620A;            /* ERS 60–79 — Warning */
  --ers-orange-bg: #FDF0E4;
  --ers-red: #C4201F;               /* ERS 80–94 — Critical */
  --ers-red-bg: #FDE8E8;
  --ers-black: #1A0A0A;             /* ERS 95–100 — Emergency */
  --ers-black-bg: #F0E8E8;
  --ers-black-text: #F5F0E8;        /* White text on black emergency badge */

  /* System Colours */
  --color-border: #0A0A0A;          /* All borders — always full black */
  --color-border-width: 2px;        /* Standard border weight */
  --color-border-width-heavy: 4px;  /* Heavy borders (cards, modals) */
  --color-shadow: #0A0A0A;          /* Hard shadow colour */
}
```

### Usage Rules
- **Background:** `--color-white` (#F5F0E8) — warm, not pure white
- **Cards / surfaces:** `--color-cream` (#EDE8DC)
- **All borders:** `--color-black` — no grey, no subtle — hard black lines only
- **Primary CTA buttons:** `--color-red` background + `--color-white` text
- **Secondary buttons:** `--color-black` background + `--color-white` text
- **Ghost/outline buttons:** transparent + `--color-black` border + `--color-black` text
- **Never use** gradients, semi-transparent overlays, or box-shadows with blur radius > 0

---

## 3. Typography

### Typeface Stack

| Role | Font | Fallback | Weight |
|---|---|---|---|
| **Display / Hero** | Bebas Neue | Impact, Arial Black, sans-serif | 400 |
| **Body / UI** | Space Grotesk | Inter, system-ui, sans-serif | 300, 400, 500, 700 |
| **Monospace** | JetBrains Mono | Courier New, monospace | 400, 700 |

**Self-host via:** Google Fonts (`fonts.googleapis.com`) — import in `app/layout.tsx`

```html
<!-- In layout.tsx <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@300;400;500;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
```

### Type Scale (Tailwind Custom Classes)

```css
/* Add to tailwind.config.ts under theme.extend */
fontSize: {
  'display-2xl': ['96px', { lineHeight: '0.95', letterSpacing: '-0.02em' }],  /* Hero numbers */
  'display-xl': ['72px', { lineHeight: '1', letterSpacing: '-0.015em' }],     /* Page titles */
  'display-lg': ['56px', { lineHeight: '1.05', letterSpacing: '-0.01em' }],   /* Section heads */
  'display-md': ['42px', { lineHeight: '1.1', letterSpacing: '-0.01em' }],    /* Card headlines */
  'display-sm': ['32px', { lineHeight: '1.15', letterSpacing: '-0.005em' }],  /* Sub-headlines */
  'body-xl': ['20px', { lineHeight: '1.5', letterSpacing: '0' }],
  'body-lg': ['18px', { lineHeight: '1.6', letterSpacing: '0' }],
  'body-md': ['16px', { lineHeight: '1.6', letterSpacing: '0' }],
  'body-sm': ['14px', { lineHeight: '1.5', letterSpacing: '0.01em' }],
  'label': ['12px', { lineHeight: '1.4', letterSpacing: '0.08em' }],           /* Caps labels */
}
```

### Typography Rules
- **Bebas Neue** = only for display text, impact counters, hero headlines, large ERS numbers
- **Space Grotesk** = all body copy, navigation, forms, buttons, labels
- **Never mix** more than 2 typefaces in a single view
- **All-caps labels** use Space Grotesk 700 + `letter-spacing: 0.08em`
- **ERS numbers** always use Bebas Neue — the urgency is communicated through size + colour

---

## 4. Spacing & Grid

```css
/* Tailwind custom spacing */
spacing: {
  '18': '72px',
  '22': '88px',
  '26': '104px',
}
```

### Grid System
- **Desktop:** 12-column grid, 24px gutters, 80px outer margin
- **Tablet (768px):** 8-column grid, 16px gutters, 40px outer margin
- **Mobile (375px):** 4-column grid, 16px gutters, 20px outer margin

### Layout Principles
- **Intentional asymmetry:** Main content 8 cols + sidebar 4 cols (not centered layouts)
- **Breathing room:** Sections separated by 80px (desktop) / 48px (mobile) vertical space
- **Dense information:** Dashboard cards are information-dense, not spacious
- **Horizontal scrolling elements:** Category pills, food tags — overflow-x: auto, no wrap

---

## 5. Component Specifications

### 5.1 Card
```tsx
// The AnnaSetu brutalist card — hard border, hard shadow, no radius
<div className="
  bg-cream border-2 border-black 
  shadow-[4px_4px_0px_0px_#0A0A0A]
  p-6
  transition-transform hover:-translate-y-0.5
  hover:shadow-[6px_6px_0px_0px_#0A0A0A]
">
```

### 5.2 Button Variants

```tsx
// PRIMARY — Red filled
<button className="
  bg-red-600 text-[#F5F0E8] 
  border-2 border-black 
  shadow-[3px_3px_0px_0px_#0A0A0A]
  px-6 py-3 font-bold uppercase tracking-widest
  text-sm font-[Space_Grotesk]
  hover:bg-red-700 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none
  transition-all
">
  DONATE NOW
</button>

// SECONDARY — Black filled
<button className="
  bg-black text-[#F5F0E8]
  border-2 border-black
  shadow-[3px_3px_0px_0px_#D42B2B]   /* Red shadow variant */
  px-6 py-3 font-bold uppercase tracking-widest text-sm
  hover:bg-[#1A1A1A] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none
  transition-all
">
  VIEW ALL
</button>

// GHOST — Outline only
<button className="
  bg-transparent text-black
  border-2 border-black
  px-6 py-3 font-bold uppercase tracking-widest text-sm
  hover:bg-black hover:text-[#F5F0E8]
  transition-all
">
  DECLINE
</button>
```

### 5.3 ERS Badge
```tsx
// ERS Badge — the most important UI component
const ersConfig = {
  'safe':      { range: [0, 39],   bg: '#2D8A3E', text: '#F5F0E8', label: 'SAFE' },
  'caution':   { range: [40, 59],  bg: '#C8961A', text: '#F5F0E8', label: 'CAUTION' },
  'warning':   { range: [60, 79],  bg: '#D4620A', text: '#F5F0E8', label: 'WARNING' },
  'critical':  { range: [80, 94],  bg: '#C4201F', text: '#F5F0E8', label: 'CRITICAL', pulse: true },
  'emergency': { range: [95, 100], bg: '#1A0A0A', text: '#F5F0E8', label: 'EMERGENCY', pulse: true },
}

// CSS pulse animation for Critical/Emergency
@keyframes ers-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.03); }
}
.ers-pulse { animation: ers-pulse 1.2s ease-in-out infinite; }
```

### 5.4 Input Fields
```tsx
<input className="
  w-full bg-[#F5F0E8] text-black
  border-2 border-black
  px-4 py-3
  text-body-md font-[Space_Grotesk]
  placeholder:text-gray-400
  focus:outline-none focus:border-red-600 focus:shadow-[2px_2px_0px_0px_#D42B2B]
  transition-shadow
"/>
```

### 5.5 Data Tables (Admin Views)
- Full-width, no rounded corners
- `border-collapse: collapse` — grid lines visible
- Header row: `bg-black text-white` + Bebas Neue uppercase
- Alternating row: `bg-cream` / `bg-white`
- Row hover: `bg-[#F5F0E8]` + left border `4px solid #D42B2B`

### 5.6 Navigation
```
Desktop sidebar:
- Black background (#0A0A0A)
- Logo at top: "ANNA · SETU" in Bebas Neue — stacked
- Nav items: Space Grotesk 500, white text
- Active item: Red left border (4px) + slightly brighter text
- Role badge at bottom: white pill with role name

Mobile:
- Hamburger icon top-left
- Full-screen overlay drawer, same black background
```

### 5.7 Map Styling (Leaflet)
- Tile layer: `CartoDB.DarkMatter` or `Stamen.Toner` — matches brutalist dark aesthetic
- Listing markers: Custom SVG — red circle with black border + ERS number inside
- Shelter markers: Black pin
- Driver markers: White pin with black border
- Route line: `#D42B2B` (red), 3px weight, dashed

---

## 6. Page-Specific Design

### 6.1 Landing Page (Public)
```
Layout:
- Full-viewport hero: "ANNA · SETU" in Bebas Neue 96px
- Subhead: "Real-time food rescue — from restaurant to shelter in minutes"
- Red CTA button: "GET STARTED" + Ghost button: "HOW IT WORKS"
- Below fold: 3-column feature summary (brutalist card grid)
- Impact counter strip: Bebas Neue numbers on black background
- Marquee text strip (like Chompo): "ZERO WASTE · ZERO FRICTION · ZERO HUNGER"
```

### 6.2 Donor Dashboard
```
Layout:
- Greeting header: "WELCOME BACK, [NAME]" — Bebas Neue 56px
- Stats row: 4 metric tiles (active listings, meals rescued, ERS alerts, this month)
- Primary CTA: Big red "POST FOOD NOW" button — always visible
- Listings table/grid: sorted by ERS descending — most urgent first
- Quick relist: icon button on each past listing
```

### 6.3 Public Impact Dashboard
```
Layout:
- Dark hero section (black bg): giant Bebas Neue counter numbers
  "48,219" — white, enormous — "MEALS RESCUED"
- Secondary counters in a row below
- Full-width Leaflet heatmap (red → orange → yellow density)
- Live activity ticker: scrolling strip of recent donations
- "JOIN THE MISSION" CTA strip at bottom
```

### 6.4 Admin Verification Queue
```
Layout:
- Page title: "VERIFICATION QUEUE" — Bebas Neue 56px
- Filter tabs: ALL | PENDING | UNDER REVIEW | APPROVED | REJECTED
- Table view: business name, type, FSSAI number, submission date, status badge, action buttons
- No cards — table is correct for this density of information
```

### 6.5 ERS Alert Email Template
```
Design: Matches web — white background, bold black borders
Header: Red block with "⚠️ URGENT FOOD ALERT" in white Bebas Neue
Body: ERS badge + listing title + expiry countdown
CTA: Red button "ACCEPT NOW"
Footer: Black strip with AnnaSetu wordmark
```

---

## 7. Illustration Style

Follow the hand-drawn illustration style from the Chompo reference:
- **Black-and-white line illustrations** — food items, trucks, community figures
- **Thick stroke weight** (3-4px equivalent in SVG)
- **Slightly imperfect / hand-drawn quality** — not perfectly geometric
- **Used as:** listing category icons, empty state illustrations, onboarding graphics

Illustration slots needed:
1. Empty state: "No listings yet" — illustrated empty bowl
2. Onboarding: Step-by-step illustrated sequence (camera → form → truck → shelter)
3. Verification pending: Illustrated clock/waiting state
4. Success / delivered: Illustrated handshake or smiling person

Source: Use Humaaans (humaaans.com — free) or draw simple SVGs matching the style.

---

## 8. Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-black':  '#0A0A0A',
        'brand-white':  '#F5F0E8',
        'brand-cream':  '#EDE8DC',
        'brand-red':    '#D42B2B',
        'brand-red-dk': '#A01E1E',
        'ers-safe':     '#2D8A3E',
        'ers-caution':  '#C8961A',
        'ers-warning':  '#D4620A',
        'ers-critical': '#C4201F',
        'ers-emergency':'#1A0A0A',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'Arial Black', 'sans-serif'],
        body:    ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'Courier New', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['96px',  { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-xl':  ['72px',  { lineHeight: '1',    letterSpacing: '-0.015em' }],
        'display-lg':  ['56px',  { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        'display-md':  ['42px',  { lineHeight: '1.1',  letterSpacing: '-0.01em' }],
        'display-sm':  ['32px',  { lineHeight: '1.15', letterSpacing: '-0.005em' }],
      },
      boxShadow: {
        'brutal':      '4px 4px 0px 0px #0A0A0A',
        'brutal-red':  '4px 4px 0px 0px #D42B2B',
        'brutal-sm':   '2px 2px 0px 0px #0A0A0A',
        'brutal-lg':   '8px 8px 0px 0px #0A0A0A',
        'brutal-hover':'6px 6px 0px 0px #0A0A0A',
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
      animation: {
        'ers-pulse': 'ers-pulse 1.2s ease-in-out infinite',
        'ticker':    'ticker 30s linear infinite',
        'counter':   'counter 1.5s ease-out forwards',
      },
      keyframes: {
        'ers-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.85', transform: 'scale(1.03)' },
        },
        'ticker': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Notes |
|---|---|---|
| `sm` | 640px | Small mobile |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide desktop |
| `2xl` | 1536px | Ultra-wide |

### Mobile-First Rules
- All font sizes reduce by ~20% on mobile
- Cards stack to single column at < 768px
- Sidebar collapses to drawer at < 1024px
- Map components height: `400px` mobile / `600px` desktop
- Tables become horizontally scrollable at < 768px (never hide columns)

---

## 10. Motion & Animation

**Rule:** Functional animation only. No decoration-only animations.

| Animation | Where | Duration | Easing |
|---|---|---|---|
| ERS pulse | Critical/Emergency badges | 1.2s loop | ease-in-out |
| Impact counter count-up | Public dashboard on load | 1.5s | ease-out |
| Activity ticker | Live activity strip | 30s loop | linear |
| Button press | All buttons | 100ms | immediate |
| Card hover | All listing cards | 150ms | ease-out |
| Page transition | Dashboard route changes | 200ms fade | ease-in-out |
| Toast entrance | Notifications | 200ms slide-up | ease-out |

**Never animate:** Background colours, border colours, typography size/weight, layout shifts.

---

## 11. Accessibility

- All colour combinations must meet WCAG AA contrast (4.5:1 for text)
- ERS badges use both colour AND text label (never colour alone)
- All interactive elements have visible focus state (2px red outline, 2px offset)
- All icons have `aria-label` or adjacent text label
- Form errors shown as text below field, not only red border
- Keyboard navigation works through all dashboard flows
- Skip-to-content link at top of every page
