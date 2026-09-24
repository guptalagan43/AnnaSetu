import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <header className="mb-12 text-center">
          <Link href="/" className="inline-flex items-center gap-4 mb-8">
            <span className="font-display text-3xl tracking-tight">ANNA</span>
            <span className="w-px h-8 bg-brand-black"></span>
            <span className="font-display text-3xl tracking-tight">SETU</span>
          </Link>
          <h1 className="font-display text-display-lg text-brand-black mb-4">AnnaSetu</h1>
          <p className="font-body text-body-md text-brand-black/70">Real-time food rescue platform</p>
        </header>
        <main className="brutal-card">
          {children}
        </main>
        <footer className="mt-8 text-center">
          <p className="font-body text-body-sm text-brand-black/50">
            By continuing, you agree to our{' '}
            <Link href="#" className="underline hover:text-brand-red">Terms of Service</Link>
            {' '}and{' '}
            <Link href="#" className="underline hover:text-brand-red">Privacy Policy</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}