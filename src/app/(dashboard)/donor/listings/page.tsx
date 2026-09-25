import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ERSBadge } from "@/components/ui/ERSBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, ArrowLeft } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "safe" | "caution" | "warning" | "critical" | "emergency" | "default" }> = {
  listed: { label: "LISTED", variant: "caution" },
  matched: { label: "MATCHED", variant: "warning" },
  driver_assigned: { label: "DRIVER ASSIGNED", variant: "critical" },
  in_transit: { label: "IN TRANSIT", variant: "critical" },
  checklist: { label: "CHECKLIST", variant: "emergency" },
  delivered: { label: "DELIVERED", variant: "safe" },
  disputed: { label: "DISPUTED", variant: "emergency" },
  cancelled: { label: "CANCELLED", variant: "default" },
  expired: { label: "EXPIRED", variant: "default" },
};

export default async function DonorListingsPage() {
  const session = await requireRole(["donor_admin", "donor_staff", "super_admin", "platform_admin", "moderator"])();
  const userId = session.user!.id;
  const supabase = await createClient();

  const { data: dbListings } = await supabase
    .from("listings")
    .select("*")
    .eq("donor_id", userId)
    .order("created_at", { ascending: false });

  const listings = dbListings ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-brand-black pb-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/donor" className="text-brand-black hover:text-brand-red transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-display text-display-lg text-brand-black uppercase">
              ALL FOOD LISTINGS
            </h1>
          </div>
          <p className="font-body text-body-sm text-brand-black/70 mt-1">
            Complete inventory log of surplus rescue listings and real-time statuses.
          </p>
        </div>

        <Link href="/donor/new-listing">
          <Button variant="primary" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            POST SURPLUS FOOD
          </Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title="NO LISTINGS IN INVENTORY"
          description="You have not posted any food donations yet. When you create surplus food listings, they will appear here with live dispatch tracking."
          actionText="POST SURPLUS FOOD NOW →"
          actionHref="/donor/new-listing"
        />
      ) : (
        <div className="space-y-4">
          {listings.map((listing: any) => {
            const config = statusConfig[listing.status] ?? statusConfig.listed;
            const diffMs = new Date(listing.expiry_time).getTime() - Date.now();
            const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
            const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const timeRemaining = diffMs > 0 ? `${hoursLeft > 0 ? `${hoursLeft}h ` : ""}${minsLeft}m left` : "Expired";

            return (
              <Card key={listing.id} className="overflow-hidden">
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
                      <ERSBadge score={listing.ers_score ?? 0} size="md" />
                      <span className="font-mono text-xs text-brand-black/70">{timeRemaining}</span>
                    </div>
                    <div className="font-mono text-xs text-brand-black/60">
                      Pickup Window: {new Date(listing.pickup_window_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(listing.pickup_window_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div>
                    <p className="label-text text-brand-black/60 mb-1">STATUS</p>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>

                  <div>
                    <p className="label-text text-brand-black/60 mb-1">DONOR PIN</p>
                    <span className="font-mono text-sm font-bold bg-brand-cream border border-brand-black px-2 py-1">
                      {listing.donor_pin}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/donor/new-listing?relist=${listing.id}`}>
                      <Button variant="ghost" size="sm" title="Relist item">⚡ RELIST</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
