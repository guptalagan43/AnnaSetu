import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center flex flex-col items-center">
          <Logo href="/" size="xl" className="mb-4" />
          <p className="font-body text-body-md text-brand-black/70 font-semibold">Real-Time Food Rescue Platform</p>
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