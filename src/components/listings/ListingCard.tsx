"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ERSBadge } from "@/components/ui/ERSBadge";

export interface ListingItem {
  id: string;
  title: string;
  food_category: string;
  quantity_kg: number | string | null;
  estimated_servings: number | null;
  pickup_address: string;
  pickup_window_start: string;
  pickup_window_end: string;
  expiry_time: string;
  donor_pin?: string | null;
  ers_score?: number | null;
  status: string;
  photo_url?: string | null;
}

const statusConfig: Record<string, { label: string; variant: "safe" | "caution" | "warning" | "critical" | "emergency" }> = {
  listed: { label: "LISTED", variant: "caution" },
  matched: { label: "MATCHED", variant: "warning" },
  driver_assigned: { label: "DRIVER ASSIGNED", variant: "warning" },
  in_transit: { label: "IN TRANSIT", variant: "critical" },
  checklist: { label: "AT SHELTER", variant: "warning" },
  delivered: { label: "DELIVERED", variant: "safe" },
  disputed: { label: "DISPUTED", variant: "emergency" },
  cancelled: { label: "CANCELLED", variant: "emergency" },
  expired: { label: "EXPIRED", variant: "emergency" },
};

export interface ListingCardProps {
  listing: ListingItem;
  showPin?: boolean;
  actionSlot?: React.ReactNode;
  relistHref?: string;
}

export function ListingCard({
  listing,
  showPin = true,
  actionSlot,
  relistHref,
}: ListingCardProps) {
  const config = statusConfig[listing.status] ?? statusConfig.listed;
  const diffMs = new Date(listing.expiry_time).getTime() - Date.now();
  const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
  const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const timeRemaining =
    diffMs > 0
      ? `${hoursLeft > 0 ? `${hoursLeft}h ` : ""}${minsLeft}m remaining`
      : "Expired";

  const score = listing.ers_score ?? 0;

  return (
    <Card className="overflow-hidden border-2 border-brand-black hover:shadow-brutal transition-shadow">
      <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_1fr_1fr_auto] gap-4 items-center p-6">
        <div>
          <h3 className="font-display text-display-sm text-brand-black">{listing.title}</h3>
          <p className="font-body text-body-sm text-brand-black/60">{listing.food_category}</p>
          <p className="font-mono text-xs text-brand-black/70 mt-1">
            {listing.quantity_kg} kg · {listing.estimated_servings} servings
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <ERSBadge score={score} size="md" />
            <span className="font-mono text-xs text-brand-black/70">{timeRemaining}</span>
          </div>
          <div className="font-mono text-xs text-brand-black/60">
            Ready:{" "}
            {new Date(listing.pickup_window_start).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        <div>
          <p className="label-text text-brand-black/60 mb-1">STATUS</p>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>

        {showPin && (
          <div>
            <p className="label-text text-brand-black/60 mb-1">DONOR PIN</p>
            <span className="font-mono text-sm font-bold bg-brand-cream border border-brand-black px-2 py-1">
              {listing.donor_pin || "----"}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {actionSlot}
          {relistHref && (
            <Link href={relistHref}>
              <Button variant="ghost" size="sm" title="Copy to new listing">
                ⚡ RELIST
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
