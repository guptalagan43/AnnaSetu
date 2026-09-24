import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ERSBadge } from "@/components/ui/ERSBadge";

interface VerificationStatus {
  id: string;
  status: "pending_review" | "under_review" | "approved" | "rejected";
  business_name: string;
  submitted_at: string;
  rejection_reason?: string;
}

const mockListings = [
  { id: "1", title: "Biryani × 20", category: "Cooked Rice/Curry", qty: 20, status: "matched", ers: 84, shelter: "Hope Shelter", timeLeft: "42 min" },
  { id: "2", title: "Bread × 30", category: "Baked / Bread", qty: 30, status: "listed", ers: 43, shelter: "—", timeLeft: "3 hrs 20 min" },
  { id: "3", title: "Dal × 15", category: "Cooked Rice/Curry", qty: 15, status: "delivered", ers: 28, shelter: "City Food Bank", timeLeft: "—" },
];

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
              {businessName} · Verified ✅
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
              <Button variant="primary" size="lg">📸 DONATE BY PHOTO</Button>
            </Link>
            <Link href="/donor/new-listing?mode=manual">
              <Button variant="secondary">✏️ QUICK FORM</Button>
            </Link>
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
              <div className="font-display text-display-xl text-brand-red">3</div>
              <div className="label-text text-brand-black/60 mt-1">ACTIVE LISTINGS</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">340</div>
              <div className="label-text text-brand-black/60 mt-1">MEALS THIS MONTH</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">124</div>
              <div className="label-text text-brand-black/60 mt-1">KG DIVERTED</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">2</div>
              <div className="label-text text-brand-black/60 mt-1">ERS ALERTS</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Listings (verified only) */}
      {isVerified && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-display-md text-brand-black">ACTIVE LISTINGS</h2>
            <div className="flex items-center gap-4">
              <span className="label-text text-brand-black/60">FILTER:</span>
              <select className="input-field w-auto px-4 py-2 text-sm">
                <option>ALL</option>
                <option>URGENT</option>
                <option>MATCHED</option>
                <option>DELIVERED</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {mockListings.map((listing) => {
              const config = statusConfig[listing.status];
              return (
                <Card key={listing.id} className="overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] gap-4 items-center p-6">
                    <div>
                      <h3 className="font-display text-display-sm text-brand-black">{listing.title}</h3>
                      <p className="font-body text-body-sm text-brand-black/60">{listing.category}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <ERSBadge score={listing.ers} size="md" />
                      <span className="font-body text-body-sm text-brand-black/60">{listing.timeLeft} remaining</span>
                    </div>
                    <div>
                      <p className="label-text text-brand-black/60">STATUS</p>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                    <div>
                      <p className="label-text text-brand-black/60">SHELTER</p>
                      <p className="font-body text-body-md text-brand-black">{listing.shelter}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">VIEW</Button>
                      {(listing.status === "listed" || listing.status === "matched") && (
                        <Button variant="destructive" size="sm">CANCEL</Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
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
              <Button variant="secondary">DOWNLOAD MONTHLY TAX CERTIFICATE (PDF)</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}