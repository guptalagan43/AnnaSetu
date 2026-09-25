import Link from "next/link";

// This layout is wider than the standard auth layout to accommodate
// the 4-step verification form with map and document upload
export default function DonorVerifyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-white p-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-4">
            <span className="font-display text-2xl tracking-tight">ANNA</span>
            <span className="w-px h-6 bg-brand-black" />
            <span className="font-display text-2xl tracking-tight">SETU</span>
          </Link>
          <Link
            href="/donor"
            className="font-body text-body-sm font-bold text-brand-black/60 hover:text-brand-black underline"
          >
            Skip for now →
          </Link>
        </header>
        <main className="brutal-card p-8">{children}</main>
        <footer className="mt-8 text-center">
          <p className="font-body text-body-sm text-brand-black/50">
            Your documents are encrypted and only accessible to our verification team.
          </p>
        </footer>
      </div>
    </div>
  );
}
