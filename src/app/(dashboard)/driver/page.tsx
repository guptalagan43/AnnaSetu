"use client";

import { ERSBadge } from "@/components/ui/ERSBadge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const mockRoute = [
  { stop: 1, type: "pickup", name: "MG Road Dhaba", items: "Biryani × 20", ers: 84, distance: "5 min away", address: "123 MG Road, Bangalore" },
  { stop: 2, type: "pickup", name: "City Bakery", items: "Bread × 30", ers: 43, distance: "2.1 km from Stop 1", address: "456 Brigade Road, Bangalore" },
  { stop: 3, type: "delivery", name: "Hope Shelter", items: "All items", ers: null, distance: "3.2 km from Stop 2", address: "789 Indiranagar, Bangalore" },
];

const mockAvailable = [
  { title: "Pasta × 15", ers: 79, distance: "0.3 km", address: "MG Road" },
];

export default function DriverDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="font-display text-display-lg text-brand-black">PRIYA SHARMA · DRIVER</h1>
          <p className="font-body text-body-md text-brand-black/60 mt-1">Available ●</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button variant="secondary">GO OFFLINE</Button>
        </div>
      </header>

      {/* Active Route */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-display-md text-brand-black">MY ACTIVE ROUTE</h2>
          <span className="font-body text-body-md text-brand-black/60">Est. Total: 8.4 km · 35 min</span>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-brand-black">
              {mockRoute.map((stop, index) => (
                <div key={stop.stop} className="p-6 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-4 mb-4 md:mb-0 md:w-48">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center font-display text-xl text-brand-white",
                      stop.type === "pickup" ? "bg-brand-red" : "bg-brand-black"
                    )}>
                      {stop.stop}
                    </div>
                    <div>
                      <p className="label-text text-brand-black">{stop.type === "pickup" ? "📦 PICKUP" : "🏠 DELIVER"}</p>
                      <p className="font-display text-display-sm text-brand-black">STOP {stop.stop}</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-display-sm text-brand-black">{stop.name}</h3>
                    <p className="font-body text-body-md text-brand-black">{stop.items}</p>
                    {stop.ers && (
                      <div className="flex items-center gap-2 mt-1">
                        <ERSBadge score={stop.ers} size="sm" />
                        <span className="font-body text-body-sm text-brand-black/60">{stop.distance}</span>
                      </div>
                    )}
                    {!stop.ers && (
                      <p className="font-body text-body-sm text-brand-black/60 mt-1">{stop.distance}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stop.type === "pickup" ? (
                      <>
                        <Button variant="primary" size="sm">MARK PICKED UP ✅</Button>
                        <Button variant="ghost" size="sm">NAVIGATE 🗺️</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="primary" size="sm">MARK DELIVERED ✅</Button>
                        <Button variant="ghost" size="sm">CALL SHELTER 📞</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t-2 border-brand-black">
              <Button variant="secondary" className="w-full md:w-auto">OPEN FULL ROUTE IN GOOGLE MAPS</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Available Nearby */}
      <section className="mt-8">
        <h2 className="font-display text-display-md text-brand-black mb-6">AVAILABLE NEARBY (UNASSIGNED)</h2>
        <Card>
          <CardContent>
            {mockAvailable.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border-b border-brand-black/20 last:border-0">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <ERSBadge score={item.ers} size="sm" />
                    <span className="font-display text-display-sm text-brand-black">{item.title}</span>
                  </div>
                  <p className="font-body text-body-sm text-brand-black/60">{item.distance} · {item.address}</p>
                </div>
                <Button variant="primary" size="sm">ACCEPT THIS PICKUP</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* My Stats */}
      <section className="mt-8">
        <h2 className="font-display text-display-md text-brand-black mb-6">MY STATS (THIS MONTH)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">28</div>
              <div className="label-text text-brand-black/60">TRIPS</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">480</div>
              <div className="label-text text-brand-black/60">MEALS</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">4.9/5</div>
              <div className="label-text text-brand-black/60">RATING</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">#1</div>
              <div className="label-text text-brand-black/60">TOP DRIVER</div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}