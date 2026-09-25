import { Logo } from "@/components/ui/Logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-white">
      <header className="border-b-2 border-brand-black">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo href="/" size="lg" />
          <nav className="hidden md:flex items-center gap-8">
            <a href="/register" className="btn-primary">GET STARTED</a>
            <a href="/public-impact" className="btn-ghost">LIVE IMPACT</a>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-brand-black opacity-5" />
          <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">
            <h1 className="font-display text-display-2xl text-brand-black leading-[0.95] mb-8">
              REAL-TIME FOOD RESCUE
            </h1>
            <p className="font-body text-body-xl text-brand-black max-w-3xl mx-auto mb-12 leading-relaxed">
              From restaurant to shelter in minutes. Zero waste. Zero friction. Zero hunger.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20">
              <a href="/register" className="btn-primary text-lg px-10 py-4">
                BECOME A DONOR
              </a>
              <a href="/public-impact" className="btn-secondary text-lg px-10 py-4">
                VIEW LIVE IMPACT
              </a>
            </div>
          </div>
        </section>

        <section className="py-20 border-y-2 border-brand-black">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex animate-ticker overflow-hidden">
              <div className="flex whitespace-nowrap gap-16 px-8">
                <span className="font-display text-4xl text-brand-black">ZERO WASTE</span>
                <span className="font-display text-4xl text-brand-red">ZERO FRICTION</span>
                <span className="font-display text-4xl text-brand-black">ZERO HUNGER</span>
                <span className="font-display text-4xl text-brand-red">ZERO WASTE</span>
                <span className="font-display text-4xl text-brand-black">ZERO FRICTION</span>
                <span className="font-display text-4xl text-brand-red">ZERO HUNGER</span>
              </div>
              <div className="flex whitespace-nowrap gap-16 px-8">
                <span className="font-display text-4xl text-brand-black">ZERO WASTE</span>
                <span className="font-display text-4xl text-brand-red">ZERO FRICTION</span>
                <span className="font-display text-4xl text-brand-black">ZERO HUNGER</span>
                <span className="font-display text-4xl text-brand-red">ZERO WASTE</span>
                <span className="font-display text-4xl text-brand-black">ZERO FRICTION</span>
                <span className="font-display text-4xl text-brand-red">ZERO HUNGER</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-display text-display-lg text-brand-black mb-12 text-center">
              HOW IT WORKS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <article className="brutal-card">
                <div className="font-display text-6xl text-brand-red mb-4">01</div>
                <h3 className="font-display text-display-sm text-brand-black mb-4">POST FOOD</h3>
                <p className="font-body text-body-md text-brand-black leading-relaxed">
                  Snap a photo or type a description. Our AI identifies the food, estimates servings, and fills the form in seconds.
                </p>
              </article>
              <article className="brutal-card">
                <div className="font-display text-6xl text-brand-red mb-4">02</div>
                <h3 className="font-display text-display-sm text-brand-black mb-4">AUTO-MATCH</h3>
                <p className="font-body text-body-md text-brand-black leading-relaxed">
                  Expiry Risk Score (ERS) drives instant matching to the nearest shelter with capacity and matching preferences.
                </p>
              </article>
              <article className="brutal-card">
                <div className="font-display text-6xl text-brand-red mb-4">03</div>
                <h3 className="font-display text-display-sm text-brand-black mb-4">DELIVER & VERIFY</h3>
                <p className="font-body text-body-md text-brand-black leading-relaxed">
                  Volunteer drivers follow optimized routes. Shelter confirms with 5-point checklist + donor PIN. Impact tracked automatically.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="py-20 bg-brand-black text-brand-white">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="font-display text-display-lg text-brand-white mb-8">
              LIVE IMPACT
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div>
                <div className="font-display text-display-xl text-brand-red animate-counter" data-target="48320">0</div>
                <div className="font-body text-body-sm text-brand-white/70 uppercase tracking-wider mt-2">MEALS RESCUED</div>
              </div>
              <div>
                <div className="font-display text-display-xl text-brand-red animate-counter" data-target="17842">0</div>
                <div className="font-body text-body-sm text-brand-white/70 uppercase tracking-wider mt-2">KG DIVERTED</div>
              </div>
              <div>
                <div className="font-display text-display-xl text-brand-red animate-counter" data-target="12489">0</div>
                <div className="font-body text-body-sm text-brand-white/70 uppercase tracking-wider mt-2">CO₂e AVOIDED</div>
              </div>
              <div>
                <div className="font-display text-display-xl text-brand-red animate-counter" data-target="142">0</div>
                <div className="font-body text-body-sm text-brand-white/70 uppercase tracking-wider mt-2">DONORS ACTIVE</div>
              </div>
            </div>
            <a href="/public-impact" className="btn-primary inline-block">
              VIEW FULL DASHBOARD
            </a>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="font-display text-display-lg text-brand-black mb-8">
              JOIN THE MISSION
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-2xl mx-auto">
              <a href="/register" className="btn-primary w-full md:w-auto">
                FOOD BUSINESS — DONATE SURPLUS
              </a>
              <a href="/register?role=shelter" className="btn-secondary w-full md:w-auto">
                SHELTER / NGO — RECEIVE FOOD
              </a>
              <a href="/register?role=driver" className="btn-ghost w-full md:w-auto">
                VOLUNTEER — DRIVE DELIVERIES
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-brand-black text-brand-white py-12 border-t-4 border-brand-red">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="bg-brand-cream px-2 py-1 border-2 border-brand-white/20 inline-flex items-center mb-4">
                <Logo size="md" />
              </div>
              <p className="font-body text-body-sm text-brand-white/60 leading-relaxed">
                Real-time food rescue platform connecting surplus to shelters.
              </p>
            </div>
            <div>
              <h4 className="font-body label-text text-brand-white mb-4">FOR DONORS</h4>
              <ul className="space-y-2 font-body text-body-sm text-brand-white/70">
                <li><a href="/register" className="hover:text-brand-red transition-colors">Register Your Business</a></li>
                <li><a href="#" className="hover:text-brand-red transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-brand-red transition-colors">Tax Benefits</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-body label-text text-brand-white mb-4">FOR SHELTERS</h4>
              <ul className="space-y-2 font-body text-body-sm text-brand-white/70">
                <li><a href="/register?role=shelter" className="hover:text-brand-red transition-colors">Join as Shelter</a></li>
                <li><a href="#" className="hover:text-brand-red transition-colors">Capacity Management</a></li>
                <li><a href="#" className="hover:text-brand-red transition-colors">Food Preferences</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-body label-text text-brand-white mb-4">PLATFORM</h4>
              <ul className="space-y-2 font-body text-body-sm text-brand-white/70">
                <li><a href="/public-impact" className="hover:text-brand-red transition-colors">Live Impact</a></li>
                <li><a href="#" className="hover:text-brand-red transition-colors">Transparency Reports</a></li>
                <li><a href="#" className="hover:text-brand-red transition-colors">API Docs</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-brand-white/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-body text-body-sm text-brand-white/50">
              © 2026 AnnaSetu. Built for AmiHacks Track A — NGO / Social Impact.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-brand-white/50 hover:text-brand-red transition-colors">Privacy</a>
              <a href="#" className="text-brand-white/50 hover:text-brand-red transition-colors">Terms</a>
              <a href="#" className="text-brand-white/50 hover:text-brand-red transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}