"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PackageOpen } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  actionHref,
  onAction,
  secondaryActionText,
  secondaryActionHref,
  onSecondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-2 border-brand-black bg-brand-cream shadow-brutal p-8 sm:p-12 text-center",
        className
      )}
      role="status"
    >
      <div className="mx-auto w-16 h-16 border-2 border-brand-black bg-brand-white flex items-center justify-center shadow-brutal-sm mb-6">
        {icon || <PackageOpen className="w-8 h-8 text-brand-black" aria-hidden="true" />}
      </div>

      <h3 className="font-display text-2xl sm:text-3xl tracking-tight text-brand-black uppercase mb-2">
        {title}
      </h3>

      <p className="font-body text-body-md text-brand-black/75 max-w-md mx-auto mb-6">
        {description}
      </p>

      {(actionText || secondaryActionText) && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {actionText && actionHref && (
            <Link href={actionHref} className="btn-primary">
              {actionText}
            </Link>
          )}

          {actionText && onAction && !actionHref && (
            <button type="button" onClick={onAction} className="btn-primary">
              {actionText}
            </button>
          )}

          {secondaryActionText && secondaryActionHref && (
            <Link href={secondaryActionHref} className="btn-ghost">
              {secondaryActionText}
            </Link>
          )}

          {secondaryActionText && onSecondaryAction && !secondaryActionHref && (
            <button type="button" onClick={onSecondaryAction} className="btn-ghost">
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
