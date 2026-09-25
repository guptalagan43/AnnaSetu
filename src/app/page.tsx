import Link from "next/link";
import { Hero3DCanvas } from "@/components/landing/Hero3DCanvas";
import { SimulatedDispatchHUD } from "@/components/landing/SimulatedDispatchHUD";
import { ErsInteractiveSimulator } from "@/components/landing/ErsInteractiveSimulator";
import { LandingFaq } from "@/components/landing/LandingFaq";

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-white text-brand-black overflow-x-hidden">
      {/* ─── 1. TOP ANNOUNCEMENT BAR ─────────────────────────────────────── */}
      <div className="bg-brand-black text-brand-white border-b-2 border-brand-red py-2 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="font-bold">GRID ACTIVE:</span>
            <span className="text-brand-white/80 hidden sm:inline">
              1,420 kg rescued in the last 24 hours across Bengaluru & NCR
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/public-impact" className="text-brand-red font-bold hover:underline">
              LIVE IMPACT HEATMAP →
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN NAVIGATION ─────────────────────────────────────────── */}
      <header className="border-b-4 border-brand-black bg-brand-cream sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <span className="font-display text-3xl md:text-4xl tracking-tight group-hover:text-brand-red transition-colors">
              ANNA
            </span>
            <span className="w-px h-8 bg-brand-black"></span>
            <span className="font-display text-3xl md:text-4xl tracking-tight text-brand-red">
              SETU
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 font-mono text-xs font-bold uppercase tracking-wider">
            <a href="#how-it-works" className="hover:text-brand-red transition-colors">
              How It Works
            </a>
            <a href="#telemetry" className="hover:text-brand-red transition-colors">
              Live Telemetry
            </a>
            <a href="#ers-engine" className="hover:text-brand-red transition-colors">
              ERS Engine
            </a>
            <a href="#ecosystem" className="hover:text-brand-red transition-colors">
              Ecosystem
            </a>
            <a href="#safety" className="hover:text-brand-red transition-colors">
              Safety & Law
            </a>
            <a href="#faq" className="hover:text-brand-red transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-xs py-2 px-4">
              SIGN IN
            </Link>
            <Link href="/register" className="btn-primary text-xs py-2 px-4">
              JOIN NETWORK →
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* ─── 3. IMMERSIVE 3D HERO SECTION ───────────────────────────────── */}
        <section className="relative min-h-[92vh] flex flex-col justify-center border-b-4 border-brand-black overflow-hidden bg-brand-cream">
          {/* 3D Background Canvas with moving crates and logistics arcs */}
          <Hero3DCanvas />

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24 text-center">
            {/* Live Status Badge */}
            <div className="inline-flex items-center gap-2 bg-brand-white border-2 border-brand-black px-4 py-1.5 shadow-brutal mb-6">
              <span className="w-2.5 h-2.5 bg-brand-red rounded-none animate-pulse"></span>
              <span className="font-mono text-xs font-bold text-brand-black tracking-wider uppercase">
                AUTONOMOUS FOOD RESCUE INFRASTRUCTURE · SUB-15 MIN DISPATCH
              </span>
            </div>

            {/* Giant Brutalist Heading */}
            <h1 className="font-display text-display-xl md:text-[6rem] lg:text-[7.5rem] text-brand-black leading-[0.92] tracking-tight mb-8">
              FROM RESTAURANT TO SHELTER IN <span className="text-brand-red">MINUTES</span>
            </h1>

            <p className="font-body text-body-lg md:text-body-xl text-brand-black/80 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              Zero food waste. Zero human delay. Zero hunger. AnnaSetu is India&apos;s
              first agentic logistics grid connecting commercial surplus food to hungry shelters
              using AI visual inspection and instant proximity dispatch.
            </p>

            {/* Call To Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/register?role=donor_admin" className="w-full sm:w-auto btn-primary text-base py-4 px-8 tracking-wide">
                DONATE SURPLUS FOOD →
              </Link>
              <Link href="/register?role=shelter_admin" className="w-full sm:w-auto btn-secondary text-base py-4 px-8 tracking-wide">
                REGISTER AS SHELTER
              </Link>
              <Link href="/register?role=verified_driver" className="w-full sm:w-auto btn-ghost text-base py-4 px-6 tracking-wide">
                VOLUNTEER DRIVER
              </Link>
            </div>

            {/* 3D Interactive Telemetry HUD Preview */}
            <div id="telemetry" className="max-w-4xl mx-auto text-left pt-6">
              <SimulatedDispatchHUD />
            </div>
          </div>
        </section>

        {/* ─── 4. LIVE METRICS COUNTER BAR ─────────────────────────────────── */}
        <section className="bg-brand-black text-brand-white py-12 border-b-4 border-brand-black">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-brand-white/10">
              <div className="pt-4 lg:pt-0">
                <div className="font-display text-display-xl text-brand-red font-black">48,320+</div>
                <div className="font-mono text-xs text-brand-white/70 tracking-widest uppercase mt-1">
                  MEALS RESCUED
                </div>
              </div>
              <div className="pt-4 lg:pt-0">
                <div className="font-display text-display-xl text-brand-white font-black">17,842</div>
                <div className="font-mono text-xs text-brand-white/70 tracking-widest uppercase mt-1">
                  KG DIVERTED FROM LANDFILL
                </div>
              </div>
              <div className="pt-4 lg:pt-0">
                <div className="font-display text-display-xl text-brand-red font-black">44,605</div>
                <div className="font-mono text-xs text-brand-white/70 tracking-widest uppercase mt-1">
                  KG CO₂e PREVENTED (WARM)
                </div>
              </div>
              <div className="pt-4 lg:pt-0">
                <div className="font-display text-display-xl text-brand-white font-black">14.2m</div>
                <div className="font-mono text-xs text-brand-white/70 tracking-widest uppercase mt-1">
                  AVG MATCH-TO-DISPATCH TIME
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 5. ARCHITECTURE / HOW IT WORKS ─────────────────────────────── */}
        <section id="how-it-works" className="py-24 border-b-4 border-brand-black bg-brand-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="font-mono text-xs font-bold bg-brand-red text-brand-white px-3 py-1">
                4-STAGE LOGISTICS PIPELINE
              </span>
              <h2 className="font-display text-display-lg text-brand-black mt-3">
                HOW ANNASETU WORKS
              </h2>
              <p className="font-body text-body-md text-brand-black/70 mt-2">
                Engineered to eliminate administrative friction so perishable meals reach hungry mouths before spoiling.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="brutal-card bg-brand-cream border-4 border-brand-black p-6 flex flex-col justify-between">
                <div>
                  <div className="font-display text-6xl text-brand-red font-black mb-3">01</div>
                  <h3 className="font-display text-2xl text-brand-black mb-2">INSTANT AI INTAKE</h3>
                  <p className="font-body text-body-sm text-brand-black/80 leading-relaxed">
                    Donors snap a photograph or speak. Multimodal Gemini 2.0 automatically recognizes meal category, estimates servings, and fills the manifest in seconds.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t-2 border-brand-black/20 font-mono text-[11px] text-brand-black/60 font-bold">
                  ⚡ Voice & CV Auto-Complete
                </div>
              </div>

              <div className="brutal-card bg-brand-cream border-4 border-brand-black p-6 flex flex-col justify-between">
                <div>
                  <div className="font-display text-6xl text-brand-black font-black mb-3">02</div>
                  <h3 className="font-display text-2xl text-brand-black mb-2">ERS HEURISTIC</h3>
                  <p className="font-body text-body-sm text-brand-black/80 leading-relaxed">
                    Our Expiry Risk Score dynamically evaluates food type, prep timestamp, and weather. Batches scoring ≥80 trigger autonomous direct dispatch.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t-2 border-brand-black/20 font-mono text-[11px] text-brand-black/60 font-bold">
                  ⚡ 5-Minute Auto-Confirm
                </div>
              </div>

              <div className="brutal-card bg-brand-cream border-4 border-brand-black p-6 flex flex-col justify-between">
                <div>
                  <div className="font-display text-6xl text-brand-red font-black mb-3">03</div>
                  <h3 className="font-display text-2xl text-brand-black mb-2">PROXIMITY ROUTING</h3>
                  <p className="font-body text-body-sm text-brand-black/80 leading-relaxed">
                    Verified volunteer drivers and insulated courier fleets receive turn-by-turn routing with shortest Haversine transit distance to prevent thermal loss.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t-2 border-brand-black/20 font-mono text-[11px] text-brand-black/60 font-bold">
                  ⚡ Live GPS Vehicle Radar
                </div>
              </div>

              <div className="brutal-card bg-brand-cream border-4 border-brand-black p-6 flex flex-col justify-between">
                <div>
                  <div className="font-display text-6xl text-brand-black font-black mb-3">04</div>
                  <h3 className="font-display text-2xl text-brand-black mb-2">PIN HANDOVER & 80G</h3>
                  <p className="font-body text-body-sm text-brand-black/80 leading-relaxed">
                    Shelters inspect food quality and sign off with a donor PIN. Official Section 80G tax certificates and EPA CO₂e reduction ledgers are generated on the spot.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t-2 border-brand-black/20 font-mono text-[11px] text-brand-black/60 font-bold">
                  ⚡ Automated PDF Tax Certificates
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 6. INTERACTIVE ERS ENGINE SIMULATOR ──────────────────────────── */}
        <section id="ers-engine" className="py-24 border-b-4 border-brand-black bg-brand-cream">
          <div className="max-w-6xl mx-auto px-6">
            <ErsInteractiveSimulator />
          </div>
        </section>

        {/* ─── 7. THE 4-PILLAR ECOSYSTEM ──────────────────────────────────── */}
        <section id="ecosystem" className="py-24 border-b-4 border-brand-black bg-brand-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="font-mono text-xs font-bold bg-brand-black text-brand-white px-3 py-1">
                CONNECTED STAKEHOLDERS
              </span>
              <h2 className="font-display text-display-lg text-brand-black mt-3">
                THE ANNASETU ECOSYSTEM
              </h2>
              <p className="font-body text-body-md text-brand-black/70 mt-2">
                Purpose-built dashboards tailored to every role in the food rescue supply chain.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Pillar 1: Donors */}
              <div className="border-4 border-brand-black bg-brand-cream p-8 brutal-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b-2 border-brand-black pb-3 mb-4">
                    <span className="text-4xl">🍱</span>
                    <span className="font-mono text-xs font-bold bg-brand-red text-brand-white px-2 py-0.5">
                      COMMERCIAL DONORS
                    </span>
                  </div>
                  <h3 className="font-display text-3xl text-brand-black mb-3">
                    HOTELS, RESTAURANTS & BANQUETS
                  </h3>
                  <p className="font-body text-body-md text-brand-black/80 leading-relaxed mb-6">
                    Turn unserved surplus into social impact and corporate tax deductions. Avoid landfill guilt and disposal costs with compliant digital handovers.
                  </p>
                  <ul className="space-y-2 font-mono text-xs text-brand-black/80 mb-6">
                    <li>✓ Section 80G Automated Tax Exemption PDF receipts</li>
                    <li>✓ Full Good Samaritan legal liability protection</li>
                    <li>✓ Real-time volunteer pickup tracking & verification PINs</li>
                  </ul>
                </div>
                <Link href="/register?role=donor_admin" className="btn-primary text-xs py-3 text-center">
                  BECOME A VERIFIED DONOR →
                </Link>
              </div>

              {/* Pillar 2: Shelters */}
              <div className="border-4 border-brand-black bg-brand-cream p-8 brutal-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b-2 border-brand-black pb-3 mb-4">
                    <span className="text-4xl">🏠</span>
                    <span className="font-mono text-xs font-bold bg-brand-black text-brand-white px-2 py-0.5">
                      RECEIVING CHARITIES
                    </span>
                  </div>
                  <h3 className="font-display text-3xl text-brand-black mb-3">
                    SHELTERS, ORPHANAGES & FOOD BANKS
                  </h3>
                  <p className="font-body text-body-md text-brand-black/80 leading-relaxed mb-6">
                    Access nutritious, freshly cooked meals delivered directly to your doorstep with zero financial cost, guaranteed temperature control, and dietary preferences.
                  </p>
                  <ul className="space-y-2 font-mono text-xs text-brand-black/80 mb-6">
                    <li>✓ 100% Free surplus food deliveries forever</li>
                    <li>✓ Live GPS driver tracking with arrival ETA notifications</li>
                    <li>✓ Digital safety inspection checklists & capacity limits</li>
                  </ul>
                </div>
                <Link href="/register?role=shelter_admin" className="btn-secondary text-xs py-3 text-center">
                  REGISTER YOUR SHELTER →
                </Link>
              </div>

              {/* Pillar 3: Drivers */}
              <div className="border-4 border-brand-black bg-brand-cream p-8 brutal-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b-2 border-brand-black pb-3 mb-4">
                    <span className="text-4xl">🚚</span>
                    <span className="font-mono text-xs font-bold bg-emerald-600 text-brand-white px-2 py-0.5">
                      LOGISTICS FLEET
                    </span>
                  </div>
                  <h3 className="font-display text-3xl text-brand-black mb-3">
                    VOLUNTEER & FLEET DRIVERS
                  </h3>
                  <p className="font-body text-body-md text-brand-black/80 leading-relaxed mb-6">
                    Be the lifeline connecting surplus kitchens to hungry children. Toggle availability whenever you have 30 minutes free and accept high-impact runs.
                  </p>
                  <ul className="space-y-2 font-mono text-xs text-brand-black/80 mb-6">
                    <li>✓ AI-optimized turn-by-turn pickup and drop routes</li>
                    <li>✓ Flexible scheduling: 2-wheelers, cars, and delivery vans</li>
                    <li>✓ National community impact leaderboard recognition</li>
                  </ul>
                </div>
                <Link href="/register?role=verified_driver" className="btn-primary text-xs py-3 text-center">
                  JOIN AS RESCUE DRIVER →
                </Link>
              </div>

              {/* Pillar 4: Network Coordinator */}
              <div className="border-4 border-brand-black bg-brand-cream p-8 brutal-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b-2 border-brand-black pb-3 mb-4">
                    <span className="text-4xl">🛡️</span>
                    <span className="font-mono text-xs font-bold bg-brand-black text-brand-white px-2 py-0.5">
                      NETWORK ADMIN
                    </span>
                  </div>
                  <h3 className="font-display text-3xl text-brand-black mb-3">
                    NETWORK COORDINATOR
                  </h3>
                  <p className="font-body text-body-md text-brand-black/80 leading-relaxed mb-6">
                    Regional coordinators overseeing the entire food redistribution network. Manage all shelters, NGOs, donors, and drivers from a single analytics dashboard.
                  </p>
                  <ul className="space-y-2 font-mono text-xs text-brand-black/80 mb-6">
                    <li>✓ Full network analytics &amp; redistribution metrics</li>
                    <li>✓ Manage all shelters, NGOs, donors &amp; drivers</li>
                    <li>✓ Real-time delivery monitoring &amp; alerts</li>
                  </ul>
                </div>
                <Link href="/register?role=shelter_coordinator" className="btn-ghost text-xs py-3 text-center">
                  JOIN AS COORDINATOR →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 8. SAFETY & LEGAL PROTOCOL ─────────────────────────────────── */}
        <section id="safety" className="py-24 border-b-4 border-brand-black bg-brand-cream">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-6">
                <span className="font-mono text-xs font-bold bg-brand-red text-brand-white px-3 py-1">
                  REGULATORY COMPLIANCE
                </span>
                <h2 className="font-display text-display-lg text-brand-black leading-tight">
                  RIGOROUS SAFETY & LEGAL ASSURANCE
                </h2>
                <p className="font-body text-body-md text-brand-black/80 leading-relaxed">
                  Food safety is not an afterthought—it is codified into our algorithms. We operate in strict conformity with Indian Good Samaritan statutes and FSSAI standards.
                </p>
                <div className="pt-2">
                  <Link href="/terms" className="btn-primary text-xs py-3 px-6">
                    READ COMPLETE LEGAL TERMS →
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border-4 border-brand-black bg-brand-white p-5 brutal-card">
                  <div className="text-3xl mb-2">🛡️</div>
                  <h4 className="font-display text-xl text-brand-black mb-2">GOOD SAMARITAN LAW</h4>
                  <p className="font-body text-xs text-brand-black/70 leading-relaxed">
                    Donors acting in good faith without negligence are shielded from civil and criminal liability under FSSAI 2019 regulations.
                  </p>
                </div>

                <div className="border-4 border-brand-black bg-brand-white p-5 brutal-card">
                  <div className="text-3xl mb-2">❄️</div>
                  <h4 className="font-display text-xl text-brand-black mb-2">COLD-CHAIN MONITORING</h4>
                  <p className="font-body text-xs text-brand-black/70 leading-relaxed">
                    Perishable dairy and cooked batches require thermal insulated transport bags with mandatory sensory checks at handover.
                  </p>
                </div>

                <div className="border-4 border-brand-black bg-brand-white p-5 brutal-card">
                  <div className="text-3xl mb-2">🏷️</div>
                  <h4 className="font-display text-xl text-brand-black mb-2">FSSAI VERIFICATION</h4>
                  <p className="font-body text-xs text-brand-black/70 leading-relaxed">
                    Commercial food businesses must provide verified 14-digit FSSAI licenses to ensure compliance with national food hygiene standards.
                  </p>
                </div>

                <div className="border-4 border-brand-black bg-brand-white p-5 brutal-card">
                  <div className="text-3xl mb-2">🔒</div>
                  <h4 className="font-display text-xl text-brand-black mb-2">DIGITAL PIN HANDOVER</h4>
                  <p className="font-body text-xs text-brand-black/70 leading-relaxed">
                    Deliveries can only be completed when the recipient coordinator inputs the donor&apos;s verification PIN after physical inspection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 9. FREQUENTLY ASKED QUESTIONS ──────────────────────────────── */}
        <section id="faq" className="py-24 border-b-4 border-brand-black bg-brand-white">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="font-mono text-xs font-bold bg-brand-black text-brand-white px-3 py-1">
                QUESTIONS & ANSWERS
              </span>
              <h2 className="font-display text-display-lg text-brand-black mt-3">
                FREQUENTLY ASKED QUESTIONS
              </h2>
              <p className="font-body text-body-md text-brand-black/70 mt-2">
                Everything you need to know about our legal structure, operations, and impact.
              </p>
            </div>

            <LandingFaq />
          </div>
        </section>

        {/* ─── 10. HIGH IMPACT FINAL CTA BANNER ────────────────────────────── */}
        <section className="py-24 bg-brand-red text-brand-white border-b-4 border-brand-black text-center relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 relative z-10 space-y-8">
            <h2 className="font-display text-display-xl md:text-7xl tracking-tight leading-[0.95]">
              STOP DUMPING EDIBLE FOOD.<br />START RESCUING LIVES.
            </h2>
            <p className="font-body text-body-xl max-w-2xl mx-auto text-brand-white/90 font-medium">
              Join thousands of restaurants, volunteer drivers, and relief charities building India&apos;s hunger-free future.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/register"
                className="w-full sm:w-auto bg-brand-black text-brand-white font-display text-xl px-10 py-5 border-4 border-brand-black hover:bg-brand-white hover:text-brand-black transition-all shadow-brutal"
              >
                CREATE ACCOUNT NOW →
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto bg-brand-white text-brand-black font-display text-xl px-10 py-5 border-4 border-brand-black hover:bg-brand-black hover:text-brand-white transition-all shadow-brutal"
              >
                SIGN IN TO DASHBOARD
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── 11. COMPREHENSIVE FOOTER ────────────────────────────────────── */}
      <footer className="bg-brand-black text-brand-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-2 space-y-4">
              <div className="font-display text-4xl tracking-tight">
                ANNA<span className="text-brand-red">·</span>SETU
              </div>
              <p className="font-body text-body-sm text-brand-white/70 max-w-sm leading-relaxed">
                National real-time surplus food redistribution infrastructure connecting commercial food donors to verified shelters in minutes.
              </p>
              <div className="font-mono text-xs text-brand-red font-bold">
                MISSION: ZERO WASTE · ZERO HUNGER
              </div>
            </div>

            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-brand-white/50 mb-4 font-bold">
                SOLUTIONS
              </h4>
              <ul className="space-y-2 font-body text-body-sm text-brand-white/80">
                <li><Link href="/register?role=donor_admin" className="hover:text-brand-red">Commercial Donors</Link></li>
                <li><Link href="/register?role=shelter_admin" className="hover:text-brand-red">Shelters & NGOs</Link></li>
                <li><Link href="/register?role=verified_driver" className="hover:text-brand-red">Volunteer Drivers</Link></li>
                <li><Link href="/register?role=shelter_coordinator" className="hover:text-brand-red">Network Coordinators</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-brand-white/50 mb-4 font-bold">
                PLATFORM
              </h4>
              <ul className="space-y-2 font-body text-body-sm text-brand-white/80">
                <li><Link href="/public-impact" className="hover:text-brand-red">Live Impact Heatmap</Link></li>
                <li><a href="#how-it-works" className="hover:text-brand-red">4-Stage Pipeline</a></li>
                <li><a href="#ers-engine" className="hover:text-brand-red">ERS Calculator</a></li>
                <li><Link href="/dev/components" className="hover:text-brand-red">Brutalist Design System</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-brand-white/50 mb-4 font-bold">
                LEGAL & POLICY
              </h4>
              <ul className="space-y-2 font-body text-body-sm text-brand-white/80">
                <li><Link href="/terms" className="hover:text-brand-red">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-brand-red">Privacy Policy</Link></li>
                <li><a href="#safety" className="hover:text-brand-red">FSSAI Compliance</a></li>
                <li><Link href="/login" className="hover:text-brand-red">Sign In Portal</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-brand-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-brand-white/40">
            <p>© 2026 AnnaSetu National Food Rescue Grid. Regulated under FSSAI Surplus Food Norms.</p>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="hover:text-brand-white">Terms</Link>
              <Link href="/privacy" className="hover:text-brand-white">Privacy</Link>
              <Link href="/login" className="hover:text-brand-white">Sign In</Link>
              <Link href="/register" className="hover:text-brand-white">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
