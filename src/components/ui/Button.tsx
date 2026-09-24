"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const baseStyles = "font-body font-bold uppercase tracking-widest transition-all border-2 border-brand-black";
    
    const variants = {
      primary: "bg-brand-red text-brand-white shadow-brutal-sm hover:bg-brand-red-dk active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
      secondary: "bg-brand-black text-brand-white shadow-brutal-red hover:bg-[#1A1A1A] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
      ghost: "bg-transparent text-brand-black hover:bg-brand-black hover:text-brand-white",
      destructive: "bg-brand-white text-brand-red border-brand-red shadow-brutal-sm hover:bg-brand-red hover:text-brand-white active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs",
      md: "px-6 py-3 text-sm",
      lg: "px-8 py-4 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };