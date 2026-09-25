import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ERSBadge } from "@/components/ui/ERSBadge";
import { EmptyState } from "@/components/ui/EmptyState";

interface VerificationStatus {
  id: string;
  status: "pending_review" | "under_review" | "approved" | "rejected";
  business_name: string;
  submitted_at: string;
  rejection_reason?: string;
}

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

function VerificationBanner({ verification }: { verification: VerificationStatus | null }) {
  if (!verification) {
    // No application — prompt to apply
    return (
      <div className="border-2 border-brand-black bg-brand-cream p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-display-sm text-brand-black">VERIFICATION REQUIRED</h2>
          <p className="font-body text-body-sm text-brand-black/70 mt-1">
            To donate food, your business must be verified. It takes 5 minutes and we review within 2–3 business days.
          </p>
        </div>
        <Link href="/register/donor-verify">
          <Button variant="primary" size="lg">APPLY NOW →</Button>
        </Link>
      </div>
    );
  }

  if (verification.status === "pending_review" || verification.status === "under_review") {
    return (
      <div className="border-2 border-brand-black bg-[#FEF7E0] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-display text-display-sm text-brand-black">APPLICATION UNDER REVIEW</span>
            <span className="font-mono text-xs px-2 py-0.5 bg-brand-black text-brand-white uppercase">
              {verification.status === "under_review" ? "IN REVIEW" : "PENDING"}
            </span>
          </div>
          <p className="font-body text-body-sm text-brand-black/70">
            <strong>{verification.business_name}</strong> — submitted{" "}
            {new Date(verification.submitted_at).toLocaleDateString("en-IN", {
              day: "numeric", month: "long", year: "numeric",
            })}. You&apos;ll receive an email once reviewed.
          </p>
        </div>
      </div>
    );
  }

  if (verification.status === "rejected") {
    return (
      <div className="border-2 border-brand-red bg-[#FDE8E8] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-display-sm text-brand-red">APPLICATION REJECTED</h2>
          {verification.rejection_reason && (
            <p className="font-body text-body-sm text-brand-black/80 mt-1">
              Reason: {verification.rejection_reason}
            </p>
          )}
          <p className="font-body text-body-sm text-brand-black/60 mt-1">
            Please address the issues above and reapply.
          </p>
        </div>
        <Link href="/register/donor-verify">
          <Button variant="destructive">REAPPLY →</Button>
        </Link>
      </div>
    );
  }

  return null; // Approved — no banner needed
}

export default async function DonorDashboard() {
  // Server-side role check — requireRole redirects if not authed/authorized
  const session = await requireRole(["donor_admin", "donor_staff", "super_admin", "platform_admin", "moderator"])();
  // requireRole redirects before returning if user is null, so this assertion is safe
  const userId = session.user!.id;
  const supabase = await createClient();

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, is_verified_donor")
    .eq("id", userId)
    .single();

  // Fetch their latest verification application
  let verification: VerificationStatus | null = null;
  if (!profile?.is_verified_donor) {
    const { data } = await supabase
      .from("donor_verifications")
      .select("id, status, business_name, submitted_at, rejection_reason")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    verification = data as VerificationStatus | null;
  }

  const isVerified = profile?.is_verified_donor;
  const displayName = profile?.display_name ?? "Donor";

  // Fetch verification business name for verified users
  let businessName = "";
  if (isVerified) {
    const { data: verif } = await supabase
      .from("donor_verifications")
      .select("business_name")
      .eq("user_id", userId)
      .eq("status", "approved")
      .maybeSingle();
    businessName = verif?.business_name ?? "";
  }

  // Fetch donor's real listings
  const { data: dbListings } = await supabase
    .from("listings")
    .select("*")
    .eq("donor_id", userId)
    .order("created_at", { ascending: false });

  const listings = dbListings ?? [];
  const activeCount = listings.filter((l: any) => ["listed", "matched", "driver_assigned", "in_transit"].includes(l.status)).length;
  const mealsCount = listings.reduce((acc: number, l: any) => acc + (l.estimated_servings || 0), 0);
  const kgCount = listings.reduce((acc: number, l: any) => acc + (Number(l.quantity_kg) || 0), 0);
  const ersAlertsCount = listings.filter((l: any) => (l.ers_score || 0) >= 80).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="font-display text-display-lg text-brand-black">
            WELCOME BACK, {displayName.toUpperCase()}
          </h1>
          {isVerified ? (
            <p className="font-body text-body-md text-brand-black/60 mt-1">
              {businessName || "Verified Food Donor"} · Verified ✅
            </p>
          ) : (
            <p className="font-body text-body-md text-brand-black/60 mt-1">
              Complete verification to start donating food
            </p>
          )}
        </div>
        {isVerified && (
          <div className="flex flex-wrap gap-4">
            <Link href="/donor/new-listing">
              <Button variant="primary" size="lg">➕ POST SURPLUS FOOD</Button>
            </Link>
            {listings.length > 0 && (
              <Link href="/donor/new-listing?relist=last">
                <Button variant="secondary" size="lg">⚡ RELIST LAST ITEM</Button>
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Verification banner (if not verified) */}
      {!isVerified && <VerificationBanner verification={verification} />}

      {/* Stats (show for verified donors only) */}
      {isVerified && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">{activeCount}</div>
              <div className="label-text text-brand-black/60 mt-1">ACTIVE LISTINGS</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">{mealsCount}</div>
              <div className="label-text text-brand-black/60 mt-1">MEALS LISTED</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">{Math.round(kgCount)}</div>
              <div className="label-text text-brand-black/60 mt-1">KG DIVERTED</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">{ersAlertsCount}</div>
              <div className="label-text text-brand-black/60 mt-1">ERS ALERTS</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Listings (verified only) */}
      {isVerified && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-display-md text-brand-black">MY FOOD LISTINGS</h2>
            <div className="flex items-center gap-4">
              <span className="label-text text-brand-black/60">COUNT:</span>
              <span className="font-mono text-sm font-bold bg-brand-black text-brand-white px-2 py-0.5">
                {listings.length}
              </span>
            </div>
          </div>

          {listings.length === 0 ? (
            <EmptyState
              title="NO LISTINGS POSTED YET"
              description="You have not posted any food listings yet. Take 60 seconds to post your surplus edible food and connect with nearby shelters."
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
                const timeRemaining = diffMs > 0 ? `${hoursLeft > 0 ? `${hoursLeft}h ` : ""}${minsLeft}m remaining` : "Expired";

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
                          Ready: {listing.pickup_window_start && !isNaN(new Date(listing.pickup_window_start).getTime()) ? new Date(listing.pickup_window_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Immediate"}
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
                        <Link href={`/donor/new-listing?relist=last&from=${listing.id}`}>
                          <Button variant="ghost" size="sm" title="Copy to new listing">⚡ RELIST</Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Impact (verified only) */}
      {isVerified && (
        <Card className="mt-8">
          <CardHeader>
            <h2 className="font-display text-display-md text-brand-black">MY IMPACT THIS MONTH</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="font-display text-display-xl text-brand-red">340</div>
                <div className="label-text text-brand-black/60">MEALS RESCUED</div>
              </div>
              <div>
                <div className="font-display text-display-xl text-brand-red">124</div>
                <div className="label-text text-brand-black/60">KG DIVERTED</div>
              </div>
              <div>
                <div className="font-display text-display-xl text-brand-red">89</div>
                <div className="label-text text-brand-black/60">CO₂e AVOIDED</div>
              </div>
              <div>
                <div className="font-display text-display-xl text-brand-red">₹4,200</div>
                <div className="label-text text-brand-black/60">EST. TAX DEDUCTION</div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link href="/donor/impact">
                <Button variant="secondary">VIEW FULL IMPACT & DOWNLOAD TAX CERTIFICATE (PDF) →</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}