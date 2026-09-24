"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "safe" | "caution" | "warning" | "critical" | "emergency" | "default";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", pulse, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center gap-2 font-display font-bold uppercase tracking-wider";
    
    const variants = {
      safe: "bg-ers-safe text-brand-white",
      caution: "bg-ers-caution text-brand-white",
      warning: "bg-ers-warning text-brand-white",
      critical: "bg-ers-critical text-brand-white",
      emergency: "bg-ers-emergency text-brand-white",
      default: "bg-brand-black text-brand-white",
    };

    const sizes = {
      sm: "px-2.5 py-0.5 text-xs",
      md: "px-3 py-1 text-sm",
      lg: "px-4 py-1.5 text-base",
    };

    return (
      <span
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          pulse && (variant === "critical" || variant === "emergency") && "animate-ers-pulse",
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = "Badge";

export { Badge };