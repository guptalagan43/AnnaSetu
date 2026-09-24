import React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
}

export function Breadcrumb({
  items,
  separator = <span className="text-brand-red font-bold select-none">//</span>,
  className = "",
}: BreadcrumbProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`font-mono text-xs font-bold tracking-wider uppercase ${className}`}>
      <ol className="flex flex-wrap items-center gap-2 list-none p-0 m-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-brand-black/60 hover:text-brand-red hover:underline transition-colors focus:outline-none focus:ring-1 focus:ring-brand-black"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? "text-brand-black font-extrabold" : "text-brand-black/60"}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}

              {!isLast && <span aria-hidden="true">{separator}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
