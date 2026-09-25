import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | AnnaSetu",
  description: "Privacy Policy and Data Protection standards governing AnnaSetu.",
};

export default function PrivacyPage() {
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
          <div className="inline-block bg-brand-black text-brand-white font-mono text-xs font-bold px-3 py-1 mb-3">
            DATA PROTECTION & DPDP COMPLIANCE
          </div>
          <h1 className="font-display text-display-xl tracking-tight mb-3">PRIVACY POLICY</h1>
          <p className="font-mono text-sm text-brand-black/60">
            Effective Date: September 25, 2026 | Regulated under Digital Personal Data Protection Act (DPDPA), 2023
          </p>
        </div>

        {/* Commitment Statement */}
        <div className="brutal-card bg-brand-cream border-2 border-brand-black p-6 space-y-3">
          <h2 className="font-display text-display-sm text-brand-black">OUR PRIVACY GUARANTEE</h2>
          <p className="font-body text-body-sm leading-relaxed text-brand-black/80">
            AnnaSetu prioritizes radical data minimalism. We only gather telemetry and organizational credentials
            strictly necessary to rescue surplus food, verify identity against commercial databases (FSSAI/MCA),
            and optimize physical volunteer transit routes. We never sell, monetize, or broker personal records.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-2xl border-b-2 border-brand-black pb-2">1. INFORMATION WE COLLECT</h2>
          <div className="space-y-3 font-body text-body-md text-brand-black/80">
            <p><strong>Account Credentials:</strong> Name, verified corporate email, telephone number, encrypted password hash, and designated organizational role.</p>
            <p><strong>Business Verification Data:</strong> Commercial entity title, physical pickup address, 14-digit FSSAI license number, PAN registration (for Section 80G documentation).</p>
            <p><strong>Geospatial & GPS Telemetry:</strong> Precise pickup and delivery coordinates. For active volunteer drivers, real-time location telemetry is recorded during active dispatch runs to calculate ETAs and verify physical drop-off pins.</p>
            <p><strong>Food Intake Documentation:</strong> Photographs uploaded for AI visual inspection, audio recordings submitted for natural language processing, temperature logs, and recipient signatures.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl border-b-2 border-brand-black pb-2">2. HOW WE USE YOUR DATA</h2>
          <ul className="list-disc pl-6 space-y-2 font-body text-body-md text-brand-black/80">
            <li>To match surplus food listings to proximate shelters within safe delivery radii using Haversine calculation algorithms.</li>
            <li>To compute Emergency Response System (ERS) perishability scores and dispatch volunteer drivers.</li>
            <li>To generate automated tax exemption certificates and EPA WARM methodology ESG audit ledgers.</li>
            <li>To transmit vital operational notifications (dispatch alerts, OTP verification codes, pickup ETA updates).</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl border-b-2 border-brand-black pb-2">3. LOCATION TRACKING & DRIVER PRIVACY</h2>
          <p className="font-body text-body-md leading-relaxed text-brand-black/80">
            Location tracking for volunteer drivers is active <strong>only</strong> during accepted rescue runs. Drivers may toggle their availability to off at any time, terminating background location polling immediately. Location logs are retained solely for delivery confirmation and anonymized impact heatmap generation.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl border-b-2 border-brand-black pb-2">4. DATA RETENTION & SECURITY</h2>
          <p className="font-body text-body-md leading-relaxed text-brand-black/80">
            All stored credentials and sessions are secured using industry-standard TLS 1.3 encryption in transit and AES-256 encryption at rest. Audit logs and agent dispatch histories are preserved for 180 days to fulfill regulatory transparency requirements before automatic archival.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl border-b-2 border-brand-black pb-2">5. USER RIGHTS UNDER DPDPA 2023</h2>
          <p className="font-body text-body-md leading-relaxed text-brand-black/80">
            As a data principal, you have the right to review, update, or request erasure of your personal data stored within AnnaSetu. You may request account deletion through your dashboard Settings or by transmitting a formal notice to our Data Protection Officer.
          </p>
        </section>

        {/* Contact Info */}
        <div className="border-t-4 border-brand-black pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg">DATA PROTECTION INQUIRIES</h3>
            <p className="font-body text-body-sm text-brand-black/60">Reach our Data Protection Officer at privacy@annasetu.in</p>
          </div>
          <Link href="/terms" className="btn-secondary text-sm">
            Read Terms of Service →
          </Link>
        </div>
      </main>
    </div>
  );
}
