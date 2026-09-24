"use client";

import { ERSBadge } from "@/components/ui/ERSBadge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const mockListings = [
  { id: "1", title: "Biryani × 20", category: "cooked_rice_curry", qty: 20, status: "matched", ers: 84, shelter: "Hope Shelter", timeLeft: "42 min" },
  { id: "2", title: "Bread × 30", category: "baked_bread", qty: 30, status: "listed", ers: 43, shelter: "—", timeLeft: "3 hrs 20 min" },
  { id: "3", title: "Dal × 15", category: "cooked_rice_curry", qty: 15, status: "delivered", ers: 28, shelter: "City Food Bank", timeLeft: "—" },
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

export default function DonorDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="font-display text-display-lg text-brand-black">WELCOME BACK, RAVI</h1>
          <p className="font-body text-body-md text-brand-black/60 mt-1">MG Road Dhaba · Verified ✅</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" className="text-lg px-8 py-4">
            📸 DONATE BY PHOTO
          </Button>
          <Button variant="secondary">✏️ QUICK FORM</Button>
          <Button variant="ghost">⭐ MY TEMPLATES</Button>
          <Button variant="ghost">🔁 SAME AS LAST TIME</Button>
        </div>
      </header>

      {/* Stats Row */}
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

      {/* Active Listings */}
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
                    <p className="font-body text-body-sm text-brand-black/60">Category: {listing.category.replace("_", " ")}</p>
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
                    {listing.status === "listed" || listing.status === "matched" ? (
                      <Button variant="destructive" size="sm">CANCEL</Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Impact This Month */}
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
    </div>
  );
}