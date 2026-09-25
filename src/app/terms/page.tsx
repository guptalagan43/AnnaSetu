import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | AnnaSetu",
  description: "Terms of Service and legal framework governing the AnnaSetu National Surplus Food Redistribution Network.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-white text-brand-black">
      {/* Top Banner */}
      <header className="border-b-4 border-brand-black bg-brand-cream sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <span className="font-display text-3xl tracking-tight group-hover:text-brand-red transition-colors">ANNA</span>
            <span className="w-px h-6 bg-brand-black"></span>
            <span className="font-display text-3xl tracking-tight text-brand-red">SETU</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="btn-secondary text-sm">
              Sign In
            </Link>
            <Link href="/" className="btn-primary text-sm">
              ← Return Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <div>
          <div className="inline-block bg-brand-red text-brand-white font-mono text-xs font-bold px-3 py-1 mb-3">
            LEGAL FRAMEWORK & COMPLIANCE
          </div>
          <h1 className="font-display text-display-xl tracking-tight mb-3">TERMS OF SERVICE</h1>
          <p className="font-mono text-sm text-brand-black/60">
            Last Updated: September 25, 2026 | Governing Jurisdiction: Republic of India
          </p>
        </div>

        {/* Executive Summary Card */}
        <div className="brutal-card bg-brand-cream border-2 border-brand-black p-6 space-y-3">
          <h2 className="font-display text-display-sm text-brand-black">EXECUTIVE SUMMARY</h2>
          <p className="font-body text-body-sm leading-relaxed text-brand-black/80">
            AnnaSetu operates an algorithmic real-time redistribution network connecting verified food businesses
            with registered shelters, orphanages, and relief organizations. Participation is governed by the Food Safety
            and Standards Authority of India (FSSAI) regulations, Section 317A Good Samaritan food protection standards,
            and mutual indemnification clauses outlined herein.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-2xl border-b-2 border-brand-black pb-2">1. PLATFORM NATURE & MISSION</h2>
          <p className="font-body text-body-md leading-relaxed text-brand-black/80">
            AnnaSetu is an emergency logistics and dispatch technology platform. We do not manufacture, cook, or sell food.
            Our infrastructure facilitates instantaneous matching of surplus edible food from authorized commercial donors
            to vetted receiving charities through volunteer and dedicated dispatch drivers.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl border-b-2 border-brand-black pb-2">2. DONOR OBLIGATIONS & FSSAI COMPLIANCE</h2>
          <ul className="list-disc pl-6 space-y-2 font-body text-body-md text-brand-black/80">
            <li>
              <strong>Registration:</strong> Commercial food business operators (restaurants, hotels, caterers) must provide a valid 14-digit FSSAI license number during account verification.
            </li>
            <li>
              <strong>Food Safety Thresholds:</strong> All donated food must be fit for human consumption at the time of pickup, segregated under hygienic standards, and preserved within temperature control bounds.
            </li>
            <li>
              <strong>ERS & Expiry Declarations:</strong> Donors must provide truthful and accurate information regarding preparation timestamps, allergens, and consumption expiry windows.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl border-b-2 border-brand-black pb-2">3. GOOD SAMARITAN LEGAL PROTECTION</h2>
          <p className="font-body text-body-md leading-relaxed text-brand-black/80">
            In accordance with the Food Safety and Standards (Recovery & Distribution of Surplus Food) Regulations, 2019,
            donors and food rescue volunteers acting in good faith without negligence or malicious intent are shielded from
            civil and criminal liability regarding food quality after formal handover, provided reasonable safety protocols were observed.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl border-b-2 border-brand-black pb-2">4. SHELTER & RECIPIENT RESPONSIBILITIES</h2>
          <ul className="list-disc pl-6 space-y-2 font-body text-body-md text-brand-black/80">
            <li>
              <strong>Capacity & Acceptance:</strong> Shelters must ensure active coordinators are available to inspect, accept, or flag discrepancies upon delivery arrival.
            </li>
            <li>
              <strong>No Resale:</strong> Rescued food provided through AnnaSetu is 100% free and strictly prohibited from being monetized, resold, or redistributed for commercial gain.
            </li>
            <li>
              <strong>Verification Checklist:</strong> Recipients must complete the digital handover checklist and temperature sensory checks before feeding beneficiaries.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl border-b-2 border-brand-black pb-2">5. VOLUNTEER DRIVER PROTOCOLS</h2>
          <p className="font-body text-body-md leading-relaxed text-brand-black/80">
            Volunteer drivers are independent community logistics partners. Drivers must adhere to traffic laws,
            maintain vehicle cleanliness suitable for food transit, and handle thermal insulated transport bags responsibly.
            Drivers have the full right to decline or abort transport if pickup premises present safety hazards.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl border-b-2 border-brand-black pb-2">6. TAX CERTIFICATES & ESG REPORTING</h2>
          <p className="font-body text-body-md leading-relaxed text-brand-black/80">
            AnnaSetu issues automated Section 80G tax recognition receipts and EPA WARM CO₂e emissions abatement certificates
            to verified donors. These figures represent verified logistics milestones and mathematical estimations. Donors
            remain responsible for submitting appropriate filings to tax authorities in consultation with certified advisors.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl border-b-2 border-brand-black pb-2">7. TERMINATION & SUSPENSION</h2>
          <p className="font-body text-body-md leading-relaxed text-brand-black/80">
            AnnaSetu reserves the right to immediately suspend accounts found submitting spoiled items, misrepresenting
            food quantities, fabricating delivery handovers, or abusing platform dispatch personnel.
          </p>
        </section>

        {/* Contact Info */}
        <div className="border-t-4 border-brand-black pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg">HAVE QUESTIONS ABOUT OUR TERMS?</h3>
            <p className="font-body text-body-sm text-brand-black/60">Contact legal & compliance at legal@annasetu.in</p>
          </div>
          <Link href="/privacy" className="btn-secondary text-sm">
            Read Privacy Policy →
          </Link>
        </div>
      </main>
    </div>
  );
}
