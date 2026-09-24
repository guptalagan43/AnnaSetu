"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-white flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-brand-cream border-2 border-brand-black shadow-brutal-lg p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand-red text-brand-white flex items-center justify-center border-2 border-brand-black">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="label-text text-brand-red font-mono">ERROR 500 // UNHANDLED EXCEPTION</span>
            <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-brand-black">
              SYSTEM INTERRUPT
            </h1>
          </div>
        </div>

        <p className="font-body text-body-md text-brand-black/80 mb-6">
          An unexpected anomaly occurred during this transaction. The logistics kernel has logged this event.
        </p>

        {error.digest && (
          <div className="mb-6 p-3 bg-brand-black text-brand-white font-mono text-xs border border-brand-black overflow-x-auto">
            TRACE DIGEST: {error.digest}
          </div>
        )}

        <div className="flex flex-wrap gap-4 pt-2">
          <button
            onClick={() => reset()}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            RETRY ACTION
          </button>
          <Link
            href="/"
            className="btn-secondary flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            RETURN TO HOMEPAGE
          </Link>
        </div>
      </div>
    </div>
  );
}
