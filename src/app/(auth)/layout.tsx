import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-white flex items-center justify-center p-6">
      <div className="w-full max-w-7xl">
        <header className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-4 mb-4 group">
            <span className="font-display text-4xl tracking-tight group-hover:text-brand-red transition-colors">ANNA</span>
            <span className="w-px h-8 bg-brand-black"></span>
            <span className="font-display text-4xl tracking-tight text-brand-red">SETU</span>
          </Link>
          <p className="font-mono text-xs uppercase tracking-widest text-brand-black/60 font-bold">
            National Surplus Food Redistribution Network
          </p>
        </header>
        <main>
          {children}
        </main>
        <footer className="mt-8 text-center">
          <p className="font-body text-body-sm text-brand-black/60">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-brand-red font-medium">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:text-brand-red font-medium">Privacy Policy</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}