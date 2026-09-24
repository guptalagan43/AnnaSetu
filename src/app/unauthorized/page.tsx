import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-brand-white flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-brand-cream border-2 border-brand-black shadow-brutal-lg p-6 sm:p-10 text-center">
        <div className="mx-auto w-16 h-16 bg-brand-red text-brand-white flex items-center justify-center border-2 border-brand-black shadow-brutal-sm mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="label-text text-brand-red font-mono">ERROR 403 // RESTRICTED ACCESS</span>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-brand-black mt-1 mb-4">
          ACCESS DENIED
        </h1>

        <p className="font-body text-body-md text-brand-black/80 mb-6">
          Your current account role does not have authorization to view this terminal or dispatch module.
        </p>

        <div className="p-3 bg-brand-white border-2 border-brand-black font-mono text-xs text-brand-black/70 mb-8">
          SECURITY PROTOCOL: Role-based boundary enforcement active. Contact an administrator if you believe your credentials should allow access.
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/" className="btn-primary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            RETURN HOME
          </Link>
          <Link href="/login" className="btn-secondary flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            SWITCH ACCOUNT
          </Link>
        </div>
      </div>
    </div>
  );
}
