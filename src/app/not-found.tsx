import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-white flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-brand-cream border-2 border-brand-black shadow-brutal-lg p-6 sm:p-10 text-center">
        <div className="mx-auto w-16 h-16 bg-brand-black text-brand-white flex items-center justify-center border-2 border-brand-black shadow-brutal-sm mb-6">
          <SearchX className="w-8 h-8" />
        </div>

        <span className="label-text text-brand-red font-mono">STATUS 404 // ROUTE MISSING</span>
        <h1 className="font-display text-5xl sm:text-6xl tracking-tight text-brand-black mt-1 mb-4">
          ROUTE NOT FOUND
        </h1>

        <p className="font-body text-body-md text-brand-black/75 mb-8">
          The dispatch coordinate you requested either expired, was rescued, or never existed in the AnnaSetu routing network.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/" className="btn-primary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            BACK TO HOMEPAGE
          </Link>
          <Link href="/public-impact" className="btn-ghost">
            VIEW LIVE IMPACT
          </Link>
        </div>
      </div>
    </div>
  );
}
