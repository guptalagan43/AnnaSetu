"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId} 
            className="block label-text text-brand-black mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "input-field",
            error && "border-brand-red focus:border-brand-red",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p 
            id={`${inputId}-error`} 
            className="mt-1.5 font-body text-body-sm text-brand-red"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p 
            id={`${inputId}-hint`} 
            className="mt-1.5 font-body text-body-sm text-brand-black/50"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };