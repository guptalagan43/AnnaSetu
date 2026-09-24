"use client";

import { cn } from "@/lib/utils";

export interface ERSBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ERSBadge({ score, size = "md", showLabel = true, className }: ERSBadgeProps) {
  const getConfig = (score: number) => {
    if (score >= 95) return { variant: "emergency", label: "EMERGENCY", pulse: true };
    if (score >= 80) return { variant: "critical", label: "CRITICAL", pulse: true };
    if (score >= 60) return { variant: "warning", label: "WARNING", pulse: false };
    if (score >= 40) return { variant: "caution", label: "CAUTION", pulse: false };
    return { variant: "safe", label: "SAFE", pulse: false };
  };

  const { variant, label, pulse } = getConfig(score);

  const sizes = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
    lg: "px-4 py-1.5 text-base gap-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-display font-bold uppercase tracking-wider",
        sizes[size],
        {
          "bg-ers-safe text-brand-white": variant === "safe",
          "bg-ers-caution text-brand-white": variant === "caution",
          "bg-ers-warning text-brand-white": variant === "warning",
          "bg-ers-critical text-brand-white": variant === "critical",
          "bg-ers-emergency text-brand-white": variant === "emergency",
        },
        pulse && "animate-ers-pulse",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`Expiry Risk Score: ${score} out of 100, ${label}`}
    >
      <span className="font-mono">{score}</span>
      {showLabel && <span>/100 {label}</span>}
    </span>
  );
}

export function ERSDot({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const getConfig = (score: number) => {
    if (score >= 95) return "bg-ers-emergency";
    if (score >= 80) return "bg-ers-critical";
    if (score >= 60) return "bg-ers-warning";
    if (score >= 40) return "bg-ers-caution";
    return "bg-ers-safe";
  };

  const sizes = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={cn(
        "inline-block rounded-full border-2 border-brand-black",
        sizes[size],
        getConfig(score)
      )}
      aria-label={`ERS: ${score}`}
    />
  );
}