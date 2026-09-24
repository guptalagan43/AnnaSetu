"use client";

import { ERSBadge } from "@/components/ui/ERSBadge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

const mockIncoming = [
  { id: "1", title: "Biryani × 20", category: "cooked_rice_curry", qty: 20, ers: 84, distance: "1.2 km", donor: "MG Road Dhaba", donorStars: 18, timeLeft: "42 min", fitsCapacity: true },
  { id: "2", title: "Bread × 30", category: "baked_bread", qty: 30, ers: 28, distance: "0.8 km", donor: "City Bakery", donorStars: 6, timeLeft: "5.5 hrs", fitsCapacity: true },
];

export default function ShelterDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="font-display text-display-lg text-brand-black">HOPE SHELTER</h1>
          <p className="font-body text-body-md text-brand-black/60 mt-1">Verified ✅ · Capacity: 55/100 kg free</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">UPDATE CAPACITY</Button>
          <Button variant="secondary">SET PREFERENCES</Button>
          <Button variant="ghost">MARK UNAVAILABLE</Button>
        </div>
      </header>

      {/* Capacity Bar */}
      <Card className="mb-8">
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            <span className="label-text text-brand-black">CAPACITY STATUS</span>
            <span className="font-body font-bold text-brand-black">55/100 kg free</span>
          </div>
          <div className="w-full h-6 bg-brand-black/10 relative overflow-hidden">
            <div className="h-full bg-brand-red w-[55%]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-body text-body-sm font-bold text-brand-white">55% AVAILABLE</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incoming Donations */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-display-md text-brand-black">INCOMING DONATIONS</h2>
          <div className="flex items-center gap-4">
            <span className="label-text text-brand-black/60">SORT:</span>
            <select className="input-field w-auto px-4 py-2 text-sm">
              <option>ERS ↓</option>
              <option>DISTANCE ↓</option>
              <option>TIME LEFT ↑</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {mockIncoming.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 items-start p-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display text-display-sm text-brand-black">{listing.title}</h3>
                    <ERSBadge score={listing.ers} size="sm" />
                  </div>
                  <p className="font-body text-body-md text-brand-black">{listing.donor} ⭐ {listing.donorStars} donations</p>
                  <p className="font-body text-body-sm text-brand-black/60">{listing.distance} · {listing.timeLeft} left</p>
                </div>
                <div>
                  <p className="label-text text-brand-black/60">CAPACITY FIT</p>
                  <Badge variant={listing.fitsCapacity ? "safe" : "warning"}>
                    {listing.fitsCapacity ? "✅ FITS" : "⚠️ MAY EXCEED"}
                  </Badge>
                </div>
                <div>
                  <p className="label-text text-brand-black/60">CATEGORY</p>
                  <p className="font-body text-body-md text-brand-black">{listing.category.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="label-text text-brand-black/60">TIME LEFT</p>
                  <p className="font-display text-display-sm text-brand-black">{listing.timeLeft}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="primary" className="w-full">✅ ACCEPT</Button>
                  <Button variant="ghost" className="w-full">❌ DECLINE</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Scheduled Deliveries */}
      <section className="mt-8">
        <h2 className="font-display text-display-md text-brand-black mb-6">SCHEDULED — ACCEPTED, AWAITING DELIVERY</h2>
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-display-sm text-brand-black">Dal × 15</p>
                <p className="font-body text-body-md text-brand-black/60">from Campus Café · Driver Priya S. · ETA 25 min</p>
              </div>
              <Button variant="primary">VIEW ROUTE</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Food Preferences */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-display-md text-brand-black">FOOD PREFERENCES</h2>
            <Button variant="ghost" size="sm">EDIT</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {["Vegetarian", "Baked Goods", "Packaged", "Non-Veg", "Dairy", "Fresh Produce"].map((pref) => (
              <Badge 
                key={pref} 
                variant={["Vegetarian", "Baked Goods", "Packaged", "Fresh Produce"].includes(pref) ? "safe" : "default"}
              >
                {["Vegetarian", "Baked Goods", "Packaged", "Fresh Produce"].includes(pref) ? "✅" : "❌"} {pref.toUpperCase()}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* This Week's Impact */}
      <Card className="mt-8">
        <CardHeader>
          <h2 className="font-display text-display-md text-brand-black">THIS WEEK'S IMPACT</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8 text-center">
            <div>
              <div className="font-display text-display-xl text-brand-red">890</div>
              <div className="label-text text-brand-black/60">MEALS SERVED</div>
            </div>
            <div>
              <div className="font-display text-display-xl text-brand-red">MG ROAD DHABA</div>
              <div className="label-text text-brand-black/60">TOP DONOR (18 DONATIONS)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}