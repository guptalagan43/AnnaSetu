"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-brand-cream border-2 border-brand-black shadow-brutal p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-brand-red text-brand-white border-2 border-brand-black shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="label-text text-brand-red font-mono">DASHBOARD ROUTE FAULT</span>
            <h2 className="font-display text-2xl sm:text-3xl tracking-tight text-brand-black mt-1">
              FAILED TO RENDER VIEW
            </h2>
            <p className="font-body text-body-sm text-brand-black/80 mt-2">
              The requested dashboard dataset could not be hydrated. This could be due to a transient API network timeout or session expiration.
            </p>
          </div>
        </div>

        {error.message && (
          <div className="mb-6 p-3 bg-brand-white border-2 border-brand-black font-mono text-xs text-brand-black break-words">
            ERROR: {error.message}
          </div>
        )}

        <div className="flex flex-wrap gap-4 pt-2">
          <button
            onClick={() => reset()}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            RETRY VIEW
          </button>
          <Link
            href="/donor"
            className="btn-secondary flex items-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            GO TO DASHBOARD ROOT
          </Link>
        </div>
      </div>
    </div>
  );
}
