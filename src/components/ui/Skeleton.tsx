"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[#DDD6C8] border-2 border-brand-black/20 rounded-none",
        className
      )}
      role="status"
      aria-label="Loading content..."
      {...props}
    />
  );
}

export function MetricSkeleton() {
  return (
    <div className="bg-brand-cream border-2 border-brand-black shadow-brutal p-6">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-12 w-32 mb-2" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-brand-cream border-2 border-brand-black shadow-brutal p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full border-2 border-brand-black bg-brand-cream overflow-hidden shadow-brutal">
      {/* Table Header */}
      <div className="bg-brand-black p-4 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1">
            <Skeleton className="h-5 w-3/4 bg-brand-white/30 border-none" />
          </div>
        ))}
      </div>
      {/* Table Rows */}
      <div className="divide-y-2 divide-brand-black/20">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div
            key={rIdx}
            className={cn(
              "p-4 flex gap-4 items-center",
              rIdx % 2 === 0 ? "bg-brand-cream" : "bg-brand-white"
            )}
          >
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div key={cIdx} className="flex-1">
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
